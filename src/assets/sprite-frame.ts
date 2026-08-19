import spriteBounds from './sprite-bounds.json';

export interface SpriteFrame {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

const BOUNDS = spriteBounds as Record<string, SpriteFrame>;

export function spriteFrame(file: string): SpriteFrame | null {
  return BOUNDS[file] ?? null;
}

export function spriteAspect(file: string): number {
  const frame = spriteFrame(file);
  if (!frame || frame.sh <= 0) return 1;
  return frame.sw / frame.sh;
}
