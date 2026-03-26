"use client";

import { useState, useEffect } from "react";
import { useCatalog } from "@/hooks/useCatalog";
import { formatBRL } from "@/lib/catalog";
import { Loading } from "@/components/Loading";

export default function ConfiguracoesPage() {
  const { markupPercentage, updateMarkup, isLoading } = useCatalog();

  // Local input state — percentage as the user sees it (e.g. 30 for 30%)
  const [inputValue, setInputValue] = useState("");
  const [saved, setSaved] = useState(false);

  // Sync from the hook on first render
  useEffect(() => {
    setInputValue(String(Math.round(markupPercentage * 100)));
  }, [markupPercentage]);

  const numericValue = parseFloat(inputValue) || 0;
  const previewBase = 100;
  const previewFinal = Math.round(previewBase * (1 + numericValue / 100));

  async function handleSave() {
    try {
      await updateMarkup(numericValue / 100);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Erro ao salvar configuracoes");
    }
  }

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen px-6 py-16 md:py-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1
            className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight text-foreground mb-4"
            style={{ animation: "fadeInUp 0.7s ease-out both" }}
          >
            configuracoes
          </h1>
          <p
            className="text-muted text-lg"
            style={{ animation: "fadeInUp 0.7s ease-out 0.15s both" }}
          >
            Ajustes da plataforma
          </p>
        </div>

        {/* Markup section */}
        <section
          className="rounded-2xl border border-border bg-surface p-8"
          style={{ animation: "fadeInUp 0.7s ease-out 0.3s both" }}
        >
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight mb-2">
            Markup do Catalogo
          </h2>
          <p className="text-muted text-sm mb-8">
            Percentual aplicado sobre o valor base de cada obra para formar o
            preco exibido no catalogo.
          </p>

          {/* Current value */}
          <div className="mb-8 flex items-baseline gap-3">
            <span className="text-5xl font-extrabold text-accent">
              {Math.round(markupPercentage * 100)}%
            </span>
            <span className="text-muted text-sm">markup atual</span>
          </div>

          {/* Input */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="markup-input"
                className="block text-sm font-bold text-foreground mb-2"
              >
                Novo percentual (%)
              </label>
              <input
                id="markup-input"
                type="number"
                min={0}
                step={1}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setSaved(false);
                }}
                className="w-full rounded-xl border border-border bg-surface-light px-5 py-3 text-lg font-bold text-foreground outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="30"
              />
            </div>

            <button
              onClick={handleSave}
              className="rounded-full bg-accent px-8 py-3 text-sm font-bold uppercase tracking-wide text-black transition-all duration-300 hover:bg-accent/80 disabled:opacity-40"
              disabled={inputValue === "" || numericValue < 0}
            >
              {saved ? "Salvo!" : "Salvar"}
            </button>
          </div>

          {/* Preview */}
          <div className="mt-8 rounded-xl border border-border bg-black/30 p-5">
            <p className="text-sm text-muted mb-1">Pre-visualizacao</p>
            <p className="text-foreground text-lg">
              Produto de{" "}
              <span className="font-bold text-accent">
                {formatBRL(previewBase)}
              </span>{" "}
              sera exibido por{" "}
              <span className="font-bold text-accent">
                {formatBRL(previewFinal)}
              </span>{" "}
              no catalogo
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
