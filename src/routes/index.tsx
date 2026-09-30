import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  CircleUserRound, Play, Search, Settings, ServerOff, RefreshCw, Film, Tv, X
} from "lucide-react";
import {
  checkCineCasaServer, getCatalog, getMediaUrl, getProgress, getProfiles, saveProgress,
  type CatalogTitle, type CineCasaProfile
} from "../lib/cinecasa-api";

export const Route = createFileRoute("/")({ component: CineCasaHome });

function CineCasaHome() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [titles, setTitles] = useState<CatalogTitle[]>([]);
  const [profiles, setProfiles] = useState<CineCasaProfile[]>([]);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [playing, setPlaying] = useState<CatalogTitle | null>(null);

  async function loadCatalog() {
    setLoading(true);
    try {
      await checkCineCasaServer();
      const [catalog, availableProfiles] = await Promise.all([getCatalog(), getProfiles()]);
      setTitles(catalog);
      setProfiles(availableProfiles);
      setConnected(true);
    } catch {
      setConnected(false);
      setTitles([]);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem("cinecasa.profileId");
    if (stored) setProfileId(Number(stored));
    void loadCatalog();
  }, []);

  const activeProfile = profiles.find((profile) => profile.id === profileId) ?? null;
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
          <button
            aria-label={activeProfile ? `Perfil ${activeProfile.name}` : "Selecionar perfil"}
            onClick={() => setProfileId(null)}
            className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-red-500 to-red-900"
          ><CircleUserRound className="h-5 w-5" /></button>
        </div>
      </header>

      {!connected ? (
        <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-6 py-16">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center shadow-2xl md:p-12">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-white/50"><ServerOff className="h-8 w-8" /></div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-[#e50914]">CineCasa local</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Servidor não conectado</h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/50">Inicie o CineCasa Server no computador que guarda sua biblioteca e abra esta interface pelo endereço dele.</p>
            <button onClick={() => void loadCatalog()} disabled={loading} className="mt-7 inline-flex h-11 items-center gap-2 rounded-md bg-white px-5 text-sm font-bold text-black disabled:opacity-50"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Tentar novamente</button>
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
              <p className="mt-5 max-w-xl text-sm leading-6 text-white/60 md:text-base">{titles.length} título{titles.length === 1 ? "" : "s"} encontrado{titles.length === 1 ? "" : "s"} no seu servidor local.</p>
            </div>
          </section>
          <CatalogRow id="filmes" title="Filmes" items={movies} icon={<Film className="h-5 w-5" />} onPlay={setPlaying} />
          <CatalogRow id="series" title="Séries" items={series} icon={<Tv className="h-5 w-5" />} onPlay={setPlaying} />
        </>
      )}

      {playing && profileId && <Player profileId={profileId} title={playing} onClose={() => setPlaying(null)} />}
      {connected && profiles.length > 0 && !activeProfile && (
        <ProfilePicker profiles={profiles} onSelect={(id) => {
          localStorage.setItem("cinecasa.profileId", String(id));
          setProfileId(id);
        }} />
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

function CatalogRow({ id, title, items, icon, onPlay }: { id: string; title: string; items: CatalogTitle[]; icon: React.ReactNode; onPlay: (item: CatalogTitle) => void }) {
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
              <button onClick={() => item.media_file_id && onPlay(item)} disabled={!item.media_file_id} aria-label={item.media_file_id ? `Reproduzir ${item.title}` : `Sem arquivo para ${item.title}`} className="absolute bottom-3 left-3 grid h-9 w-9 scale-90 place-items-center rounded-full bg-white text-black opacity-0 transition group-hover/card:scale-100 group-hover/card:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"><Play className="h-4 w-4 fill-current" /></button>
            </div>
            <h3 className="mt-2 truncate text-sm font-semibold text-white/90">{item.title}</h3>
            <p className="mt-0.5 truncate text-xs text-white/40">{[item.year, item.type === "series" ? "Série" : "Filme"].filter(Boolean).join(" • ")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProfilePicker({ profiles, onSelect }: { profiles: CineCasaProfile[]; onSelect: (id: number) => void }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/90 px-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#e50914]">CineCasa</p>
        <h1 className="mt-3 text-3xl font-black md:text-4xl">Quem está assistindo?</h1>
        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3">
          {profiles.map((profile) => (
            <button key={profile.id} onClick={() => onSelect(profile.id)} className="group rounded-2xl p-4 transition hover:bg-white/10">
              <div className="mx-auto grid aspect-square w-full max-w-36 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-red-950 text-4xl font-black shadow-2xl transition group-hover:scale-105">
                {profile.avatar ? <img src={profile.avatar} alt="" className="h-full w-full rounded-2xl object-cover" /> : profile.name.charAt(0).toUpperCase()}
              </div>
              <p className="mt-4 font-semibold text-white/85 group-hover:text-white">{profile.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Player({ profileId, title, onClose }: { profileId: number; title: CatalogTitle; onClose: () => void }) {
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  const [resume, setResume] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedAt = useRef(0);
  const resumeApplied = useRef(false);

  useEffect(() => {
    let active = true;
    const mediaFileId = title.media_file_id;
    if (!mediaFileId) return;

    setResume(0);
    setPosition(0);
    setDuration(null);
    resumeApplied.current = false;
    lastSavedAt.current = 0;

    void getProgress(profileId, mediaFileId).then((progress) => {
      if (active) {
        setResume(progress.completed ? 0 : Math.max(0, progress.position_seconds || 0));
      }
    }).catch(() => undefined);

    return () => { active = false; };
  }, [profileId, title.media_file_id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || resumeApplied.current || resume <= 5 || !duration) return;
    if (resume >= duration - 3) return;
    video.currentTime = resume;
    resumeApplied.current = true;
  }, [resume, duration]);

  if (!title.media_file_id) return null;

  const persistProgress = (video: HTMLVideoElement, completed = false) => {
    const currentTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const videoDuration = Number.isFinite(video.duration) ? video.duration : null;
    void saveProgress(profileId, title.media_file_id!, currentTime, videoDuration, completed).catch(() => undefined);
    lastSavedAt.current = Date.now();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95">
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between px-4 md:px-8">
          <div className="min-w-0"><p className="truncate text-sm font-semibold">{title.title}</p><p className="text-xs text-white/40">CineCasa</p></div>
          <button onClick={onClose} aria-label="Fechar player" className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"><X className="h-6 w-6" /></button>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black">
          <video
            ref={videoRef}
            className="max-h-full max-w-full w-full object-contain"
            src={getMediaUrl(title.media_file_id)}
            controls
            playsInline
            autoPlay
            onLoadedMetadata={(event) => {
              const video = event.currentTarget;
              setDuration(Number.isFinite(video.duration) ? video.duration : null);
            }}
            onTimeUpdate={(event) => {
              const video = event.currentTarget;
              setPosition(video.currentTime);
              if (video.currentTime > 0 && Date.now() - lastSavedAt.current >= 10000) {
                persistProgress(video);
              }
            }}
            onPause={(event) => persistProgress(event.currentTarget)}
            onEnded={(event) => persistProgress(event.currentTarget, true)}
          />
          {resume > 5 && position < 1 && !resumeApplied.current && (
            <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-4 py-2 text-xs text-white/80 backdrop-blur">Retomando em {Math.floor(resume / 60)}:{String(Math.floor(resume % 60)).padStart(2, "0")}</div>
          )}
        </div>
        <div className="flex h-10 shrink-0 items-center justify-between px-4 text-xs text-white/35 md:px-8">
          <span>{duration ? `${Math.floor(position / 60)}:${String(Math.floor(position % 60)).padStart(2, "0")}` : ""}</span>
          <span>Reprodução local • HTTP Range</span>
        </div>
      </div>
    </div>
  );
}
