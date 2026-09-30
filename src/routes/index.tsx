import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Bookmark, CircleUserRound, Play, Search, Settings, ServerOff, RefreshCw, Film, Tv, X
} from "lucide-react";
import {
  addToMyList, checkCineCasaServer, getCatalog, getMediaUrl, getProgress, getMyList, getProfiles, getSeriesEpisodes, removeFromMyList, saveProgress,
  type CatalogTitle, type CineCasaProfile, type SeriesEpisode
} from "../lib/cinecasa-api";

export const Route = createFileRoute("/")({ component: CineCasaHome });

function CineCasaHome() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [titles, setTitles] = useState<CatalogTitle[]>([]);
  const [profiles, setProfiles] = useState<CineCasaProfile[]>([]);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [playing, setPlaying] = useState<CatalogTitle | null>(null);
  const [seriesPicker, setSeriesPicker] = useState<{ title: CatalogTitle; episodes: SeriesEpisode[] } | null>(null);
  const [myList, setMyList] = useState<CatalogTitle[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [search, setSearch] = useState("");

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

  useEffect(() => {
    if (!profileId) {
      setMyList([]);
      return;
    }
    void getMyList(profileId).then(setMyList).catch(() => setMyList([]));
  }, [profileId]);

  const activeProfile = profiles.find((profile) => profile.id === profileId) ?? null;
  const movies = titles.filter((title) => title.type === "movie");
  const series = titles.filter((title) => title.type === "series");
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  const searchResults = normalizedSearch
    ? titles.filter((title) => [title.title, title.original_title, title.year?.toString()].filter(Boolean).some((value) => String(value).toLocaleLowerCase("pt-BR").includes(normalizedSearch)))
    : [];
  const myListIds = new Set(myList.map((item) => item.id));

  async function handlePlay(item: CatalogTitle) {
    if (!item.media_file_id) return;
    if (item.type === "series") {
      try {
        const episodes = await getSeriesEpisodes(item.id);
        setSeriesPicker({ title: item, episodes });
      } catch {
        setSeriesPicker({ title: item, episodes: [] });
      }
      return;
    }
    setPlaying(item);
  }

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
          <button aria-label="Pesquisar" onClick={() => setSearchOpen(true)} className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"><Search className="h-5 w-5" /></button>
          <button aria-label="Configurações" onClick={() => setSettingsOpen(true)} className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"><Settings className="h-5 w-5" /></button>
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
          <CatalogRow id="filmes" title="Filmes" items={movies} icon={<Film className="h-5 w-5" />} onPlay={handlePlay} myListIds={myListIds} onToggleList={async (id) => {
            if (!profileId) return;
            if (myListIds.has(id)) {
              await removeFromMyList(profileId, id);
              setMyList((items) => items.filter((item) => item.id !== id));
            } else {
              await addToMyList(profileId, id);
              const item = titles.find((title) => title.id === id);
              if (item) setMyList((items) => [item, ...items]);
            }
          }} />
          <CatalogRow id="series" title="Séries" items={series} icon={<Tv className="h-5 w-5" />} onPlay={setPlaying} myListIds={myListIds} onToggleList={async (id) => {
            if (!profileId) return;
            if (myListIds.has(id)) {
              await removeFromMyList(profileId, id);
              setMyList((items) => items.filter((item) => item.id !== id));
            } else {
              await addToMyList(profileId, id);
              const item = titles.find((title) => title.id === id);
              if (item) setMyList((items) => [item, ...items]);
            }
          }} />
          {myList.length > 0 && <CatalogRow id="lista" title="Minha lista" items={myList} icon={<Bookmark className="h-5 w-5" />} onPlay={setPlaying} myListIds={myListIds} onToggleList={async (id) => {
            if (!profileId) return;
            await removeFromMyList(profileId, id);
            setMyList((items) => items.filter((item) => item.id !== id));
          }} />
        </>
      )}

      {seriesPicker && <EpisodePicker title={seriesPicker.title} episodes={seriesPicker.episodes} onClose={() => setSeriesPicker(null)} onPlay={(mediaFileId) => {
        setPlaying({ ...seriesPicker.title, media_file_id: mediaFileId });
        setSeriesPicker(null);
        setSearchOpen(false);
      }} />}
      {playing && profileId && <Player profileId={profileId} title={playing} onClose={() => setPlaying(null)} />}
      {searchOpen && <SearchOverlay value={search} onChange={setSearch} results={searchResults} onPlay={handlePlay} onClose={() => { setSearchOpen(false); setSearch(""); }} />}
      {settingsOpen && <SettingsOverlay onClose={() => setSettingsOpen(false)} />}
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

function CatalogRow({ id, title, items, icon, onPlay, myListIds, onToggleList }: { id: string; title: string; items: CatalogTitle[]; icon: React.ReactNode; onPlay: (item: CatalogTitle) => void; myListIds: Set<number>; onToggleList: (id: number) => Promise<void> }) {
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
              <button onClick={() => void onToggleList(item.id)} aria-label={myListIds.has(item.id) ? `Remover ${item.title} da minha lista` : `Adicionar ${item.title} à minha lista`} className="absolute bottom-3 right-3 grid h-9 w-9 scale-90 place-items-center rounded-full bg-black/75 text-white opacity-0 transition group-hover/card:scale-100 group-hover/card:opacity-100 hover:bg-black"><Bookmark className={myListIds.has(item.id) ? "h-4 w-4 fill-current text-[#e50914]" : "h-4 w-4"} /></button>
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

function EpisodePicker({ title, episodes, onClose, onPlay }: { title: CatalogTitle; episodes: SeriesEpisode[]; onClose: () => void; onPlay: (mediaFileId: number) => void }) {
  return (
    <div className="fixed inset-0 z-[65] grid place-items-center bg-black/90 px-6 py-8 backdrop-blur-md">
      <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#121212] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#e50914]">Série</p><h2 className="mt-1 text-2xl font-black">{title.title}</h2></div>
          <button onClick={onClose} aria-label="Fechar seleção de episódios" className="rounded-full p-2 text-white/60 hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[calc(80vh-90px)] overflow-y-auto p-4">
          {episodes.length === 0 ? (
            <p className="p-4 text-sm text-white/40">Nenhum episódio disponível para reprodução.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {episodes.map((episode) => (
                <button key={episode.media_file_id} onClick={() => onPlay(episode.media_file_id)} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-white/20 hover:bg-white/[0.08]">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/10 text-sm font-bold">{String(episode.episode_number).padStart(2, "0")}</span>
                  <span><span className="block text-sm font-semibold">Temporada {episode.season_number}</span><span className="text-xs text-white/40">Episódio {episode.episode_number}</span></span>
                  <Play className="ml-auto h-4 w-4 shrink-0" />
                </button>
              ))}
            </div>
          )}
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


function SearchOverlay({ value, onChange, results, onPlay, onClose }: { value: string; onChange: (value: string) => void; results: CatalogTitle[]; onPlay: (item: CatalogTitle) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] bg-[#070707]/95 px-6 py-8 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-5xl flex-col">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-white/45" />
          <input autoFocus value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => event.key === "Escape" && onClose()} placeholder="Buscar filmes, séries ou ano..." className="min-w-0 flex-1 bg-transparent text-2xl font-semibold outline-none placeholder:text-white/20" />
          <button onClick={onClose} aria-label="Fechar pesquisa" className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"><X className="h-6 w-6" /></button>
        </div>
        <div className="mt-8 overflow-y-auto pb-10">
          {!value.trim() ? <p className="text-sm text-white/35">Digite para pesquisar na sua biblioteca.</p> : results.length === 0 ? <p className="text-sm text-white/35">Nenhum título encontrado.</p> : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {results.map((item) => (
                <button key={item.id} onClick={() => item.media_file_id && onPlay(item)} disabled={!item.media_file_id} className="text-left disabled:opacity-40">
                  <div className="aspect-[2/3] overflow-hidden rounded-lg bg-[#151515]">{item.poster_path ? <img src={item.poster_path} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-white/20"><Film className="h-10 w-10" /></div>}</div>
                  <p className="mt-2 truncate text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-white/35">{item.year ?? (item.type === "series" ? "Série" : "Filme")}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsOverlay({ onClose }: { onClose: () => void }) {
  const [serverUrl, setServerUrl] = useState(() => localStorage.getItem("cinecasa.serverUrl") || "");
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/85 px-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#e50914]">Configurações</p><h2 className="mt-2 text-2xl font-black">Servidor CineCasa</h2></div><button onClick={onClose} aria-label="Fechar configurações" className="rounded-full p-2 text-white/60 hover:bg-white/10"><X className="h-5 w-5" /></button></div>
        <label className="mt-7 block text-sm font-medium text-white/75">URL do servidor</label>
        <input value={serverUrl} onChange={(event) => setServerUrl(event.target.value)} placeholder="Deixe vazio para usar o mesmo endereço" className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm outline-none focus:border-white/30" />
        <p className="mt-2 text-xs leading-5 text-white/35">Exemplo: http://192.168.1.20:8420. Útil quando a interface e o servidor estão em máquinas diferentes.</p>
        <div className="mt-6 flex justify-end gap-3"><button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-white/60 hover:bg-white/10">Cancelar</button><button onClick={() => { localStorage.setItem("cinecasa.serverUrl", serverUrl.trim().replace(/\/$/, "")); onClose(); window.location.reload(); }} className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-black">Salvar</button></div>
      </div>
    </div>
  );
}
