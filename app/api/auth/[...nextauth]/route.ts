// Temporarily commented out to resolve NextAuth errors during migration to Vercel DB
// import NextAuth from 'next-auth';
// import { authOptions } from '@/lib/auth';

// const handler = NextAuth(authOptions);

// export { handler as GET, handler as POST };

// Temporary placeholder to prevent route errors
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'NextAuth temporarily disabled during migration' });
}

export async function POST() {
  return NextResponse.json({ message: 'NextAuth temporarily disabled during migration' });
}