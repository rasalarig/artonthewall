"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/catalogo", label: "Catalogo" },
  { href: "/artistas", label: "Artistas" },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Hide header on public catalog page
  if (pathname === "/catalogo-publico") return null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = useCallback(
    (href: string) => {
      if (href === "/") return pathname === "/";
      return pathname.startsWith(href);
    },
    [pathname],
  );

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ease-in-out ${
          scrolled
            ? "bg-accent shadow-lg shadow-black/20"
            : "bg-accent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[70px] items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-black sm:text-2xl uppercase">
                Art on the Wall
              </span>
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-bold tracking-wide uppercase transition-colors duration-300 ${
                    isActive(link.href)
                      ? "text-black"
                      : "text-black/60 hover:text-black"
                  }`}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-black" />
                  )}
                </Link>
              ))}

              {/* Cadastrar button */}
              <Link
                href="/cadastrar"
                className="ml-4 inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-sm font-bold uppercase tracking-wide text-accent transition-all duration-300 hover:bg-black/80"
              >
                Cadastrar
              </Link>

              {/* Settings gear icon */}
              <Link
                href="/configuracoes"
                className={`ml-2 inline-flex items-center justify-center rounded-full p-2 text-lg transition-colors duration-300 ${
                  isActive("/configuracoes")
                    ? "text-black"
                    : "text-black/60 hover:text-black"
                }`}
                aria-label="Configuracoes"
                title="Configuracoes"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </Link>
            </nav>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="relative z-50 flex h-10 w-10 items-center justify-center md:hidden"
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
            >
              <div className="flex w-6 flex-col gap-1.5">
                <span
                  className={`block h-0.5 w-full rounded-full bg-black transition-all duration-300 ${
                    menuOpen ? "translate-y-2 rotate-45" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-full rounded-full bg-black transition-all duration-300 ${
                    menuOpen ? "scale-x-0 opacity-0" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-full rounded-full bg-black transition-all duration-300 ${
                    menuOpen ? "-translate-y-2 -rotate-45" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 md:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile slide-in menu */}
      <nav
        className={`fixed right-0 top-0 z-40 flex h-full w-72 flex-col bg-surface pt-24 shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col px-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`border-b border-border py-4 text-lg font-bold tracking-wide uppercase transition-colors duration-300 ${
                isActive(link.href)
                  ? "text-accent"
                  : "text-muted hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/cadastrar"
            className={`border-b border-border py-4 text-lg font-bold tracking-wide uppercase transition-colors duration-300 ${
              isActive("/cadastrar")
                ? "text-accent"
                : "text-muted hover:text-white"
            }`}
          >
            Cadastrar
          </Link>
          <Link
            href="/configuracoes"
            className={`border-b border-border py-4 text-lg font-bold tracking-wide uppercase transition-colors duration-300 ${
              isActive("/configuracoes")
                ? "text-accent"
                : "text-muted hover:text-white"
            }`}
          >
            Configuracoes
          </Link>
        </div>

        {/* Accent at bottom of mobile menu */}
        <div className="mt-auto px-6 pb-8">
          <div className="h-px bg-accent/30" />
          <p className="mt-4 text-xs tracking-widest text-muted uppercase">
            Expo Coletiva 2024
          </p>
        </div>
      </nav>
    </>
  );
}
