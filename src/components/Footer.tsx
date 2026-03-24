import Link from "next/link";

const footerLinks = [
  { href: "/catalogo", label: "Catalogo" },
  { href: "/artistas", label: "Artistas" },
  { href: "/cadastrar", label: "Cadastrar" },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray bg-black">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:justify-between sm:text-left">
          {/* Branding */}
          <div>
            <p className="text-lg font-extrabold tracking-tight text-white uppercase">
              Art on the Wall
            </p>
            <p className="mt-2 text-sm text-muted">
              Expo Coletiva &bull; Arte Urbana &bull; Maio 2024
            </p>
          </div>

          {/* Links */}
          <nav className="flex gap-8">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted transition-colors duration-300 hover:text-white uppercase font-bold tracking-wide"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-12 text-center text-xs text-muted/60">
          &copy; 2024 Art on the Wall. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
