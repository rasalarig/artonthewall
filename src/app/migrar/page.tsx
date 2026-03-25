"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MigrationData {
  artists: any[];
  markupPercentage: number;
  totalWorks: number;
  totalImages: number;
}

function readLocalStorageData(): MigrationData | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("artes-dan-artists");
  if (!stored) return null;

  try {
    const artists = JSON.parse(stored);
    const markupStr = localStorage.getItem("artes-dan-markup");
    const markupPercentage = markupStr ? parseFloat(markupStr) : 0.3;

    let totalWorks = 0;
    let totalImages = 0;
    for (const artist of artists) {
      totalWorks += (artist.works || []).length;
      for (const work of artist.works || []) {
        if (work.images && work.images.length > 0) {
          totalImages += work.images.length;
        } else if (work.image) {
          totalImages += 1;
        }
      }
    }

    return { artists, markupPercentage, totalWorks, totalImages };
  } catch {
    return null;
  }
}

export default function MigrarPage() {
  const [data, setData] = useState<MigrationData | null>(null);
  const [status, setStatus] = useState<
    "idle" | "migrating" | "done" | "error"
  >("idle");
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    setData(readLocalStorageData());
  }, []);

  async function handleMigrate() {
    if (!data) return;
    setStatus("migrating");
    setProgress("Enviando dados para o servidor...");

    try {
      const res = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artists: data.artists,
          markupPercentage: data.markupPercentage,
        }),
      });

      if (!res.ok) {
        throw new Error(`Erro ${res.status}: ${await res.text()}`);
      }

      const jsonResult = await res.json();
      setResult(jsonResult);
      setStatus("done");
      setProgress("");
    } catch (e: any) {
      setStatus("error");
      setProgress(e.message || "Erro desconhecido");
    }
  }

  function handleClearLocalStorage() {
    localStorage.removeItem("artes-dan-artists");
    localStorage.removeItem("artes-dan-markup");
    setData(null);
    alert("localStorage limpo com sucesso!");
  }

  return (
    <div className="min-h-screen px-6 py-16 md:py-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
          {"Migra\u00e7\u00e3o de Dados"}
        </h1>
        <p className="text-muted text-lg mb-8">
          {"Transferir dados do localStorage para o banco de dados PostgreSQL + Cloudinary."}
        </p>

        {!data ? (
          <div className="bg-surface rounded-xl p-8 border border-border text-center">
            <p className="text-muted text-lg mb-4">
              Nenhum dado encontrado no localStorage.
            </p>
            <p className="text-muted text-sm">
              {"Os dados j\u00e1 podem ter sido migrados ou o localStorage est\u00e1 vazio."}
            </p>
            <Link
              href="/"
              className="btn-pill btn-white text-sm mt-6 inline-block"
            >
              {"Voltar ao in\u00edcio"}
            </Link>
          </div>
        ) : (
          <div className="bg-surface rounded-xl p-8 border border-border space-y-6">
            <h2 className="text-xl font-bold text-white">
              Dados encontrados
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-accent">
                  {data.artists.length}
                </p>
                <p className="text-sm text-muted">Artistas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-extrabold text-accent">
                  {data.totalWorks}
                </p>
                <p className="text-sm text-muted">Obras</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-extrabold text-accent">
                  {data.totalImages}
                </p>
                <p className="text-sm text-muted">Imagens</p>
              </div>
            </div>

            {status === "idle" && (
              <button
                onClick={handleMigrate}
                className="btn-pill btn-yellow text-lg w-full"
              >
                {"Iniciar Migra\u00e7\u00e3o"}
              </button>
            )}

            {status === "migrating" && (
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white">{progress}</p>
              </div>
            )}

            {status === "done" && result && (
              <div className="space-y-4">
                <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
                  <p className="text-green-400 font-bold mb-2">
                    {"Migra\u00e7\u00e3o conclu\u00edda!"}
                  </p>
                  <p className="text-sm text-muted">
                    {result.artists} artistas, {result.works} obras,{" "}
                    {result.images} imagens migradas.
                  </p>
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-yellow-400 text-sm font-bold">
                        Avisos ({result.errors.length}):
                      </p>
                      <ul className="text-xs text-muted mt-1 space-y-1">
                        {result.errors.map((err: string, i: number) => (
                          <li key={i}>{"• "}{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleClearLocalStorage}
                  className="btn-pill btn-white text-sm w-full"
                >
                  {"Limpar localStorage (dados j\u00e1 est\u00e3o no banco)"}
                </button>
                <Link
                  href="/"
                  className="btn-pill btn-yellow text-sm w-full text-center block"
                >
                  {"Voltar ao in\u00edcio"}
                </Link>
              </div>
            )}

            {status === "error" && (
              <div className="bg-red-900/30 border border-red-600 rounded-lg p-4">
                <p className="text-red-400 font-bold mb-2">
                  {"Erro na migra\u00e7\u00e3o"}
                </p>
                <p className="text-sm text-muted">{progress}</p>
                <button
                  onClick={() => setStatus("idle")}
                  className="btn-pill btn-white text-sm mt-4"
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
