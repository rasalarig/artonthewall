import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Art on the Wall — Catalogo Digital",
  description:
    "Expo Coletiva Art on The Wall. Expressões contemporâneas de arte urbana.",
};

export default function CatalogoPublicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
