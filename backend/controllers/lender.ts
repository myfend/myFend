import { Request, RequestHandler, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import Joi from "joi";
import UserRegistered from "../events/userRegistered";
import { EventEmitter } from "../events/event";
import Encrypter from "../adapters/encrypter";
import MongoLenderDb from "../adapters/mongoLenderDb";

export interface LenderDB {
  create(input: UserStoreInput): Promise<Lender>;

  updateWalletAddress(id: string, walletAddress: string): Promise<Lender>;
}

export default class LenderController {
  private router: Router = Router();
  private db: LenderDB;
  private emitter: EventEmitter;

  private encrypter: Encrypter;

  constructor(db: LenderDB, emitter: EventEmitter, encrypter: Encrypter) {
    this.db = db;
    this.emitter = emitter;
    this.encrypter = encrypter;
  }

  static new(emitter: EventEmitter) {
    return new LenderController(new MongoLenderDb(), emitter, new Encrypter());
  }

  registerRoutes(): Router {
    this.router.post("/lender/store", this.store());

    return this.router;
  }

  private store(): RequestHandler {
    return async (req: Request, res: Response) => {
      const input: UserStoreInput = req.body;

      const { error } = await Joi.object({
        firstname: Joi.string().required(),
        lastname: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().required(),
        password: Joi.string().min(6).required(),
      })
        .options({ abortEarly: false })
        .validate(input);

      if (error)
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(error);

      try {
        input.password = await this.encrypter.hash(input.password);

        let lender = await this.db.create(input);

        const openLender = {
          id: lender.id,
          wallet: lender.wallet,
          firstname: lender.firstname,
          lastname: lender.lastname,
          email: lender.email,
          phone: lender.phone,
        };

        this.emitter.emit<UserRegistered>(new UserRegistered(openLender));

        return res.status(StatusCodes.CREATED).json(openLender);
      } catch (e: any) {
        console.error(e);
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json(e ? e.message : "INTERNAL_SERVER_ERROR");
      }
    };
  }
}

export type UserStoreInput = {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  password: string;
};

export type Lender = {
  id: string;
  wallet: {
    address: string;
    balance: number;
    available: number;
  };
  firstname: string;
  fullName: string;
  lastname: string;
  email: string;
  phone: string;
  password: string;
};
