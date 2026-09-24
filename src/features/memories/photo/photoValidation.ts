export const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
export const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;
export const MAX_EDGE = 2048;
const accepted = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/heif']);

export type SelectedMemoryPhoto = { uri: string; mimeType: string | null; fileSize: number | null; width: number; height: number };

export function validateMemoryPhoto(photo: SelectedMemoryPhoto): string | null {
  if (!photo.mimeType || !accepted.has(photo.mimeType)) return 'JPEG, PNG, HEIC 또는 HEIF 사진만 올릴 수 있어요.';
  if (photo.fileSize !== null && photo.fileSize > MAX_SOURCE_BYTES) return '원본 사진은 10MB 이하여야 해요.';
  return null;
}

export function targetPhotoSize(photo: SelectedMemoryPhoto) {
  const edge = Math.max(photo.width, photo.height);
  if (edge <= MAX_EDGE) return { width: photo.width, height: photo.height };
  const ratio = MAX_EDGE / edge;
  return { width: Math.round(photo.width * ratio), height: Math.round(photo.height * ratio) };
}
