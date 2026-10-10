import { connection } from "next/server";
import { getProducts } from "@/lib/paypal";
import { DataTable } from "../data-table";

export default async function ProductsPage() {
  await connection();

  const products = await getProducts();

  return (
    <DataTable
      title="Catalog products"
      columns={["Name", "Type", "Category", "Description", "Created", "ID"]}
      rows={products.map((p) => ({
        key: p.id,
        cells: [p.name, p.type, p.category, p.description, p.create_time?.slice(0, 10), p.id],
      }))}
    />
  );
}
