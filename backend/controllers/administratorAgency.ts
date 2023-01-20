import { RequestHandler, Router, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Agency } from "./agency";
import { EventEmitter } from "../events/event";
import Joi from "joi";

export interface AgencyStoreInput {}

export interface AdministratorAgencyDb {
  store(input: AgencyStoreInput): Promise<Agency>;
}

export class AgencyStored {
  private agency: Agency;
  constructor(agency: Agency) {
    this.agency = agency;
  }
}

export class AdministratorAgencyController {
  private readonly agency: AdministratorAgencyDb;
  private readonly emitter: EventEmitter;

  constructor(agency: AdministratorAgencyDb, emitter: EventEmitter) {
    this.agency = agency;
    this.emitter = emitter;
  }

  registerRoutes(): Router {
    const router = Router();

    router.post("/agency/store", this.store());

    return router;
  }

  private store(): RequestHandler {
    return async (req: Request, res: Response) => {
      const input: AgencyStoreInput = req.body;

      try {
        await Joi.object({
          name: Joi.string().required(),
          description: Joi.string(),
          email: Joi.string().email().required(),
        })
          .options({ abortEarly: false })
          .validateAsync(input);
      } catch (e: any) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(e.details);
      }

      const agency = await this.agency.store(input);
      this.emitter.emit<AgencyStored>(new AgencyStored(agency));

      return res.status(StatusCodes.CREATED).json(agency);
    };
  }
}
