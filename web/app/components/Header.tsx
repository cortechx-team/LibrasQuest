'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { clearAuthToken, getAuthToken, subscribeToAuth } from '../lib/auth';

type HeaderProps = {
  autoHideOnScroll?: boolean;
};

/**
 * Componente de Cabeçalho (Header)
 * Responsável pela navegação principal da página de entrada.
 */
export default function Header({ autoHideOnScroll = false }: HeaderProps) {
  const token = useSyncExternalStore(subscribeToAuth, getAuthToken, () => null);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    if (!autoHideOnScroll) {
      return;
    }

    lastScrollYRef.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingUp = currentScrollY < lastScrollYRef.current;
      const isNearTop = currentScrollY < 24;

      const shouldBeVisible = isNearTop || isScrollingUp;
      setIsVisible((current) => current === shouldBeVisible ? current : shouldBeVisible);
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [autoHideOnScroll]);

  const handleLogout = () => {
    clearAuthToken();
  };

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 flex w-full items-center justify-between bg-bg-dark/90 px-[10%] py-5 backdrop-blur-sm transition-transform duration-300 ${
        !autoHideOnScroll || isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Logotipo */}
      <Link href="/" className="text-2xl font-bold text-primary-cyan">
        LibrasQuest
      </Link>
      
      {/* Menu de Navegação */}
      <nav className="flex items-center gap-3 sm:gap-6">
        <Link href="/#sobre" className="text-sm text-white transition-colors hover:text-primary-cyan">
          Sobre 
        </Link>
        {token ? (
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-primary-cyan/70 bg-primary-cyan/10 px-4 py-2 text-sm font-bold text-primary-cyan shadow-[0_0_18px_rgba(66,245,227,0.18)] transition-all hover:-translate-y-0.5 hover:bg-primary-cyan hover:text-black hover:shadow-primary-cyan/40"
          >
            Sair
          </button>
        ) : (
          <Link
            href="/login"
            className="rounded-full border border-primary-cyan/70 bg-primary-cyan/10 px-4 py-2 text-sm font-bold text-primary-cyan shadow-[0_0_18px_rgba(66,245,227,0.18)] transition-all hover:-translate-y-0.5 hover:bg-primary-cyan hover:text-black hover:shadow-primary-cyan/40"
          >
            Login / Registrar-se
          </Link>
        )}
      </nav>
    </header>
  );
}
