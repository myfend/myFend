import {
  InvoiceStatus,
  SimpleInvoice,
} from "../controllers/administratorInvoice";
import {
  InvoiceActiveDB,
  InvoiceActiveDbActiveParams,
  InvoiceContributeToParams,
  PublicInvoice,
} from "../controllers/invoiceActive";
import { MongoInvoiceDB } from "./mongoInvoiceDb";
import InvoiceModel from "../database/models/invoice";
import Invoice from "../database/models/invoice";
import Agency from "../database/models/agency";
import { Types } from "mongoose";
import {
  LenderContribution,
  LenderContributionDB,
  SimpleInvoice as LenderContributionSimpleInvoice,
} from "../controllers/lenderContribution";

export default class MongoInvoiceActiveDB
  extends MongoInvoiceDB
  implements InvoiceActiveDB, LenderContributionDB
{
  async allInvoicesContributedToBy(id: string): Promise<LenderContribution[]> {
    const pipeline: any = [
      {
        $match: {
          status: InvoiceStatus.Active,
          contributions: { $elemMatch: { lender: new Types.ObjectId(id) } },
        },
      },
    ];

    return (await Invoice.aggregate(pipeline)).map((invoice) => {
      const contribution = invoice.contributions[id];
      const actualInterest =
        invoice.interest *
        invoice.amount *
        ((contribution?.amount as number) / invoice.amount);

      return {
        id: invoice._id.toString() as string,
        name: invoice.name as string,
        amount: invoice.amount as number,
        interest: invoice.interest as number,
        company: {
          name: invoice.company?.name as string,
        },
        contribution: {
          interest: actualInterest,
          amount: contribution?.amount,
        },
      };
    });
  }

  async allInvoiceContributedToBy(
    id: string
  ): Promise<LenderContributionSimpleInvoice[]> {
    const $match: any = {
      status: InvoiceStatus.Active,
      contributions: { $elemMatch: { lender: new Types.ObjectId(id) } },
    };

    const res = await this.lookupAgencyAndPaginateInvoice($match);

    return res.map((invoice) => ({
      id: invoice._id.toString(),
      name: invoice.name,
      description: invoice.description,
      interest: invoice.interest,
      amount: invoice.amount,
      contributed: invoice.contributions.get(id),
      url: invoice.url,
      agency: {
        id: invoice.agencies[0]?._id?.toString(),
        name: invoice.agencies[0]?.name,
        description: invoice.agencies[0]?.description,
        email: invoice.agencies[0]?.email,
      },
      company: invoice.company,
      status: invoice.status,
    }));
  }
  async listActiveInvoices(
    params: InvoiceActiveDbActiveParams
  ): Promise<SimpleInvoice[]> {
    const $match: any = {
      status: InvoiceStatus.Active,
    };

    const res = await this.lookupAgencyAndPaginateInvoice($match, params);
    return this.mapSimpleInvoice(res);
  }

  async contributeTo(
    invoiceId: string,
    params: InvoiceContributeToParams
  ): Promise<PublicInvoice> {
    const result = await InvoiceModel.findById(invoiceId);
    if (!result) throw new Error("result not found");

    result.contributions.set(params.lender, {
      lender: new Types.ObjectId(params.lender),
      amount: params.amount,
      stake: params.stake,
    });
    await result.save();

    return this.mapPublicInvoice(result);
  }

  async contributionsFor(id: string): Promise<Map<string, number>> {
    const result = await InvoiceModel.findById(id);
    if (!result) throw new Error("result not found");

    const contributions = new Map<string, number>();
    result.contributions.forEach((contribution, key) =>
      contributions.set(key, contribution.amount)
    );

    return contributions;
  }

  async findInvoice(id: string): Promise<PublicInvoice> {
    const result = await InvoiceModel.findById(id);
    if (!result) throw new Error("result not found");
    const agencyResult = await Agency.findById(result.agency);

    return this.mapPublicInvoice(result, agencyResult);
  }

  private mapPublicInvoice(result: any, agencyResult?: any) {
    return {
      activatedAt: result.activatedAt,
      agency: agencyResult?.toAgency(),
      amount: result.amount,
      company: result.company,
      contributions: [],
      description: result.description,
      id: result._id.toString(),
      interest: result.interest,
      name: result.name,
      status: result.status,
      url: result.url,
      contributionClosesAt: result.contributionClosesAt,
      repaymentAt: result.repaymentAt,
    };
  }
}
