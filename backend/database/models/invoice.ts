import {
  AdministratorInvoice as LogicInvoice,
  InvoiceStatus,
} from "../../controllers/administratorInvoice";
import { model, Schema, Types } from "mongoose";
import { Agency } from "../../controllers/agency";
import { PublicInvoice } from "../../controllers/invoiceActive";

type Contribution = {
  lender: Types.ObjectId;
  amount: number;
  stake: number;
  repay: number;
};

export interface Invoice {
  _id: Types.ObjectId;
  name: string;
  description: string;
  url: string;
  agency: Types.ObjectId;
  amount: number;
  repaymentAmount: number;
  interest: number;
  company: string;
  walletAddress: string;
  invoiceUrl: string;
  status: InvoiceStatus;
  contributionClosesAt: Date;
  repaymentAt: Date;
  activatedAt: Date;
  balanceWithdrawnAt: Date;
  contributions: Map<string, Contribution>;
  toInvoice(agency?: Agency): LogicInvoice;
  toPublicInvoice(agency?: Agency): PublicInvoice;
}

const schema = new Schema<Invoice>(
  {
    name: String,
    description: String,
    url: String,
    agency: Types.ObjectId,
    walletAddress: String,
    invoiceUrl: String,
    amount: Number,
    interest: Number,
    activatedAt: Date,
    balanceWithdrawnAt: Date,
    contributionClosesAt: Date,
    repaymentAt: Date,
    company: String,
    status: {
      type: String,
      enum: ["active"],
    },
    contributions: {
      type: Map,
      of: {
        lender: Types.ObjectId,
        amount: Number,
        stake: Number,
        repay: Number,
      },
    },
  },
  {
    timestamps: true,
    methods: {
      toInvoice(agency?: Agency): LogicInvoice {
        let contributed: number = 0;
        const contributions: any[] = [];
        this.contributions?.forEach((contribution) => {
          contributions.push({
            lender: { id: contribution.lender?.toString() },
            amount: contribution.amount,
            stake: contribution.stake,
            repay: contribution.repay,
          });
          contributed +=
            typeof contribution.amount === "string"
              ? parseFloat(contribution.amount)
              : contribution.amount;
        });

        return {
          activatedAt: this.activatedAt,
          agency: agency,
          amount: this.amount,
          repaymentAmount: this.repaymentAmount,
          company: this.company,
          description: this.description,
          contributionClosesAt: this.contributionClosesAt,
          repaymentAt: this.repaymentAt,
          id: this._id.toString(),
          name: this.name,
          invoiceUrl: this.invoiceUrl,
          walletAddress: this.walletAddress,
          balanceWithdrawnAt: this.balanceWithdrawnAt,
          status: this.status,
          interest: this.interest,
          url: this.url,
          contributions,
          contributed,
        };
      },

      toPublicInvoice(agency?: Agency): PublicInvoice {
        const contributions: any[] = [];
        let contributed: number = 0;
        this.contributions?.forEach((contribution: any) => {
          contributed +=
            typeof contribution.amount === "string"
              ? parseFloat(contribution.amount)
              : contribution.amount;

          contributions.push({
            lender: { id: contribution.lender?.toString() },
            amount: contribution.amount,
            stake: contribution.stake,
            repay: contribution.repay,
          });
        });

        return {
          activatedAt: this.activatedAt,
          agency: agency,
          amount: this.amount,
          company: this.company,
          contributions: contributions,
          contributed: contributed,
          description: this.description,
          id: this._id.toString(),
          interest: this.interest,
          walletAddress: this.walletAddress,
          name: this.name,
          status: this.status,
          url: this.url,
          invoiceUrl: this.invoiceUrl,
          contributionClosesAt: this.contributionClosesAt,
          repaymentAt: this.repaymentAt,
        };
      },
    },
  }
);

schema.virtual("repaymentAmount").get(function () {
  return this.amount + this.amount * this.interest;
});

const Invoice = model<Invoice>("Invoice", schema);
export default Invoice;
