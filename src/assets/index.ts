function pack(modules: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, url] of Object.entries(modules)) {
    const file = path.split('/').pop()?.replace(/\.svg$/, '');
    if (file) out[file] = url;
  }
  return out;
}

export const classicArt = pack(
  import.meta.glob('./themes/classic/*.svg', { eager: true, import: 'default' }) as Record<string, string>,
);
export const nightArt = pack(
  import.meta.glob('./themes/night/*.svg', { eager: true, import: 'default' }) as Record<string, string>,
);
export const tropicalArt = pack(
  import.meta.glob('./themes/tropical/*.svg', { eager: true, import: 'default' }) as Record<string, string>,
);
export const sportsArt = pack(
  import.meta.glob('./themes/sports/*.svg', { eager: true, import: 'default' }) as Record<string, string>,
);
export const drinksArt = pack(
  import.meta.glob('./themes/drinks/*.svg', { eager: true, import: 'default' }) as Record<string, string>,
);
export const uiIcons = pack(
  import.meta.glob('./ui/*.svg', { eager: true, import: 'default' }) as Record<string, string>,
);

export function artUrls(...packs: Array<Record<string, string>>): string[] {
  const urls: string[] = [];
  for (const packMap of packs) urls.push(...Object.values(packMap));
  return urls;
}
