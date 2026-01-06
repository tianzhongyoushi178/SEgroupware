import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const filePath = formData.get('path') as string;

        if (!file || !filePath) {
            return NextResponse.json({ error: 'File or path missing' }, { status: 400 });
        }

        const bucketName = 'chat-attachments';

        // Ensure bucket exists (best effort)
        const { data: bucketData, error: bucketError } = await supabaseAdmin
            .storage
            .getBucket(bucketName);

        if (bucketError && bucketError.message.includes('not found')) {
            // Try to create if not exists
            const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
                public: true
            });
            if (createError) {
                console.error('Failed to create bucket', createError);
            }
        } else {
            // Ensure public if exists (idempotent-ish)
            await supabaseAdmin.storage.updateBucket(bucketName, { public: true });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const { data, error } = await supabaseAdmin
            .storage
            .from(bucketName)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (error) {
            console.error('Upload error', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return NextResponse.json({ publicUrl });
    } catch (error: any) {
        console.error('Upload API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
