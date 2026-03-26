import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SWRProvider } from "@/components/SWRProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Art on the Wall — Expo Coletiva",
  description:
    "Expo Coletiva Art on The Wall. Expressões contemporâneas de arte urbana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black text-foreground">
        <SWRProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SWRProvider>
      </body>
    </html>
  );
}
