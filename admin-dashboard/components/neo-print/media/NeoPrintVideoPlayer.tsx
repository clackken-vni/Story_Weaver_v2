interface NeoPrintVideoPlayerProps {
  src: string;
  poster?: string;
}

export function NeoPrintVideoPlayer({ src, poster }: NeoPrintVideoPlayerProps) {
  return (
    <video controls preload="metadata" playsInline poster={poster} style={{ width: '100%', display: 'block', aspectRatio: '16 / 9', border: '1px solid var(--np-line)', background: 'var(--np-ink)' }}>
      <source src={src} type="video/mp4" />
    </video>
  );
}
