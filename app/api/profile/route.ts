import { NextResponse } from 'next/server';
import { MetaClient } from '@/lib/meta-client';

export async function POST(req: Request) {
  try {
    const { igUserId, accessToken } = await req.json();
    
    // Temporarily override env vars for this request if provided
    if (igUserId) process.env.META_CLI_IG_USER_ID = igUserId;
    if (accessToken) process.env.META_CLI_ACCESS_TOKEN = accessToken;

    const profile = await MetaClient.getProfile();

    if (profile) {
      return NextResponse.json({ success: true, profile });
    } else {
      return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 400 });
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
