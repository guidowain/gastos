'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './Shell.module.css';

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [theme, setTheme] = useState<'auto' | 'light' | 'dark'>('auto');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (saved) setTheme(saved);
  }, []);

  function toggleTheme() {
    const next = theme === 'auto' ? 'dark' : theme === 'dark' ? 'light' : 'auto';
    setTheme(next);
    if (next === 'auto') {
      localStorage.removeItem('theme');
      document.documentElement.removeAttribute('data-theme');
    } else {
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
    }
  }

  const themeIcon = theme === 'dark' ? '☾' : theme === 'light' ? '☀' : '⊙';

  return (
    <div className={styles.layout}>
      <div className={styles.content}>{children}</div>
      <nav className={styles.nav}>
        <Link href="/nuevo-gasto" className={`${styles.tab} ${path === '/nuevo-gasto' ? styles.active : ''}`}>
          <span className={styles.tabIcon}>+</span>
          <span className={styles.tabLabel}>Nuevo</span>
        </Link>
        <Link href="/dashboard" className={`${styles.tab} ${path === '/dashboard' ? styles.active : ''}`}>
          <span className={styles.tabIcon}>◎</span>
          <span className={styles.tabLabel}>Dashboard</span>
        </Link>
        <button className={styles.tab} onClick={toggleTheme}>
          <span className={styles.tabIcon}>{themeIcon}</span>
          <span className={styles.tabLabel}>Tema</span>
        </button>
      </nav>
    </div>
  );
}
