'use client';

import React, { useEffect, useState } from 'react';
import { User, Bell, Moon, Sun, Shield, LogOut, Lock } from 'lucide-react';
import styles from './page.module.css';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { useAppSettingsStore } from '@/store/appSettingsStore';
import { navigation } from '@/constants/navigation';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '@/components/ui/SortableItem';

export default function SettingsPage() {
    const {
        theme,
        notifications,
        setTheme,
        toggleDesktopNotification,
        sendTestNotification,
        defaultNoticeView,
        setDefaultNoticeView,
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

    // Editing State
    const [editingLink, setEditingLink] = useState<{ id: string, title: string, url: string, type: 'quickAccess' | 'sidebar' } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const QUICK_ACCESS_ITEMS = [
        { id: 'attendance', label: '勤怠管理を行う' },
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

    const handleUpdateLink = async () => {
        if (!editingLink) return;

        const { id, title, url, type } = editingLink;
        if (!title.trim() || !url.trim()) return;

        try {
            if (type === 'quickAccess') {
                const current = profile?.preferences?.customQuickAccess || [];
                const updated = current.map((item: any) =>
                    item.id === id ? { ...item, title, url } : item
                );
                await updatePreferences({ customQuickAccess: updated });
            } else {
                const current = profile?.preferences?.customLinks || [];
                const updated = current.map((item: any) =>
                    item.id === id ? { ...item, title, url } : item
                );
                await updatePreferences({ customLinks: updated });
            }
            setEditingLink(null);
        } catch (error) {
            console.error('Failed to update link:', error);
            alert('更新に失敗しました');
        }
    };



    const handleDragEndQuickAccess = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        if (active.id !== over.id) {
            // Check if we have a valid saved order, otherwise use default order
            const savedOrder = profile?.preferences?.quickAccessOrder;
            const hasSavedOrder = Array.isArray(savedOrder) && savedOrder.length > 0;

            let currentOrder: string[];

            if (hasSavedOrder) {
                currentOrder = [...savedOrder!];
            } else {
                currentOrder = [
                    ...QUICK_ACCESS_ITEMS.map(i => i.id),
                    ...(profile?.preferences?.customQuickAccess?.map(i => i.id) || [])
                ];
            }

            const oldIndex = currentOrder.indexOf(active.id as string);
            const newIndex = currentOrder.indexOf(over.id as string);

            let newOrder = [...currentOrder];

            // If items are not found (e.g. sync issue or unsaved mixed state), reconstruct
            if (oldIndex === -1 || newIndex === -1) {
                const allIds = [
                    ...QUICK_ACCESS_ITEMS.map(i => i.id),
                    ...(profile?.preferences?.customQuickAccess?.map(i => i.id) || [])
                ];
                newOrder = allIds;

                const fallbackOldIdx = newOrder.indexOf(active.id as string);
                const fallbackNewIdx = newOrder.indexOf(over.id as string);

                if (fallbackOldIdx !== -1 && fallbackNewIdx !== -1) {
                    newOrder = arrayMove(newOrder, fallbackOldIdx, fallbackNewIdx);
                }
            } else {
                newOrder = arrayMove(newOrder, oldIndex, newIndex);
            }

            // Ensure we didn't lose any items
            const allCurrentIds = new Set([
                ...QUICK_ACCESS_ITEMS.map(i => i.id),
                ...(profile?.preferences?.customQuickAccess?.map(i => i.id) || [])
            ]);

            allCurrentIds.forEach(id => {
                if (!newOrder.includes(id)) {
                    newOrder.push(id);
                }
            });

            newOrder = newOrder.filter(id => allCurrentIds.has(id));

            await updatePreferences({ quickAccessOrder: newOrder });
        }
    };


    const handleDragEndLinks = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const currentLinks = profile?.preferences?.customLinks || [];
            const oldIndex = currentLinks.findIndex(i => i.id === active.id);
            const newIndex = currentLinks.findIndex(i => i.id === over?.id);

            const newLinks = arrayMove(currentLinks, oldIndex, newIndex);
            await updatePreferences({ customLinks: newLinks });
        }
    };

    // Helper to sort Quick Access Items
    const getSortedQuickAccessItems = () => {
        const standardItems = QUICK_ACCESS_ITEMS.map(item => ({ ...item, type: 'standard' }));
        const customItems = (profile?.preferences?.customQuickAccess || []).map((item: any) => ({ ...item, type: 'custom', label: item.title }));

        const allItems = [...standardItems, ...customItems];
        const order = profile?.preferences?.quickAccessOrder || [];

        // If no order is saved yet, return default concatenation
        if (order.length === 0) return allItems;

        return allItems.sort((a, b) => {
            const indexA = order.indexOf(a.id);
            const indexB = order.indexOf(b.id);
            // If item is new and not in order list, put it at the end
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
    };

    const sortedQuickAccessItems = getSortedQuickAccessItems();

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
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>設定と並び替え</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>ドラッグ＆ドロップで表示順を変更できます</p>

                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEndQuickAccess}
                                >
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <SortableContext
                                            items={sortedQuickAccessItems.map(i => i.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {sortedQuickAccessItems.map((item: any) => (
                                                <SortableItem key={item.id} id={item.id}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flex: 1, minWidth: 0 }}>
                                                            {item.type === 'standard' && (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={profile?.preferences?.quickAccess?.[item.id] !== false}
                                                                    onChange={(e) => handleQuickAccessChange(item.id, e.target.checked)}
                                                                    style={{ width: '1.25em', height: '1.25em' }}
                                                                />
                                                            )}
                                                            <div style={{ minWidth: 0 }}>
                                                                <span style={{ fontWeight: '500', display: 'block' }}>{item.label}</span>
                                                                {item.type === 'custom' && (
                                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.url}</span>
                                                                )}
                                                            </div>
                                                        </label>

                                                        {item.type === 'custom' && (
                                                            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
                                                                <button
                                                                    onClick={() => setEditingLink({ ...item, type: 'quickAccess' })}
                                                                    style={{ padding: '0.25rem 0.5rem', background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.75rem' }}
                                                                >
                                                                    編集
                                                                </button>
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
                                                        )}
                                                    </div>
                                                </SortableItem>
                                            ))}
                                        </SortableContext>
                                    </div>
                                </DndContext>

                                <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--background-secondary)' }}>
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
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEndLinks}
                                >
                                    <div style={{ marginBottom: '1rem' }}>
                                        <SortableContext
                                            items={(profile?.preferences?.customLinks || []).map((i: any) => i.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {profile?.preferences?.customLinks?.map((item: any) => (
                                                <SortableItem key={item.id} id={item.id}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                        <div style={{ flex: 1, minWidth: 0, marginRight: '0.5rem' }}>
                                                            <div style={{ fontWeight: '500', wordBreak: 'break-word', lineHeight: '1.4' }}>{item.title}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-all', lineHeight: '1.4' }}>{item.url}</div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                                            <button
                                                                onClick={() => setEditingLink({ ...item, type: 'sidebar' })}
                                                                style={{ padding: '0.25rem 0.5rem', background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.75rem' }}
                                                            >
                                                                編集
                                                            </button>
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
                                                    </div>
                                                </SortableItem>
                                            ))}
                                        </SortableContext>

                                        {(!profile?.preferences?.customLinks || profile.preferences.customLinks.length === 0) && (
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>追加されたリンクはありません</div>
                                        )}
                                    </div>
                                </DndContext>

                                <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--background-secondary)' }}>
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
                                    <div id="tutorial-settings-theme-buttons" className={styles.themeToggle}>
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
                                        <p className={styles.toggleSubtext}>
                                            ブラウザでのプッシュ通知を許可します
                                            <br />
                                            <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>
                                                ※iPhoneの場合は、ホーム画面に追加してから有効にしてください
                                            </span>
                                        </p>
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

                        {/* お知らせ表示設定 */}
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.headerContent}>
                                    <Bell size={20} style={{ color: '#2563eb' }} />
                                    <h2 className={styles.sectionTitle}>お知らせ設定</h2>
                                </div>
                                <p className={styles.sectionDescription}>お知らせの表示に関する設定を行います</p>
                            </div>
                            <div className={styles.content}>
                                <div className={styles.row}>
                                    <div>
                                        <p className={styles.toggleText}>初期表示設定</p>
                                        <p className={styles.toggleSubtext}>お知らせページを開いた時の初期表示を設定します</p>
                                    </div>
                                    <div className={styles.themeToggle}>
                                        <button
                                            onClick={() => setDefaultNoticeView('all')}
                                            className={`${styles.themeButton} ${defaultNoticeView === 'all' ? styles.themeButtonActive : styles.themeButtonInactive}`}
                                        >
                                            すべて
                                        </button>
                                        <button
                                            onClick={() => setDefaultNoticeView('unread')}
                                            className={`${styles.themeButton} ${defaultNoticeView === 'unread' ? styles.themeButtonActive : styles.themeButtonInactive}`}
                                        >
                                            未読のみ
                                        </button>
                                    </div>
                                </div>
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
                                                        background: 'var(--background-secondary)',
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

            {/* Edit Link Modal */}
            {
                editingLink && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{
                            background: 'var(--surface)', padding: '2rem', borderRadius: '1rem',
                            width: '90%', maxWidth: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}>
                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>リンクを編集</h2>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>タイトル</label>
                                    <input
                                        type="text"
                                        value={editingLink.title}
                                        onChange={e => setEditingLink({ ...editingLink, title: e.target.value })}
                                        className={styles.input}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>URL</label>
                                    <input
                                        type="text"
                                        value={editingLink.url}
                                        onChange={e => setEditingLink({ ...editingLink, url: e.target.value })}
                                        className={styles.input}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                    <button
                                        onClick={() => setEditingLink(null)}
                                        style={{
                                            padding: '0.5rem 1rem', background: '#f3f4f6', color: '#4b5563',
                                            border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '500'
                                        }}
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        onClick={handleUpdateLink}
                                        style={{
                                            padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white',
                                            border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '500'
                                        }}
                                    >
                                        更新
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
