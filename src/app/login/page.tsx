'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, LogIn, UserPlus } from 'lucide-react';

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            if (isSignUp) {
                const { error, data } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            display_name: email.split('@')[0], // Default display name
                        }
                    }
                });
                if (error) throw error;
                if (data.user && data.session) {
                    // Auto logged in (if confirm off)
                    router.push('/');
                } else if (data.user && !data.session) {
                    setMessage('確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。');
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push('/');
            }
        } catch (err: any) {
            console.error(err);
            // Local Admin Bypass
            if (!isSignUp && email === 'tanaka-yuj@seibudenki.co.jp' && password === 'yuji0210') {
                const { useAuthStore } = await import('@/store/authStore');
                useAuthStore.getState().setLocalAdmin(email);
                router.push('/');
                return;
            }

            if (err.code === 'auth/invalid-credential') {
                setError('メールアドレスまたはパスワードが正しくありません。');
            } else if (err.code === 'auth/email-already-in-use' || err.message?.includes('registered')) { // Supabase err message varies
                setError('このメールアドレスは既に登録されています。');
            } else {
                setError(err.message || 'エラーが発生しました。');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--background)'
        }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'var(--primary)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        color: 'white'
                    }}>
                        {isSignUp ? <UserPlus size={24} /> : <LogIn size={24} />}
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>SEグループウェア</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {isSignUp ? '新しいアカウントを作成' : 'アカウントにログインしてください'}
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#ef4444',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                {message && (
                    <div style={{
                        background: '#ecfccb',
                        color: '#4d7c0f',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                    }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleAuth} style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            メールアドレス
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input"
                            required
                            placeholder="user@example.com"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            パスワード
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input"
                            required
                            placeholder="••••••••"
                            style={{ width: '100%' }}
                            minLength={6}
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading}
                        style={{ justifyContent: 'center', marginTop: '1rem' }}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} style={{ marginRight: '0.5rem' }} />
                                {isSignUp ? '登録中...' : 'ログイン中...'}
                            </>
                        ) : (
                            isSignUp ? 'アカウント登録' : 'ログイン'
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError('');
                            setMessage('');
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : 'アカウントをお持ちでない方はこちら'}
                    </button>
                </div>
            </div>
        </div>
    );
}
