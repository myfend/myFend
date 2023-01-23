import express from "express";
import { PORT } from "./constants/http";
import LenderController from "./controllers/lender";
import Event from "./events/event";
import { startMongoose } from "./database/mongoose";
import AuthenticationController from "./controllers/authentication";
import MongoAuthDB from "./adapters/mongoAuthDB";
import Encrypter from "./adapters/encrypter";
import JwtAuthenticator from "./adapters/jwtAuthenticator";
import AdministratorInvoiceController from "./controllers/administratorInvoice";
import MongoInvoiceDb from "./adapters/mongoInvoiceDb";
import CeloInvoice from "./adapters/celoInvoice";
import { AdministratorAgencyController } from "./controllers/administratorAgency";
import { MongoAdministratorAgencyDb } from "./adapters/mongoAdministratorAgencyDb";
import InvoiceActiveController from "./controllers/invoiceActive";
import MongoInvoiceActiveDB from "./adapters/mongoInvoiceActiveDB";
import LenderContributionController from "./controllers/lenderContribution";

export default class App {
  private express = express();
  private emitter = new Event();

  private registerControllers(): App {
    this.express.use(this.makeLenderController().registerRoutes());
    this.express.use(this.makeAuthenticationController().registerRoute());
    this.express.use(
      this.makeAdministratorInvoiceController().registerRoutes()
    );
    this.express.use(this.makeAdministratorAgencyController().registerRoutes());
    this.express.use(this.makeInvoiceActiveController().registerRoutes());
    this.express.use(this.makeLenderContributionController().registerRouter());

    return this;
  }

  private makeLenderContributionController() {
    return new LenderContributionController(
      new MongoInvoiceActiveDB(),
      this.emitter
    );
  }

  private makeInvoiceActiveController() {
    return new InvoiceActiveController(
      new MongoInvoiceActiveDB(),
      this.emitter
    );
  }

  private makeAdministratorAgencyController() {
    return new AdministratorAgencyController(
      new MongoAdministratorAgencyDb(),
      this.emitter
    );
  }

  private makeLenderController() {
    return LenderController.new(this.emitter);
  }

  private makeAdministratorInvoiceController() {
    return new AdministratorInvoiceController(
      new MongoInvoiceDb(),
      new CeloInvoice(),
      this.emitter
    );
  }

  private makeAuthenticationController() {
    return new AuthenticationController(
      new MongoAuthDB(),
      new Encrypter(),
      new JwtAuthenticator()
    );
  }

  async startExpressServer() {
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: true }));

    try {
      await startMongoose();
    } catch (err) {
      console.error("database connection failed", err);
    }

    this.registerControllers();

    this.express.listen(PORT, () =>
      console.log(`app listening on port ${PORT}`)
    );
  }
}