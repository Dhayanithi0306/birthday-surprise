import birthdayMusic from './atlasaudio-birthday.mp3';
export interface GalleryPhoto { src: string; caption: string }
export interface BirthdayData {
  uncleName: string; greeting: string; subtitle: string; personalMessage: string;
  finalSurprise: string; birthdayDate?: string; gallery: GalleryPhoto[]; musicPath?: string;
}

// Personalize this file to make the celebration your own. Add photos under /public/photos.
export const birthdayData: BirthdayData = {
  uncleName: 'Sanjeevan',
  greeting: 'Happy Birthday, Dear Sanjeevan Mama ❤️',
  subtitle: 'Today is all about celebrating the wonderful person you are.',
  personalMessage: 'Thank you for all the laughter, kindness, and warmth you bring to our family. We are so lucky to have you. May the year ahead return every bit of joy you give to everyone around you.',
  finalSurprise: 'You are loved more than words can say. Here’s to many more beautiful memories together. 🥂',
  birthdayDate: '',
  gallery: [
    { src: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80', caption: 'The people who make every moment brighter' },
    { src: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=80', caption: 'Together is our favorite place to be' },
    { src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80', caption: 'A lifetime of laughter and love' },
    { src: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=900&q=80', caption: 'Making memories, one celebration at a time' },
  ],
  musicPath: birthdayMusic,
};
