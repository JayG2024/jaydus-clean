import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';

async function GET(req: NextRequest) {
  const handler = NextAuth(authOptions);
  return handler(req);
}

async function POST(req: NextRequest) {
  const handler = NextAuth(authOptions);
  return handler(req);
}

export { GET, POST };