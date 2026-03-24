"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCatalog } from "@/hooks/useCatalog";
import type { Artist, Artwork } from "@/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* Neon color cycle */
const NEON_COLORS = ["#ff2d7b", "#00f0ff", "#39ff14", "#ffe600", "#ff6b00", "#bf5af2"];
function neonColor(index: number): string {
  return NEON_COLORS[index % NEON_COLORS.length];
}

/* ------------------------------------------------------------------ */
/*  Tab type                                                           */
/* ------------------------------------------------------------------ */
type Tab = "artista" | "obra";

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function CadastrarPage() {
  const router = useRouter();
  const { artists, upsertArtist } = useCatalog();
  const [activeTab, setActiveTab] = useState<Tab>("artista");

  /* ---- Artist form state ---- */
  const [artistName, setArtistName] = useState("");
  const [characteristics, setCharacteristics] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [artistErrors, setArtistErrors] = useState<Record<string, string>>({});
  const [artistSuccess, setArtistSuccess] = useState(false);
  const [artistSubmitting, setArtistSubmitting] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  /* ---- Artwork form state ---- */
  const [selectedArtistId, setSelectedArtistId] = useState("");
  const [obraTitle, setObraTitle] = useState("");
  const [obraTechnique, setObraTechnique] = useState("");
  const [obraSize, setObraSize] = useState("");
  const [obraValue, setObraValue] = useState("");
  const [obraErrors, setObraErrors] = useState<Record<string, string>>({});
  const [obraSuccess, setObraSuccess] = useState(false);
  const [obraSubmitting, setObraSubmitting] = useState(false);

  /* ---- Tag input handlers ---- */
  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = tagInput.trim();
      if (value && !characteristics.includes(value)) {
        setCharacteristics((prev) => [...prev, value]);
        setTagInput("");
        setArtistErrors((prev) => {
          const next = { ...prev };
          delete next.characteristics;
          return next;
        });
      }
    }
  }

  function removeTag(tag: string) {
    setCharacteristics((prev) => prev.filter((t) => t !== tag));
  }

  /* ---- Artist submit ---- */
  function handleArtistSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!artistName.trim()) {
      errors.name = "Nome e obrigatorio";
    }
    if (characteristics.length === 0) {
      errors.characteristics = "Adicione pelo menos uma caracteristica";
    }

    if (Object.keys(errors).length > 0) {
      setArtistErrors(errors);
      return;
    }

    setArtistSubmitting(true);
    const slug = createSlug(artistName.trim());
    const newArtist: Artist = {
      id: crypto.randomUUID(),
      name: artistName.trim(),
      slug,
      characteristics,
      works: [],
    };

    upsertArtist(newArtist);
    setArtistSuccess(true);
    setArtistSubmitting(false);

    setTimeout(() => {
      router.push(`/artistas/${slug}`);
    }, 2000);
  }

  /* ---- Artwork submit ---- */
  function handleObraSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!selectedArtistId) {
      errors.artist = "Selecione um artista";
    }
    if (!obraTitle.trim()) {
      errors.title = "Titulo e obrigatorio";
    }
    if (!obraTechnique.trim()) {
      errors.technique = "Tecnica e obrigatoria";
    }
    if (!obraSize.trim()) {
      errors.size = "Tamanho e obrigatorio";
    }

    if (Object.keys(errors).length > 0) {
      setObraErrors(errors);
      return;
    }

    setObraSubmitting(true);
    const artist = artists.find((a) => a.id === selectedArtistId);
    if (!artist) return;

    const newWork: Artwork = {
      id: crypto.randomUUID(),
      artistId: artist.id,
      title: obraTitle.trim(),
      technique: obraTechnique.trim(),
      size: obraSize.trim(),
      value: obraValue.trim() ? parseFloat(obraValue) : null,
    };

    const updatedArtist: Artist = {
      ...artist,
      works: [...artist.works, newWork],
    };

    upsertArtist(updatedArtist);
    setObraSuccess(true);
    setObraSubmitting(false);

    setTimeout(() => {
      router.push(`/artistas/${artist.slug}`);
    }, 2000);
  }

  /* ---- Reset form state when switching tabs ---- */
  useEffect(() => {
    setArtistErrors({});
    setObraErrors({});
  }, [activeTab]);

  /* ---- Tab indicator position ---- */
  const tabs: { key: Tab; label: string }[] = [
    { key: "artista", label: "Cadastrar Artista" },
    { key: "obra", label: "Cadastrar Obra" },
  ];

  return (
    <main className="min-h-screen px-6 py-16 md:py-24 relative">
      {/* Subtle background pattern — concrete dots */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-neon-cyan) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-10 relative">
          {/* Spray paint splatter decoration */}
          <svg
            className="absolute -top-6 left-1/2 -translate-x-1/2 w-48 h-12 opacity-[0.15] pointer-events-none"
            viewBox="0 0 200 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="40" cy="25" r="8" fill="#ff2d7b" opacity="0.4" />
            <circle cx="100" cy="20" r="5" fill="#00f0ff" opacity="0.3" />
            <circle cx="160" cy="28" r="7" fill="#39ff14" opacity="0.35" />
            <circle cx="70" cy="35" r="3" fill="#ffe600" opacity="0.3" />
            <circle cx="130" cy="15" r="4" fill="#bf5af2" opacity="0.25" />
          </svg>
          <h1 className="text-4xl md:text-5xl font-heading tracking-wide text-neon-cyan mb-3 text-spray">
            CADASTRAR
          </h1>
          <p className="text-muted text-lg font-accent">
            Adicione novos artistas e obras ao catalogo
          </p>
        </div>

        {/* Tab switcher */}
        <div className="relative flex border-b border-border mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex-1 py-3 text-center font-bold uppercase tracking-wider transition-colors duration-300 ${
                activeTab === tab.key
                  ? "text-neon-pink"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              {/* Animated underline */}
              {activeTab === tab.key && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-pink"
                  style={{
                    animation: "tabSlide 0.3s ease-out forwards",
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content with transition */}
        <div className="transition-opacity duration-300">
          {/* ========== TAB 1: Cadastrar Artista ========== */}
          {activeTab === "artista" && (
            <form onSubmit={handleArtistSubmit} className="space-y-6">
              {/* Success message */}
              {artistSuccess && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-neon-green/10 border border-neon-green/40 text-neon-green">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>
                    Artista cadastrado com sucesso! Redirecionando...
                  </span>
                </div>
              )}

              {/* Nome */}
              <div>
                <label
                  htmlFor="artist-name"
                  className="block text-sm font-bold text-foreground mb-2 uppercase tracking-wider"
                >
                  Nome do Artista
                </label>
                <input
                  id="artist-name"
                  type="text"
                  placeholder="Ex: Maria Silva"
                  value={artistName}
                  onChange={(e) => {
                    setArtistName(e.target.value);
                    setArtistErrors((prev) => {
                      const next = { ...prev };
                      delete next.name;
                      return next;
                    });
                  }}
                  disabled={artistSuccess}
                  className="w-full px-4 py-3 rounded-lg bg-concrete border border-border text-foreground placeholder:text-muted outline-none transition-all duration-300 focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.15)] disabled:opacity-50"
                />
                {artistErrors.name && (
                  <p className="mt-1 text-sm text-red-400">
                    {artistErrors.name}
                  </p>
                )}
              </div>

              {/* Caracteristicas (tag input) */}
              <div>
                <label
                  htmlFor="artist-characteristics"
                  className="block text-sm font-bold text-foreground mb-2 uppercase tracking-wider"
                >
                  Caracteristicas
                </label>

                {/* Tags display — sticker style with neon colors */}
                {characteristics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {characteristics.map((tag, ti) => (
                      <span
                        key={tag}
                        className="sticker inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-surface-light border border-border font-bold"
                        style={{
                          color: neonColor(ti),
                          borderColor: `${neonColor(ti)}30`,
                          ["--sticker-rotation" as string]: `${(ti % 5) - 2}deg`,
                        }}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          disabled={artistSuccess}
                          className="ml-1 text-muted hover:text-red-400 transition-colors"
                          aria-label={`Remover ${tag}`}
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <input
                  id="artist-characteristics"
                  ref={tagInputRef}
                  type="text"
                  placeholder="Digite e pressione Enter para adicionar"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  disabled={artistSuccess}
                  className="w-full px-4 py-3 rounded-lg bg-concrete border border-border text-foreground placeholder:text-muted outline-none transition-all duration-300 focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.15)] disabled:opacity-50"
                />
                {artistErrors.characteristics && (
                  <p className="mt-1 text-sm text-red-400">
                    {artistErrors.characteristics}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={artistSuccess || artistSubmitting}
                className="w-full py-3 rounded-lg bg-neon-pink text-background font-bold text-lg uppercase tracking-wider transition-all duration-300 hover:bg-neon-pink/80 hover:shadow-[0_0_20px_rgba(255,45,123,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {artistSubmitting
                  ? "Salvando..."
                  : artistSuccess
                    ? "Cadastrado!"
                    : "Cadastrar Artista"}
              </button>
            </form>
          )}

          {/* ========== TAB 2: Cadastrar Obra ========== */}
          {activeTab === "obra" && (
            <form onSubmit={handleObraSubmit} className="space-y-6">
              {/* Success message */}
              {obraSuccess && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-neon-green/10 border border-neon-green/40 text-neon-green">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Obra cadastrada com sucesso! Redirecionando...</span>
                </div>
              )}

              {/* Artista select */}
              <div>
                <label
                  htmlFor="obra-artist"
                  className="block text-sm font-bold text-foreground mb-2 uppercase tracking-wider"
                >
                  Artista
                </label>
                <select
                  id="obra-artist"
                  value={selectedArtistId}
                  onChange={(e) => {
                    setSelectedArtistId(e.target.value);
                    setObraErrors((prev) => {
                      const next = { ...prev };
                      delete next.artist;
                      return next;
                    });
                  }}
                  disabled={obraSuccess}
                  className="w-full px-4 py-3 rounded-lg bg-concrete border border-border text-foreground outline-none transition-all duration-300 focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.15)] disabled:opacity-50 appearance-none"
                >
                  <option value="">Selecione um artista...</option>
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                {obraErrors.artist && (
                  <p className="mt-1 text-sm text-red-400">
                    {obraErrors.artist}
                  </p>
                )}
              </div>

              {/* Titulo */}
              <div>
                <label
                  htmlFor="obra-title"
                  className="block text-sm font-bold text-foreground mb-2 uppercase tracking-wider"
                >
                  Titulo
                </label>
                <input
                  id="obra-title"
                  type="text"
                  placeholder="Ex: Natureza Urbana"
                  value={obraTitle}
                  onChange={(e) => {
                    setObraTitle(e.target.value);
                    setObraErrors((prev) => {
                      const next = { ...prev };
                      delete next.title;
                      return next;
                    });
                  }}
                  disabled={obraSuccess}
                  className="w-full px-4 py-3 rounded-lg bg-concrete border border-border text-foreground placeholder:text-muted outline-none transition-all duration-300 focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.15)] disabled:opacity-50"
                />
                {obraErrors.title && (
                  <p className="mt-1 text-sm text-red-400">
                    {obraErrors.title}
                  </p>
                )}
              </div>

              {/* Tecnica */}
              <div>
                <label
                  htmlFor="obra-technique"
                  className="block text-sm font-bold text-foreground mb-2 uppercase tracking-wider"
                >
                  Tecnica
                </label>
                <input
                  id="obra-technique"
                  type="text"
                  placeholder="Ex: Spray sobre concreto"
                  value={obraTechnique}
                  onChange={(e) => {
                    setObraTechnique(e.target.value);
                    setObraErrors((prev) => {
                      const next = { ...prev };
                      delete next.technique;
                      return next;
                    });
                  }}
                  disabled={obraSuccess}
                  className="w-full px-4 py-3 rounded-lg bg-concrete border border-border text-foreground placeholder:text-muted outline-none transition-all duration-300 focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.15)] disabled:opacity-50"
                />
                {obraErrors.technique && (
                  <p className="mt-1 text-sm text-red-400">
                    {obraErrors.technique}
                  </p>
                )}
              </div>

              {/* Tamanho */}
              <div>
                <label
                  htmlFor="obra-size"
                  className="block text-sm font-bold text-foreground mb-2 uppercase tracking-wider"
                >
                  Tamanho
                </label>
                <input
                  id="obra-size"
                  type="text"
                  placeholder="Ex: 30x40"
                  value={obraSize}
                  onChange={(e) => {
                    setObraSize(e.target.value);
                    setObraErrors((prev) => {
                      const next = { ...prev };
                      delete next.size;
                      return next;
                    });
                  }}
                  disabled={obraSuccess}
                  className="w-full px-4 py-3 rounded-lg bg-concrete border border-border text-foreground placeholder:text-muted outline-none transition-all duration-300 focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.15)] disabled:opacity-50"
                />
                {obraErrors.size && (
                  <p className="mt-1 text-sm text-red-400">
                    {obraErrors.size}
                  </p>
                )}
              </div>

              {/* Valor */}
              <div>
                <label
                  htmlFor="obra-value"
                  className="block text-sm font-bold text-foreground mb-2 uppercase tracking-wider"
                >
                  Valor em R${" "}
                  <span className="text-muted font-normal">(opcional)</span>
                </label>
                <input
                  id="obra-value"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 1500.00"
                  value={obraValue}
                  onChange={(e) => setObraValue(e.target.value)}
                  disabled={obraSuccess}
                  className="w-full px-4 py-3 rounded-lg bg-concrete border border-border text-foreground placeholder:text-muted outline-none transition-all duration-300 focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.15)] disabled:opacity-50"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={obraSuccess || obraSubmitting}
                className="w-full py-3 rounded-lg bg-neon-pink text-background font-bold text-lg uppercase tracking-wider transition-all duration-300 hover:bg-neon-pink/80 hover:shadow-[0_0_20px_rgba(255,45,123,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {obraSubmitting
                  ? "Salvando..."
                  : obraSuccess
                    ? "Cadastrada!"
                    : "Cadastrar Obra"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Inline keyframes for tab animation */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes tabSlide {
              from { transform: scaleX(0); }
              to   { transform: scaleX(1); }
            }
          `,
        }}
      />
    </main>
  );
}
