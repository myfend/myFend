import { Request, RequestHandler, Response, Router } from "express";
import Joi from "joi";
import { StatusCodes } from "http-status-codes";
import { Agency } from "./agency";
import { EventEmitter } from "../events/event";
import InvoiceStored from "../events/invoiceStored";
import { JwtAuthMiddleware } from "../adapters/jwtAuthenticator";
import invoice from "../database/models/invoice";

export default class AdministratorInvoiceController {
  private readonly auth = new JwtAuthMiddleware();
  private db: InvoiceDB;
  private invoiceDapp: InvoiceDapp;

  private emitter: EventEmitter;
  private router = Router();

  constructor(db: InvoiceDB, invoiceDapp: InvoiceDapp, emitter: EventEmitter) {
    this.db = db;
    this.invoiceDapp = invoiceDapp;
    this.emitter = emitter;
  }

  registerRoutes(): Router {
    this.router.post("/invoice/store", this.auth.middleware(), this.store());
    this.router.get("/invoice/all", this.auth.middleware(), this.list());
    this.router.get("/invoice/stats", this.auth.middleware(), this.stats());
    this.router.get("/invoice/:invoice", this.auth.middleware(), this.show());

    return this.router;
  }

  private store(): RequestHandler {
    return async (req: Request, res: Response) => {
      const input: InvoiceCreateInput = req.body;

      try {
        await Joi.object({
          name: Joi.string().required(),
          description: Joi.string(),
          url: Joi.string().uri().required(),
          agency: Joi.string().required(),
          amount: Joi.number().required(),
          interest: Joi.number().required().min(0).max(1),
          company: Joi.string().required(),
          contributionClosesAt: Joi.string().required(),
          repaymentAt: Joi.string().required(),
        })
          .options({ abortEarly: false })
          .validate(input);
      } catch (e) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(e);
      }

      try {
        let invoice = await this.db.store(input);
        invoice = await this.db.addWalletAddress(
          invoice,
          await this.invoiceDapp.createWalletAddressFor(
            invoice.id,
            invoice.amount,
            invoice.repaymentAmount as number
          )
        );

        this.emitter.emit<InvoiceStored>(new InvoiceStored(invoice));

        return res.status(StatusCodes.CREATED).json(invoice);
      } catch (e: any) {
        console.error(e);
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json(e ? e.message : "INTERNAL_SERVER_ERROR");
      }
    };
  }

  private list(): RequestHandler {
    return async (req: Request, res: Response) => {
      const params: InvoiceListParams = {};
      if (req.query.page) params.page = +req.query.page;
      if (req.query.limit) params.limit = +req.query.limit;

      const invoices = await this.db.list(params);
      return res.status(StatusCodes.OK).json(invoices);
    };
  }

  private show(): RequestHandler {
    return async (req: Request, res: Response) => {
      try {
        const invoice = await this.db.show(req.params.invoice);
        return res.status(StatusCodes.OK).json(invoice);
      } catch (e: any) {
        switch (e.message) {
          case "NOT_FOUND":
            return res
              .status(StatusCodes.NOT_FOUND)
              .json({ message: "NOT_FOUND" });
          default:
            return res
              .status(StatusCodes.INTERNAL_SERVER_ERROR)
              .json({ message: "INTERNAL_SERVER_ERROR" });
        }
      }
    };
  }

  private stats(): RequestHandler {
    return async (req: Request, res: Response) => {
      const invoices = await this.db.takeInterestAndAmountFromAllInvoices();
      const initialValue = {
        count: invoices.length,
        interest: 0,
        amount: 0,
      };
      const stat = invoices.reduce((previous, invoice) => {
        previous.interest += invoice.interest;
        previous.amount += invoice.amount;
        return previous;
      }, initialValue);

      return res.status(StatusCodes.OK).json(stat);
    };
  }
}

export interface InvoiceCreateInput {
  name: string;
  description: string;
  url: string;
  agency: string;
  amount: number;
  interest: number;
  company: string;
  contributionClosesAt: string;
  repaymentAt: string;
}

export enum InvoiceStatus {
  Active = "active",
}

export interface AdministratorInvoice {
  walletAddress: string;
  id: string;
  name: string;
  description: string;
  url: string;
  agency?: Agency;
  amount: number;
  repaymentAmount?: number;
  interest: number;
  company: string;
  status: InvoiceStatus;
  activatedAt: Date;
  contributionClosesAt: Date;
  repaymentAt: Date;
  contributions: { lender: { id: string }; amount: number }[];
  contributed: number;
}

export interface SimpleInvoice {
  id: string;
  name: string;
  description: string;
  url: string;
  agency: Agency;
  amount: number;
  interest: number;
  company: string;
  contributionClosesAt: Date;
  repaymentAt: Date;
  status: InvoiceStatus;
}

export interface InvoiceListParams {
  page?: number;
  status?: InvoiceStatus;
  limit?: number;
}

export interface InvoiceInterestAndAmount {
  amount: number;
  interest: number;
}

export interface InvoiceDB {
  store(input: InvoiceCreateInput): Promise<AdministratorInvoice>;

  addWalletAddress(
    invoice: AdministratorInvoice,
    address: string
  ): Promise<AdministratorInvoice>;

  list(params?: InvoiceListParams): Promise<SimpleInvoice[]>;

  show(id: string): Promise<AdministratorInvoice>;

  takeInterestAndAmountFromAllInvoices(): Promise<InvoiceInterestAndAmount[]>;
}

export interface InvoiceDapp {
  createWalletAddressFor(
    id: string,
    amount: number,
    repaymentAmount: number
  ): Promise<string>;
}
