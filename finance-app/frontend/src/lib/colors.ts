/**
 * Deterministic category color mapping and styling utilities.
 * Ensures consistent colors across all tables, charts, cards, and renders.
 */

// Curated palette tailored for the Onyx & Amber design system
export const CATEGORY_PALETTE: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  // Expenses
  housing: {
    color: '#D97706', // Warm Amber
    bg: 'rgba(217, 119, 6, 0.12)',
    border: 'rgba(217, 119, 6, 0.3)',
    icon: 'home',
  },
  'food & dining': {
    color: '#F59E0B', // Amber Gold
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: 'utensils',
  },
  food: {
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: 'utensils',
  },
  groceries: {
    color: '#10B981', // Emerald
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)',
    icon: 'shopping-cart',
  },
  transportation: {
    color: '#3B82F6', // Sapphire Blue
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.3)',
    icon: 'car',
  },
  utilities: {
    color: '#6366F1', // Indigo
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.3)',
    icon: 'zap',
  },
  entertainment: {
    color: '#EC4899', // Pink Coral
    bg: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.3)',
    icon: 'film',
  },
  healthcare: {
    color: '#EF4444', // Ruby
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: 'activity',
  },
  shopping: {
    color: '#8B5CF6', // Purple Amethyst
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.3)',
    icon: 'bag',
  },
  'personal care': {
    color: '#14B8A6', // Teal
    bg: 'rgba(20, 184, 166, 0.12)',
    border: 'rgba(20, 184, 166, 0.3)',
    icon: 'smile',
  },
  travel: {
    color: '#06B6D4', // Cyan
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.3)',
    icon: 'plane',
  },
  education: {
    color: '#84CC16', // Lime
    bg: 'rgba(132, 204, 22, 0.12)',
    border: 'rgba(132, 204, 22, 0.3)',
    icon: 'book-open',
  },
  subscriptions: {
    color: '#A855F7', // Violet
    bg: 'rgba(168, 85, 247, 0.12)',
    border: 'rgba(168, 85, 247, 0.3)',
    icon: 'cloud',
  },
  'other expense': {
    color: '#78716C', // Warm Stone
    bg: 'rgba(120, 113, 108, 0.12)',
    border: 'rgba(120, 113, 108, 0.3)',
    icon: 'tag',
  },

  // Income
  salary: {
    color: '#10B981', // Emerald
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)',
    icon: 'briefcase',
  },
  freelance: {
    color: '#34D399', // Mint
    bg: 'rgba(52, 211, 153, 0.12)',
    border: 'rgba(52, 211, 153, 0.3)',
    icon: 'laptop',
  },
  investments: {
    color: '#059669', // Dark Emerald
    bg: 'rgba(5, 150, 105, 0.12)',
    border: 'rgba(5, 150, 105, 0.3)',
    icon: 'trending-up',
  },
  gifts: {
    color: '#F59E0B', // Amber
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: 'gift',
  },
  'other income': {
    color: '#6EE7B7', // Light Sage
    bg: 'rgba(110, 231, 183, 0.12)',
    border: 'rgba(110, 231, 183, 0.3)',
    icon: 'dollar-sign',
  },
}

// Deterministic fallback generator for custom categories
const FALLBACK_HUES = [38, 142, 217, 260, 320, 180, 25, 280, 200]

export function getCategoryMeta(categoryName: string) {
  const key = categoryName.trim().toLowerCase()
  if (CATEGORY_PALETTE[key]) {
    return CATEGORY_PALETTE[key]
  }

  // Consistent string hash
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i)
    hash |= 0
  }
  const hue = FALLBACK_HUES[Math.abs(hash) % FALLBACK_HUES.length]

  return {
    color: `hsl(${hue}, 75%, 45%)`,
    bg: `hsla(${hue}, 75%, 45%, 0.12)`,
    border: `hsla(${hue}, 75%, 45%, 0.3)`,
    icon: 'tag',
  }
}
