import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Art on the Wall — Catalogo Digital",
  description:
    "Galeria de Artistas Urbanos. Expressões contemporâneas de arte urbana.",
};

export default function CatalogoPublicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
