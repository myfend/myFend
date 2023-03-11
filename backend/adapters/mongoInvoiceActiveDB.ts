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
  Contribution,
  InvoiceNumbersWithUserContributionData,
  LenderContributionDB,
  SimpleInvoice as LenderContributionSimpleInvoice,
} from "../controllers/lenderContribution";
import User from "../database/models/user";

export default class MongoInvoiceActiveDB
  extends MongoInvoiceDB
  implements InvoiceActiveDB, LenderContributionDB
{
  async allContributionsAmountAndReturnByLender(
    id: string
  ): Promise<Contribution[]> {
    const user = await User.findById(id);
    if (!user) return [];

    const pipeline: any = [
      {
        $match: {
          status: InvoiceStatus.Active,
          _id: { $in: user?.projectContributed },
        },
      },
    ];

    const aggregateResult = await Invoice.aggregate(pipeline);
    return aggregateResult.map((invoice) => invoice.contributions[id]);
  }

  async allInvoicesLenderContributedTo(
    id: string
  ): Promise<LenderContributionSimpleInvoice[]> {
    const user = await User.findById(id);
    if (!user) return [];

    const $match: any = {
      status: InvoiceStatus.Active,
      _id: { $in: user?.projectContributed },
    };

    const res = await this.pipelineLatestLookupAgencyAndPaginateInvoice($match);

    return res.map((invoice) => ({
      id: invoice._id.toString(),
      name: invoice.name,
      description: invoice.description,
      interest: invoice.interest,
      amount: invoice.amount,
      contributed: invoice.contributions[id],
      url: invoice.url,
      agency: {
        id: invoice.agencies[0]?._id?.toString(),
        name: invoice.agencies[0]?.name,
        number: invoice.agencies[0]?.number,
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

    const res = await this.pipelineLatestLookupAgencyAndPaginateInvoice(
      $match,
      params
    );
    return this.mapSimpleInvoice(res);
  }

  async contributeToInvoice(
    invoiceId: string,
    params: InvoiceContributeToParams
  ): Promise<PublicInvoice> {
    const result = await InvoiceModel.findById(invoiceId);
    if (!result) throw new Error("NOT_FOUND");

    const lenderObjectId = new Types.ObjectId(params.lender);
    const lender = await User.findById(lenderObjectId);
    if (!lender) throw new Error("NOT_FOUND");

    result.contributions.set(params.lender, {
      lender: lenderObjectId,
      amount: params.amount,
      stake: params.stake,
      repay: params.repay,
    });
    await result.save();

    const set = new Set(lender.projectContributed);
    set.add(result._id);

    lender.projectContributed = Array.from(set);
    lender.save();

    return result.toPublicInvoice();
  }
  async getInvoiceAmountAndAmountUserContributed(
    invoiceId: string,
    lenderId: string
  ): Promise<InvoiceNumbersWithUserContributionData> {
    const result = await InvoiceModel.findById(invoiceId);
    if (!result) throw new Error("result not found");

    return {
      amount: result.amount,
      repaymentAmount: result.repaymentAmount,
      amountLenderContributed: result.contributions.get(lenderId)?.amount ?? 0,
    };
  }

  async findInvoice(id: string): Promise<PublicInvoice> {
    const result = await InvoiceModel.findById(id);
    if (!result) throw new Error("result not found");
    const agencyResult = await Agency.findById(result.agency);

    return result.toPublicInvoice(agencyResult?.toAgency());
  }

  private mapPublicInvoice(result: any, agencyResult?: any) {
    const contributions: any[] = [];
    result.contributions?.forEach((contribution: any) =>
      contributions.push({
        lender: { id: contribution.lender?.toString() },
        amount: contribution.amount,
        stake: contribution.stake,
      })
    );

    return {
      activatedAt: result.activatedAt,
      agency: agencyResult?.toAgency(),
      amount: result.amount,
      company: result.company,
      contributions: contributions,
      description: result.description,
      id: result._id.toString(),
      interest: result.interest,
      walletAddress: result.walletAddress,
      name: result.name,
      status: result.status,
      url: result.url,
      contributionClosesAt: result.contributionClosesAt,
      repaymentAt: result.repaymentAt,
    };
  }
}
