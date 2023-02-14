import { Request, RequestHandler, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { Agency } from "./agency";
import { EventEmitter } from "../events/event";
import Joi from "joi";
import { JwtAuthMiddleware } from "../adapters/jwtAuthenticator";

export interface AgencyStoreInput {}

export interface AdministratorAgencyDb {
  store(input: AgencyStoreInput): Promise<Agency>;

  search(query: string): Promise<Agency[]>;
}

export class AgencyStored {
  private agency: Agency;

  constructor(agency: Agency) {
    this.agency = agency;
  }
}

export class AdministratorAgencyController {
  private router = Router();
  private readonly auth = new JwtAuthMiddleware();
  private readonly db: AdministratorAgencyDb;
  private readonly emitter: EventEmitter;

  constructor(db: AdministratorAgencyDb, emitter: EventEmitter) {
    this.db = db;
    this.emitter = emitter;
  }

  registerRoutes(): Router {
    this.router.post("/agency/store", this.auth.middleware(), this.store());
    this.router.get("/agency/search", this.auth.middleware(), this.search());

    return this.router;
  }

  private search(): RequestHandler {
    return async (req: Request, res: Response) => {
      const agencies = await this.db.search(req.query.query as string);
      return res.status(StatusCodes.OK).json(agencies);
    };
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
        console.error(e);
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(e.details);
      }

      try {
        const agency = await this.db.store(input);
        this.emitter.emit<AgencyStored>(new AgencyStored(agency));

        return res.status(StatusCodes.CREATED).json(agency);
      } catch (e: any) {
        console.error(e);
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json(e ? e.message : "INTERNAL_SERVER_ERROR");
      }
    };
  }
}
