import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Info,
  ListPlus,
  Play,
  Search,
  Settings,
  Volume2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: CineCasaHome,
});

type Title = {
  title: string;
  meta: string;
  image: string;
  progress?: number;
};

const continueWatching: Title[] = [
  {
    title: "Dune: Part Two",
    meta: "2024 • 2h 46m",
    image:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=85",
    progress: 68,
  },
  {
    title: "Interstellar",
    meta: "2014 • 2h 49m",
    image:
      "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=900&q=85",
    progress: 42,
  },
  {
    title: "The Last Horizon",
    meta: "S01 E04 • 52m",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85",
    progress: 31,
  },
  {
    title: "Arrival",
    meta: "2016 • 1h 56m",
    image:
      "https://images.unsplash.com/photo-1484950763426-56b5bf172dbb?auto=format&fit=crop&w=900&q=85",
    progress: 79,
  },
];

const recent: Title[] = [
  {
    title: "The Creator",
    meta: "2023 • Ficção científica",
    image:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Blade Runner",
    meta: "1982 • Ficção científica",
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Nocturne",
    meta: "2025 • Suspense",
    image:
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Gravity",
    meta: "2013 • Drama",
    image:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "The Wild",
    meta: "2025 • Aventura",
    image:
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=85",
  },
];

const genres: Title[] = [
  {
    title: "Ficção científica",
    meta: "24 títulos",
    image:
      "https://images.unsplash.com/photo-1534791547706-7b6f5e9e0c3b?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Ação",
    meta: "31 títulos",
    image:
      "https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Suspense",
    meta: "18 títulos",
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Drama",
    meta: "27 títulos",
    image:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85",
  },
];

function CineCasaHome() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#070707] text-white">
      <div className="fixed left-0 top-0 z-50 border-b border-white/10 bg-[#111]/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45 backdrop-blur">
        Demonstração visual • catálogo fictício da Etapa 1
      </div>

      <header className="absolute left-0 right-0 top-0 z-40 flex h-20 items-center justify-between px-6 pt-3 md:px-10 lg:px-14">
        <div className="flex items-center gap-10">
          <a href="/" className="text-2xl font-black tracking-[-0.06em]">
            Cine<span className="text-[#e50914]">Casa</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-white/70 md:flex">
            <a className="text-white" href="/">Início</a>
            <a href="#filmes">Filmes</a>
            <a href="#series">Séries</a>
            <a href="#lista">Minha lista</a>
            <a href="#categorias">Categorias</a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button aria-label="Pesquisar" className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white">
            <Search className="h-5 w-5" />
          </button>
          <button aria-label="Configurações" className="hidden rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white sm:block">
            <Settings className="h-5 w-5" />
          </button>
          <button aria-label="Perfil" className="flex items-center gap-2 rounded-full bg-white/5 p-1 pr-2 transition hover:bg-white/10">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-red-500 to-red-900 text-xs font-bold">B</span>
            <CircleUserRound className="hidden h-4 w-4 text-white/50 sm:block" />
          </button>
        </div>
      </header>

      <section className="relative min-h-[650px] overflow-hidden md:min-h-[720px]">
        <img
          src="https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=2200&q=90"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070707] via-[#070707]/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-[#070707]/35" />

        <div className="relative flex min-h-[650px] max-w-2xl flex-col justify-end px-6 pb-20 pt-32 md:min-h-[720px] md:px-10 md:pb-28 lg:px-14">
          <div className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-white/55">
            <span className="text-[#e50914]">CineCasa Original</span>
            <span>•</span>
            <span>4K</span>
          </div>
          <h1 className="max-w-xl text-5xl font-black leading-[0.95] tracking-[-0.055em] md:text-7xl">
            Interestelar
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/70">
            <span>2014</span><span>•</span><span>2h 49m</span><span>•</span><span>12</span><span>•</span><span>Ficção científica</span>
          </div>
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/65 md:text-base">
            Uma equipe atravessa um buraco de minhoca em busca de um novo lar para a humanidade. Nesta interface, este conteúdo é apenas demonstrativo e será substituído pela biblioteca local real.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-5 text-sm font-bold text-black transition hover:bg-white/90">
              <Play className="h-4 w-4 fill-current" /> Assistir
            </button>
            <button className="inline-flex h-11 items-center gap-2 rounded-md bg-white/15 px-5 text-sm font-bold backdrop-blur transition hover:bg-white/25">
              <Info className="h-4 w-4" /> Mais informações
            </button>
            <button aria-label="Adicionar à minha lista" className="grid h-11 w-11 place-items-center rounded-md bg-white/15 backdrop-blur transition hover:bg-white/25">
              <ListPlus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="-mt-4 relative z-10 space-y-12 pb-16 md:-mt-8">
        <ContentRow id="lista" title="Continuar assistindo" items={continueWatching} progress />
        <ContentRow id="filmes" title="Adicionados recentemente" items={recent} />
        <ContentRow id="categorias" title="Explore por categoria" items={genres} category />
      </section>

      <section id="series" className="border-t border-white/10 px-6 py-14 md:px-10 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#e50914]">Arquitetura preparada</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Biblioteca local, sem dados inventados</h2>
            </div>
            <span className="text-sm text-white/45">Backend de mídia será conectado na Etapa 3</span>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Servidor local", "Node.js + TypeScript"],
              ["Streaming", "HTTP Range + HTML5"],
              ["Catálogo", "Banco relacional"],
              ["Transcodificação", "FFmpeg opcional"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
                <div className="text-xs uppercase tracking-widest text-white/35">{label}</div>
                <div className="mt-2 text-sm font-semibold text-white/80">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-white/30">
        CineCasa • Etapa 1 • Interface preparada para integração com biblioteca local
      </footer>
    </main>
  );
}

function ContentRow({
  id,
  title,
  items,
  progress = false,
  category = false,
}: {
  id?: string;
  title: string;
  items: Title[];
  progress?: boolean;
  category?: boolean;
}) {
  return (
    <section id={id} className="group/row">
      <div className="mb-4 flex items-center justify-between px-6 md:px-10 lg:px-14">
        <h2 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
        <div className="flex gap-1 opacity-0 transition group-hover/row:opacity-100">
          <button aria-label="Anterior" className="rounded-full p-1.5 hover:bg-white/10"><ChevronLeft className="h-5 w-5" /></button>
          <button aria-label="Próximo" className="rounded-full p-1.5 hover:bg-white/10"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-6 pb-2 md:gap-4 md:px-10 lg:px-14">
        {items.map((item) => (
          <article key={item.title} className={`group/card relative shrink-0 ${category ? "w-52 md:w-60" : "w-44 md:w-52"}`}>
            <div className={`relative overflow-hidden rounded-lg bg-[#151515] ${category ? "aspect-[16/9]" : "aspect-[2/3]"}`}>
              <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover/card:scale-[1.04] group-hover/card:opacity-75" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition group-hover/card:opacity-100" />
              <button aria-label={`Reproduzir ${item.title}`} className="absolute bottom-3 left-3 grid h-9 w-9 scale-90 place-items-center rounded-full bg-white text-black opacity-0 transition group-hover/card:scale-100 group-hover/card:opacity-100">
                <Play className="h-4 w-4 fill-current" />
              </button>
              {progress && item.progress ? (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div className="h-full bg-[#e50914]" style={{ width: `${item.progress}%` }} />
                </div>
              ) : null}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-white/90">{item.title}</h3>
                <p className="mt-0.5 truncate text-xs text-white/40">{item.meta}</p>
              </div>
              {!category && <Volume2 className="hidden h-4 w-4 shrink-0 text-white/25 sm:block" />}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
