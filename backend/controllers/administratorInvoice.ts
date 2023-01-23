import { Request, RequestHandler, Response, Router } from "express";
import Joi from "joi";
import { StatusCodes } from "http-status-codes";
import { Agency } from "./agency";
import { EventEmitter } from "../events/event";
import InvoiceStored from "../events/invoiceStored";

export default class AdministratorInvoiceController {
  private db: InvoiceDB;

  private smartContract: InvoiceSmartContract;

  private emitter: EventEmitter;

  constructor(
    db: InvoiceDB,
    smartContract: InvoiceSmartContract,
    emitter: EventEmitter
  ) {
    this.db = db;
    this.smartContract = smartContract;
    this.emitter = emitter;
  }

  registerRoutes(): Router {
    const router = Router();

    router.post("/invoice/store", this.store());
    router.get("/invoice/all", this.list());
    router.get("/invoice/:invoice", this.show());

    return router;
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
        })
          .options({ abortEarly: false })
          .validate(input);
      } catch (e) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(e);
      }

      let invoice = await this.db.store(input);
      invoice = await this.db.addWalletAddress(
        invoice,
        await this.smartContract.createWalletAddressFor(invoice.id)
      );

      this.emitter.emit<InvoiceStored>(new InvoiceStored(invoice));

      return res.status(StatusCodes.CREATED).json(invoice);
    };
  }

  private list(): RequestHandler {
    return async (req: Request, res: Response) => {
      const invoices = await this.db.list(req.body);
      return res.status(StatusCodes.OK).json(invoices);
    };
  }

  private show(): RequestHandler {
    return async (req: Request, res: Response) => {
      const invoice = await this.db.show(req.params.invoice);
      return res.status(StatusCodes.OK).json(invoice);
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
  interest: number;
  company: string;
  status: InvoiceStatus;
  activatedAt: Date;
  contributions: { lender: { id: string }; amount: number }[];
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
  status: InvoiceStatus;
}

export interface InvoiceListParams {
  page?: number;
  status?: InvoiceStatus;
  limit?: number;
}

export interface InvoiceDB {
  store(input: InvoiceCreateInput): Promise<AdministratorInvoice>;

  addWalletAddress(
    invoice: AdministratorInvoice,
    address: string
  ): Promise<AdministratorInvoice>;

  list(params?: InvoiceListParams): Promise<SimpleInvoice[]>;

  show(id: string): Promise<AdministratorInvoice>;
}

export interface InvoiceSmartContract {
  createWalletAddressFor(id: string): Promise<string>;
}
