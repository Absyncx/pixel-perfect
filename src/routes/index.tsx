import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CircleUserRound, Info, ListPlus, Play, Search, Settings,
  ServerOff, RefreshCw, Film, Tv
} from "lucide-react";
import { checkCineCasaServer, getCatalog, type CatalogTitle } from "../lib/cinecasa-api";

export const Route = createFileRoute("/")({ component: CineCasaHome });

function CineCasaHome() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [titles, setTitles] = useState<CatalogTitle[]>([]);

  async function loadCatalog() {
    setLoading(true);
    try {
      await checkCineCasaServer();
      const catalog = await getCatalog();
      setTitles(catalog);
      setConnected(true);
    } catch {
      setConnected(false);
      setTitles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadCatalog(); }, []);

  const movies = titles.filter((title) => title.type === "movie");
  const series = titles.filter((title) => title.type === "series");

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#070707] text-white">
      <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/10 bg-[#070707]/90 px-6 backdrop-blur md:px-10 lg:px-14">
        <div className="flex items-center gap-10">
          <a href="/" className="text-2xl font-black tracking-[-0.06em]">Cine<span className="text-[#e50914]">Casa</span></a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-white/65 md:flex">
            <a className="text-white" href="/">Início</a>
            <a href="#filmes">Filmes</a>
            <a href="#series">Séries</a>
            <a href="#lista">Minha lista</a>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Pesquisar" className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"><Search className="h-5 w-5" /></button>
          <button aria-label="Configurações" className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"><Settings className="h-5 w-5" /></button>
          <button aria-label="Perfil" className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-red-500 to-red-900"><CircleUserRound className="h-5 w-5" /></button>
        </div>
      </header>

      {!connected ? (
        <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-6 py-16">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center shadow-2xl md:p-12">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-white/50">
              <ServerOff className="h-8 w-8" />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-[#e50914]">CineCasa local</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Servidor não conectado</h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/50">
              O CineCasa não inventa filmes para preencher a tela. Inicie o CineCasa Server no computador que guarda sua biblioteca e abra esta interface pelo endereço dele.
            </p>
            <button onClick={() => void loadCatalog()} disabled={loading} className="mt-7 inline-flex h-11 items-center gap-2 rounded-md bg-white px-5 text-sm font-bold text-black disabled:opacity-50">
              <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Tentar novamente
            </button>
            <p className="mt-6 text-xs text-white/25">Servidor padrão: http://localhost:8420</p>
          </div>
        </section>
      ) : titles.length === 0 ? (
        <EmptyLibrary onRefresh={() => void loadCatalog()} loading={loading} />
      ) : (
        <>
          <section className="relative min-h-[570px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#070707] via-[#070707]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-[#070707]/20" />
            <div className="relative flex min-h-[570px] max-w-2xl flex-col justify-end px-6 pb-20 md:px-10 lg:px-14">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#e50914]">Sua biblioteca</p>
              <h1 className="mt-3 text-5xl font-black tracking-[-0.055em] md:text-7xl">CineCasa</h1>
              <p className="mt-5 max-w-xl text-sm leading-6 text-white/60 md:text-base">
                {titles.length} título{titles.length === 1 ? "" : "s"} encontrado{titles.length === 1 ? "" : "s"} no seu servidor local.
              </p>
            </div>
          </section>
          <CatalogRow id="filmes" title="Filmes" items={movies} icon={<Film className="h-5 w-5" />} />
          <CatalogRow id="series" title="Séries" items={series} icon={<Tv className="h-5 w-5" />} />
        </>
      )}
    </main>
  );
}

function EmptyLibrary({ onRefresh, loading }: { onRefresh: () => void; loading: boolean }) {
  return (
    <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-6 py-16">
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-white/40"><Film className="h-8 w-8" /></div>
        <h1 className="mt-6 text-3xl font-black">Sua biblioteca está vazia</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/45">O servidor está funcionando, mas nenhuma mídia foi cadastrada. Configure suas pastas e execute uma varredura.</p>
        <button onClick={onRefresh} disabled={loading} className="mt-6 inline-flex h-10 items-center gap-2 rounded-md border border-white/15 px-4 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Atualizar</button>
      </div>
    </section>
  );
}

function CatalogRow({ id, title, items, icon }: { id: string; title: string; items: CatalogTitle[]; icon: React.ReactNode }) {
  if (!items.length) return null;
  return (
    <section id={id} className="px-6 pb-12 md:px-10 lg:px-14">
      <div className="mb-5 flex items-center gap-2"><span className="text-[#e50914]">{icon}</span><h2 className="text-xl font-bold">{title}</h2></div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((item) => (
          <article key={item.id} className="group/card min-w-0">
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-[#151515]">
              {item.poster_path ? <img src={item.poster_path} alt="" className="h-full w-full object-cover transition duration-500 group-hover/card:scale-[1.04]" /> : <div className="grid h-full place-items-center text-white/20"><Film className="h-10 w-10" /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition group-hover/card:opacity-100" />
              <button aria-label={`Reproduzir ${item.title}`} className="absolute bottom-3 left-3 grid h-9 w-9 scale-90 place-items-center rounded-full bg-white text-black opacity-0 transition group-hover/card:scale-100 group-hover/card:opacity-100"><Play className="h-4 w-4 fill-current" /></button>
            </div>
            <h3 className="mt-2 truncate text-sm font-semibold text-white/90">{item.title}</h3>
            <p className="mt-0.5 truncate text-xs text-white/40">{[item.year, item.type === "series" ? "Série" : "Filme"].filter(Boolean).join(" • ")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
