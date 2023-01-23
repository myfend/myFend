import { Request, RequestHandler, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import Joi from "joi";
import UserRegistered from "../events/userRegistered";
import { EventEmitter } from "../events/event";
import Encrypter from "../adapters/encrypter";
import MongoLenderDb from "../adapters/mongoLenderDb";
import CeloLenderBlockchain from "../adapters/celoLenderBlockchain";

export interface LenderDB {
  create(input: UserStoreInput): Promise<Lender>;

  updateWalletAddress(id: string, walletAddress: string): Promise<Lender>;
}

export interface LenderBlockchain {
  createWalletFor(id: string): Promise<string>;
}

export default class LenderController {
  private router: Router = Router();
  private db: LenderDB;
  private blockchain: LenderBlockchain;
  private emitter: EventEmitter;

  private encrypter: Encrypter;

  constructor(
    db: LenderDB,
    blockchain: LenderBlockchain,
    emitter: EventEmitter,
    encrypter: Encrypter
  ) {
    this.db = db;
    this.blockchain = blockchain;
    this.emitter = emitter;
    this.encrypter = encrypter;
  }

  static new(emitter: EventEmitter) {
    return new LenderController(
      new MongoLenderDb(),
      new CeloLenderBlockchain(),
      emitter,
      new Encrypter()
    );
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
        password: Joi.string().alphanum().min(6).required(),
      })
        .options({ abortEarly: false })
        .validate(input);

      if (error)
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(error);

      input.password = await this.encrypter.hash(input.password);

      let lender = await this.db.create(input);

      const walletAddress = await this.blockchain.createWalletFor(lender.id);
      lender = await this.db.updateWalletAddress(lender.id, walletAddress);

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
  lastname: string;
  email: string;
  phone: string;
  password: string;
};
