export type MemoryAlbum = 'family' | 'fun' | 'portraits' | 'videos';
export type MemoryFilter = 'all' | MemoryAlbum;
export interface MemoryItem {
  id: string;
  album: MemoryAlbum;
  type: 'photo' | 'video';
  src?: string;
  loadVideo?: () => Promise<string>;
  caption: string;
  number: string;
}

const familyFiles = import.meta.glob<string>('./family/*.{jpg,jpeg,png,webp,avif}', { eager: true, query: '?url', import: 'default' });
const funFiles = import.meta.glob<string>('./lite_fun/*.{jpg,jpeg,png,webp,avif}', { eager: true, query: '?url', import: 'default' });
const portraitFiles = import.meta.glob<string>('./single_images/*.{jpg,jpeg,png,webp,avif}', { eager: true, query: '?url', import: 'default' });
const videoFiles = import.meta.glob<string>('./recap_vedio/*.mp4', { query: '?url', import: 'default' });

const naturalSort = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const albumCaptions: Record<MemoryAlbum, string> = {
  family: 'Together with family',
  fun: 'A little fun with Uncle',
  portraits: 'Uncle, just being himself',
  videos: 'A family memory in motion',
};

function photosFrom(files: Record<string, string>, album: Exclude<MemoryAlbum, 'videos'>): MemoryItem[] {
  return Object.entries(files)
    .sort(([a], [b]) => naturalSort.compare(a, b))
    .map(([path, src], index) => ({
      id: path,
      album,
      type: 'photo',
      src,
      caption: `${albumCaptions[album]} · ${String(index + 1).padStart(2, '0')}`,
      number: String(index + 1).padStart(2, '0'),
    }));
}

const videos: MemoryItem[] = Object.entries(videoFiles)
  .sort(([a], [b]) => naturalSort.compare(a, b))
  .map(([path, loadVideo], index) => ({
    id: path,
    album: 'videos',
    type: 'video',
    loadVideo,
    caption: `${albumCaptions.videos} · ${String(index + 1).padStart(2, '0')}`,
    number: String(index + 1).padStart(2, '0'),
  }));

export const birthdayMemories: MemoryItem[] = [
  ...photosFrom(familyFiles, 'family'),
  ...photosFrom(funFiles, 'fun'),
  ...photosFrom(portraitFiles, 'portraits'),
  ...videos,
];

export const memoryAlbumLabels: Record<MemoryFilter, string> = {
  all: 'All moments',
  family: 'Family',
  fun: 'Little fun',
  portraits: 'Sanjeevan',
  videos: 'Recap videos',
};
