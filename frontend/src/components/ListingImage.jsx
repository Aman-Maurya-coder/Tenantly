import { getAssetPath, getListingCoverImage, getListingImageAlt, getMediaUrl } from '../lib/listingMedia.js';

export default function ListingImage({
  listing,
  image,
  alt,
  variant = 'card',
  className = '',
  fallbackLabel = 'No image available',
}) {
  const resolvedImage = image || getListingCoverImage(listing);
  const source = getMediaUrl(getAssetPath(resolvedImage));
  const resolvedAlt = alt || getListingImageAlt(listing, resolvedImage);

  if (source) {
    return (
      <img
        src={source}
        alt={resolvedAlt}
        className={`listing-media listing-media--${variant} ${className}`.trim()}
        loading={variant === 'hero' ? 'eager' : 'lazy'}
      />
    );
  }

  return (
    <div
      className={`listing-media listing-media--${variant} listing-media--fallback ${className}`.trim()}
      aria-label={fallbackLabel}
    >
      <span>{fallbackLabel}</span>
    </div>
  );
}