import { connection } from "next/server";
import { getInvoices } from "@/lib/paypal";
import { DataTable, money } from "../data-table";

export default async function InvoicesPage() {
  await connection();

  const invoices = await getInvoices();

  return (
    <DataTable
      title="Invoices"
      columns={["Number", "Status", "Customer", "Company", "Invoice date", "Due date", "Total", "Paid", "Refunded", "Due", "ID"]}
      rows={invoices.map((inv) => {
        const recipient = inv.primary_recipients?.[0]?.billing_info;
        return {
          key: inv.id,
          cells: [
            inv.detail.invoice_number,
            inv.status,
            recipient?.name?.full_name ?? recipient?.email_address,
            recipient?.business_name,
            inv.detail.invoice_date,
            inv.detail.payment_term?.due_date,
            money(inv.amount),
            money(inv.payments?.paid_amount),
            money(inv.refunds?.refund_amount),
            money(inv.due_amount),
            inv.id,
          ],
        };
      })}
    />
  );
}
