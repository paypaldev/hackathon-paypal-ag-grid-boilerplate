import { listInvoiceDetails } from "@/lib/paypal";
import DataSource from "../data-source";

export default function InvoicesPage() {
  return (
    <DataSource
      title="Invoices"
      endpoints={["GET /v2/invoicing/invoices", "GET /v2/invoicing/invoices/{id}"]}
      load={listInvoiceDetails}
    />
  );
}
