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

        if (bucketError) {
            if (bucketError.message.includes('not found')) {
                // Try to create if not exists
                const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
                    public: true,
                    fileSizeLimit: 10485760 // 10MB
                });
                if (createError) {
                    console.error('Failed to create bucket', createError);
                    return NextResponse.json({ error: `Failed to create bucket: ${createError.message}` }, { status: 500 });
                }
            } else {
                console.error('Error checking bucket:', bucketError);
                // Proceeding might be risky if we can't check it, but let's try upload anyway?
                // Or maybe return error?
                // For now, let's just log it.
            }
        } else {
            // Ensure public if exists
            const { error: updateError } = await supabaseAdmin.storage.updateBucket(bucketName, {
                public: true,
                fileSizeLimit: 10485760 // 10MB
            });
            if (updateError) {
                console.error('Failed to update bucket', updateError);
            }
        }

        let buffer: Buffer;
        try {
            buffer = Buffer.from(await file.arrayBuffer());
        } catch (e: any) {
            console.error('File buffer error:', e);
            return NextResponse.json({ error: `File processing failed: ${e.message}` }, { status: 500 });
        }

        const { data, error } = await supabaseAdmin
            .storage
            .from(bucketName)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (error) {
            console.error('Upload error details:', error);
            // Check for explicit size limit error or other common issues
            return NextResponse.json({
                error: `Upload failed: ${error.message}`,
                details: error
            }, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return NextResponse.json({ publicUrl });
    } catch (error: any) {
        console.error('Upload API Critical Error:', error);
        return NextResponse.json({
            error: `Server Error: ${error.message}`,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
