import { NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/products-data';

export async function GET() {
  try {
    const products = getProducts();
    return NextResponse.json({ totalCount: products.length, products });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to list products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newProduct = createProduct(body);
    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500 });
  }
}

