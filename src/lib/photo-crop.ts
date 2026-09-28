export const PHOTO_CROP_ASPECT = 4 / 5;
export const PHOTO_CROP_MIN_ZOOM = 0.75;
export const PHOTO_CROP_MAX_ZOOM = 2.4;
export const PHOTO_FRAME_BORDER_RADIUS = "42% 42% 26% 26%";

export type PhotoCrop = {
  x: number;
  y: number;
  zoom: number;
};

export type PhotoSize = {
  width: number;
  height: number;
};

export const DEFAULT_PHOTO_CROP: PhotoCrop = {
  x: 0.5,
  y: 0.5,
  zoom: 1.08,
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

function getBaseCropSize(image: PhotoSize) {
  if (image.width / image.height > PHOTO_CROP_ASPECT) {
    return { width: image.height * PHOTO_CROP_ASPECT, height: image.height };
  }

  return { width: image.width, height: image.width / PHOTO_CROP_ASPECT };
}

export function normalizePhotoCrop(crop: PhotoCrop, image: PhotoSize): PhotoCrop {
  const zoom = clamp(crop.zoom, PHOTO_CROP_MIN_ZOOM, PHOTO_CROP_MAX_ZOOM);

  if (image.width <= 0 || image.height <= 0) {
    return { x: 0.5, y: 0.5, zoom };
  }

  const baseCrop = getBaseCropSize(image);
  const halfWidth = baseCrop.width / zoom / image.width / 2;
  const halfHeight = baseCrop.height / zoom / image.height / 2;

  const getBounds = (halfSize: number) =>
    halfSize <= 0.5
      ? { minimum: halfSize, maximum: 1 - halfSize }
      : { minimum: Math.max(0, 1 - halfSize), maximum: Math.min(1, halfSize) };
  const horizontal = getBounds(halfWidth);
  const vertical = getBounds(halfHeight);

  return {
    x: clamp(crop.x, horizontal.minimum, horizontal.maximum),
    y: clamp(crop.y, vertical.minimum, vertical.maximum),
    zoom,
  };
}

export function getPhotoPlacement(
  frame: PhotoSize,
  image: PhotoSize,
  crop: PhotoCrop,
) {
  if (frame.width <= 0 || frame.height <= 0 || image.width <= 0 || image.height <= 0) {
    return null;
  }

  const normalized = normalizePhotoCrop(crop, image);
  const coverScale = Math.max(frame.width / image.width, frame.height / image.height);
  const width = image.width * coverScale * normalized.zoom;
  const height = image.height * coverScale * normalized.zoom;

  return {
    width,
    height,
    left: frame.width / 2 + (0.5 - normalized.x) * width,
    top: frame.height / 2 + (0.5 - normalized.y) * height,
  };
}

export function movePhotoCrop(
  crop: PhotoCrop,
  deltaX: number,
  deltaY: number,
  frame: PhotoSize,
  image: PhotoSize,
) {
  const placement = getPhotoPlacement(frame, image, crop);
  if (!placement) return crop;

  return normalizePhotoCrop(
    {
      ...crop,
      x: crop.x - deltaX / placement.width,
      y: crop.y - deltaY / placement.height,
    },
    image,
  );
}

export function getPhotoCropRegion(image: PhotoSize, crop: PhotoCrop) {
  const normalized = normalizePhotoCrop(crop, image);
  const baseCrop = getBaseCropSize(image);
  const width = Math.max(1, Math.min(image.width, Math.round(baseCrop.width / normalized.zoom)));
  const height = Math.max(1, Math.min(image.height, Math.round(baseCrop.height / normalized.zoom)));
  const left = clamp(Math.round(normalized.x * image.width - width / 2), 0, image.width - width);
  const top = clamp(Math.round(normalized.y * image.height - height / 2), 0, image.height - height);

  return { left, top, width, height };
}

export function getPhotoRenderPlan(
  image: PhotoSize,
  crop: PhotoCrop,
  output: PhotoSize,
) {
  const normalized = normalizePhotoCrop(crop, image);
  const baseCrop = getBaseCropSize(image);
  const viewWidth = baseCrop.width / normalized.zoom;
  const viewHeight = baseCrop.height / normalized.zoom;
  const viewLeft = normalized.x * image.width - viewWidth / 2;
  const viewTop = normalized.y * image.height - viewHeight / 2;
  const viewRight = viewLeft + viewWidth;
  const viewBottom = viewTop + viewHeight;

  const sourceLeft = clamp(Math.floor(Math.max(0, viewLeft)), 0, image.width - 1);
  const sourceTop = clamp(Math.floor(Math.max(0, viewTop)), 0, image.height - 1);
  const sourceRight = clamp(Math.ceil(Math.min(image.width, viewRight)), sourceLeft + 1, image.width);
  const sourceBottom = clamp(Math.ceil(Math.min(image.height, viewBottom)), sourceTop + 1, image.height);
  const scaleX = output.width / viewWidth;
  const scaleY = output.height / viewHeight;
  const destinationLeft = clamp(Math.round((sourceLeft - viewLeft) * scaleX), 0, output.width - 1);
  const destinationTop = clamp(Math.round((sourceTop - viewTop) * scaleY), 0, output.height - 1);
  const destinationRight = clamp(
    Math.round((sourceRight - viewLeft) * scaleX),
    destinationLeft + 1,
    output.width,
  );
  const destinationBottom = clamp(
    Math.round((sourceBottom - viewTop) * scaleY),
    destinationTop + 1,
    output.height,
  );

  return {
    source: {
      left: sourceLeft,
      top: sourceTop,
      width: sourceRight - sourceLeft,
      height: sourceBottom - sourceTop,
    },
    destination: {
      left: destinationLeft,
      top: destinationTop,
      width: destinationRight - destinationLeft,
      height: destinationBottom - destinationTop,
    },
  };
}
