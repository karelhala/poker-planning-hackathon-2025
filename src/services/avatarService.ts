import { createAvatar } from '@dicebear/core';
import * as pixelArt from '@dicebear/pixel-art';

export interface AvatarConfig {
  hair?: string[];
  hairColor?: string[];
  hairProbability?: number;
  eyes?: string[];
  mouth?: string[];
  beard?: string[];
  beardColor?: string[];
  beardProbability?: number;
  hat?: string[];
  hatColor?: string[];
  hatProbability?: number;
  glasses?: string[];
  glassesProbability?: number;
  accessories?: string[];
  accessoriesProbability?: number;
  clothing?: string[];
  clothingColor?: string[];
  skinColor?: string[];
}

const STORAGE_KEY = 'avatarConfig';
const UNLOCKS_KEY = 'avatarUnlocks';

const DEFAULT_CONFIG: AvatarConfig = {};

const FREE_ITEMS = new Set([
  'hair:short01', 'hair:short03', 'hair:long01',
  'eyes:variant01', 'eyes:variant06',
  'mouth:happy01', 'mouth:happy03',
  'clothing:variant01', 'clothing:variant03',
]);

export function loadUnlockedItems(): Set<string> {
  try {
    const stored = localStorage.getItem(UNLOCKS_KEY);
    if (stored) return new Set([...FREE_ITEMS, ...JSON.parse(stored)]);
  } catch {
    // ignore
  }
  return new Set(FREE_ITEMS);
}

export function saveUnlockedItems(items: Set<string>): void {
  const paid = [...items].filter(i => !FREE_ITEMS.has(i));
  localStorage.setItem(UNLOCKS_KEY, JSON.stringify(paid));
}

export function isItemFree(itemKey: string): boolean {
  return FREE_ITEMS.has(itemKey);
}

export function isItemUnlocked(itemKey: string, unlocked: Set<string>): boolean {
  return FREE_ITEMS.has(itemKey) || unlocked.has(itemKey);
}

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
    if (config.hairProbability !== undefined) opts.hairProbability = config.hairProbability;
    if (config.eyes?.length) opts.eyes = config.eyes;
    if (config.mouth?.length) opts.mouth = config.mouth;
    if (config.beard?.length) opts.beard = config.beard;
    if (config.beardColor?.length) opts.beardColor = config.beardColor;
    if (config.beardProbability !== undefined) opts.beardProbability = config.beardProbability;
    if (config.hat?.length) opts.hat = config.hat;
    if (config.hatColor?.length) opts.hatColor = config.hatColor;
    if (config.hatProbability !== undefined) opts.hatProbability = config.hatProbability;
    if (config.glasses?.length) opts.glasses = config.glasses;
    if (config.glassesProbability !== undefined) opts.glassesProbability = config.glassesProbability;
    if (config.accessories?.length) opts.accessories = config.accessories;
    if (config.accessoriesProbability !== undefined) opts.accessoriesProbability = config.accessoriesProbability;
    if (config.clothing?.length) opts.clothing = config.clothing;
    if (config.clothingColor?.length) opts.clothingColor = config.clothingColor;
    if (config.skinColor?.length) opts.skinColor = config.skinColor;
  }

  const avatar = createAvatar(pixelArt, opts);
  return avatar.toDataUri();
}
