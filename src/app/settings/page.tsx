'use client';

import React from 'react';
import { User, Bell, Moon, Sun, Shield, LogOut } from 'lucide-react';
import styles from './page.module.css';

export default function SettingsPage() {
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
                                    defaultValue="田中 太郎"
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>メールアドレス</label>
                                <input
                                    type="email"
                                    defaultValue="tanaka.taro@example.com"
                                    className={styles.input}
                                />
                            </div>
                        </div>
                    </div>
                </section>

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
                                <button className={`${styles.themeButton} ${styles.themeButtonActive}`}>
                                    <Sun size={16} />
                                    ライト
                                </button>
                                <button className={`${styles.themeButton} ${styles.themeButtonInactive}`}>
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
                                <input type="checkbox" defaultChecked />
                                <span className={styles.slider}></span>
                            </label>
                        </div>
                        <div className={styles.divider}></div>
                        <div className={styles.toggleRow}>
                            <div>
                                <p className={styles.toggleText}>メール通知</p>
                                <p className={styles.toggleSubtext}>重要なお知らせをメールで受け取ります</p>
                            </div>
                            <label className={styles.switch}>
                                <input type="checkbox" defaultChecked />
                                <span className={styles.slider}></span>
                            </label>
                        </div>
                    </div>
                </section>

                {/* その他 */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.headerContent}>
                            <Shield size={20} style={{ color: '#16a34a' }} />
                            <h2 className={styles.sectionTitle}>セキュリティ</h2>
                        </div>
                    </div>
                    <div className={styles.content}>
                        <button className={styles.logoutButton}>
                            <LogOut size={20} />
                            ログアウト
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
