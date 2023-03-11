import { AdministratorInvoice } from "../controllers/administratorInvoice";

export default class InvoiceUpdated {
  invoice: AdministratorInvoice;

  constructor(invoice: AdministratorInvoice) {
    this.invoice = invoice;
  }
}
