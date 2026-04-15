'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';
import { useUser } from '@/hooks/useUser';

export default function Navbar() {
  const { t, language, setLanguage } = useTranslation();
  const { user, loading } = useUser();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [hasPromo, setHasPromo] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    // Fetch promotions silently
    fetch('/api/promotions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const hasEligible = data.some((p: { eligible: boolean; claimed: boolean }) => p.eligible && !p.claimed);
          setHasPromo(hasEligible);
        }
      })
      .catch(() => {});
  }, [user, loading]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowLanguages(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleClose() {
    setOpen(false);
    setShowLanguages(false);
  }

  function handleDismissPromo(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPromoDismissed(true);
  }

  function handleLanguageSelect(lang: Language) {
    setLanguage(lang);
    handleClose();
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-40 h-14 bg-background/80 backdrop-blur-md border-b border-border-subtle flex items-center px-6 md:px-8">
      <Link
        href="/dashboard"
        className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary-text to-accent-blue bg-clip-text text-transparent hover:opacity-80 transition-opacity"
      >
        Eduh
      </Link>

      <div className="ml-auto flex items-center gap-4">
        {!loading && (
          <div className="relative flex items-center justify-center">
            <Link
              href="/subscription"
              className="text-sm font-medium text-muted-text hover:text-primary-text transition-colors"
            >
              {t.nav.subscription}
            </Link>
            {hasPromo && !promoDismissed && pathname === '/dashboard' && (
              <div className="absolute top-[120%] right-0 mt-3 w-56 p-3 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-surface border border-accent-blue/30 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] animate-[fade-in-up_0.4s_ease-out_forwards] z-50">
                <div className="absolute -top-1.5 right-6 w-3 h-3 bg-surface border-t border-l border-accent-blue/30 transform rotate-45" />
                <div className="flex items-start justify-between gap-3 relative">
                  <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  <span className="text-[13px] font-medium text-primary-text leading-snug">{t.promotions.claimTooltipNavbar}</span>
                  <button onClick={handleDismissPromo} className="shrink-0 text-muted-text hover:text-primary-text transition-colors mt-0.5 cursor-pointer" aria-label="Close">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="relative" ref={dropdownRef}>
        {/* Avatar button */}
        <button
          onClick={() => { setOpen((v) => !v); setShowLanguages(false); }}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 cursor-pointer"
          aria-label={t.nav.profileMenu}
          aria-expanded={open}
        >
          <AvatarIcon />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-12 w-48 bg-surface border border-border-subtle rounded-2xl p-1 shadow-2xl">
            {!showLanguages ? (
              <>
                <button
                  onClick={() => setShowLanguages(true)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-primary-text hover:bg-surface-hover rounded-xl cursor-pointer transition-colors"
                >
                  <span>{t.nav.language}</span>
                  <ChevronRightIcon />
                </button>
                <div className="my-1 border-t border-border-subtle mx-2" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-danger-red hover:bg-surface-hover rounded-xl cursor-pointer transition-colors"
                >
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowLanguages(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-text hover:text-primary-text hover:bg-surface-hover rounded-xl cursor-pointer transition-colors"
                >
                  <ChevronLeftIcon />
                  <span>{t.nav.language}</span>
                </button>
                <div className="my-1 border-t border-border-subtle mx-2" />
                {(['pt-BR', 'en'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageSelect(lang)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-surface-hover rounded-xl transition-colors ${
                      language === lang ? 'text-accent-blue bg-accent-surface' : 'text-primary-text'
                    }`}
                  >
                    <span>{lang === 'pt-BR' ? 'Português' : 'English'}</span>
                    {language === lang && <CheckIcon />}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
      </div>
    </nav>
  );
}

function AvatarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
