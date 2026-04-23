import { NeoPrintImage } from './NeoPrintImage';

interface NeoPrintGalleryItem {
  id: string;
  label: string;
  image: string;
}

interface NeoPrintGalleryProps {
  items: NeoPrintGalleryItem[];
}

export function NeoPrintGallery({ items }: NeoPrintGalleryProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
      {items.map((item) => (
        <figure key={item.id} style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <NeoPrintImage src={item.image} alt={item.label} aspectRatio="4 / 3" />
          <figcaption style={{ fontSize: 'var(--text-xs)', color: 'var(--np-muted)' }}>{item.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
