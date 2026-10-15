import type { Viewport } from './roomLayout';

// Optical rod/hem bounds within each transparent PNG (not its padded canvas).
export const curtainArtBounds: Record<string, { left: number; right: number; top: number; bottom: number }> = {
  'curtain-ribbon-pair': { left: .12, right: .88, top: .085, bottom: .91 },
  'curtain-cloud-valance': { left: .06, right: .94, top: .03, bottom: .95 },
  'curtain-leaf-panels': { left: .07, right: .93, top: .08, bottom: .93 },
  'curtain-star-drape': { left: .07, right: .93, top: .12, bottom: .88 },
  'curtain-cafe-check': { left: .03, right: .97, top: .27, bottom: .77 },
};

export function getCurtainWindowRect(viewport: Viewport, itemId: string) {
  const bounds = curtainArtBounds[itemId] ?? curtainArtBounds['curtain-ribbon-pair'];
  // Window/rod anchors in the original 1536 × 1024 background. Match cover,
  // including its centered crop, instead of the floor's contain transform.
  const scale = Math.max(viewport.width / 1536, viewport.height / 1024);
  const width = 848 / (bounds.right - bounds.left);
  const height = ((itemId === 'curtain-cafe-check' ? 390 : 515) - 6) / (bounds.bottom - bounds.top);
  return {
    position: 'absolute' as const,
    left: (viewport.width - 1536 * scale) / 2 + (344 - bounds.left * width) * scale,
    top: (viewport.height - 1024 * scale) / 2 + (6 - bounds.top * height) * scale,
    width: width * scale,
    height: height * scale,
  };
}
