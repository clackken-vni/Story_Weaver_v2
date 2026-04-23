import { NeoPrintImage } from './NeoPrintImage';
import { NeoPrintTag } from '../ui/NeoPrintTag';

interface NeoPrintThumbnailProps {
  src: string;
  alt: string;
  label: string;
}

export function NeoPrintThumbnail({ src, alt, label }: NeoPrintThumbnailProps) {
  return (
    <div style={{ position: 'relative' }}>
      <NeoPrintImage src={src} alt={alt} aspectRatio="4 / 3" />
      <div style={{ position: 'absolute', top: 8, right: 8 }}>
        <NeoPrintTag tone="accent">Live</NeoPrintTag>
      </div>
      <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8, padding: '8px 10px', background: 'rgba(0,0,0,0.64)', color: '#f5f1ea', fontSize: 'var(--text-xs)' }}>
        {label}
      </div>
    </div>
  );
}
