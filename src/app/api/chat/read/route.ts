
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
    try {
        // 1. Verify User via Token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');

        // Create a temporary client to verify the token
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

        const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);

        if (authError || !user) {
            console.error('Auth check failed:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { threadId } = await req.json();

        if (!threadId) {
            return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
        }

        // 2. Perform Admin Update
        const { error } = await supabaseAdmin
            .from('thread_participants')
            .upsert({
                thread_id: threadId,
                user_id: user.id,
                last_read_at: new Date().toISOString()
            }, { onConflict: 'thread_id,user_id' });

        if (error) {
            console.error('Error marking read via admin:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in /api/chat/read:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
