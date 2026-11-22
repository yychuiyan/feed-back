const MB = 1024 * 1024;

export const IMAGE_OPTIMIZATION_THRESHOLD = 1 * MB;
export const IMAGE_MAX_EDGE = 2000;
export const IMAGE_OUTPUT_QUALITY = 0.82;

const compressibleTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp'
]);
const extensionTypes = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif'
};

function imageType(file) {
  const declared = String(file?.type ?? '').toLowerCase();
  if (declared) return declared;
  const extension = String(file?.name ?? '').split('.').pop()?.toLowerCase();
  return extensionTypes[extension] ?? '';
}

export function shouldOptimizeImage(file) {
  return Boolean(
    file
    && Number.isFinite(file.size)
    && file.size > IMAGE_OPTIMIZATION_THRESHOLD
    && compressibleTypes.has(imageType(file))
  );
}

export function optimizedDimensions(width, height, maxEdge = IMAGE_MAX_EDGE) {
  const longest = Math.max(width, height);
  if (!longest || longest <= maxEdge) {
    return { width, height, resized: false };
  }
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    resized: true
  };
}

export function optimizedFileName(name, mimeType) {
  const stem = String(name || '图片').replace(/\.[^.]+$/, '') || '图片';
  const extension = mimeType === 'image/png'
    ? 'png'
    : mimeType === 'image/jpeg' ? 'jpg' : 'webp';
  return `${stem}.${extension}`;
}

export function formatFileSize(bytes) {
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

async function decodeImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {}
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('图片无法读取'));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasBlob(canvas, mimeType, quality) {
  return new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));
}

async function encodeCanvas(canvas, sourceType) {
  let blob = await canvasBlob(canvas, 'image/webp', IMAGE_OUTPUT_QUALITY);
  if (blob?.type === 'image/webp') return blob;
  if (sourceType === 'image/png') {
    blob = await canvasBlob(canvas, 'image/png');
    if (blob?.type === 'image/png') return blob;
  }
  return canvasBlob(canvas, 'image/jpeg', IMAGE_OUTPUT_QUALITY);
}

export async function optimizeImageFile(file) {
  const originalSize = file.size;
  if (!shouldOptimizeImage(file)) {
    return { file, originalSize, optimized: false, failed: false };
  }

  let image;
  try {
    image = await decodeImage(file);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const dimensions = optimizedDimensions(sourceWidth, sourceHeight);
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('图片无法处理');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, dimensions.width, dimensions.height);

    const blob = await encodeCanvas(canvas, imageType(file));
    if (!blob || blob.size >= file.size) {
      return { file, originalSize, optimized: false, failed: false };
    }
    const optimizedFile = new File(
      [blob],
      optimizedFileName(file.name, blob.type),
      { type: blob.type, lastModified: file.lastModified }
    );
    return {
      file: optimizedFile,
      originalSize,
      optimized: true,
      failed: false
    };
  } catch {
    return { file, originalSize, optimized: false, failed: true };
  } finally {
    image?.close?.();
  }
}
