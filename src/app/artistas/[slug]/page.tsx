"use client";

import React, { useState, useRef, useEffect } from "react";
import { mutate as globalMutate } from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCatalog } from "@/hooks/useCatalog";
import { formatBRL, getWorkImages, getDisplayImageUrls, compressImage, applyMarkup, handleImageError, convertHeicIfNeeded, isPromoActive } from "@/lib/catalog";
import { Loading } from "@/components/Loading";
import { ImageCarousel } from "@/components/ImageCarousel";
import { ImagePositionModal } from "@/components/ImagePositionModal";
import type { Artwork } from "@/types";


/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function artistGradient(name: string): string {
  const h = hashStr(name);
  const hue1 = h % 360;
  const hue2 = (h * 7 + 120) % 360;
  const hue3 = (h * 13 + 240) % 360;
  return `linear-gradient(135deg, hsl(${hue1} 85% 25%) 0%, hsl(${hue2} 75% 30%) 50%, hsl(${hue3} 65% 20%) 100%)`;
}

const inputClasses =
  "w-full px-4 py-3 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted outline-none transition-all duration-300 focus:border-accent focus:ring-1 focus:ring-accent";

/* ------------------------------------------------------------------ */
/*  Multi-Image Upload Component                                       */
/* ------------------------------------------------------------------ */

function MultiImageUpload({
  values,
  onChange,
  disabled,
}: {
  values: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setCompressing(true);
    try {
      const promises = Array.from(files).map(
        (file) =>
          new Promise<string>(async (resolve, reject) => {
            try {
              const convertedFile = await convertHeicIfNeeded(file);
              const reader = new FileReader();
              reader.onload = () => {
                const dataUri = reader.result as string;
                if (!dataUri || !dataUri.startsWith("data:image/")) {
                  reject(new Error("Arquivo invalido"));
                  return;
                }
                compressImage(dataUri).then(resolve).catch(() => resolve(dataUri));
              };
              reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
              reader.readAsDataURL(convertedFile);
            } catch (err) {
              reject(err);
            }
          }),
      );
      const results = await Promise.all(promises);
      const valid = results.filter((r) => r && r.length > 0);
      if (valid.length > 0) {
        onChange([...values, ...valid]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao processar imagens");
    } finally {
      setCompressing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleRemove(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="block text-sm font-bold text-foreground mb-2 uppercase tracking-wider">
        Fotos <span className="text-muted font-normal">(opcional)</span>
      </label>
      {values.length > 0 && (
        <div className="flex gap-3 mb-3 overflow-x-auto pb-2">
          {values.map((img, idx) => (
            <div key={idx} className="relative flex-shrink-0">
              <img
                src={img}
                alt={`Foto ${idx + 1}`}
                className="h-32 w-auto rounded-lg object-cover border border-border"
                onError={handleImageError}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-foreground flex items-center justify-center text-xs hover:bg-red-500 transition"
                >
                  X
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {!disabled && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            onChange={handleFiles}
            disabled={compressing}
            className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border file:border-border file:bg-surface-light file:text-foreground file:font-bold file:cursor-pointer hover:file:bg-accent hover:file:text-black file:transition-all disabled:opacity-50"
          />
          {compressing && (
            <p className="mt-2 text-xs text-accent animate-pulse">
              Comprimindo imagens...
            </p>
          )}
          {!compressing && values.length > 0 && (
            <p className="mt-1 text-xs text-muted">
              {values.length} {values.length === 1 ? "foto" : "fotos"} — selecione mais para adicionar
            </p>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit Work Inline Form                                              */
/* ------------------------------------------------------------------ */

function EditWorkForm({
  work,
  onSave,
  onCancel,
  saving,
}: {
  work: Artwork;
  onSave: (data: {
    title: string;
    technique: string;
    size: string;
    value: number | null;
    description?: string;
    images?: string[];
  }) => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [title, setTitle] = useState(work.title);
  const [technique, setTechnique] = useState(work.technique);
  const [size, setSize] = useState(work.size);
  const [value, setValue] = useState(work.value !== null ? String(work.value) : "");
  const [description, setDescription] = useState(work.description ?? "");
  const [images, setImages] = useState<string[]>(getWorkImages(work));
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!technique.trim()) errs.technique = "Tecnica e obrigatoria";
    if (!size.trim()) errs.size = "Tamanho e obrigatorio";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSave({
      title: title.trim(),
      technique: technique.trim(),
      size: size.trim(),
      value: value.trim() ? parseFloat(value) : null,
      description: description.trim() || undefined,
      images: images.length > 0 ? images : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div>
        <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">Titulo</label>
        <input value={title} onChange={(e) => { setTitle(e.target.value); setErrors((p) => { const n = { ...p }; delete n.title; return n; }); }} className={inputClasses} />
        {errors.title && <p className="mt-1 text-sm text-accent-red">{errors.title}</p>}
      </div>
      <div>
        <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">Tecnica</label>
        <input value={technique} onChange={(e) => { setTechnique(e.target.value); setErrors((p) => { const n = { ...p }; delete n.technique; return n; }); }} className={inputClasses} />
        {errors.technique && <p className="mt-1 text-sm text-accent-red">{errors.technique}</p>}
      </div>
      <div>
        <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">Tamanho</label>
        <input value={size} onChange={(e) => { setSize(e.target.value); setErrors((p) => { const n = { ...p }; delete n.size; return n; }); }} className={inputClasses} />
        {errors.size && <p className="mt-1 text-sm text-accent-red">{errors.size}</p>}
      </div>
      <div>
        <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">Valor em R$ <span className="text-muted font-normal">(opcional)</span></label>
        <input type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} className={inputClasses} />
      </div>
      <div>
        <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">Descricao <span className="text-muted font-normal">(opcional)</span></label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClasses} />
      </div>
      <MultiImageUpload values={images} onChange={setImages} />
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className={`btn-pill btn-yellow text-sm${saving ? " opacity-50 cursor-not-allowed" : ""}`}>{saving ? "Salvando..." : "Salvar"}</button>
        <button type="button" onClick={onCancel} disabled={saving} className="btn-pill btn-white text-sm">Cancelar</button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ArtistDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  const router = useRouter();
  const { artists, getArtistBySlug, upsertArtist, removeArtist, editWork, removeWork, isLoading, markupPercentage } = useCatalog();
  const artist = getArtistBySlug(slug);

  /* Edit artist state */
  const [editingArtist, setEditingArtist] = useState(false);
  const [editName, setEditName] = useState("");
  const [editChars, setEditChars] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [editArtistErrors, setEditArtistErrors] = useState<Record<string, string>>({});

  /* Edit work state */
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);
  const [savingWork, setSavingWork] = useState(false);
  const [savingArtist, setSavingArtist] = useState(false);

  /* Crop/position modal state */
  const [cropModal, setCropModal] = useState<{ workId: string; imageIndex: number; imageUrl: string } | null>(null);

  /* Reorder works state */
  const [savingWorksOrder, setSavingWorksOrder] = useState(false);

  // Inline drag-and-drop state for works
  const dragWorkIndexRef = useRef<number | null>(null);
  const [dragWorkVisualIndex, setDragWorkVisualIndex] = useState<number | null>(null);
  const [dropWorkTargetIndex, setDropWorkTargetIndex] = useState<number | null>(null);

  /* Hide/show work state */
  const [hiddenWorkMap, setHiddenWorkMap] = useState<Record<string, boolean>>({});
  const [soldWorkMap, setSoldWorkMap] = useState<Record<string, boolean>>({});
  const [localCoverWorkId, setLocalCoverWorkId] = useState<string | null | undefined>(undefined);
  const [hiddenWorkInit, setHiddenWorkInit] = useState(false);

  /* Promo editing state */
  const [promoWorkId, setPromoWorkId] = useState<string | null>(null);
  const [promoPrice, setPromoPrice] = useState("");
  const [promoUntil, setPromoUntil] = useState("");
  const [savingPromo, setSavingPromo] = useState(false);

  // Reset local cover state when SWR data updates
  useEffect(() => {
    setLocalCoverWorkId(undefined);
  }, [artist?.coverWorkId]);

  if (!hiddenWorkInit && artist && artist.works.length > 0) {
    const m: Record<string, boolean> = {};
    const s: Record<string, boolean> = {};
    for (const w of artist.works) {
      m[w.id] = w.hidden ?? false;
      s[w.id] = w.sold ?? false;
    }
    setHiddenWorkMap(m);
    setSoldWorkMap(s);
    setHiddenWorkInit(true);
  }

  async function toggleWorkHidden(workId: string) {
    const current = hiddenWorkMap[workId] ?? false;
    const next = !current;
    setHiddenWorkMap((prev) => ({ ...prev, [workId]: next }));
    try {
      await fetch(`/api/works/${workId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: next }),
      });
      await globalMutate("/api/artists?all=true");
    } catch {
      setHiddenWorkMap((prev) => ({ ...prev, [workId]: current }));
    }
  }

  async function toggleWorkSold(workId: string) {
    const current = soldWorkMap[workId] ?? false;
    const next = !current;
    setSoldWorkMap((prev) => ({ ...prev, [workId]: next }));
    try {
      await fetch(`/api/works/${workId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sold: next }),
      });
      await globalMutate("/api/artists?all=true");
    } catch {
      setSoldWorkMap((prev) => ({ ...prev, [workId]: current }));
    }
  }

  async function toggleCoverWork(workId: string) {
    if (!artist) return;
    const isCover = (localCoverWorkId !== undefined ? localCoverWorkId : artist.coverWorkId) === workId;
    const newCoverWorkId = isCover ? null : workId;
    setLocalCoverWorkId(newCoverWorkId);
    try {
      await fetch(`/api/artists/${artist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverWorkId: newCoverWorkId }),
      });
      await globalMutate("/api/artists?all=true");
    } catch {
      setLocalCoverWorkId(undefined); // rollback
    }
  }

  function openPromoEditor(work: Artwork) {
    setPromoWorkId(work.id);
    setPromoPrice(work.promoPrice != null ? String(work.promoPrice) : "");
    setPromoUntil(work.promoUntil ? work.promoUntil.slice(0, 10) : "");
  }

  async function savePromo() {
    if (!promoWorkId) return;
    setSavingPromo(true);
    try {
      await fetch(`/api/works/${promoWorkId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoPrice: promoPrice.trim() ? promoPrice : null,
          promoUntil: promoUntil.trim() ? promoUntil : null,
        }),
      });
      await globalMutate("/api/artists?all=true");
      setPromoWorkId(null);
    } catch {
      alert("Erro ao salvar promocao");
    } finally {
      setSavingPromo(false);
    }
  }

  async function setCoverImageIndex(workId: string, index: number) {
    try {
      await fetch(`/api/works/${workId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImageIndex: index }),
      });
      await globalMutate("/api/artists?all=true");
    } catch {
      // ignore
    }
  }

  /* Compute previous / next artists for navigation */
  const currentIndex = artists.findIndex((a) => a.slug === slug);
  const prevArtist = currentIndex > 0 ? artists[currentIndex - 1] : null;
  const nextArtist =
    currentIndex >= 0 && currentIndex < artists.length - 1
      ? artists[currentIndex + 1]
      : null;

  /* ---- Start editing artist ---- */
  function startEditArtist() {
    if (!artist) return;
    setEditName(artist.name);
    setEditChars([...artist.characteristics]);
    setEditTagInput("");
    setEditArtistErrors({});
    setEditingArtist(true);
  }

  function handleEditTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = editTagInput.trim();
      if (val && !editChars.includes(val)) {
        setEditChars((prev) => [...prev, val]);
        setEditTagInput("");
        setEditArtistErrors((prev) => {
          const next = { ...prev };
          delete next.characteristics;
          return next;
        });
      }
    }
  }

  async function saveArtistEdit() {
    if (!artist) return;
    const errs: Record<string, string> = {};
    if (!editName.trim()) errs.name = "Nome e obrigatorio";
    if (editChars.length === 0) errs.characteristics = "Adicione pelo menos uma caracteristica";
    if (Object.keys(errs).length > 0) {
      setEditArtistErrors(errs);
      return;
    }
    setSavingArtist(true);
    try {
      const result = await upsertArtist(artist.id, {
        name: editName.trim(),
        characteristics: editChars,
      });
      setEditingArtist(false);
      if (result.slug !== slug) {
        router.push(`/artistas/${result.slug}`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar artista");
    } finally {
      setSavingArtist(false);
    }
  }

  /* ---- Delete artist ---- */
  async function handleDeleteArtist() {
    if (!artist) return;
    if (!window.confirm(`Tem certeza que deseja excluir o artista "${artist.name}" e todas as suas obras?`)) return;
    try {
      await removeArtist(artist.id);
      router.push("/artistas");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao excluir artista");
    }
  }

  /* ---- Save edited work ---- */
  async function handleSaveWork(data: {
    title: string;
    technique: string;
    size: string;
    value: number | null;
    description?: string;
    images?: string[];
  }) {
    if (!editingWorkId) return;
    setSavingWork(true);
    try {
      await editWork(editingWorkId, data);
      setEditingWorkId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar obra");
    } finally {
      setSavingWork(false);
    }
  }

  /* ---- Delete work ---- */
  async function handleDeleteWork(workId: string, workTitle: string) {
    if (!window.confirm(`Tem certeza que deseja excluir a obra "${workTitle}"?`)) return;
    try {
      await removeWork(workId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao excluir obra");
    }
  }

  async function handleReorderWorks(reordered: Artwork[]) {
    setSavingWorksOrder(true);
    const items = reordered.map((w, index) => ({ id: w.id, sortOrder: index }));
    try {
      await fetch("/api/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "work", items }),
      });
      await globalMutate("/api/artists?all=true");
    } catch {
      // ignore
    } finally {
      setSavingWorksOrder(false);
    }
  }

  if (isLoading) return <Loading />;

  /* ---- 404: artist not found ---- */
  if (!artist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24">
        <div
          className="text-center"
          style={{ animation: "fadeInUp 0.6s ease-out both" }}
        >
          <div className="text-6xl mb-6 opacity-30">~</div>
          <h1 className="text-3xl font-extrabold text-foreground mb-4 tracking-tight">
            Artista nao encontrado
          </h1>
          <p className="text-muted mb-8">
            O artista que voce procura nao existe no catalogo.
          </p>
          <Link
            href="/artistas"
            className="btn-pill btn-white"
          >
            &larr; Voltar para artistas
          </Link>
        </div>
      </div>
    );
  }

  const works = artist.works;

  return (
    <div className="min-h-screen">
      {/* ---- Back link ---- */}
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <Link
          href="/artistas"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors duration-300 font-bold"
          style={{ animation: "fadeIn 0.5s ease-out both" }}
        >
          <span aria-hidden="true">&larr;</span> Voltar para artistas
        </Link>
      </div>

      {/* ---- Banner / Header ---- */}
      <section
        className="relative mt-6 mx-6 rounded-2xl overflow-hidden"
        style={{ animation: "fadeInUp 0.7s ease-out 0.1s both" }}
      >
        {/* Gradient banner */}
        <div
          className="h-48 md:h-64 w-full relative overflow-hidden"
          style={{ background: artistGradient(artist.name) }}
        >
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
        </div>

        {/* Artist info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-8">
          {editingArtist ? (
            /* ---- Inline edit artist form ---- */
            <div className="space-y-4 max-w-lg">
              <div>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => { setEditName(e.target.value); setEditArtistErrors((p) => { const n = { ...p }; delete n.name; return n; }); }}
                  placeholder="Nome do artista"
                  className={inputClasses}
                  autoFocus
                />
                {editArtistErrors.name && <p className="mt-1 text-sm text-accent-red">{editArtistErrors.name}</p>}
              </div>
              <div>
                {editChars.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editChars.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-surface-light text-foreground font-medium border border-border"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setEditChars((prev) => prev.filter((t) => t !== tag))}
                          className="ml-1 text-muted hover:text-accent-red transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  onKeyDown={handleEditTagKeyDown}
                  placeholder="Caracteristica + Enter"
                  className={inputClasses}
                />
                {editArtistErrors.characteristics && <p className="mt-1 text-sm text-accent-red">{editArtistErrors.characteristics}</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={saveArtistEdit} disabled={savingArtist} className={`btn-pill btn-yellow text-sm${savingArtist ? " opacity-50 cursor-not-allowed" : ""}`}>{savingArtist ? "Salvando..." : "Salvar"}</button>
                <button onClick={() => setEditingArtist(false)} disabled={savingArtist} className="btn-pill btn-white text-sm">Cancelar</button>
              </div>
            </div>
          ) : (
            /* ---- Normal display ---- */
            <>
              <div className="flex items-start gap-4 mb-4">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground">
                  {artist.name}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Characteristics tags */}
                {artist.characteristics.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1.5 rounded-full bg-[#B8AFA6]/15 backdrop-blur-sm text-foreground font-medium"
                  >
                    {tag}
                  </span>
                ))}

                {/* Works count */}
                <span className="text-sm text-muted ml-2">
                  {works.length} {works.length === 1 ? "obra" : "obras"}
                </span>

                {/* Action buttons */}
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={startEditArtist}
                    className="text-xs px-4 py-1.5 rounded-full border border-[#B8AFA6]/30 text-foreground font-bold hover:border-accent hover:text-accent transition-all duration-300"
                  >
                    Editar
                  </button>
                  <button
                    onClick={handleDeleteArtist}
                    className="text-xs px-4 py-1.5 rounded-full border border-red-500/50 text-red-400 font-bold hover:border-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Quote */}
      <div
        className="max-w-6xl mx-auto px-6 mt-8 flex items-center justify-center gap-3"
        style={{ animation: "fadeIn 0.8s ease-out 0.4s both" }}
      >
        <div className="h-px flex-1 max-w-16 bg-border" />
        <p className="text-sm text-muted/60 italic tracking-wide">
          &ldquo;A rua e a galeria&rdquo;
        </p>
        <div className="h-px flex-1 max-w-16 bg-border" />
      </div>

      {/* ---- Works Grid ---- */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        {works.length === 0 ? (
          /* Empty state */
          <div
            className="text-center py-20"
            style={{ animation: "fadeInUp 0.6s ease-out 0.3s both" }}
          >
            <div className="text-5xl mb-6 opacity-30">~</div>
            <p className="text-xl font-extrabold text-muted tracking-tight">
              Este artista ainda nao tem obras cadastradas
            </p>
          </div>
        ) : (
          <>
            <div
              className="flex items-center justify-between mb-8"
              style={{ animation: "fadeInUp 0.6s ease-out 0.25s both" }}
            >
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                Obras
              </h2>
              {savingWorksOrder && (
                <span className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent/10 text-accent px-4 py-1.5 text-xs font-bold animate-pulse">
                  Salvando ordem...
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {works.map((work, index) => {
                const workImages = getDisplayImageUrls(work);
                const delay = 0.3 + index * 0.08;
                const isEditing = editingWorkId === work.id;
                const isWorkHidden = hiddenWorkMap[work.id] ?? work.hidden ?? false;
                const isWorkSold = soldWorkMap[work.id] ?? work.sold ?? false;
                const effectiveCoverWorkId = localCoverWorkId !== undefined ? localCoverWorkId : artist.coverWorkId;
                const isCover = effectiveCoverWorkId === work.id;

                const isWorkBeingDragged = dragWorkVisualIndex === index;
                const isWorkDropTarget = dropWorkTargetIndex === index && dragWorkVisualIndex !== null && dragWorkVisualIndex !== index;

                return (
                  <div
                    key={work.id}
                    className="relative"
                    style={{
                      opacity: isWorkBeingDragged ? 0.3 : undefined,
                      transition: "opacity 0.15s ease",
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDropWorkTargetIndex(index);
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDropWorkTargetIndex(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fromIndex = dragWorkIndexRef.current;
                      if (fromIndex !== null && fromIndex !== index) {
                        const newItems = [...works];
                        const [moved] = newItems.splice(fromIndex, 1);
                        newItems.splice(index, 0, moved);
                        handleReorderWorks(newItems);
                      }
                      dragWorkIndexRef.current = null;
                      setDragWorkVisualIndex(null);
                      setDropWorkTargetIndex(null);
                    }}
                    onDragEnd={() => {
                      dragWorkIndexRef.current = null;
                      setDragWorkVisualIndex(null);
                      setDropWorkTargetIndex(null);
                    }}
                  >
                    {/* Yellow insertion indicator */}
                    {isWorkDropTarget && (
                      <div className="absolute -top-1.5 left-2 right-2 h-1 bg-accent rounded-full z-50 shadow-[0_0_8px_rgba(255,230,0,0.5)]" />
                    )}

                  <article
                    className={`group overflow-hidden rounded-xl bg-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-foreground/5 ${isWorkDropTarget ? "border border-accent" : ""}${isWorkHidden ? " opacity-50" : ""}${isCover ? " ring-2 ring-accent" : ""}`}
                    style={{
                      opacity: isWorkBeingDragged ? undefined : 0,
                      animation: isWorkBeingDragged ? undefined : `fadeInUp 0.6s ease-out ${delay}s forwards`,
                    }}
                  >
                    {isEditing ? (
                      <EditWorkForm
                        work={work}
                        onSave={handleSaveWork}
                        onCancel={() => setEditingWorkId(null)}
                        saving={savingWork}
                      />
                    ) : (
                      <>
                        {/* Image carousel - draggable for reordering */}
                        <div
                          className="relative cursor-grab active:cursor-grabbing"
                          draggable
                          onDragStart={(e) => {
                            dragWorkIndexRef.current = index;
                            setDragWorkVisualIndex(index);
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", String(index));
                          }}
                          onDragEnd={() => {
                            dragWorkIndexRef.current = null;
                            setDragWorkVisualIndex(null);
                            setDropWorkTargetIndex(null);
                          }}
                        >
                          {workImages.length > 0 && (
                            <ImageCarousel
                              images={workImages}
                              alt={work.title}
                              height={260}
                              imagePositions={work.imagePositions as Record<string, { x: number; y: number }> | undefined}
                            />
                          )}

                          {/* Action buttons overlay */}
                          <div className="absolute top-3 left-3 z-10 flex gap-2">
                            {/* Eye toggle */}
                            <button
                              type="button"
                              onClick={() => toggleWorkHidden(work.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/70 backdrop-blur-sm border border-border hover:bg-black/90 transition-colors duration-200"
                              aria-label={isWorkHidden ? "Tornar visivel" : "Ocultar obra"}
                            >
                              <svg className="w-4 h-4" fill="none" stroke={isWorkHidden ? "#ef4444" : "#999"} viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                {isWorkHidden ? (
                                  <>
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                  </>
                                ) : (
                                  <>
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </>
                                )}
                              </svg>
                            </button>

                            {/* Cover toggle */}
                            <button
                              type="button"
                              onClick={() => toggleCoverWork(work.id)}
                              className={`w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-sm border transition-colors duration-200 ${isCover ? "bg-accent/80 border-accent hover:bg-accent" : "bg-black/70 border-border hover:bg-black/90"}`}
                              aria-label={isCover ? "Remover capa" : "Definir como capa"}
                            >
                              <svg className="w-4 h-4" fill="none" stroke={isCover ? "#000" : "#999"} viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            </button>

                            {/* Sold toggle */}
                            <button
                              type="button"
                              onClick={() => toggleWorkSold(work.id)}
                              className={`w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-sm border transition-colors duration-200 ${isWorkSold ? "bg-red-600/80 border-red-500 hover:bg-red-600" : "bg-black/70 border-border hover:bg-black/90"}`}
                              aria-label={isWorkSold ? "Marcar como disponivel" : "Marcar como vendido"}
                            >
                              <svg className="w-4 h-4" fill="none" stroke={isWorkSold ? "#fff" : "#999"} viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                              </svg>
                            </button>

                            {/* Position/crop button */}
                            {workImages.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCropModal({ workId: work.id, imageIndex: 0, imageUrl: workImages[0] });
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/70 backdrop-blur-sm border border-border hover:bg-black/90 transition-colors duration-200"
                                aria-label="Ajustar posicao"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="#999" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="5 9 2 12 5 15" />
                                  <polyline points="9 5 12 2 15 5" />
                                  <polyline points="15 19 12 22 9 19" />
                                  <polyline points="19 9 22 12 19 15" />
                                  <line x1="2" y1="12" x2="22" y2="12" />
                                  <line x1="12" y1="2" x2="12" y2="22" />
                                </svg>
                              </button>
                            )}

                            {/* Promo toggle */}
                            <button
                              type="button"
                              onClick={() => openPromoEditor(work)}
                              className={`w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-sm border transition-colors duration-200 ${isPromoActive(work) ? "bg-green-600/80 border-green-500 hover:bg-green-600" : "bg-black/70 border-border hover:bg-black/90"}`}
                              aria-label="Promocao"
                            >
                              <svg className="w-4 h-4" fill="none" stroke={isPromoActive(work) ? "#fff" : "#999"} viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="5" x2="5" y2="19" />
                                <circle cx="6.5" cy="6.5" r="2.5" />
                                <circle cx="17.5" cy="17.5" r="2.5" />
                              </svg>
                            </button>
                          </div>

                          {/* Badges */}
                          <div className="absolute top-3 right-3 z-10 flex gap-2">
                            {isWorkSold && (
                              <span className="bg-red-700/90 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full text-white border border-red-600/50">
                                Vendido
                              </span>
                            )}
                            {isWorkHidden && (
                              <span className="bg-red-600/80 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full text-white border border-red-500/50">
                                Oculta
                              </span>
                            )}
                            {isCover && (
                              <span className="bg-accent/80 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full text-black border border-accent">
                                Capa
                              </span>
                            )}
                            {isPromoActive(work) && (
                              <span className="bg-green-600/90 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full text-white border border-green-500/50">
                                PROMO
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Promo inline editor */}
                        {promoWorkId === work.id && (
                          <div className="px-5 py-3 bg-surface-light border-t border-border">
                            <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">Promocao</p>
                            <div className="flex flex-wrap gap-3 items-end">
                              <div>
                                <label className="block text-xs text-muted mb-1">Preco promocional (R$)</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={promoPrice}
                                  onChange={(e) => setPromoPrice(e.target.value)}
                                  className="w-32 px-3 py-1.5 rounded-lg bg-surface border border-border text-foreground text-sm outline-none focus:border-accent"
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-muted mb-1">Valido ate</label>
                                <input
                                  type="date"
                                  value={promoUntil}
                                  onChange={(e) => setPromoUntil(e.target.value)}
                                  className="w-40 px-3 py-1.5 rounded-lg bg-surface border border-border text-foreground text-sm outline-none focus:border-accent"
                                />
                              </div>
                              <button
                                onClick={savePromo}
                                disabled={savingPromo}
                                className="px-4 py-1.5 rounded-full bg-accent text-black text-xs font-bold hover:bg-accent/80 transition disabled:opacity-50"
                              >
                                {savingPromo ? "Salvando..." : "Salvar"}
                              </button>
                              <button
                                onClick={() => setPromoWorkId(null)}
                                disabled={savingPromo}
                                className="px-4 py-1.5 rounded-full border border-border text-muted text-xs font-bold hover:text-foreground transition"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Cover image thumbnails */}
                        {workImages.length > 1 && (
                          <div className="px-5 py-2 bg-surface-light/50 border-t border-border flex gap-2 items-center overflow-x-auto">
                            <span className="text-xs text-muted font-bold shrink-0">Capa:</span>
                            {workImages.map((img, imgIdx) => (
                              <button
                                key={imgIdx}
                                type="button"
                                onClick={() => setCoverImageIndex(work.id, imgIdx)}
                                className={`shrink-0 w-10 h-10 rounded-md overflow-hidden border-2 transition-all ${(work.coverImageIndex ?? 0) === imgIdx ? "border-accent ring-1 ring-accent" : "border-border hover:border-muted"}`}
                                title={`Definir foto ${imgIdx + 1} como capa`}
                              >
                                <img src={img} alt={`Foto ${imgIdx + 1}`} className="w-full h-full object-cover" onError={handleImageError} />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-extrabold text-lg text-foreground group-hover:text-accent transition-colors duration-300 tracking-tight">
                              {work.title}
                            </h3>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => setEditingWorkId(work.id)}
                                className="text-xs px-3 py-1 rounded-full border border-border text-muted font-bold hover:border-accent hover:text-accent transition-all duration-300"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteWork(work.id, work.title)}
                                className="text-xs px-3 py-1 rounded-full border border-red-500/30 text-red-400/70 font-bold hover:border-red-400 hover:text-red-300 transition-all duration-300"
                              >
                                Excluir
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 space-y-1.5">
                            <p className="text-sm">
                              <span className="text-accent-pink font-bold">
                                {work.technique}
                              </span>
                            </p>
                            <p className="text-sm text-muted">{work.size}</p>
                            {work.description && (
                              <p className="text-sm text-muted/80 mt-2">
                                {work.description}
                              </p>
                            )}
                            {isWorkSold ? (
                              <p className="text-base font-bold mt-2 text-red-400">Indisponivel</p>
                            ) : isPromoActive(work) ? (
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="text-muted line-through text-sm">{formatBRL(applyMarkup(work.value, markupPercentage))}</span>
                                <span className="text-green-400 font-bold text-base">{formatBRL(applyMarkup(work.promoPrice!, markupPercentage))}</span>
                                <span className="text-xs text-muted">ate {new Date(work.promoUntil!).toLocaleDateString('pt-BR')}</span>
                              </div>
                            ) : (
                              <p className="text-base font-bold mt-2 text-accent">{formatBRL(applyMarkup(work.value, markupPercentage))}</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </article>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ---- CTA: Add work ---- */}
        <div
          className="text-center mt-14"
          style={{
            opacity: 0,
            animation: `fadeInUp 0.7s ease-out ${0.4 + works.length * 0.08}s forwards`,
          }}
        >
          <Link
            href={`/cadastrar?artistId=${artist.id}`}
            className="btn-pill btn-yellow text-lg"
          >
            Adicionar obra para {artist.name}
          </Link>
        </div>

        {/* ---- Previous / Next navigation ---- */}
        <nav
          className="mt-16 flex items-center justify-between border-t border-border pt-8"
          style={{
            opacity: 0,
            animation: `fadeIn 0.6s ease-out ${0.5 + works.length * 0.08}s forwards`,
          }}
        >
          {prevArtist ? (
            <Link
              href={`/artistas/${prevArtist.slug}`}
              className="group flex flex-col items-start gap-1 text-left transition-colors duration-300"
            >
              <span className="text-xs text-muted group-hover:text-accent transition-colors duration-300 font-bold">
                &larr; Anterior
              </span>
              <span className="text-sm font-extrabold text-foreground group-hover:text-accent transition-colors duration-300 tracking-tight">
                {prevArtist.name}
              </span>
            </Link>
          ) : (
            <div />
          )}

          {nextArtist ? (
            <Link
              href={`/artistas/${nextArtist.slug}`}
              className="group flex flex-col items-end gap-1 text-right transition-colors duration-300"
            >
              <span className="text-xs text-muted group-hover:text-accent transition-colors duration-300 font-bold">
                Proximo &rarr;
              </span>
              <span className="text-sm font-extrabold text-foreground group-hover:text-accent transition-colors duration-300 tracking-tight">
                {nextArtist.name}
              </span>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </section>

      {/* Image position/crop modal */}
      {cropModal && (
        <ImagePositionModal
          imageUrl={cropModal.imageUrl}
          initialPosition={
            ((artist?.works.find(w => w.id === cropModal.workId)?.imagePositions as Record<string, { x: number; y: number }>) || {})[String(cropModal.imageIndex)] || { x: 50, y: 50 }
          }
          onSave={async (pos) => {
            const work = artist?.works.find(w => w.id === cropModal.workId);
            const currentPositions = (work?.imagePositions as Record<string, { x: number; y: number }>) || {};
            const updated = { ...currentPositions, [String(cropModal.imageIndex)]: pos };
            await fetch(`/api/works/${cropModal.workId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imagePositions: updated }),
            });
            await globalMutate("/api/artists?all=true");
            setCropModal(null);
          }}
          onClose={() => setCropModal(null)}
        />
      )}
    </div>
  );
}
