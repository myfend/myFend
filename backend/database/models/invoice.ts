import { InvoiceStatus } from "../../controllers/administratorInvoice";
import { Schema, model, Types } from "mongoose";
import { Agency } from "../../controllers/agency";
import { AdministratorInvoice as LogicInvoice } from "../../controllers/administratorInvoice";

export interface Invoice {
  _id: Types.ObjectId;
  name: string;
  description: string;
  url: string;
  agency: Types.ObjectId;
  amount: number;
  interest: number;
  company: string;
  walletAddress: string;
  status: InvoiceStatus;
  activatedAt: Date;
  contributions: Map<
    string,
    { lender: Types.ObjectId; amount: number; stake: number }
  >;
  toInvoice(agency?: Agency): LogicInvoice;
}

const schema = new Schema<Invoice>(
  {
    name: String,
    description: String,
    url: String,
    agency: Types.ObjectId,
    walletAddress: String,
    amount: Number,
    interest: Number,
    activatedAt: Date,
    company: String,
    status: {
      type: String,
      enum: Object.values(InvoiceStatus).filter(
        (status) => typeof status === "string"
      ),
    },
    contributions: {
      type: Map,
      of: { lender: Types.ObjectId, amount: Number, stake: Number },
    },
  },
  {
    timestamps: true,
    methods: {
      toInvoice(agency?: Agency): LogicInvoice {
        const contributions: any[] = [];
        this.contributions?.forEach((contribution) =>
          contributions.push({
            lender: { id: contribution.lender?.toString() },
            amount: contribution.amount,
            stake: contribution.stake,
          })
        );

        return {
          activatedAt: this.activatedAt,
          agency: agency,
          amount: this.amount,
          company: this.company,
          description: this.description,
          id: this._id.toString(),
          name: this.name,
          walletAddress: this.walletAddress,
          status: this.status,
          interest: this.interest,
          url: this.url,
          contributions,
        };
      },
    },
  }
);

const Invoice = model<Invoice>("Invoice", schema);
export default Invoice;
