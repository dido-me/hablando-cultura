// Tráiler de la página del curso: video público de Mux, sin tokens, con la portada como
// póster mientras no se reproduce.

import MuxPlayer from '@mux/mux-player-react';

interface Props {
  playbackId: string;
  title: string;
  poster?: string;
}

export default function TrailerPlayer({ playbackId, title, poster }: Props) {
  return (
    <MuxPlayer
      playbackId={playbackId}
      poster={poster}
      metadata={{ video_title: `${title} · Tráiler` }}
      streamType="on-demand"
      accentColor="#6d28d9"
      style={{ aspectRatio: '16 / 9', width: '100%' }}
    />
  );
}
