// Tráiler para la home: muestra la portada con un botón y carga el reproductor de Mux
// recién cuando alguien lo pide, para que la home no cargue el reproductor en cada visita.

import { lazy, Suspense, useState } from 'react';

interface Props {
  playbackId: string;
  title: string;
  poster?: string;
}

// Si el reproductor no llega a cargar (sin conexión, por ejemplo), queda la portada.
const TrailerPlayer = lazy(() =>
  import('./TrailerPlayer').catch(() => ({
    default: ({ poster }: Props) => (poster ? <img src={poster} alt="" className="h-full w-full object-cover" /> : null),
  })),
);

export default function TrailerFacade({ playbackId, title, poster }: Props) {
  const [playing, setPlaying] = useState(false);
  const cover = poster && <img src={poster} alt="" className="h-full w-full object-cover" />;

  if (playing) {
    return (
      <Suspense fallback={cover}>
        <TrailerPlayer playbackId={playbackId} title={title} poster={poster} autoPlay />
      </Suspense>
    );
  }

  return (
    <button type="button" onClick={() => setPlaying(true)} className="group relative block h-full w-full cursor-pointer text-left">
      {cover}
      <span className="absolute bottom-4 left-4 inline-flex items-center gap-3 rounded-full bg-[var(--secondary)] py-2.5 pl-3 pr-5 text-sm font-bold text-violet-950 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-out group-hover:scale-105 sm:bottom-6 sm:left-6 sm:text-base">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-950">
          <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 fill-[var(--secondary)]" aria-hidden="true">
            <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.2-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14z" />
          </svg>
        </span>
        Ver el tráiler
      </span>
    </button>
  );
}
