"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCatalog } from "@/hooks/useCatalog";
import { formatBRL, getWorkImages, compressImage } from "@/lib/catalog";
import { Loading } from "@/components/Loading";
import { ImageCarousel } from "@/components/ImageCarousel";
import type { Artwork } from "@/types";
import type { FilterPreset } from "@/lib/imageFilter";

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
  "w-full px-4 py-3 rounded-lg bg-surface border border-border text-white placeholder:text-muted outline-none transition-all duration-300 focus:border-accent focus:ring-1 focus:ring-accent";

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

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
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
      onChange([...values, ...results]);
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  function handleRemove(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
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
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs hover:bg-red-500 transition"
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
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border file:border-border file:bg-surface-light file:text-white file:font-bold file:cursor-pointer hover:file:bg-accent hover:file:text-black file:transition-all"
          />
          {values.length > 0 && (
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
    if (!title.trim()) errs.title = "Titulo e obrigatorio";
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
        <label className="block text-xs font-bold text-white mb-1 uppercase tracking-wider">Titulo</label>
        <input value={title} onChange={(e) => { setTitle(e.target.value); setErrors((p) => { const n = { ...p }; delete n.title; return n; }); }} className={inputClasses} />
        {errors.title && <p className="mt-1 text-sm text-accent-red">{errors.title}</p>}
      </div>
      <div>
        <label className="block text-xs font-bold text-white mb-1 uppercase tracking-wider">Tecnica</label>
        <input value={technique} onChange={(e) => { setTechnique(e.target.value); setErrors((p) => { const n = { ...p }; delete n.technique; return n; }); }} className={inputClasses} />
        {errors.technique && <p className="mt-1 text-sm text-accent-red">{errors.technique}</p>}
      </div>
      <div>
        <label className="block text-xs font-bold text-white mb-1 uppercase tracking-wider">Tamanho</label>
        <input value={size} onChange={(e) => { setSize(e.target.value); setErrors((p) => { const n = { ...p }; delete n.size; return n; }); }} className={inputClasses} />
        {errors.size && <p className="mt-1 text-sm text-accent-red">{errors.size}</p>}
      </div>
      <div>
        <label className="block text-xs font-bold text-white mb-1 uppercase tracking-wider">Valor em R$ <span className="text-muted font-normal">(opcional)</span></label>
        <input type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} className={inputClasses} />
      </div>
      <div>
        <label className="block text-xs font-bold text-white mb-1 uppercase tracking-wider">Descricao <span className="text-muted font-normal">(opcional)</span></label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClasses} />
      </div>
      <MultiImageUpload values={images} onChange={setImages} />
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-pill btn-yellow text-sm">Salvar</button>
        <button type="button" onClick={onCancel} className="btn-pill btn-white text-sm">Cancelar</button>
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
  const { artists, getArtistBySlug, upsertArtist, removeArtist, editWork, removeWork, isLoading, imageFilter, updateImageFilter } = useCatalog();
  const artist = getArtistBySlug(slug);

  /* Edit artist state */
  const [editingArtist, setEditingArtist] = useState(false);
  const [editName, setEditName] = useState("");
  const [editChars, setEditChars] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [editArtistErrors, setEditArtistErrors] = useState<Record<string, string>>({});

  /* Edit work state */
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);

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
    try {
      await editWork(editingWorkId, data);
      setEditingWorkId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar obra");
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
          <h1 className="text-3xl font-extrabold text-white mb-4 tracking-tight">
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
                        className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-surface-light text-white font-medium border border-border"
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
                <button onClick={saveArtistEdit} className="btn-pill btn-yellow text-sm">Salvar</button>
                <button onClick={() => setEditingArtist(false)} className="btn-pill btn-white text-sm">Cancelar</button>
              </div>
            </div>
          ) : (
            /* ---- Normal display ---- */
            <>
              <div className="flex items-start gap-4 mb-4">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white lowercase">
                  {artist.name}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Characteristics tags */}
                {artist.characteristics.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white font-medium"
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
                    className="text-xs px-4 py-1.5 rounded-full border border-white/30 text-white font-bold hover:border-accent hover:text-accent transition-all duration-300"
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
            <h2
              className="text-2xl font-extrabold text-white mb-8 tracking-tight"
              style={{ animation: "fadeInUp 0.6s ease-out 0.25s both" }}
            >
              Obras
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {works.map((work, index) => {
                const workImages = getWorkImages(work);
                const delay = 0.3 + index * 0.08;
                const isEditing = editingWorkId === work.id;

                return (
                  <article
                    key={work.id}
                    className="group overflow-hidden rounded-xl bg-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-white/5"
                    style={{
                      opacity: 0,
                      animation: `fadeInUp 0.6s ease-out ${delay}s forwards`,
                    }}
                  >
                    {isEditing ? (
                      <EditWorkForm
                        work={work}
                        onSave={handleSaveWork}
                        onCancel={() => setEditingWorkId(null)}
                      />
                    ) : (
                      <>
                        {/* Image carousel */}
                        {workImages.length > 0 && (
                          <ImageCarousel
                            images={workImages}
                            alt={work.title}
                            height={260}
                            activeFilter={imageFilter as FilterPreset}
                            onFilterChange={(preset) => updateImageFilter(preset)}
                          />
                        )}

                        {/* Content */}
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-extrabold text-lg text-white group-hover:text-accent transition-colors duration-300 tracking-tight">
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
                            <p className="text-base font-bold text-accent mt-2">
                              {formatBRL(work.value)}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </article>
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
              <span className="text-sm font-extrabold text-white group-hover:text-accent transition-colors duration-300 tracking-tight">
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
              <span className="text-sm font-extrabold text-white group-hover:text-accent transition-colors duration-300 tracking-tight">
                {nextArtist.name}
              </span>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </section>
    </div>
  );
}
