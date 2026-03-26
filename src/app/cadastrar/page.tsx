"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCatalog } from "@/hooks/useCatalog";
import { compressImage } from "@/lib/catalog";
import { Loading } from "@/components/Loading";

/* ------------------------------------------------------------------ */
/*  Tab type                                                           */
/* ------------------------------------------------------------------ */
type Tab = "artista" | "obra";

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function CadastrarPage() {
  return (
    <Suspense>
      <CadastrarContent />
    </Suspense>
  );
}

function CadastrarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedArtistId = searchParams.get("artistId") ?? "";
  const { artists, addArtist, addWork, isLoading } = useCatalog();
  const [activeTab, setActiveTab] = useState<Tab>(preselectedArtistId ? "obra" : "artista");

  /* ---- Artist form state ---- */
  const [artistName, setArtistName] = useState("");
  const [characteristics, setCharacteristics] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [artistErrors, setArtistErrors] = useState<Record<string, string>>({});
  const [artistSuccess, setArtistSuccess] = useState(false);
  const [artistSubmitting, setArtistSubmitting] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  /* ---- Artwork form state ---- */
  const [selectedArtistId, setSelectedArtistId] = useState(preselectedArtistId);
  const [obraTitle, setObraTitle] = useState("");
  const [obraTechnique, setObraTechnique] = useState("");
  const [obraSize, setObraSize] = useState("");
  const [obraValue, setObraValue] = useState("");
  const [obraDescription, setObraDescription] = useState("");
  const [obraImages, setObraImages] = useState<string[]>([]);
  const [obraErrors, setObraErrors] = useState<Record<string, string>>({});
  const [obraSuccess, setObraSuccess] = useState(false);
  const [obraSubmitting, setObraSubmitting] = useState(false);
  const obraFileRef = useRef<HTMLInputElement>(null);

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
  async function handleArtistSubmit(e: React.FormEvent) {
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
    try {
      const result = await addArtist({
        name: artistName.trim(),
        characteristics,
      });
      setArtistSuccess(true);
      setArtistSubmitting(false);

      setTimeout(() => {
        router.push(`/artistas/${result.slug}`);
      }, 2000);
    } catch (err) {
      setArtistSubmitting(false);
      alert(err instanceof Error ? err.message : "Erro ao cadastrar artista");
    }
  }

  /* ---- Image upload handler (multi) ---- */
  function handleObraFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const promises = Array.from(files).map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUri = reader.result as string;
            compressImage(dataUri).then(resolve);
          };
          reader.readAsDataURL(file);
        }),
    );
    Promise.all(promises).then((results) => {
      setObraImages((prev) => [...prev, ...results]);
      if (obraFileRef.current) obraFileRef.current.value = "";
    });
  }

  function handleRemoveObraImage(index: number) {
    setObraImages((prev) => prev.filter((_, i) => i !== index));
  }

  /* ---- Artwork submit ---- */
  async function handleObraSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!selectedArtistId) {
      errors.artist = "Selecione um artista";
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

    try {
      await addWork({
        artistId: artist.id,
        title: obraTitle.trim(),
        technique: obraTechnique.trim(),
        size: obraSize.trim(),
        value: obraValue.trim() ? parseFloat(obraValue) : null,
        description: obraDescription.trim() || undefined,
        images: obraImages.length > 0 ? obraImages : undefined,
      });
      setObraSuccess(true);
      setObraSubmitting(false);

      setTimeout(() => {
        router.push(`/artistas/${artist.slug}`);
      }, 2000);
    } catch (err) {
      setObraSubmitting(false);
      alert(err instanceof Error ? err.message : "Erro ao cadastrar obra");
    }
  }

  /* ---- Reset form state when switching tabs ---- */
  useEffect(() => {
    setArtistErrors({});
    setObraErrors({});
  }, [activeTab]);

  if (isLoading) return <Loading />;

  /* ---- Tab indicator position ---- */
  const tabs: { key: Tab; label: string }[] = [
    { key: "artista", label: "Cadastrar Artista" },
    { key: "obra", label: "Cadastrar Obra" },
  ];

  const inputClasses =
    "w-full px-4 py-3 rounded-lg bg-surface border border-border text-white placeholder:text-muted outline-none transition-all duration-300 focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50";

  return (
    <div className="min-h-screen px-6 py-16 md:py-24">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight text-white mb-4"
            style={{ animation: "fadeInUp 0.7s ease-out both" }}
          >
            cadastrar
          </h1>
          <p
            className="text-muted text-lg"
            style={{ animation: "fadeInUp 0.7s ease-out 0.15s both" }}
          >
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
                  ? "text-accent"
                  : "text-muted hover:text-white"
              }`}
            >
              {tab.label}
              {/* Yellow underline on active */}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="transition-opacity duration-300">
          {/* ========== TAB 1: Cadastrar Artista ========== */}
          {activeTab === "artista" && (
            <form onSubmit={handleArtistSubmit} className="space-y-6">
              {/* Success message */}
              {artistSuccess && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-accent-green/10 border border-accent-green/40 text-accent-green">
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
                  className="block text-sm font-bold text-white mb-2 uppercase tracking-wider"
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
                  className={inputClasses}
                />
                {artistErrors.name && (
                  <p className="mt-1 text-sm text-accent-red">
                    {artistErrors.name}
                  </p>
                )}
              </div>

              {/* Caracteristicas (tag input) */}
              <div>
                <label
                  htmlFor="artist-characteristics"
                  className="block text-sm font-bold text-white mb-2 uppercase tracking-wider"
                >
                  Caracteristicas
                </label>

                {/* Tags display -- clean dark pills */}
                {characteristics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {characteristics.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-surface-light text-white font-medium border border-border"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          disabled={artistSuccess}
                          className="ml-1 text-muted hover:text-accent-red transition-colors"
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
                  className={inputClasses}
                />
                {artistErrors.characteristics && (
                  <p className="mt-1 text-sm text-accent-red">
                    {artistErrors.characteristics}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={artistSuccess || artistSubmitting}
                className="btn-pill btn-yellow w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="flex items-center gap-3 p-4 rounded-lg bg-accent-green/10 border border-accent-green/40 text-accent-green">
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
                  className="block text-sm font-bold text-white mb-2 uppercase tracking-wider"
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
                  className={`${inputClasses} appearance-none`}
                >
                  <option value="">Selecione um artista...</option>
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                {obraErrors.artist && (
                  <p className="mt-1 text-sm text-accent-red">
                    {obraErrors.artist}
                  </p>
                )}
              </div>

              {/* Titulo */}
              <div>
                <label
                  htmlFor="obra-title"
                  className="block text-sm font-bold text-white mb-2 uppercase tracking-wider"
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
                  className={inputClasses}
                />
                {obraErrors.title && (
                  <p className="mt-1 text-sm text-accent-red">
                    {obraErrors.title}
                  </p>
                )}
              </div>

              {/* Tecnica */}
              <div>
                <label
                  htmlFor="obra-technique"
                  className="block text-sm font-bold text-white mb-2 uppercase tracking-wider"
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
                  className={inputClasses}
                />
                {obraErrors.technique && (
                  <p className="mt-1 text-sm text-accent-red">
                    {obraErrors.technique}
                  </p>
                )}
              </div>

              {/* Tamanho */}
              <div>
                <label
                  htmlFor="obra-size"
                  className="block text-sm font-bold text-white mb-2 uppercase tracking-wider"
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
                  className={inputClasses}
                />
                {obraErrors.size && (
                  <p className="mt-1 text-sm text-accent-red">
                    {obraErrors.size}
                  </p>
                )}
              </div>

              {/* Valor */}
              <div>
                <label
                  htmlFor="obra-value"
                  className="block text-sm font-bold text-white mb-2 uppercase tracking-wider"
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
                  className={inputClasses}
                />
              </div>

              {/* Descricao */}
              <div>
                <label
                  htmlFor="obra-description"
                  className="block text-sm font-bold text-white mb-2 uppercase tracking-wider"
                >
                  Descricao{" "}
                  <span className="text-muted font-normal">(opcional)</span>
                </label>
                <textarea
                  id="obra-description"
                  placeholder="Descricao da obra..."
                  value={obraDescription}
                  onChange={(e) => setObraDescription(e.target.value)}
                  disabled={obraSuccess}
                  rows={3}
                  className={inputClasses}
                />
              </div>

              {/* Fotos */}
              <div>
                <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                  Fotos{" "}
                  <span className="text-muted font-normal">(opcional)</span>
                </label>
                {obraImages.length > 0 && (
                  <div className="flex gap-3 mb-3 overflow-x-auto pb-2">
                    {obraImages.map((img, idx) => (
                      <div key={idx} className="relative flex-shrink-0">
                        <img
                          src={img}
                          alt={`Preview ${idx + 1}`}
                          className="h-32 w-auto rounded-lg object-cover border border-border"
                        />
                        {!obraSuccess && (
                          <button
                            type="button"
                            onClick={() => handleRemoveObraImage(idx)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs hover:bg-red-500 transition"
                          >
                            X
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <input
                  ref={obraFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleObraFileChange}
                  disabled={obraSuccess}
                  className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border file:border-border file:bg-surface-light file:text-white file:font-bold file:cursor-pointer hover:file:bg-accent hover:file:text-black file:transition-all"
                />
                {obraImages.length > 0 && (
                  <p className="mt-1 text-xs text-muted">
                    {obraImages.length} {obraImages.length === 1 ? "foto" : "fotos"} — selecione mais para adicionar
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={obraSuccess || obraSubmitting}
                className="btn-pill btn-yellow w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}
