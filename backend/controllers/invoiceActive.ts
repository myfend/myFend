import { Request, RequestHandler, Response, Router } from "express";
import { InvoiceStatus, SimpleInvoice } from "./administratorInvoice";
import { Agency } from "./agency";
import { StatusCodes } from "http-status-codes";
import { EventEmitter } from "../events/event";

export default class InvoiceActiveController {
  private readonly db: InvoiceActiveDB;
  private readonly router = Router();
  private readonly emitter: EventEmitter;

  constructor(db: InvoiceActiveDB, emitter: EventEmitter) {
    this.db = db;
    this.emitter = emitter;
  }

  registerRoutes() {
    this.router.get("/invoice/active/all", this.list());
    this.router.get("/invoice/active/:id", this.show());

    return this.router;
  }

  private list(): RequestHandler {
    return async (req: Request, res: Response) => {
      const invoices = await this.db.listActiveInvoices(req.query);
      return res.json(invoices);
    };
  }

  private show(): RequestHandler {
    return async (req: Request, res: Response) => {
      const invoice = await this.db.findInvoice(req.params.id);
      return res.status(StatusCodes.OK).json(invoice);
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
  interest: number;
  company: string;
  status: InvoiceStatus;
  activatedAt: Date;
  contributions: { lender: { id: string }; amount: number }[];
}

export interface InvoiceContributeToParams {
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
  amount: number;
  lender: string;
}

export interface InvoiceActiveDbActiveParams {
  page?: number;
  limit?: number;
}
