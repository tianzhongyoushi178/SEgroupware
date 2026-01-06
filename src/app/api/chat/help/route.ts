import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        // Use standard environment variable or specific one if needed
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("API Key missing");
            // Return a helpful mock response if key is missing, to avoid breaking the demo
            return NextResponse.json({
                reply: "申し訳ありません。現在AIサービスに接続できません（APIキーが未設定です）。管理者にご連絡ください。"
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using 'gemini-1.5-flash' as it is stable and fast. 'gemini-2.0-flash-exp' is also an option if available.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = `
あなたは社内グループウェア「Sales Hub」のヘルプデスクAIです。
以下の機能について、ユーザーの質問に日本語で簡潔に答えてください。

【主な機能】
- **ダッシュボード**: ログイン直後の画面。クイックアクセス（よく使うリンク）、お知らせ一覧があります。
- **スケジュール**: Googleカレンダーのような機能。自分の予定管理やチームメンバーの予定確認ができます。
- **掲示板（お知らせ）**: 重要な連絡事項を投稿・閲覧する場所。重要度設定やメール通知が可能です。
- **ワークフロー（申請）**: 経費精算、決裁申請などを行います。サイドバーの「リンク集」からアクセスします。
- **チャット**: チームメンバーとのリアルタイムなコミュニケーションツール。スレッド形式で会話できます。
- **設定**: テーマ（ダークモード）の切り替え、デスクトップ通知設定ができます。

【回答のルール】
- ユーザーの質問が曖昧な場合（「あれこれ」など）は、文脈から推測して補足質問をするか、一般的な機能を案内してください。
- 丁寧で親しみやすい口調（〜です、〜ます）で話してください。
- 回答は長すぎないように（300文字以内推奨）。
- 機能以外の質問（天気、料理など）には「申し訳ありませんが、グループウェアの使い方以外にはお答えできません」と返してください。
`;

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: "承知いたしました。Sales HubのヘルプデスクAIとして、ユーザーの皆様の質問に丁寧にお答えします。どのようなことでもお聞きください。" }],
                },
            ],
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const result = await chat.sendMessage(message);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ reply: text });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({
            error: "AI service error",
            details: error.message
        }, { status: 500 });
    }
}
