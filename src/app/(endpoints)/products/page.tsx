import type { Metadata } from 'next';
import { connection } from 'next/server';
import { listProducts } from '@/lib/paypal';
import { ProductsPageContainer } from '@/app/products/components/products-page-container';

export const metadata: Metadata = { title: 'Products Catalog & Inventory Admin' };

export default async function ProductsPage() {
  // Live PayPal data: render per request, not at build time.
  await connection();
  const products = await listProducts();

  const paypalRows = products.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    category: p.category,
    description: p.description,
    created: p.create_time,
  }));

  const paypalColumns = [
    { field: 'name', headerName: 'Name' },
    { field: 'type', headerName: 'Type' },
    { field: 'category', headerName: 'Category' },
    { field: 'description', headerName: 'Description' },
    { field: 'created', headerName: 'Created', cellDataType: 'dateTimeString' as const },
    { field: 'id', headerName: 'Product ID' },
  ];

  return (
    <ProductsPageContainer
      paypalRows={paypalRows}
      paypalColumns={paypalColumns}
      calls={['GET /v1/catalogs/products', 'GET /v1/catalogs/products/{id}']}
      source="listProducts()"
    />
  );
}
