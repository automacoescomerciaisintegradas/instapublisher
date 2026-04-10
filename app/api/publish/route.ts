import { NextResponse } from 'next/server';
import { MetaClient } from '@/lib/meta-client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { igUserId, accessToken, images, caption } = body;

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'Missing images' }, { status: 400 });
    }

    const postId = await MetaClient.publishCarousel(images, caption, { igUserId, accessToken });

    return NextResponse.json({ success: true, id: postId });

  } catch (error: any) {
    console.error("❌ Falha crítica na automação de postagem:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
