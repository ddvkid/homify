import app from "./config/express";
import config from "./config/config";
import mongoose from "./config/db";
import MqttClient from "./services/mqtt.service";
import Overload from "./services/overload.service";
import { Devices } from "./config/db";

export const mqtt = new MqttClient("ws://192.168.1.2:9001", { clientId: "gateway" + Math.floor(Date.now() / 1000) });
export const overload = new Overload();
overload.attachClient(mqtt.client);
Devices
  .find({})
  .populate("type")
  .exec()
  .then(devices => {
    overload.registerAllControllers(devices);
  });

mongoose.connect(
  `mongodb://${config.db}:${config.db_port}/${config.db_name}`,
  { useNewUrlParser: true }
);

// listen on port config.port
app.listen(config.port, () => {
  console.info(`server started on port ${config.port} (${config.env})`);
});
export default app;
