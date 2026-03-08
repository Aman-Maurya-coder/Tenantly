import api from './api.js';

const ABSOLUTE_URL = /^https?:\/\//i;

export const getApiOrigin = () => {
  const baseUrl = api.defaults.baseURL || '';
  return baseUrl.replace(/\/api\/?$/, '');
};

export const getMediaUrl = (assetPath) => {
  if (!assetPath) {
    return '';
  }

  if (ABSOLUTE_URL.test(assetPath)) {
    return assetPath;
  }

  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  const origin = getApiOrigin();

  return origin ? `${origin}${normalizedPath}` : normalizedPath;
};

export const getAssetPath = (asset) => {
  if (!asset) {
    return '';
  }

  if (asset.mediaId) {
    return `/api/media/${asset.mediaId}`;
  }

  return asset.path || '';
};

export const getListingImages = (listing) => (Array.isArray(listing?.images) ? listing.images : []);

export const getListingCoverImage = (listing) => listing?.coverImage || getListingImages(listing)[0] || null;

export const getListingCoverImageUrl = (listing) => getMediaUrl(getAssetPath(getListingCoverImage(listing)));

export const getListingImageAlt = (listing, image) => {
  if (image?.altText) {
    return image.altText;
  }

  if (image?.caption) {
    return image.caption;
  }

  if (listing?.title) {
    return `${listing.title} listing image`;
  }

  return 'Listing image';
};