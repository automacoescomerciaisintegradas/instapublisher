import { NextResponse } from 'next/server';
import { saveVector } from '@/lib/vector-db/r2-service';
import { VectorEntry, ContentType } from '@/lib/vector-db/types';
import { getEmbedding, describeContent } from '@/lib/vector-db/gemini-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, content, mimeType, metadata: inputMetadata, embedding: inputEmbedding } = body;

    let embedding = inputEmbedding;
    let description = '';

    // If embedding is not provided, we need to generate it
    if (!embedding) {
      if (type === 'text' || type === 'document') {
        embedding = await getEmbedding(content);
      } else if (type === 'image' || type === 'video') {
        // For media, we describe it first then embed the description
        description = await describeContent(content, mimeType || '', type as 'image' | 'video');
        embedding = await getEmbedding(description);
      } else {
        return NextResponse.json({ error: 'Unsupported content type for embedding generation' }, { status: 400 });
      }
    }

    const entry: VectorEntry = {
      embedding,
      metadata: {
        id: inputMetadata?.id || Math.random().toString(36).substring(7),
        type: type as ContentType,
        title: inputMetadata?.title || 'Untitled',
        source: inputMetadata?.source,
        tags: inputMetadata?.tags || [],
        createdAt: new Date().toISOString(),
        originalContent: type === 'text' ? content : description,
        mimeType: mimeType
      }
    };

    await saveVector(entry);

    return NextResponse.json({ success: true, id: entry.metadata.id });
  } catch (error: any) {
    console.error('Ingest Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
