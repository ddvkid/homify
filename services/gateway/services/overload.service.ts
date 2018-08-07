import { Devices } from "../config/db";
import { mqttService } from "../";
import { Observable, from } from "rxjs";
import { switchMapTo, switchMap } from "rxjs/operators";
import { IMqttMessage } from "../types/mqtt.model";

export default class Overload {
  service: any;
  $: (action: string) => Observable<IMqttMessage>;

  constructor(private device) {
    try {
      const { platform, type_name } = this.device.type;
      const moduleName = `@/plugins/${platform}/${type_name}`;
      const Plugin = require(moduleName).default;
      this.service = new Plugin(this.device);
      this.$ = mqttService.getStreaming(this.device._id);
      this.$("update")
        .pipe(switchMap(res => this.service.setState(res)))
        .subscribe(this.handleStatus);

      this.service.onHealth().subscribe(this.handleHealth);
      this.service.onStatus().subscribe(this.handleStatus);
    } catch (e) {
      console.log(this.device.name, e);
      this.handleHealth(false);
    }
  }

  handleHealth = (online: boolean) => {
    this.handleChanges("health_check", "online", online);
  };

  handleStatus = (state: any) => {
    console.log("handleStatus", this.device.name, state);
    this.handleChanges("response", "state", state);
  };

  handleChanges = (action, type, value) => {
    const topic = `devices/${this.device._id}/${action}`;
    mqttService
      .publish(topic, JSON.stringify(value))
      .pipe(
        switchMapTo(
          from(
            Devices.findOneAndUpdate(
              { _id: this.device._id },
              { [type]: value },
              { new: true }
            ).exec()
          )
        )
      )
      .subscribe();
  };
}
