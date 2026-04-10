import { NextResponse } from 'next/server';
import { uploadFile } from '@/lib/vector-db/r2-service';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const key = `uploads/${filename}`;
    
    const publicUrl = await uploadFile(buffer, key, file.type);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
