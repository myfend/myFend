import {
  AdministratorInvoice,
  InvoiceCreateInput,
  InvoiceDB,
  InvoiceListParams,
  InvoiceStatus,
  SimpleInvoice,
} from "../controllers/administratorInvoice";
import Agency from "../database/models/agency";
import InvoiceModel from "../database/models/invoice";

export default class MongoInvoiceDb implements InvoiceDB {
  async list(params: InvoiceListParams): Promise<SimpleInvoice[]> {
    const $limit = params?.limit || 20;
    const $skip = params?.page && params?.page > 1 ? params.page - 1 : 0;

    const $match: any = {};
    if (params.status) {
      $match.status = params.status;
    }
    const res = await InvoiceModel.aggregate([
      { $match },
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
    ]);

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
  async show(id: string): Promise<AdministratorInvoice> {
    const result = await InvoiceModel.findById(id);
    if (!result) throw new Error("result not found");
    const agencyResult = await Agency.findById(result.agency);
    const agency = {
      id: agencyResult?._id?.toString() as string,
      name: agencyResult?.name as string,
      description: agencyResult?.description as string,
      email: agencyResult?.email as string,
    };
    return result.toInvoice(agency);
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
    console.log(invoiceDoc);

    invoice.walletAddress = address;
    return invoice;
  }
}
