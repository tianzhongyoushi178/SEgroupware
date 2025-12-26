'use client';

import React, { useEffect, useState } from 'react';
import { User, Bell, Moon, Sun, Shield, LogOut, Lock } from 'lucide-react';
import styles from './page.module.css';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { useAppSettingsStore } from '@/store/appSettingsStore';
import { navigation } from '@/constants/navigation';

export default function SettingsPage() {
    const {
        theme,
        notifications,
        setTheme,
        toggleDesktopNotification,
        sendTestNotification,
    } = useSettingsStore();

    const { isAdmin, logout, profile, updateProfileName } = useAuthStore();
    const {
        tabSettings,
        updateTabSetting,
        subscribeSettings,
        getAllProfiles,
        updateUserPermission,
        fetchUserPermissions
    } = useAppSettingsStore();

    // Hydration mismatch回避のため、マウント後にレンダリングする
    const [mounted, setMounted] = useState(false);
    const [displayName, setDisplayName] = useState('');

    // Admin: User Management State
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setMounted(true);
        const unsubscribe = subscribeSettings();

        if (isAdmin) {
            getAllProfiles().then(setUsers).catch(console.error);
        }

        return () => unsubscribe();
    }, [isAdmin]);

    useEffect(() => {
        if (selectedUser) {
            fetchUserPermissions(selectedUser).then(setUserPermissions);
        } else {
            setUserPermissions({});
        }
    }, [selectedUser]);

    useEffect(() => {
        if (profile?.displayName) {
            setDisplayName(profile.displayName);
        }
    }, [profile?.displayName]);

    if (!mounted) {
        return null;
    }

    const handleBlur = () => {
        if (displayName !== profile?.displayName) {
            updateProfileName(displayName);
        }
    };

    const handlePermissionChange = async (userId: string, path: string, checked: boolean) => {
        // Optimistic update
        setUserPermissions(prev => ({ ...prev, [path]: checked }));
        try {
            await updateUserPermission(userId, path, checked);
        } catch (e) {
            console.error(e);
            // Revert on error
            setUserPermissions(prev => ({ ...prev, [path]: !checked }));
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>設定</h1>

            <div className={styles.sectionSpace}>
                {/* プロフィール設定 */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.headerContent}>
                            <User size={20} className="text-blue-600" style={{ color: '#2563eb' }} />
                            <h2 className={styles.sectionTitle}>プロフィール設定</h2>
                        </div>
                        <p className={styles.sectionDescription}>アカウント情報の確認・変更ができます</p>
                    </div>
                    <div className={styles.content}>
                        <div className={styles.grid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>ユーザー名</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    onBlur={handleBlur}
                                    placeholder="投稿者名として使用されます"
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>メールアドレス</label>
                                <input
                                    type="email"
                                    value={profile?.email || ''}
                                    readOnly
                                    disabled
                                    className={styles.input}
                                    style={{ background: 'var(--background-secondary)', cursor: 'not-allowed', color: 'var(--text-secondary)' }}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    ※メールアドレスは変更できません
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 管理者設定: ユーザー権限管理 */}
                {isAdmin && (
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.headerContent}>
                                <Lock size={20} style={{ color: '#dc2626' }} />
                                <h2 className={styles.sectionTitle}>ユーザー権限管理（管理者のみ）</h2>
                            </div>
                            <p className={styles.sectionDescription}>各ユーザーの機能アクセス権限を設定します</p>
                        </div>
                        <div className={styles.content}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
                                {/* User List */}
                                <div style={{ borderRight: '1px solid var(--border)', paddingRight: '1rem' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>ユーザー選択</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                                        {users.map(u => (
                                            <button
                                                key={u.id}
                                                onClick={() => setSelectedUser(u.id)}
                                                style={{
                                                    textAlign: 'left',
                                                    padding: '0.5rem',
                                                    borderRadius: '0.25rem',
                                                    background: selectedUser === u.id ? 'var(--primary)' : 'transparent',
                                                    color: selectedUser === u.id ? 'white' : 'var(--text-main)',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem'
                                                }}
                                            >
                                                <div style={{ fontWeight: 'bold' }}>{u.display_name || '未設定'}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{u.email}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Permissions */}
                                <div>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>表示設定</h3>
                                    {selectedUser ? (
                                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                                            {navigation.map((item) => {
                                                // Default to true if not set (no record means accessible by default policy, unless we want strict deny)
                                                // Let's assume default accessible for now unless explicitly unchecked.
                                                // BUT, if record is empty object (fresh user), we consider true.
                                                // userPermissions stores explicitly set values.
                                                const isVisible = userPermissions[item.href] !== false;

                                                return (
                                                    <div key={item.href} style={{
                                                        padding: '0.5rem',
                                                        background: '#f8fafc',
                                                        borderRadius: '0.25rem',
                                                        border: '1px solid var(--border)'
                                                    }}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '500' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isVisible}
                                                                onChange={(e) => handlePermissionChange(selectedUser, item.href, e.target.checked)}
                                                            />
                                                            {item.name}
                                                        </label>

                                                        {item.children && item.children.length > 0 && (
                                                            <div style={{ marginLeft: '1.5rem', marginTop: '0.5rem', display: 'grid', gap: '0.5rem' }}>
                                                                {item.children.map((child: any) => {
                                                                    const isChildVisible = userPermissions[child.href] !== false;
                                                                    return (
                                                                        <label key={child.href} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={isChildVisible}
                                                                                onChange={(e) => handlePermissionChange(selectedUser, child.href, e.target.checked)}
                                                                            />
                                                                            {child.name}
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                            ユーザーを選択してください
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* 表示設定 */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.headerContent}>
                            <Sun size={20} style={{ color: '#f97316' }} />
                            <h2 className={styles.sectionTitle}>表示設定</h2>
                        </div>
                        <p className={styles.sectionDescription}>アプリケーションの見た目をカスタマイズします</p>
                    </div>
                    <div className={styles.content}>
                        <div className={styles.row}>
                            <div>
                                <p className={styles.toggleText}>テーマ設定</p>
                                <p className={styles.toggleSubtext}>ライトモードとダークモードを切り替えます</p>
                            </div>
                            <div className={styles.themeToggle}>
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`${styles.themeButton} ${theme === 'light' ? styles.themeButtonActive : styles.themeButtonInactive}`}
                                >
                                    <Sun size={16} />
                                    ライト
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`${styles.themeButton} ${theme === 'dark' ? styles.themeButtonActive : styles.themeButtonInactive}`}
                                >
                                    <Moon size={16} />
                                    ダーク
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 通知設定 */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.headerContent}>
                            <Bell size={20} style={{ color: '#9333ea' }} />
                            <h2 className={styles.sectionTitle}>通知設定</h2>
                        </div>
                        <p className={styles.sectionDescription}>通知の受け取り方を設定します</p>
                    </div>
                    <div className={styles.content}>
                        <div className={styles.toggleRow}>
                            <div>
                                <p className={styles.toggleText}>デスクトップ通知</p>
                                <p className={styles.toggleSubtext}>ブラウザでのプッシュ通知を許可します</p>
                            </div>
                            <label className={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={notifications.desktop}
                                    onChange={(e) => toggleDesktopNotification(e.target.checked)}
                                />
                                <span className={styles.slider}></span>
                            </label>
                        </div>
                        {notifications.desktop && (
                            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={sendTestNotification}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        fontSize: '0.875rem',
                                        color: '#2563eb',
                                        background: '#eff6ff',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    テスト通知を送信
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* セキュリティ設定 */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.headerContent}>
                            <Shield size={20} style={{ color: '#16a34a' }} />
                            <h2 className={styles.sectionTitle}>セキュリティ</h2>
                        </div>
                        <p className={styles.sectionDescription}>アカウントのセキュリティ設定を管理します</p>
                    </div>
                    <div className={styles.content}>
                        <button
                            className={styles.logoutButton}
                            onClick={logout}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            <LogOut size={20} />
                            ログアウト
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
