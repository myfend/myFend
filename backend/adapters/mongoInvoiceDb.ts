import {
  AdministratorInvoice,
  InvoiceCreateInput,
  InvoiceDB,
  InvoiceListParams,
  InvoiceStatus,
  SimpleInvoice,
} from "../controllers/administratorInvoice";
import Agency from "../database/models/agency";
import agency from "../database/models/agency";
import InvoiceModel from "../database/models/invoice";
import { NOT_FOUND } from "../constants/errors";

export class MongoInvoiceDB {
  protected mapSimpleInvoice(res: any[]) {
    return res.map((invoice) => ({
      id: invoice._id.toString(),
      name: invoice.name,
      description: invoice.description,
      interest: invoice.interest,
      amount: invoice.amount,
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

  protected async lookupAgencyAndPaginateInvoice(
    query: any,
    options: { page?: number; limit?: number } = {}
  ) {
    const $limit = options?.limit || 20;
    const $skip = options?.page && options?.page > 1 ? options.page - 1 : 0;

    let pipeline: any[] = [
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "agencies",
          localField: "agency",
          foreignField: "_id",
          as: "agencies",
        },
      },
      { $skip },
      { $limit },
    ];

    if (Array.isArray(query)) {
      pipeline = query.concat(pipeline);
    } else {
      pipeline = [{ $match: query }].concat(pipeline);
    }

    return InvoiceModel.aggregate(pipeline);
  }
}

export default class MongoInvoiceDb
  extends MongoInvoiceDB
  implements InvoiceDB
{
  async list(params: InvoiceListParams): Promise<SimpleInvoice[]> {
    const $match: any = {};
    if (params.status) {
      $match.status = params.status;
    }

    const res = await this.lookupAgencyAndPaginateInvoice($match, params);
    return this.mapSimpleInvoice(res);
  }
  async show(id: string): Promise<AdministratorInvoice> {
    const result = await InvoiceModel.findById(id);
    if (!result) throw NOT_FOUND;
    const agencyResult = await Agency.findById(result.agency);

    return result.toInvoice(agencyResult?.toAgency());
  }
  async store(input: InvoiceCreateInput): Promise<AdministratorInvoice> {
    const agency = await Agency.findById(input.agency);
    if (!agency) throw new Error("Agency not found");

    const invoice = await InvoiceModel.create({
      ...input,
      agency: agency._id,
      contributions: {},
      status: InvoiceStatus.Active,
    });

    return invoice.toInvoice(agency.toAgency());
  }

  async addWalletAddress(
    invoice: AdministratorInvoice,
    address: string
  ): Promise<AdministratorInvoice> {
    if (invoice.walletAddress)
      throw new Error("invoice already has wallet address");
    const invoiceDoc = await InvoiceModel.findByIdAndUpdate(invoice.id, {
      walletAddress: address,
    });

    invoice.walletAddress = address;
    return invoice;
  }
}
