'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { X, ChevronRight, Check, ArrowRight } from 'lucide-react';

interface Step {
    target?: string; // CSS selector for highlighting
    title: string;
    content: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    requireAction?: boolean; // If true, Next button is disabled until condition met
    path?: string; // Path to navigate to before showing this step
}

export default function TutorialOverlay() {
    const { user, profile, completeTutorial, updateProfileName } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [stepIndex, setStepIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [tempName, setTempName] = useState('');
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        // Wait for profile to load
        if (profile && profile.isTutorialCompleted === false) {
            setIsVisible(true);
            setTempName(profile.displayName || '');
        }
    }, [profile]);

    // Navigation logic
    useEffect(() => {
        if (!isVisible) return;

        const currentStep = steps[stepIndex];
        if (currentStep.path && pathname !== currentStep.path) {
            setIsNavigating(true);
            router.push(currentStep.path);
        } else {
            setIsNavigating(false);
        }
    }, [stepIndex, isVisible, pathname]); // Re-run when path changes

    if (!isVisible || !profile) return null;

    const steps: Step[] = [
        {
            title: 'Sales Hubへようこそ',
            content: (
                <div>
                    <p className="mb-4">新しいグループウェア「Sales Hub」へようこそ。</p>
                    <p>あなたとチームの業務効率化をサポートする、パワフルなプラットフォームです。</p>
                </div>
            ),
            position: 'center'
        },
        {
            title: '基本設定（必須）',
            content: (
                <div>
                    <p className="mb-4 text-sm text-gray-600">まずは、チームメンバーに表示するあなたの名前を設定してください。</p>
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
        // Notices Section
        {
            path: '/notices',
            target: 'nav a[href="/notices"]',
            title: 'お知らせ機能',
            content: (
                <div>
                    <p className="mb-2">全社やチームへの連絡事項は「お知らせ」で共有します。</p>
                    <p className="text-sm text-gray-600">重要度やカテゴリ分けされた情報を一覧で確認できます。</p>
                </div>
            ),
            position: 'right'
        },
        {
            path: '/notices',
            target: '#tutorial-notice-create-btn',
            title: 'お知らせを作成',
            content: (
                <div>
                    <p className="mb-2">ここから新しいお知らせを作成できます。</p>
                    <p className="text-sm text-gray-600">
                        全社員向け、または特定のラベルを付けて発信できます。<br />
                        重要な情報は「重要」ラベルを付けることで目立たせることができます。
                    </p>
                </div>
            ),
            position: 'bottom'
        },
        {
            path: '/notices',
            target: '#tutorial-notice-filter-desktop', // Fallback will handle mobile if desktop ID missing? Need handling or simple distinct steps
            title: '検索とフィルタリング',
            content: (
                <div>
                    <p className="mb-2">お知らせをカテゴリで絞り込んだり、未読のみ表示することができます。</p>
                    <p className="text-sm text-gray-600">過去のお知らせもここから簡単に検索可能です。</p>
                </div>
            ),
            position: 'bottom'
        },
        // Chat Section
        {
            path: '/chat',
            target: 'nav a[href="/chat"]',
            title: 'チャット機能',
            content: (
                <div>
                    <p className="mb-2">リアルタイムなコミュニケーションは「チャット」で行います。</p>
                    <p className="text-sm text-gray-600">プロジェクトやトピックごとにスレッドを作成し、議論を深めましょう。</p>
                </div>
            ),
            position: 'right'
        },
        {
            path: '/chat',
            target: '#tutorial-chat-create-btn',
            title: 'スレッドの作成',
            content: (
                <div>
                    <p className="mb-2">新しいトピックについて話し合いたいときは、ここからスレッドを作成します。</p>
                    <p className="text-sm text-gray-600">
                        「プライベートスレッド」を選択すれば、招待したメンバーだけで秘密の会話も可能です。
                    </p>
                </div>
            ),
            position: 'bottom'
        },
        {
            title: '準備完了！',
            content: <p>さあ、始めましょう。不明な点があれば、いつでも管理者に問い合わせてください。</p>,
            position: 'center'
        }
    ];

    const currentStep = steps[stepIndex];
    const isNameStep = stepIndex === 1; // Index 1 is the name setting step
    const canProceed = isNameStep ? !!tempName.trim() : true;

    // Loading State during navigation
    if (isNavigating) {
        return null; // Or a spinner
    }

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
    let targetEl = null;

    if (currentStep.target && typeof document !== 'undefined') {
        // Try to find target
        targetEl = document.querySelector(currentStep.target);

        // Mobile fallback for notices filter
        if (!targetEl && currentStep.target === '#tutorial-notice-filter-desktop') {
            targetEl = document.querySelector('#tutorial-notice-filter-mobile');
        }

        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
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
    }

    // If no target found but one was specified (e.g. element not rendered yet), revert to center
    if (!targetEl && currentStep.target) {
        // fallback to center overlay
        highlightStyle = {
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9998
        };
    } else if (!currentStep.target) {
        // Full screen overlay for steps without target
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

    if (currentStep.position === 'center' || (!targetEl && currentStep.target)) {
        modalStyle = { ...modalStyle, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    } else if (targetEl) {
        const rect = targetEl.getBoundingClientRect();

        if (currentStep.position === 'right') {
            modalStyle = { ...modalStyle, top: rect.top, left: rect.right + 20 };
        } else if (currentStep.position === 'bottom') {
            modalStyle = { ...modalStyle, top: rect.bottom + 20, left: rect.left };
        } else if (currentStep.position === 'left') {
            modalStyle = { ...modalStyle, top: rect.top, right: window.innerWidth - rect.left + 20 };
        }

        // Boundary check (rudimentary)
        // If goes off screen bottom
        // ... implementation omitted for brevity, keeping simple
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
