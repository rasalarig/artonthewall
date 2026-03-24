"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/catalogo", label: "Catalogo" },
  { href: "/artistas", label: "Artistas" },
  { href: "/cadastrar", label: "Cadastrar" },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
            ? "bg-background/90 backdrop-blur-md shadow-lg shadow-black/40"
            : "bg-background"
        }`}
      >
        {/* Neon gradient border at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-neon-pink via-neon-cyan to-neon-green" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between sm:h-20">
            {/* Logo */}
            <Link href="/" className="group flex items-center gap-2">
              <span className="header-logo font-heading text-xl font-bold tracking-wide text-neon-cyan sm:text-2xl">
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
                      ? "text-neon-pink"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {link.label}
                  {/* Active underline */}
                  <span
                    className={`absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-neon-pink transition-all duration-300 ${
                      isActive(link.href) ? "w-6" : "w-0"
                    }`}
                  />
                </Link>
              ))}
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
                  className={`block h-0.5 w-full rounded-full bg-neon-cyan transition-all duration-300 ${
                    menuOpen ? "translate-y-2 rotate-45" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-full rounded-full bg-neon-cyan transition-all duration-300 ${
                    menuOpen ? "scale-x-0 opacity-0" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-full rounded-full bg-neon-cyan transition-all duration-300 ${
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
        className={`fixed right-0 top-0 z-40 flex h-full w-64 flex-col bg-concrete pt-20 shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
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
                  ? "text-neon-pink"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-neon-pink" />
              )}
            </Link>
          ))}
        </div>

        {/* Neon accent at bottom of mobile menu */}
        <div className="mt-auto px-6 pb-8">
          <div className="h-px bg-gradient-to-r from-neon-pink via-neon-cyan to-transparent" />
          <p className="mt-4 font-body text-xs tracking-widest text-muted uppercase">
            Expo Coletiva 2024
          </p>
        </div>
      </nav>
    </>
  );
}
