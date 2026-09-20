import { AssetGalleryScreen } from '@/features/dev/AssetGalleryScreen';
import { readRuntimeConfig } from '@/config/env';

export default function AssetGalleryRoute() {
  const config = readRuntimeConfig();
  return <AssetGalleryScreen enabled={config.ok && config.mode === 'demo'} />;
}
