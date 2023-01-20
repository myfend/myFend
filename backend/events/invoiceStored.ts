import { AdministratorInvoice } from "../controllers/administratorInvoice";

export default class InvoiceStored {
  invoice: AdministratorInvoice;

  constructor(invoice: AdministratorInvoice) {
    this.invoice = invoice;
  }
}
