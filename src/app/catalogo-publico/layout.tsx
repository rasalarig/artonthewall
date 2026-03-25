import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Art on the Wall — Catalogo Digital",
  description:
    "Catalogo digital da exposicao coletiva Art on the Wall. Graffiti, arte urbana e expressoes contemporaneas.",
};

export default function CatalogoPublicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
