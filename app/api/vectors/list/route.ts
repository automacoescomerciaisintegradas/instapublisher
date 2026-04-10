import { NextResponse } from 'next/server';
import { listVectors } from '@/lib/vector-db/r2-service';

export async function GET() {
  try {
    const vectors = await listVectors();
    return NextResponse.json({ success: true, vectors });
  } catch (error: any) {
    console.error('List Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
