import { listProductDetails } from "@/lib/paypal";
import DataSource from "../data-source";

export default function ProductsPage() {
  return (
    <DataSource
      title="Catalog Products"
      endpoints={["GET /v1/catalogs/products", "GET /v1/catalogs/products/{id}"]}
      load={listProductDetails}
    />
  );
}
