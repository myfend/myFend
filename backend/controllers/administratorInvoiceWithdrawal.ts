import { Router, Request, Response } from "express";
import { JwtAuthMiddleware } from "../adapters/jwtAuthenticator";
import Joi from "joi";
import { StatusCodes } from "http-status-codes";
import { AdministratorInvoice } from "./administratorInvoice";
import InvoiceUpdated from "../events/invoiceUpdated";
import { EventEmitter } from "../events/event";

export interface InvoiceWithdrawBlockchain {
  withdrawBalance(from: string, to: string): Promise<void>;
}

export interface InvoiceWithdrawDb {
  show(id: string): Promise<AdministratorInvoice>;

  setInvoiceBalanceWithdrawn(
    invoice: AdministratorInvoice
  ): Promise<AdministratorInvoice>;
}

export default class AdministratorInvoiceWithdrawalController {
  private readonly auth = new JwtAuthMiddleware();
  private router = Router();
  private readonly blockchain: InvoiceWithdrawBlockchain;
  private readonly db: InvoiceWithdrawDb;
  private readonly emitter: EventEmitter;

  constructor(
    blockchain: InvoiceWithdrawBlockchain,
    db: InvoiceWithdrawDb,
    emitter: EventEmitter
  ) {
    this.blockchain = blockchain;
    this.db = db;
    this.emitter = emitter;
  }

  registerRoutes(): Router {
    this.router.post(
      "/invoice/:id/withdraw",
      this.auth.middleware(),
      this.withdraw()
    );

    return this.router;
  }

  private withdraw() {
    return async (req: Request, res: Response) => {
      const input = req.body;
      try {
        await Joi.object({
          to: Joi.string().required(),
        })
          .options({
            abortEarly: false,
          })
          .validate(input);
      } catch (e) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(e);
      }

      try {
        let invoice = await this.db.show(req.params.id);
        await this.blockchain.withdrawBalance(invoice.walletAddress, input.to);
        invoice = await this.db.setInvoiceBalanceWithdrawn(invoice);

        this.emitter.emit<InvoiceUpdated>(new InvoiceUpdated(invoice));

        return res.status(StatusCodes.CREATED).json(invoice);
      } catch (e: any) {
        console.error(e);
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json(e ? e.message : "INTERNAL_SERVER_ERROR");
      }
    };
  }
}
