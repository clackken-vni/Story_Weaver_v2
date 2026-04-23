import { useMemo, useState } from 'react';
import { NeoPrintImage } from './NeoPrintImage';
import { NeoPrintButton } from '../ui/NeoPrintButton';

interface NeoPrintCarouselProps {
  images: string[];
}

export function NeoPrintCarousel({ images }: NeoPrintCarouselProps) {
  const [index, setIndex] = useState(0);
  const current = useMemo(() => images[index] ?? images[0], [images, index]);

  if (!current) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 40px', gap: 'var(--space-2)', alignItems: 'center' }}>
      <NeoPrintButton onClick={() => setIndex((value) => (value - 1 + images.length) % images.length)} ariaLabel="Previous slide">
        ←
      </NeoPrintButton>
      <NeoPrintImage src={current} alt={`Slide ${index + 1}`} aspectRatio="16 / 9" />
      <NeoPrintButton onClick={() => setIndex((value) => (value + 1) % images.length)} ariaLabel="Next slide">
        →
      </NeoPrintButton>
    </div>
  );
}
