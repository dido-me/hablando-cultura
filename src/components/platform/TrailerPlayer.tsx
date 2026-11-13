// Tráiler de la página del curso: video público de Mux, sin tokens, con la portada como
// póster mientras no se reproduce.

import MuxPlayer from '@mux/mux-player-react';

interface Props {
  playbackId: string;
  title: string;
  poster?: string;
  // En la home el reproductor aparece después de un clic, así que arranca solo.
  autoPlay?: boolean;
}

export default function TrailerPlayer({ playbackId, title, poster, autoPlay = false }: Props) {
  return (
    <MuxPlayer
      playbackId={playbackId}
      poster={poster}
      autoPlay={autoPlay}
      metadata={{ video_title: `${title} · Tráiler` }}
      streamType="on-demand"
      accentColor="#6d28d9"
      style={{ aspectRatio: '16 / 9', width: '100%' }}
    />
  );
}
