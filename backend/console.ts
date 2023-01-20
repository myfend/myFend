import { startMongoose } from "./database/mongoose";
import ControllerConsole from "./console/controller";
import MongoControllerDB from "./adapters/mongoControllerDb";
import { Command } from "commander";

require("dotenv").config();

const program = new Command();
program.name("myFend").description("console interface").version("0.0.0");

startMongoose()
  .then(() => {
    new ControllerConsole(program, new MongoControllerDB()).registerActions();

    program.parse();
  })
  .catch((err) => console.debug(err));
