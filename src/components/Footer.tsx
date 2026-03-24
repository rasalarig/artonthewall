import Link from "next/link";

const footerLinks = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/artistas", label: "Artistas" },
  { href: "/cadastrar", label: "Cadastrar" },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border/50 bg-surface">
      {/* Gold accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
          {/* Branding */}
          <div>
            <p className="font-heading text-lg tracking-wide text-gold">
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
                className="text-sm text-muted transition-colors duration-300 hover:text-gold"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 text-center text-xs text-muted/60">
          &copy; 2024 Art on the Wall. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
