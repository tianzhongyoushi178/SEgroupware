'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { X, ChevronRight, Check, ArrowRight } from 'lucide-react';

interface Step {
    target?: string;
    title: string;
    content: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    requireAction?: boolean;
    path?: string;
    onEnter?: () => void;
}

export default function TutorialOverlay() {
    const { user, profile, completeTutorial, updateProfileName } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [stepIndex, setStepIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [tempName, setTempName] = useState('');
    const [isNavigating, setIsNavigating] = useState(false);
    const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (profile && profile.isTutorialCompleted === false) {
            setIsVisible(true);
            setTempName(profile.displayName || '');
        }
    }, [profile]);

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
                    <p className="mb-4 text-base text-gray-600">まずは、チームメンバーに表示するあなたの名前を設定してください。</p>
                    <div className="mb-2">
                        <label className="block text-sm font-bold mb-1">表示名</label>
                        <input
                            type="text"
                            className="w-full p-3 border rounded-lg text-lg"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            placeholder="例: 佐藤 太郎"
                        />
                    </div>
                    {!tempName.trim() && <p className="text-sm text-red-500 font-bold">※名前を入力してください</p>}
                </div>
            ),
            position: 'center',
            requireAction: true
        },
        // Dashboard Tab Highlight
        {
            target: '#tutorial-nav-dashboard',
            title: 'ダッシュボード',
            content: (
                <div>
                    <p className="mb-2">これが「ダッシュボード」です。</p>
                    <p className="text-base text-gray-600 leading-relaxed">
                        ログイン後、最初に表示されるホーム画面です。<br />
                        ここから日々の業務を開始します。
                    </p>
                </div>
            ),
            position: 'right',
            path: '/'
        },
        // Dashboard Content
        {
            path: '/',
            target: '#tutorial-dashboard-quickaccess',
            title: 'クイックアクセス',
            content: (
                <div>
                    <p className="mb-2">よく使う機能へすぐにアクセスできます。</p>
                    <p className="text-base text-gray-600 leading-relaxed">
                        勤怠管理や経費精算など、頻繁に利用するツールへのリンク集です。<br />
                        ご自身でよく使うリンクを追加・カスタマイズすることも可能です。
                    </p>
                </div>
            ),
            position: 'bottom'
        },
        {
            path: '/',
            target: '#tutorial-dashboard-notices',
            title: '最新のお知らせ',
            content: (
                <div>
                    <p className="mb-2">直近の重要なお知らせがここに表示されます。</p>
                    <p className="text-base text-gray-600 leading-relaxed">
                        未読のお知らせを一目で確認できます。
                    </p>
                </div>
            ),
            position: 'left'
        },
        // Notices Tab Highlight
        {
            target: '#tutorial-nav-notices',
            title: 'お知らせメニュー',
            content: (
                <div>
                    <p className="mb-2">「お知らせ」メニューです。</p>
                    <p className="text-base text-gray-600 leading-relaxed">
                        会社全体、または部署内の連絡事項を確認・発信するときはここをクリックします。
                    </p>
                </div>
            ),
            position: 'right',
            // No path change yet, just highlighting the tab
        },
        // Notices Content
        {
            path: '/notices',
            target: '#tutorial-notice-create-btn',
            title: 'お知らせ機能',
            content: (
                <div>
                    <p className="mb-2">ここから新しいお知らせを作成できます。</p>
                    <p className="text-base text-gray-600 leading-relaxed">
                        全社員向け、または部署限定など、ターゲットを絞って発信できます。
                    </p>
                </div>
            ),
            position: 'bottom',
        },
        {
            path: '/notices',
            target: '#tutorial-notice-modal',
            title: 'お知らせ作成フォーム',
            content: (
                <div>
                    <p className="mb-2">作成画面が開きました。</p>
                    <p className="text-base text-gray-600 leading-relaxed">
                        タイトル、本文を入力し、<strong>重要度</strong>を選択して投稿します。<br />
                        ここで入力した内容は全社員に通知されます。
                    </p>
                </div>
            ),
            position: 'right',
            onEnter: () => {
                document.getElementById('tutorial-notice-create-btn')?.click();
            }
        },
        // Chat Tab Highlight
        {
            target: '#tutorial-nav-chat',
            title: 'チャットメニュー',
            content: (
                <div>
                    <p className="mb-2">「チャット」メニューです。</p>
                    <p className="text-base text-gray-600 leading-relaxed">
                        チームメンバーとのリアルタイムなやり取りはここから行います。
                    </p>
                </div>
            ),
            position: 'right',
        },
        // Chat Content
        {
            path: '/chat',
            target: '#tutorial-chat-create-btn',
            title: 'スレッドの作成',
            content: (
                <div>
                    <p className="mb-2">新しいトピックについて話し合いたいときは、ここからスレッドを作成します。</p>
                </div>
            ),
            position: 'bottom',
        },
        {
            path: '/chat',
            target: '#tutorial-chat-modal',
            title: 'スレッド作成設定',
            content: (
                <div>
                    <p className="mb-2">スレッドの設定画面です。</p>
                    <p className="text-base text-gray-600 leading-relaxed">
                        <ul>
                            <li className="mb-1">・<strong>プライベート設定</strong>：招待したメンバーのみ閲覧可能な秘密の部屋を作成できます。</li>
                            <li>・参加者を選択して、すぐに議論を開始できます。</li>
                        </ul>
                    </p>
                </div>
            ),
            position: 'right',
            onEnter: () => {
                document.getElementById('tutorial-chat-create-btn')?.click();
            }
        },
        // Settings Tab Highlight
        {
            target: '#tutorial-nav-settings',
            title: '設定メニュー',
            content: (
                <div>
                    <p className="mb-2">最後に、「設定」メニューです。</p>
                    <p className="text-base text-gray-600 leading-relaxed">
                        個人の設定やアプリケーションの表示設定はここから変更します。
                    </p>
                </div>
            ),
            position: 'right',
        },
        // Settings Content
        {
            path: '/settings',
            target: '#tutorial-settings-theme-buttons',
            title: 'テーマ設定',
            content: (
                <div>
                    <p className="mb-2">自分好みの見た目にカスタマイズできます。</p>
                    <p className="text-base text-gray-600 leading-relaxed">
                        ダークモードへの切り替えや、アクセントカラーの変更が可能です。
                    </p>
                </div>
            ),
            position: 'bottom'
        },
        {
            path: '/settings',
            target: '#tutorial-settings-notifications',
            title: '通知設定',
            content: (
                <div>
                    <p className="mb-2">通知の受け取り方を調整します。</p>
                    <p className="text-base text-gray-600 leading-relaxed">
                        重要な連絡を見逃さないよう、適切に設定しましょう。
                    </p>
                </div>
            ),
            position: 'bottom'
        },
        {
            title: '準備完了！',
            content: <p className="text-lg">これでツアーは終了です。さあ、Sales Hubでの業務を始めましょう！</p>,
            position: 'center'
        }
    ];

    const currentStep = steps[stepIndex];
    const isNameStep = stepIndex === 1;
    const canProceed = isNameStep ? !!tempName.trim() : true;

    const updateHighlight = useCallback(() => {
        if (!currentStep.target) {
            setHighlightRect(null);
            return;
        }

        // Wait slightly for DOM if navigating
        setTimeout(() => {
            const el = document.querySelector(currentStep.target!);
            if (el) {
                const rect = el.getBoundingClientRect();
                setHighlightRect(rect);

                const isInViewport = (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                );

                if (!isInViewport) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                // Mobile fallback logic
                if (currentStep.target === '#tutorial-notice-filter-desktop') {
                    const mobileEl = document.querySelector('#tutorial-notice-filter-mobile');
                    if (mobileEl) {
                        setHighlightRect(mobileEl.getBoundingClientRect());
                        return;
                    }
                }
                setHighlightRect(null);
            }
        }, 100);
    }, [currentStep.target]);

    useEffect(() => {
        if (!isVisible) return;

        const handleTransition = async () => {
            if (currentStep.path && pathname !== currentStep.path) {
                setIsNavigating(true);
                await router.push(currentStep.path);
                setTimeout(() => {
                    setIsNavigating(false);
                    if (currentStep.onEnter) currentStep.onEnter();
                }, 800);
            } else {
                setIsNavigating(false);
                if (currentStep.onEnter) currentStep.onEnter();
            }
        };

        handleTransition();
    }, [stepIndex, isVisible, currentStep.path, pathname]);

    useEffect(() => {
        if (isNavigating || !isVisible) return;

        updateHighlight();

        window.addEventListener('resize', updateHighlight);
        window.addEventListener('scroll', updateHighlight);

        const interval = setInterval(updateHighlight, 500);

        return () => {
            window.removeEventListener('resize', updateHighlight);
            window.removeEventListener('scroll', updateHighlight);
            clearInterval(interval);
        };
    }, [isNavigating, isVisible, updateHighlight]); // Removed 'stepIndex' to rely on updateHighlight derived from currentStep

    if (!isVisible || !profile || isNavigating) return null;

    const handleNext = async () => {
        if (isNameStep) {
            if (!tempName.trim()) return;
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

    const highlightStyle: React.CSSProperties = highlightRect ? {
        position: 'fixed',
        top: highlightRect.top - 8,
        left: highlightRect.left - 8,
        width: highlightRect.width + 16,
        height: highlightRect.height + 16,
        borderRadius: '8px',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
        zIndex: 9998,
        pointerEvents: 'none',
        transition: 'all 0.3s ease'
    } : {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 9998
    };

    let modalStyle: React.CSSProperties = {
        position: 'fixed',
        zIndex: 9999,
        background: 'white',
        padding: '2rem',
        borderRadius: '16px',
        width: '480px',
        maxWidth: '95vw',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    };

    if (highlightRect) {
        let top = highlightRect.top;
        let left = highlightRect.right + 24;

        if (currentStep.position === 'left') {
            left = highlightRect.left - 480 - 24;
        } else if (currentStep.position === 'bottom') {
            top = highlightRect.bottom + 24;
            left = highlightRect.left;
        } else if (currentStep.position === 'top') {
            top = highlightRect.top - 200 - 24;
            left = highlightRect.left;
        }

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        if (left + 480 > windowWidth) {
            left = windowWidth - 480 - 24;
        }
        if (left < 0) left = 24;

        if (top + 300 > windowHeight) {
            top = windowHeight - 300 - 24;
        }

        modalStyle = { ...modalStyle, top, left };
    } else {
        modalStyle = { ...modalStyle, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    return (
        <>
            <div style={highlightStyle} />
            <div style={modalStyle} className="animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{currentStep.title}</h3>
                    <div className="text-sm font-medium text-gray-400 font-mono mt-1 bg-gray-100 px-2 py-1 rounded">
                        STEP {stepIndex + 1} / {steps.length}
                    </div>
                </div>

                <div className="mb-8 text-gray-700 leading-relaxed text-lg">
                    {currentStep.content}
                </div>

                <div className="flex justify-center items-center gap-6 pt-8 mt-6 border-t border-gray-100">
                    <button
                        onClick={() => setStepIndex(prev => Math.max(0, prev - 1))}
                        style={{
                            background: 'white',
                            border: '1px solid #d1d5db',
                            color: '#374151',
                            padding: '12px 0', // Vertical padding only, width controlled by minWidth
                            minWidth: '140px', // Standardized width
                            borderRadius: '9999px',
                            fontSize: '15px',
                            fontWeight: 'bold',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        className={`
                            hover:bg-gray-50 transition-all shadow-sm
                            ${stepIndex === 0 ? 'invisible' : ''}
                        `}
                    >
                        戻る
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={!canProceed}
                        style={{
                            background: canProceed ? '#2563eb' : '#e5e7eb',
                            color: canProceed ? 'white' : '#9ca3af',
                            border: 'none',
                            padding: '12px 0', // Vertical padding only
                            minWidth: '140px', // Standardized width
                            borderRadius: '9999px',
                            fontSize: '15px',
                            fontWeight: 'bold',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        className={`
                            transition-all shadow-md
                            ${!canProceed ? 'cursor-not-allowed' : 'hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5'}
                        `}
                    >
                        {stepIndex === steps.length - 1 ? '始める' : '次へ'}
                    </button>
                </div>
            </div>
        </>
    );
}
