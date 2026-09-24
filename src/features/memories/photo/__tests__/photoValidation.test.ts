import { MAX_EDGE, validateMemoryPhoto, targetPhotoSize } from '../photoValidation';

describe('memory photo validation', () => {
  it('rejects an oversized source before upload', () => {
    expect(validateMemoryPhoto({ uri: 'file://photo.jpg', mimeType: 'image/jpeg', fileSize: 10 * 1024 * 1024 + 1, width: 3000, height: 2000 })).toMatch(/10MB/);
  });
  it('scales the long edge down without stretching', () => {
    expect(targetPhotoSize({ uri: 'file://photo.jpg', mimeType: 'image/jpeg', fileSize: 1, width: 4096, height: 2048 })).toEqual({ width: MAX_EDGE, height: 1024 });
  });
});
