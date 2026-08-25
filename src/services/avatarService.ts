import { createAvatar } from '@dicebear/core';
import * as pixelArt from '@dicebear/pixel-art';

export interface AvatarConfig {
  hair?: string[];
  hairColor?: string[];
  eyes?: string[];
  mouth?: string[];
  beard?: string[];
  beardColor?: string[];
  hat?: string[];
  hatColor?: string[];
  glasses?: string[];
  accessories?: string[];
  clothing?: string[];
  clothingColor?: string[];
  skinColor?: string[];
}

const STORAGE_KEY = 'avatarConfig';

const DEFAULT_CONFIG: AvatarConfig = {};

export function loadAvatarConfig(): AvatarConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return DEFAULT_CONFIG;
}

export function saveAvatarConfig(config: AvatarConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function generateAvatarDataUri(seed: string, config?: AvatarConfig): string {
  const opts: Record<string, unknown> = { seed };

  if (config) {
    if (config.hair?.length) opts.hair = config.hair;
    if (config.hairColor?.length) opts.hairColor = config.hairColor;
    if (config.eyes?.length) opts.eyes = config.eyes;
    if (config.mouth?.length) opts.mouth = config.mouth;
    if (config.beard?.length) opts.beard = config.beard;
    if (config.beardColor?.length) opts.beardColor = config.beardColor;
    if (config.hat?.length) opts.hat = config.hat;
    if (config.hatColor?.length) opts.hatColor = config.hatColor;
    if (config.glasses?.length) opts.glasses = config.glasses;
    if (config.accessories?.length) opts.accessories = config.accessories;
    if (config.clothing?.length) opts.clothing = config.clothing;
    if (config.clothingColor?.length) opts.clothingColor = config.clothingColor;
    if (config.skinColor?.length) opts.skinColor = config.skinColor;
  }

  const avatar = createAvatar(pixelArt, opts);
  return avatar.toDataUri();
}
