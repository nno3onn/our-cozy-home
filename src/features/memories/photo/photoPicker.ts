import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { MAX_OUTPUT_BYTES, targetPhotoSize, validateMemoryPhoto, type SelectedMemoryPhoto } from './photoValidation';

export type PreparedMemoryPhoto = { uri: string; mimeType: 'image/jpeg'; byteSize: number | null };

export async function selectAndPrepareMemoryPhoto(): Promise<PreparedMemoryPhoto | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('photo_permission_required');
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1 });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const source: SelectedMemoryPhoto = { uri: asset.uri, mimeType: asset.mimeType ?? null, fileSize: asset.fileSize ?? null, width: asset.width, height: asset.height };
  const invalid = validateMemoryPhoto(source);
  if (invalid) throw new Error(invalid);
  const size = targetPhotoSize(source);
  const output = await ImageManipulator.manipulateAsync(source.uri, [{ resize: size }], { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG });
  if (output.uri.startsWith('data:')) throw new Error('memory_photo_data_uri_unsupported');
  return { uri: output.uri, mimeType: 'image/jpeg', byteSize: null };
}

export function validateCompressedPhoto(byteSize: number | null): string | null {
  return byteSize !== null && byteSize > MAX_OUTPUT_BYTES ? '압축한 사진은 5MB 이하여야 해요.' : null;
}
