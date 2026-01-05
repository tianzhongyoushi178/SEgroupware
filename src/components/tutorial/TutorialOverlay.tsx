'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { X, ChevronRight, Check, ArrowRight } from 'lucide-react';
import { useAppSettingsStore } from '@/store/appSettingsStore';

interface Step {
    target?: string; // CSS selector for highlighting
    title: string;
    content: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    requireAction?: boolean; // If true, Next button is disabled until condition met
}

export default function TutorialOverlay() {
    const { user, profile, completeTutorial, updateProfileName } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [stepIndex, setStepIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [tempName, setTempName] = useState('');

    useEffect(() => {
        // Wait for profile to load
        if (profile && profile.isTutorialCompleted === false) {
            setIsVisible(true);
            setTempName(profile.displayName || '');
        }
    }, [profile]);

    if (!isVisible || !profile) return null;

    const steps: Step[] = [
        {
            title: 'Sales Hubへようこそ',
            content: (
                <div>
                    <p className="mb-4">新しいグループウェア「Sales Hub」へようこそ。</p>
                    <p>ここで日々の業務を効率化するための主な機能をご紹介します。</p>
                </div>
            ),
            position: 'center'
        },
        {
            title: '基本設定（必須）',
            content: (
                <div>
                    <p className="mb-4 text-sm text-gray-600">まずは、他のメンバーに表示されるあなたの名前を設定してください。</p>
                    <div className="mb-2">
                        <label className="block text-xs font-bold mb-1">表示名</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            placeholder="例: 佐藤 太郎"
                        />
                    </div>
                    {!tempName.trim() && <p className="text-xs text-red-500">※名前を入力してください</p>}
                </div>
            ),
            position: 'center',
            requireAction: true
        },
        {
            target: 'nav a[href="/notices"]',
            title: 'お知らせ機能',
            content: (
                <div>
                    <p className="mb-2">重要なお知らせはここで確認できます。</p>
                    <p className="text-sm text-gray-600">
                        右上の「＋新規作成」ボタンから、新しいお知らせを投稿することも可能です。<br />
                        全社員向け、または部署限定のお知らせを発信できます。
                    </p>
                </div>
            ),
            position: 'right'
        },
        {
            target: 'nav a[href="/chat"]',
            title: 'チャット機能',
            content: (
                <div>
                    <p className="mb-2">リアルタイムなコミュニケーションはこちら。</p>
                    <p className="text-sm text-gray-600">
                        プロジェクトごとのスレッド作成や、特定のメンバーとのプライベートな会話も可能です。<br />
                        ファイルの添付やAIアシスタントの利用もサポートしています。
                    </p>
                </div>
            ),
            position: 'right'
        },
        {
            title: '準備完了！',
            content: <p>さあ、始めましょう。右上の設定アイコンから、いつでもダークモードや各種設定を変更できます。</p>,
            position: 'center'
        }
    ];

    const currentStep = steps[stepIndex];
    const isNameStep = stepIndex === 1; // Index 1 is the name setting step
    const canProceed = isNameStep ? !!tempName.trim() : true;

    const handleNext = async () => {
        if (isNameStep) {
            if (!tempName.trim()) return;
            // Save name
            await updateProfileName(tempName);
        }

        if (stepIndex < steps.length - 1) {
            setStepIndex(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        await completeTutorial();
        setIsVisible(false);
    };

    // Calculate Highlight Position
    let highlightStyle: React.CSSProperties = {};
    if (currentStep.target && typeof document !== 'undefined') {
        const el = document.querySelector(currentStep.target);
        if (el) {
            const rect = el.getBoundingClientRect();
            highlightStyle = {
                position: 'fixed',
                top: rect.top - 4,
                left: rect.left - 4,
                width: rect.width + 8,
                height: rect.height + 8,
                borderRadius: '8px',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
                zIndex: 9998,
                pointerEvents: 'none',
                transition: 'all 0.3s ease'
            };
        }
    } else {
        // Full screen overlay if no target highlight
        highlightStyle = {
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9998
        };
    }

    // Floating Modal Style
    let modalStyle: React.CSSProperties = {
        position: 'fixed',
        zIndex: 9999,
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        width: '320px',
        maxWidth: '90vw',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease'
    };

    if (currentStep.position === 'center') {
        modalStyle = { ...modalStyle, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    } else if (currentStep.target && typeof document !== 'undefined') {
        const el = document.querySelector(currentStep.target);
        if (el) {
            const rect = el.getBoundingClientRect();
            if (currentStep.position === 'right') {
                modalStyle = { ...modalStyle, top: rect.top, left: rect.right + 20 };
            }
            // Add other positions if needed
        }
    }

    return (
        <>
            <div style={highlightStyle} />
            <div style={modalStyle} className="animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{currentStep.title}</h3>
                    <div className="text-xs text-gray-400 font-mono mt-1">
                        {stepIndex + 1} / {steps.length}
                    </div>
                </div>

                <div className="mb-6 text-gray-700 leading-relaxed">
                    {currentStep.content}
                </div>

                <div className="flex justify-between items-center">
                    {stepIndex > 0 && !isNameStep ? (
                        <button
                            onClick={() => setStepIndex(prev => prev - 1)}
                            className="text-sm text-gray-500 hover:text-gray-800"
                        >
                            戻る
                        </button>
                    ) : (
                        <div /> // Spacer
                    )}

                    <button
                        onClick={handleNext}
                        disabled={!canProceed}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                            ${canProceed
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                        `}
                    >
                        {stepIndex === steps.length - 1 ? '始める' : '次へ'}
                        {stepIndex === steps.length - 1 ? <Check size={16} /> : <ArrowRight size={16} />}
                    </button>
                </div>
            </div>
        </>
    );
}
