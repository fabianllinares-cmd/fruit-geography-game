import { describe, expect, it } from 'vitest';
import { TROPICAL_MUSIC_LOOP } from '../src/audio';

describe('tropical music', () => {
  it('does not loop the Tropical gameplay song', () => {
    expect(TROPICAL_MUSIC_LOOP).toBe(false);
  });
});
