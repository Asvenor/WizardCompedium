import a from '../data/gallery-stats-a.json' with {type:'json'};
import b from '../data/gallery-stats-b.json' with {type:'json'};
import c from '../data/gallery-stats-c.json' with {type:'json'};
import type {FormGalleryEntry} from './form-gallery.ts';

type ImageStats={metadata:Record<string,unknown>;imageSha256:string;notes?:string[]};
const records:Record<string,ImageStats>={...a,...b,...c};
export const galleryStatsRecords=records;

// This is a reviewed transcription of the preserved image, not a new source or
// a current-edition/eligibility audit. A changed source image requires review.
export function getGalleryStats(entry:FormGalleryEntry){
  if(entry.checkedCardSlug)return undefined;
  const stats=records[entry.slug];
  if(!stats)return undefined;
  if(!entry.images.some(image=>image.sha256===stats.imageSha256))throw new Error(`Review changed stat-block image before publishing: ${entry.title}`);
  return {...stats.metadata,verification_status:'image-transcribed',
    verification:'Core statistics transcribed and visually checked against the preserved image',
    verification_scope:'CR, type, size, AC, HP, speeds and senses only. No independent edition, complete-ability or spell-eligibility audit.',
    transcription_notes:stats.notes??[],transcription_image_sha256:stats.imageSha256};
}
