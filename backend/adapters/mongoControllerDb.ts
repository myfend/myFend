import {
  Controller,
  ControllerDb,
  CreateControllerInput,
} from "../console/controller";
import User, { UserType } from "../database/models/user";

export default class MongoControllerDB implements ControllerDb {
  async store(input: CreateControllerInput): Promise<Controller> {
    const user = await User.create({ ...input, type: UserType.Controller });
    return user.toController();
  }
}
