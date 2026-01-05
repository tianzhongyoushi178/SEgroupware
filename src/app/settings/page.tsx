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

    const { isAdmin, logout, profile, updateProfileName, updatePreferences } = useAuthStore();
    const {
        tabSettings,
        subscribeSettings,
        getAllProfiles,
        updateUserPermissions,
        fetchUserPermissions
    } = useAppSettingsStore();

    // Hydration mismatch回避のため、マウント後にレンダリングする
    const [mounted, setMounted] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [activeTab, setActiveTab] = useState<'general' | 'admin'>('general');

    // Admin: User Management State
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const QUICK_ACCESS_ITEMS = [
        { id: 'meeting', label: '会議室を予約' },
        { id: 'notice', label: 'お知らせを投稿' }
    ];

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
            setIsDirty(false);
            fetchUserPermissions(selectedUser).then(setUserPermissions);
        } else {
            setUserPermissions({});
            setIsDirty(false);
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

    const handleQuickAccessChange = async (id: string, checked: boolean) => {
        const currentQuickAccess = profile?.preferences?.quickAccess || {};
        const newQuickAccess = { ...currentQuickAccess, [id]: checked };
        await updatePreferences({ quickAccess: newQuickAccess });
    };

    const handlePermissionChange = (path: string, checked: boolean) => {
        const newPermissions = { ...userPermissions, [path]: checked };

        // Find if this is a parent item and update children accordingly
        const parentItem = navigation.find(item => item.href === path);
        if (parentItem && parentItem.children) {
            parentItem.children.forEach((child: any) => {
                newPermissions[child.href] = checked;
            });
        }

        setUserPermissions(newPermissions);
        setIsDirty(true);
    };

    const handleSavePermissions = async () => {
        if (!selectedUser) return;
        setIsSaving(true);
        try {
            await updateUserPermissions(selectedUser, userPermissions);
            setIsDirty(false);
            alert('設定を保存しました');
        } catch (e) {
            console.error(e);
            alert('保存に失敗しました');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>設定</h1>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
                <button
                    onClick={() => setActiveTab('general')}
                    style={{
                        padding: '1rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'general' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: activeTab === 'general' ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: activeTab === 'general' ? 'bold' : 'normal',
                        cursor: 'pointer'
                    }}
                >
                    一般設定
                </button>
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab('admin')}
                        style={{
                            padding: '1rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'admin' ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === 'admin' ? 'var(--primary)' : 'var(--text-secondary)',
                            fontWeight: activeTab === 'admin' ? 'bold' : 'normal',
                            cursor: 'pointer'
                        }}
                    >
                        管理者設定
                    </button>
                )}
            </div>

            <div className={styles.sectionSpace}>
                {activeTab === 'general' && (
                    <>
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

                        {/* クイックアクセス設定 */}
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.headerContent}>
                                    <Shield size={20} style={{ color: '#eab308' }} />
                                    <h2 className={styles.sectionTitle}>クイックアクセス設定</h2>
                                </div>
                                <p className={styles.sectionDescription}>ダッシュボードに表示するクイックアクセス項目を設定します</p>
                            </div>
                            <div className={styles.content}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>標準項目</h3>
                                <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    {QUICK_ACCESS_ITEMS.map(item => {
                                        const isVisible = profile?.preferences?.quickAccess?.[item.id] !== false;
                                        return (
                                            <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--background-secondary)' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isVisible}
                                                    onChange={(e) => handleQuickAccessChange(item.id, e.target.checked)}
                                                    style={{ width: '1.25em', height: '1.25em' }}
                                                />
                                                <span style={{ fontWeight: '500' }}>{item.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>

                                <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>カスタムリンク</h3>
                                <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                                    {profile?.preferences?.customQuickAccess?.map((item: any) => (
                                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--background-secondary)', justifyContent: 'space-between' }}>
                                            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                                <div style={{ fontWeight: '500' }}>{item.title}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.url}</div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const current = profile?.preferences?.customQuickAccess || [];
                                                    const updated = current.filter((i: any) => i.id !== item.id);
                                                    updatePreferences({ customQuickAccess: updated });
                                                }}
                                                style={{ padding: '0.25rem 0.5rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.75rem' }}
                                            >
                                                削除
                                            </button>
                                        </div>
                                    ))}
                                    {(!profile?.preferences?.customQuickAccess || profile.preferences.customQuickAccess.length === 0) && (
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>カスタムリンクは設定されていません</div>
                                    )}
                                </div>

                                <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: '#f8fafc' }}>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>新しいリンクを追加</h4>
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        <input
                                            id="newLinkTitle"
                                            type="text"
                                            placeholder="タイトル (例: Google)"
                                            className={styles.input}
                                        />
                                        <input
                                            id="newLinkUrl"
                                            type="text"
                                            placeholder="URL (例: https://google.com)"
                                            className={styles.input}
                                        />
                                        <button
                                            onClick={() => {
                                                const titleInput = document.getElementById('newLinkTitle') as HTMLInputElement;
                                                const urlInput = document.getElementById('newLinkUrl') as HTMLInputElement;
                                                const title = titleInput.value.trim();
                                                const url = urlInput.value.trim();

                                                if (title && url) {
                                                    const current = profile?.preferences?.customQuickAccess || [];
                                                    const newItem = { id: crypto.randomUUID(), title, url };
                                                    updatePreferences({ customQuickAccess: [...current, newItem] });
                                                    titleInput.value = '';
                                                    urlInput.value = '';
                                                }
                                            }}
                                            style={{ padding: '0.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold', marginTop: '0.25rem' }}
                                        >
                                            追加
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* リンク集設定 */}
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.headerContent}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
                                        <span style={{ fontSize: '20px' }}>🔗</span>
                                    </div>
                                    <h2 className={styles.sectionTitle}>リンク集設定</h2>
                                </div>
                                <p className={styles.sectionDescription}>サイドバーの「リンク集」に追加する項目を設定します</p>
                            </div>
                            <div className={styles.content}>
                                <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                                    {profile?.preferences?.customLinks?.map((item: any) => (
                                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--background-secondary)', justifyContent: 'space-between' }}>
                                            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                                <div style={{ fontWeight: '500' }}>{item.title}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.url}</div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const current = profile?.preferences?.customLinks || [];
                                                    const updated = current.filter((i: any) => i.id !== item.id);
                                                    updatePreferences({ customLinks: updated });
                                                }}
                                                style={{ padding: '0.25rem 0.5rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.75rem' }}
                                            >
                                                削除
                                            </button>
                                        </div>
                                    ))}
                                    {(!profile?.preferences?.customLinks || profile.preferences.customLinks.length === 0) && (
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>追加されたリンクはありません</div>
                                    )}
                                </div>

                                <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: '#f8fafc' }}>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>新しいリンクを追加</h4>
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        <input
                                            id="newSidebarLinkTitle"
                                            type="text"
                                            placeholder="タイトル (例: 社内ポータル)"
                                            className={styles.input}
                                        />
                                        <input
                                            id="newSidebarLinkUrl"
                                            type="text"
                                            placeholder="URL (例: http://portal...)"
                                            className={styles.input}
                                        />
                                        <button
                                            onClick={() => {
                                                const titleInput = document.getElementById('newSidebarLinkTitle') as HTMLInputElement;
                                                const urlInput = document.getElementById('newSidebarLinkUrl') as HTMLInputElement;
                                                const title = titleInput.value.trim();
                                                const url = urlInput.value.trim();

                                                if (title && url) {
                                                    const current = profile?.preferences?.customLinks || [];
                                                    const newItem = { id: crypto.randomUUID(), title, url };
                                                    updatePreferences({ customLinks: [...current, newItem] });
                                                    titleInput.value = '';
                                                    urlInput.value = '';
                                                }
                                            }}
                                            style={{ padding: '0.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold', marginTop: '0.25rem' }}
                                        >
                                            追加
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 表示設定 */}
                        <section id="tutorial-settings-theme" className={styles.section}>
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
                        <section id="tutorial-settings-notifications" className={styles.section}>
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

                        {/* ログアウト */}
                        <div style={{ marginTop: '2rem', paddingBottom: '2rem' }}>
                            <button
                                className={styles.logoutButton}
                                onClick={logout}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                <LogOut size={20} />
                                ログアウト
                            </button>
                        </div>
                    </>
                )}

                {activeTab === 'admin' && isAdmin && (
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
                                                <div style={{ fontWeight: 'bold' }}>{u.display_name || u.email?.split('@')[0] || '未設定'}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{u.email}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Permissions */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>表示設定</h3>
                                        {selectedUser && (
                                            <button
                                                onClick={handleSavePermissions}
                                                disabled={!isDirty || isSaving}
                                                style={{
                                                    padding: '0.25rem 0.75rem',
                                                    fontSize: '0.75rem',
                                                    background: isDirty ? 'var(--primary)' : 'var(--muted)',
                                                    color: isDirty ? 'white' : 'var(--text-secondary)',
                                                    border: 'none',
                                                    borderRadius: '0.25rem',
                                                    cursor: isDirty ? 'pointer' : 'default',
                                                    opacity: isSaving ? 0.7 : 1
                                                }}
                                            >
                                                {isSaving ? '保存中...' : '変更を保存'}
                                            </button>
                                        )}
                                    </div>

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
                                                                onChange={(e) => handlePermissionChange(item.href, e.target.checked)}
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
                                                                                onChange={(e) => handlePermissionChange(child.href, e.target.checked)}
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
            </div>
        </div>
    );
}
