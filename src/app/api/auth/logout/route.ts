import { NextResponse } from 'next/server';
import { removeAuthCookie } from '@/lib/auth';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    removeAuthCookie(response);
    return response;
  } catch (err) {
    console.error('logout error:', err);
    return NextResponse.json({ error: 'UNKNOWN' }, { status: 500 });
  }
}
