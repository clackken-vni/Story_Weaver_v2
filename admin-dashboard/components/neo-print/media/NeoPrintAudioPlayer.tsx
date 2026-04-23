interface NeoPrintAudioPlayerProps {
  src: string;
}

export function NeoPrintAudioPlayer({ src }: NeoPrintAudioPlayerProps) {
  return (
    <audio controls preload="metadata" style={{ width: '100%' }}>
      <source src={src} type="audio/mpeg" />
    </audio>
  );
}
