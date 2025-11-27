'use client';

import React from 'react';
import { User, Bell, Moon, Sun, Shield, LogOut } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">設定</h1>

            <div className="space-y-6">
                {/* プロフィール設定 */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                            <User className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-900">プロフィール設定</h2>
                        </div>
                        <p className="text-sm text-gray-500 ml-7">アカウント情報の確認・変更ができます</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ユーザー名</label>
                                <input
                                    type="text"
                                    defaultValue="田中 太郎"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                                <input
                                    type="email"
                                    defaultValue="tanaka.taro@example.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 表示設定 */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                            <Sun className="w-5 h-5 text-orange-500" />
                            <h2 className="text-lg font-semibold text-gray-900">表示設定</h2>
                        </div>
                        <p className="text-sm text-gray-500 ml-7">アプリケーションの見た目をカスタマイズします</p>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">テーマ設定</p>
                                <p className="text-sm text-gray-500">ライトモードとダークモードを切り替えます</p>
                            </div>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button className="px-4 py-2 bg-white rounded-md shadow-sm text-sm font-medium text-gray-900 flex items-center gap-2">
                                    <Sun className="w-4 h-4" />
                                    ライト
                                </button>
                                <button className="px-4 py-2 text-sm font-medium text-gray-500 flex items-center gap-2 hover:text-gray-900">
                                    <Moon className="w-4 h-4" />
                                    ダーク
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 通知設定 */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                            <Bell className="w-5 h-5 text-purple-600" />
                            <h2 className="text-lg font-semibold text-gray-900">通知設定</h2>
                        </div>
                        <p className="text-sm text-gray-500 ml-7">通知の受け取り方を設定します</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="font-medium text-gray-900">デスクトップ通知</p>
                                <p className="text-sm text-gray-500">ブラウザでのプッシュ通知を許可します</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="border-t border-gray-100 my-2"></div>
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="font-medium text-gray-900">メール通知</p>
                                <p className="text-sm text-gray-500">重要なお知らせをメールで受け取ります</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </section>

                {/* その他 */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-5 h-5 text-green-600" />
                            <h2 className="text-lg font-semibold text-gray-900">セキュリティ</h2>
                        </div>
                    </div>
                    <div className="p-6">
                        <button className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors">
                            <LogOut className="w-5 h-5" />
                            ログアウト
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
