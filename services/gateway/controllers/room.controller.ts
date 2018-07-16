import { Rooms } from "../config/db";
export const createRoom = () => {
};

export const getAllRooms = (_req, res, next) => {
  Rooms.find({})
    .populate({ path: "devices", populate: { path: "type" } })
    .exec((err, rooms) => {
      if (err) {
        next(err);
      } else {
        res.json(rooms);
      }
    });
};