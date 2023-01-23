import { Router, Request, Response, RequestHandler } from "express";
import { EventEmitter } from "../events/event";
import { StatusCodes } from "http-status-codes";
import Joi from "joi";
import NewContribution from "../events/newContribution";
import {
  InvoiceContributeInput,
  InvoiceContributeToParams,
  PublicInvoice,
} from "./invoiceActive";
import { Agency } from "./agency";
import { InvoiceStatus } from "./administratorInvoice";

export interface SimpleInvoice {
  id: string;
  name: string;
  description: string;
  url: string;
  agency: Agency;
  amount: number;
  interest: number;
  contributed: number;
  company: string;
  status: InvoiceStatus;
}

export interface LenderContributionDB {
  contributionsFor(id: string): Promise<Map<string, number>>;

  contributeTo(
    invoiceId: string,
    params: InvoiceContributeToParams
  ): Promise<PublicInvoice>;

  allInvoiceContributedToBy(id: string): Promise<SimpleInvoice[]>;
}

export default class LenderContributionController {
  private readonly router = Router();

  private readonly db: LenderContributionDB;

  private readonly emitter: EventEmitter;

  constructor(db: LenderContributionDB, emitter: EventEmitter) {
    this.db = db;
    this.emitter = emitter;
  }

  registerRouter() {
    this.router.post("/lender/contribution/store", this.store());
    this.router.post("/lender/contribution/list", this.list());

    return this.router;
  }

  private store(): RequestHandler {
    return async (req: Request, res: Response) => {
      if (!req.user)
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "UNAUTHORIZED" });

      const input: InvoiceContributeInput = req.body;
      input.lender = req.user.id;

      try {
        await Joi.object({
          invoice: Joi.string().required(),
          lender: Joi.string().required(),
          amount: Joi.number().required(),
        })
          .options({ abortEarly: false })
          .validate(input);
      } catch (e) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(e);
      }

      const contributions = await this.db.contributionsFor(input.invoice);
      const amount = (contributions.get(input.lender) || 0) + input.amount;

      let totalRaised = input.amount;
      contributions.forEach((amount) => (totalRaised += amount));

      const invoice = await this.db.contributeTo(input.invoice, {
        lender: input.lender,
        amount,
        stake: amount / totalRaised,
      });

      this.emitter.emit(new NewContribution(invoice));

      return res.status(StatusCodes.OK).json(invoice);
    };
  }

  private list(): RequestHandler {
    return async (req: Request, res: Response) => {
      if (!req.user)
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "UNAUTHORIZED" });

      const invoices = await this.db.allInvoiceContributedToBy(req.user.id);
      return res.json(invoices);
    };
  }
}
