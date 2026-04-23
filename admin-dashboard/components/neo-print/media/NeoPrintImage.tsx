interface NeoPrintImageProps {
  src: string;
  alt: string;
  aspectRatio?: string;
}

export function NeoPrintImage({ src, alt, aspectRatio = '16 / 10' }: NeoPrintImageProps) {
  return <img src={src} alt={alt} loading="lazy" style={{ width: '100%', display: 'block', objectFit: 'cover', aspectRatio, border: '1px solid var(--np-line)' }} />;
}
