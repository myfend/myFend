import { PublicInvoice } from "../controllers/invoiceActive";

export default class NewContribution {
  public invoice: PublicInvoice;

  constructor(invoice: PublicInvoice) {
    this.invoice = invoice;
  }
}
