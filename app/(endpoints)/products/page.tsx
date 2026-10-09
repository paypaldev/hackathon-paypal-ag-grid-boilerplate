import type { Metadata } from 'next';
import { connection } from 'next/server';
import { listProducts } from '@/lib/paypal';
import { EndpointPage } from '../endpoint-page';

export const metadata: Metadata = { title: 'Catalog products' };

export default async function ProductsPage() {
  // Live PayPal data: render per request, not at build time.
  await connection();
  const products = await listProducts();

  return (
    <EndpointPage
      title="Catalog products"
      calls={['GET /v1/catalogs/products', 'GET /v1/catalogs/products/{id}']}
      source="listProducts()"
      note="The list endpoint returns summaries without type or category, so each product is then fetched in full."
      rows={products.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        category: p.category,
        description: p.description,
        created: p.create_time,
      }))}
      columns={[
        { field: 'name', headerName: 'Name' },
        { field: 'type', headerName: 'Type' },
        { field: 'category', headerName: 'Category' },
        { field: 'description', headerName: 'Description' },
        { field: 'created', headerName: 'Created', cellDataType: 'dateTimeString' },
        { field: 'id', headerName: 'Product ID' },
      ]}
    />
  );
}
