import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    let userMessage = '';
    try {
        const { message } = await req.json();
        userMessage = message;

        // Use standard environment variable or specific one if needed
        const apiKey = process.env.GEMINI_API_KEY;
        console.log("Chat API Request received. Key loaded:", !!apiKey); // DEBUG LOG

        if (!apiKey) {
            console.error("API Key missing");
            // Return a helpful mock response if key is missing, to avoid breaking the demo
            return NextResponse.json({
                reply: "申し訳ありません。現在AIサービスに接続できません（APIキーが未設定です）。管理者にご連絡ください。"
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using specific version as requested by user
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

        const result = await chat.sendMessage(userMessage);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ reply: text });

    } catch (error: any) {
        console.error("Chat API Error:", error);

        // Fallback: Return a rule-based response instead of crashing
        let reply = '申し訳ありません。現在AIサービスに接続できませんが、一般的な使い方についてお答えします。\n\n';
        const input = userMessage || '';

        if (input.includes('スケジュール') || input.includes('予定')) {
            reply = 'スケジュールの確認・登録は、ダッシュボードの「クイックアクセス」から行うことができます。カレンダーアイコンをクリックしてください。';
        } else if (input.includes('お知らせ') || input.includes('投稿')) {
            reply = 'お知らせの投稿は、ダッシュボードの「お知らせ」ウィジェットにある「投稿」ボタンから行えます。重要なお知らせはメール通知も可能です。';
        } else if (input.includes('設定') || input.includes('通知')) {
            reply = '設定画面では、テーマの変更やデスクトップ通知のON/OFFが切り替えられます。「一般設定」タブをご確認ください。';
        } else if (input.includes('申請') || input.includes('ワークフロー')) {
            reply = '各種申請は、サイドバーの「リンク集」にある「WEB申請」または「経費・旅費精算」から外部システムへアクセスしてください。';
        } else {
            reply = '申し訳ありません。AI接続に一時的な問題が発生しています。しばらく待ってから再度お試しいただくか、システム管理者（田中）にご連絡ください。';
        }

        return NextResponse.json({ reply });
    }
}
