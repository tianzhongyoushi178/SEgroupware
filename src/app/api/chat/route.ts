
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

        // Construct history from previous messages if needed, 
        // but for simplicity and context window, we'll send the last few messages or just the prompt.
        // Let's assume 'messages' is an array of content strings or objects.
        // For a simple @AI chat, we might just send the current prompt.
        // But to have context, we should look at the thread.

        // Input: { prompt: string, history: string[] }

        const lastMessage = messages[messages.length - 1]; // This is the user's @AI message

        // Simple prompt construction
        const prompt = `あなたは「Sales Hub」というグループウェアのアシスタントAIです。
以下のユーザーからのメッセージに親切に答えてください。
メッセージ: ${lastMessage}
`;

        const result = await model.generateContent(prompt);
        const responseProxy = result.response;
        const text = responseProxy.text();

        // Server-side Insert to bypass RLS for "AI" user
        // This ensures the message is saved to DB and visible to all participants via Realtime.
        if (text && threadId) {
            const { error: insertError } = await supabaseAdmin
                .from('messages')
                .insert({
                    thread_id: threadId,
                    content: text,
                    author_id: '00000000-0000-0000-0000-000000000000', // AI ID
                    author_name: 'AI',
                });

            if (insertError) {
                console.error('Failed to insert AI message:', insertError);
                // We don't fail the request, just log it. The client might still see the local optimistic update.
            }
        }

        return NextResponse.json({ response: text });

    } catch (error: any) {
        console.error('AI Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
