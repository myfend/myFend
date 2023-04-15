import { Command } from "commander";
import Joi from "joi";
import Encrypter from "../adapters/encrypter";

export interface Controller {
  id: string;
  firstname: string;
  lastname: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface CreateControllerInput {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  password: string;
}

export interface ControllerDb {
  store(input: CreateControllerInput): Promise<Controller>;
}

export default class ControllerConsole {
  private program: Command;

  private db: ControllerDb;
  private encrypter: Encrypter;

  constructor(program: Command, db: ControllerDb, encrypter: Encrypter) {
    this.program = program;
    this.db = db;
    this.encrypter = encrypter;
  }

  registerActions() {
    this.program
      .command("controller:create")
      .description("create a new controller if no exists")
      .option("-f, --firstname <string>", "the controller's firstname")
      .option("-l, --lastname <string>", "the controller's lastname")
      .option("-e, --email <string>", "the controller's email")
      .option("-h, --phone <string>", "the controller's phone")
      .option("-p, --password <string>", "the controller's password")
      .action(this.store());
  }

  private store() {
    return async (input: CreateControllerInput) => {
      try {
        await Joi.object({
          firstname: Joi.string().required(),
          lastname: Joi.string().required(),
          email: Joi.string().email().required(),
          phone: Joi.string().required(),
          password: Joi.string().alphanum().min(6).required(),
        })
          .options({ abortEarly: false })
          .validateAsync(input);
      } catch (e) {
        console.debug(e);
        return;
      }

      input.password = await this.encrypter.hash(input.password);
      const controller = await this.db.store(input);
      console.info("welcome", controller.firstname, "!");
    };
  }
}
