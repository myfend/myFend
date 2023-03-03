import { Request, RequestHandler, Response, Router } from "express";
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
import { JwtAuthMiddleware } from "../adapters/jwtAuthenticator";

export default class LenderContributionController {
  private readonly router = Router();
  private readonly auth = new JwtAuthMiddleware();

  private readonly db: LenderContributionDB;

  private readonly emitter: EventEmitter;

  constructor(db: LenderContributionDB, emitter: EventEmitter) {
    this.db = db;
    this.emitter = emitter;
  }

  registerRouter() {
    this.router.post(
      "/lender/contribution/store",
      this.auth.middleware(),
      this.store()
    );
    this.router.get(
      "/lender/contribution/list",
      this.auth.middleware(),
      this.list()
    );
    this.router.get(
      "/lender/contribution/stats",
      this.auth.middleware(),
      this.stats()
    );

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
          hash: Joi.string().required(),
          invoice: Joi.string().required(),
          lender: Joi.string().required(),
          amount: Joi.number().required(),
        })
          .options({ abortEarly: false })
          .validate(input);
      } catch (e) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(e);
      }

      try {
        const {
          amount: invoiceAmount,
          repaymentAmount,
          amountLenderContributed: oldAmount,
        } = await this.db.getInvoiceAmountAndAmountUserContributed(
          input.invoice,
          input.lender
        );
        const amount: number = oldAmount + parseFloat(input.amount);
        const stake = amount / invoiceAmount;

        const a = await this.db.contributeToInvoice(input.invoice, {
          lender: input.lender,
          amount,
          stake: stake,
          repay: stake * repaymentAmount,
        });

        this.emitter.emit(new NewContribution(a));

        return res.status(StatusCodes.OK).json(a);
      } catch (e: any) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json(e ? e.message : "INTERNAL_SERVER_ERROR");
      }
    };
  }

  private list(): RequestHandler {
    return async (req: Request, res: Response) => {
      if (!req.user)
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "UNAUTHORIZED" });

      try {
        const invoices = await this.db.allInvoicesLenderContributedTo(
          req.user.id
        );
        return res.json(invoices);
      } catch (e: any) {
        console.log(e);
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json(e ? e.message : "INTERNAL_SERVER_ERROR");
      }
    };
  }

  private stats(): RequestHandler {
    return async (req: Request, res: Response) => {
      if (!req.user?.id) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "UNAUTHORIZED" });
      }

      try {
        const contribution =
          await this.db.allContributionsAmountAndReturnByLender(req.user.id);
        const stat = contribution.reduce(
          (previous, contribution) => {
            previous.interest += contribution.repay;
            previous.amount += contribution.amount;
            return previous;
          },
          {
            count: contribution.length,
            interest: 0,
            amount: 0,
          }
        );

        return res.json(stat);
      } catch (e: any) {
        console.error(e);
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json(e ? e.message : "INTERNAL_SERVER_ERROR");
      }
    };
  }
}

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

export interface InvoiceNumbersWithUserContributionData {
  amount: number;
  repaymentAmount: number;
  amountLenderContributed: number;
}

export interface Contribution {
  amount: number;
  stake: number;
  repay: number;
}

export interface LenderContributionDB {
  getInvoiceAmountAndAmountUserContributed(
    invoiceId: string,
    lenderId: string
  ): Promise<InvoiceNumbersWithUserContributionData>;

  contributeToInvoice(
    invoiceId: string,
    params: InvoiceContributeToParams
  ): Promise<PublicInvoice>;

  allInvoicesLenderContributedTo(id: string): Promise<SimpleInvoice[]>;

  allContributionsAmountAndReturnByLender(id: string): Promise<Contribution[]>;
}
