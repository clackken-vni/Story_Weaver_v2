import type { ReactNode } from 'react';
import { NeoPrintHeader } from '../ui/NeoPrintHeader';

interface NeoPrintModuleHeroProps {
  title: string;
  kicker: string;
  strapline: string;
  edition: string;
  actions?: ReactNode;
}

export function NeoPrintModuleHero({ title, kicker, strapline, edition, actions }: NeoPrintModuleHeroProps) {
  return <NeoPrintHeader title={title} kicker={kicker} strapline={strapline} edition={edition} actions={actions} />;
}
