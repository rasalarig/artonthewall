import Link from "next/link";

const footerLinks = [
  { href: "/catalogo", label: "Catalogo" },
  { href: "/artistas", label: "Artistas" },
  { href: "/cadastrar", label: "Cadastrar" },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border/50 bg-surface">
      {/* Neon gradient accent line */}
      <div className="h-px bg-gradient-to-r from-neon-pink via-neon-cyan to-neon-green" />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
          {/* Branding */}
          <div>
            <p className="font-heading text-lg tracking-wide text-neon-cyan">
              Art on the Wall
            </p>
            <p className="mt-1 text-sm text-muted">
              Expo Coletiva Art on the Wall &mdash; Maio 2024
            </p>
          </div>

          {/* Links */}
          <nav className="flex gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted transition-colors duration-300 hover:text-neon-pink uppercase font-bold tracking-wide"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Paint splatter decoration */}
        <div className="mt-6 flex items-center justify-center gap-3 opacity-20">
          <svg width="60" height="12" viewBox="0 0 60 12" className="text-neon-pink">
            <circle cx="6" cy="6" r="5" fill="currentColor" opacity="0.6" />
            <circle cx="18" cy="4" r="3" fill="currentColor" opacity="0.4" />
            <circle cx="28" cy="8" r="2" fill="currentColor" opacity="0.3" />
            <circle cx="36" cy="5" r="4" fill="currentColor" opacity="0.5" />
            <circle cx="48" cy="7" r="3" fill="currentColor" opacity="0.35" />
            <circle cx="56" cy="3" r="2" fill="currentColor" opacity="0.25" />
          </svg>
          <svg width="60" height="12" viewBox="0 0 60 12" className="text-neon-cyan">
            <circle cx="4" cy="8" r="3" fill="currentColor" opacity="0.4" />
            <circle cx="16" cy="5" r="4" fill="currentColor" opacity="0.5" />
            <circle cx="30" cy="6" r="2" fill="currentColor" opacity="0.3" />
            <circle cx="42" cy="4" r="5" fill="currentColor" opacity="0.45" />
            <circle cx="54" cy="7" r="3" fill="currentColor" opacity="0.35" />
          </svg>
        </div>

        <div className="mt-6 text-center text-xs text-muted/60">
          &copy; 2024 Art on the Wall. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
