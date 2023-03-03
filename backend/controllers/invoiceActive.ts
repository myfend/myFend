import { Request, RequestHandler, Response, Router } from "express";
import {
  InvoiceListParams,
  InvoiceStatus,
  SimpleInvoice,
} from "./administratorInvoice";
import { Agency } from "./agency";
import { StatusCodes } from "http-status-codes";
import { EventEmitter } from "../events/event";
import { JwtAuthMiddleware } from "../adapters/jwtAuthenticator";

export default class InvoiceActiveController {
  private readonly auth = new JwtAuthMiddleware();
  private readonly db: InvoiceActiveDB;
  private readonly router = Router();
  private readonly emitter: EventEmitter;

  constructor(db: InvoiceActiveDB, emitter: EventEmitter) {
    this.db = db;
    this.emitter = emitter;
  }

  registerRoutes() {
    this.router.get("/invoice/active/all", this.auth.middleware(), this.list());
    this.router.get("/invoice/:id/active", this.auth.middleware(), this.show());

    return this.router;
  }

  private list(): RequestHandler {
    return async (req: Request, res: Response) => {
      try {
        const params: InvoiceActiveDbActiveParams = {};
        if (req.query.page) params.page = +req.query.page;
        if (req.query.limit) params.limit = +req.query.limit;

        const invoices = await this.db.listActiveInvoices(params);
        return res.json(invoices);
      } catch (e: any) {
        console.error(e);
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json(e ? e.message : "INTERNAL_SERVER_ERROR");
      }
    };
  }

  private show(): RequestHandler {
    return async (req: Request, res: Response) => {
      try {
        const invoice = await this.db.findInvoice(req.params.id);
        return res.status(StatusCodes.OK).json(invoice);
      } catch (e: any) {
        console.error(e);
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json(e ? e.message : "INTERNAL_SERVER_ERROR");
      }
    };
  }
}

export interface PublicInvoice {
  id: string;
  name: string;
  description: string;
  url: string;
  agency?: Agency;
  amount: number;
  walletAddress: string;
  interest: number;
  company: string;
  status: InvoiceStatus;
  activatedAt: Date;
  contributed: number;
  contributions: { lender: { id: string }; amount: number; repay: number }[];
  contributionClosesAt: Date;
  repaymentAt: Date;
}

export interface InvoiceContributeToParams {
  repay: number;
  stake: number;
  amount: number;
  lender: string;
}

export interface InvoiceActiveDB {
  listActiveInvoices(
    params: InvoiceActiveDbActiveParams
  ): Promise<SimpleInvoice[]>;

  findInvoice(id: string): Promise<PublicInvoice>;
}

export interface InvoiceContributeInput {
  invoice: string;
  amount: string;
  lender: string;
}

export interface InvoiceActiveDbActiveParams {
  page?: number;
  limit?: number;
}
