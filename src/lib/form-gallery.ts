import data from '../data/form-gallery.json' with {type:'json'};

export type FormGalleryImage = {
  url:string; alt:string; sourcePath:string; sha256:string; width?:number; height?:number;
};
export type FormGallerySource = {
  slug:string; title:string; sectionLabel:string; sourcePath:string;
  heading:string; headingAnchor:string; kind:'gallery'|'checked-card';
  rulesStatus:string; rulesVersion:string; updatedAt:string;
};
export type FormGalleryEntry = {
  slug:string; title:string; images:FormGalleryImage[]; sources:FormGallerySource[];
  checkedCardSlug?:string; metadata:Record<string,unknown>;
};

const entries = data.entries as FormGalleryEntry[];
export const formGalleryInfo = {
  entryCount:data.entryCount, checkedCardCount:data.checkedCardCount,
  galleryOnlyCount:data.galleryOnlyCount, imageCount:data.imageCount,
  placementCount:data.placementCount, importedAt:data.importedAt,
};
export const getFormGallery = () => entries;
export const getFormGalleryEntry = (slug:string) => entries.find(entry => entry.slug === slug);
export const galleryHref = (entry:FormGalleryEntry) => entry.checkedCardSlug
  ? `/library/${entry.checkedCardSlug}/` : `/forms/gallery/${entry.slug}/`;
export const gallerySourceHref = (source:FormGallerySource) => `/library/${source.slug}/${source.headingAnchor ? `#${source.headingAnchor}` : ''}`;
