import { NextResponse } from 'next/server';
import { getUsers, createUser } from '@/lib/users-data';

export async function GET() {
  try {
    const users = getUsers();
    return NextResponse.json({ totalCount: users.length, users });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to list users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newUser = createUser(body);
    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to create user' }, { status: 500 });
  }
}

