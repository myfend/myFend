import { startMongoose } from "./database/mongoose";
import ControllerConsole from "./console/controller";
import MongoControllerDB from "./adapters/mongoControllerDb";
import { Command } from "commander";
import Encrypter from "./adapters/encrypter";

require("dotenv").config();

const program = new Command();
program.name("myFend").description("console interface").version("0.0.0");

startMongoose()
  .then(() => {
    new ControllerConsole(
      program,
      new MongoControllerDB(),
      new Encrypter()
    ).registerActions();

    program.parse();
  })
  .catch((err) => console.debug(err));
