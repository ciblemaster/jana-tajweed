import { Bird, Cat, Dog, Fish, Rabbit, Snail, Squirrel, Turtle, type LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { Avatar as Kind } from './store';

const ICONS: Record<Kind, LucideIcon> = { cat: Cat, rabbit: Rabbit, bird: Bird, fish: Fish, turtle: Turtle, squirrel: Squirrel, dog: Dog, snail: Snail };
const COLOURS: Record<Kind, string> = { cat: '#ffe8a3', rabbit: '#ffd6e7', bird: '#cfe8ff', fish: '#c3f0ff', turtle: '#d3f9d8', squirrel: '#ffe0c2', dog: '#e5dbff', snail: '#fff3bf' };

export function Avatar({ kind, size = 40 }: { kind: Kind; size?: number }) {
  const Icon = ICONS[kind];
  return <span className="jp-avatar" style={{ '--av': COLOURS[kind] } as CSSProperties} aria-hidden><Icon size={size} strokeWidth={2} /></span>;
}
