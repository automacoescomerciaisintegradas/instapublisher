import { NextResponse } from 'next/server';
import { MetaClient } from '@/lib/meta-client';

export async function POST(req: Request) {
  try {
    const { igUserId, accessToken } = await req.json();
    
    const feed = await MetaClient.getFeed({ igUserId, accessToken });

    if (feed) {
      return NextResponse.json({ success: true, feed });
    } else {
      return NextResponse.json({ success: false, error: 'Failed to fetch feed' }, { status: 400 });
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
