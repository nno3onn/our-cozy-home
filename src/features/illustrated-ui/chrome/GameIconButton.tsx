import type { ReactNode } from 'react';

import { AppButton } from '@/components/ui/AppButton';

export function GameIconButton({ accessibilityLabel, icon, onPress }: { accessibilityLabel: string; icon: ReactNode; onPress: () => void }) {
  return <AppButton accessibilityLabel={accessibilityLabel} icon={icon} onPress={onPress} tone="quiet" />;
}
