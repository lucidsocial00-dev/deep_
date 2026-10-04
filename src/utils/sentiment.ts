/**
 * Real-Time Emotional Sentiment & Vibe Analysis Engine
 * Analyzes post text, poetry structure, hashtags, and mood metadata
 * to assign an emotional 'Vibe Score' badge with confidence percentage.
 */

export type VibeCategory =
  | 'Ethereal'
  | 'Melancholic'
  | 'Energetic'
  | 'Contemplative'
  | 'Euphoric'
  | 'Nostalgic'
  | 'Cosmic'
  | 'Serene';

export interface VibeTheme {
  category: VibeCategory;
  label: string;
  emoji: string;
  keywords: string[];
  bgClass: string;
  borderClass: string;
  textClass: string;
  glowClass: string;
  pulseGlowClass: string;
  gradientText: string;
  description: string;
}

export interface VibeAnalysisResult {
  category: VibeCategory;
  label: string;
  emoji: string;
  score: number; // 0 to 100 sentiment score / intensity
  confidencePercent: number; // 65% - 98%
  bgClass: string;
  borderClass: string;
  textClass: string;
  glowClass: string;
  pulseGlowClass: string;
  gradientText: string;
  description: string;
  secondaryVibe?: {
    category: VibeCategory;
    label: string;
    emoji: string;
    score: number;
  };
  breakdown: Record<VibeCategory, number>;
}

export const VIBE_THEMES: Record<VibeCategory, VibeTheme> = {
  Ethereal: {
    category: 'Ethereal',
    label: 'Ethereal',
    emoji: '🌌',
    keywords: [
      'dream', 'dreamscape', 'floating', 'mist', 'fog', 'ghost', 'phantom', 'spirit',
      'echo', 'starlight', 'silver', 'whisper', 'infinite', 'void', 'celestial', 'cloud',
      'atmospheric', 'aura', 'haze', 'realm', 'crystalline', 'soft', 'illusion', 'haunting',
      'ethereal', 'astral', 'shadow', 'veil', 'subtle', 'chime'
    ],
    bgClass: 'bg-fuchsia-950/80 hover:bg-fuchsia-900/90',
    borderClass: 'border-fuchsia-500/40 hover:border-fuchsia-400',
    textClass: 'text-fuchsia-300',
    glowClass: 'shadow-[0_0_12px_rgba(217,70,239,0.35)]',
    pulseGlowClass: 'animate-vibe-pulse-fuchsia',
    gradientText: 'from-fuchsia-300 via-pink-200 to-purple-300',
    description: 'Dreamy, atmospheric, and spiritually transcendent resonance.',
  },
  Melancholic: {
    category: 'Melancholic',
    label: 'Melancholic',
    emoji: '🌧️',
    keywords: [
      'rain', 'gloom', 'shadow', 'lonely', 'tears', 'quiet', 'sorrow', 'nostalgia',
      'ache', 'loss', 'blue', 'empty', 'autumn', 'dark', 'longing', 'heavy', 'winter',
      'broken', 'silent', 'memory', 'sadness', 'cold', 'teardrop', 'damp', 'melancholic',
      'tear', 'grief', 'farewell', 'fading', 'distance'
    ],
    bgClass: 'bg-sky-950/80 hover:bg-sky-900/90',
    borderClass: 'border-sky-500/40 hover:border-sky-400',
    textClass: 'text-sky-300',
    glowClass: 'shadow-[0_0_12px_rgba(56,189,248,0.35)]',
    pulseGlowClass: 'animate-vibe-pulse-sky',
    gradientText: 'from-sky-300 via-blue-200 to-indigo-300',
    description: 'Deep, reflective sadness, bittersweet longing, and rainy quietude.',
  },
  Energetic: {
    category: 'Energetic',
    label: 'Energetic',
    emoji: '⚡',
    keywords: [
      'spark', 'fire', 'pulse', 'wild', 'rhythm', 'electric', 'flame', 'rush', 'neon',
      'fast', 'hyper', 'storm', 'power', 'surge', 'heat', 'roar', 'loud', 'beat',
      'strike', 'blaze', 'speed', 'dynamic', 'energy', 'bass', 'charge', 'fever',
      'thunder', 'energetic', 'drive', 'kick', 'ignite'
    ],
    bgClass: 'bg-amber-950/80 hover:bg-amber-900/90',
    borderClass: 'border-amber-500/40 hover:border-amber-400',
    textClass: 'text-amber-300',
    glowClass: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]',
    pulseGlowClass: 'animate-vibe-pulse-amber',
    gradientText: 'from-amber-300 via-yellow-200 to-orange-300',
    description: 'High-voltage excitement, pulsing basslines, and fiery motivation.',
  },
  Contemplative: {
    category: 'Contemplative',
    label: 'Contemplative',
    emoji: '🕯️',
    keywords: [
      'thought', 'ponder', 'mind', 'deep', 'reason', 'truth', 'silence', 'philosophy',
      'stillness', 'question', 'page', 'read', 'cipher', 'book', 'soul', 'wisdom',
      'slow', 'focus', 'reflect', 'verse', 'stanza', 'logic', 'meditation', 'pondering',
      'contemplative', 'unfiltered', 'meaning', 'inquiry', 'essay'
    ],
    bgClass: 'bg-purple-950/80 hover:bg-purple-900/90',
    borderClass: 'border-purple-500/40 hover:border-purple-400',
    textClass: 'text-purple-300',
    glowClass: 'shadow-[0_0_12px_rgba(168,85,247,0.35)]',
    pulseGlowClass: 'animate-vibe-pulse-purple',
    gradientText: 'from-purple-300 via-fuchsia-200 to-violet-300',
    description: 'Philosophical introspection, quiet focus, and poetic intellectual depth.',
  },
  Euphoric: {
    category: 'Euphoric',
    label: 'Euphoric',
    emoji: '✨',
    keywords: [
      'joy', 'bliss', 'light', 'sun', 'golden', 'laugh', 'love', 'shine', 'fly',
      'radiant', 'bloom', 'glory', 'delight', 'dance', 'warm', 'ecstatic', 'magic',
      'paradise', 'smile', 'celebration', 'heart', 'euphoric', 'inspired', 'pure',
      'blessed', 'glow', 'wonder', 'sweet', 'heaven'
    ],
    bgClass: 'bg-pink-950/80 hover:bg-pink-900/90',
    borderClass: 'border-pink-500/40 hover:border-pink-400',
    textClass: 'text-pink-300',
    glowClass: 'shadow-[0_0_12px_rgba(244,114,182,0.35)]',
    pulseGlowClass: 'animate-vibe-pulse-pink',
    gradientText: 'from-pink-300 via-rose-200 to-fuchsia-300',
    description: 'Radiant warmth, joyful euphoria, and uplifting creative optimism.',
  },
  Nostalgic: {
    category: 'Nostalgic',
    label: 'Nostalgic',
    emoji: '📜',
    keywords: [
      'remember', 'old', 'tape', 'vinyl', 'cassette', 'past', 'childhood', 'polaroid',
      'retro', 'vintage', 'years', 'yesterday', 'forgotten', 'archive', 'analog',
      'memory', 'ancient', 'classic', 'nostalgic', 'golden', 'recollection', 'time',
      'aged', 'heritage', 'footsteps'
    ],
    bgClass: 'bg-orange-950/80 hover:bg-orange-900/90',
    borderClass: 'border-orange-500/40 hover:border-orange-400',
    textClass: 'text-orange-300',
    glowClass: 'shadow-[0_0_12px_rgba(249,115,22,0.35)]',
    pulseGlowClass: 'animate-vibe-pulse-orange',
    gradientText: 'from-orange-300 via-amber-200 to-yellow-300',
    description: 'Warm analog memories, retro aesthetics, and cherished reflections.',
  },
  Cosmic: {
    category: 'Cosmic',
    label: 'Cosmic',
    emoji: '💫',
    keywords: [
      'galaxy', 'nebula', 'orbit', 'space', 'starlight', 'gravity', 'comet', 'universe',
      'pulsar', 'zero-gravity', 'cosmos', 'supernova', 'eclipse', 'planet', 'void',
      'astro', 'orbital', 'cosmic', 'constellation', 'horizon', 'event-horizon', 'interstellar'
    ],
    bgClass: 'bg-cyan-950/80 hover:bg-cyan-900/90',
    borderClass: 'border-cyan-500/40 hover:border-cyan-400',
    textClass: 'text-cyan-300',
    glowClass: 'shadow-[0_0_12px_rgba(6,182,212,0.35)]',
    pulseGlowClass: 'animate-vibe-pulse-cyan',
    gradientText: 'from-cyan-300 via-teal-200 to-sky-300',
    description: 'Interstellar wonder, cosmic scale, and expansive galactic curiosity.',
  },
  Serene: {
    category: 'Serene',
    label: 'Serene',
    emoji: '🌅',
    keywords: [
      'calm', 'peace', 'river', 'ocean', 'gentle', 'breeze', 'garden', 'water',
      'soft', 'resting', 'sanctuary', 'wave', 'tranquil', 'horizon', 'dawn', 'lotus',
      'stillness', 'quiet', 'serene', 'smooth', 'solitude', 'breathe', 'oasis', 'tide'
    ],
    bgClass: 'bg-emerald-950/80 hover:bg-emerald-900/90',
    borderClass: 'border-emerald-500/40 hover:border-emerald-400',
    textClass: 'text-emerald-300',
    glowClass: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]',
    pulseGlowClass: 'animate-vibe-pulse-emerald',
    gradientText: 'from-emerald-300 via-teal-200 to-green-300',
    description: 'Peaceful harmony, gentle natural stillness, and tranquil clarity.',
  },
};

/**
 * Analyzes post text, hashtags, and mood metadata in real-time using keyword frequency
 * and contextual weightings.
 */
export function analyzePostVibe(
  content: string,
  hashtags?: string[],
  mood?: { label?: string; emoji?: string }
): VibeAnalysisResult {
  const normalizedText = (content || '').toLowerCase();
  const hashtagText = (hashtags || []).join(' ').toLowerCase();
  const moodLabel = (mood?.label || '').toLowerCase();

  const scores: Record<VibeCategory, number> = {
    Ethereal: 0,
    Melancholic: 0,
    Energetic: 0,
    Contemplative: 0,
    Euphoric: 0,
    Nostalgic: 0,
    Cosmic: 0,
    Serene: 0,
  };

  // Keyword matching
  (Object.keys(VIBE_THEMES) as VibeCategory[]).forEach((cat) => {
    const theme = VIBE_THEMES[cat];
    let matchCount = 0;

    theme.keywords.forEach((kw) => {
      if (normalizedText.includes(kw)) {
        matchCount += 2;
      }
      if (hashtagText.includes(kw)) {
        matchCount += 3;
      }
      if (moodLabel.includes(kw)) {
        matchCount += 4;
      }
    });

    // Mood direct associations
    if (moodLabel.includes('inspired') || moodLabel.includes('spark')) {
      if (cat === 'Euphoric' || cat === 'Energetic') matchCount += 3;
    }
    if (moodLabel.includes('nocturnal') || moodLabel.includes('night')) {
      if (cat === 'Ethereal' || cat === 'Contemplative') matchCount += 3;
    }
    if (moodLabel.includes('unfiltered') || moodLabel.includes('provocative')) {
      if (cat === 'Energetic' || cat === 'Contemplative') matchCount += 3;
    }
    if (moodLabel.includes('calm') || moodLabel.includes('peace')) {
      if (cat === 'Serene' || cat === 'Melancholic') matchCount += 3;
    }

    scores[cat] = matchCount;
  });

  // Structural heuristics (e.g. poetry line breaks, length, punctuation)
  if (normalizedText.includes('\n')) {
    scores.Contemplative += 2;
    scores.Ethereal += 2;
  }
  if (normalizedText.includes('!') || normalizedText.includes('🔥') || normalizedText.includes('⚡')) {
    scores.Energetic += 3;
    scores.Euphoric += 2;
  }
  if (normalizedText.includes('...') || normalizedText.includes('🌧️') || normalizedText.includes('🕯️')) {
    scores.Melancholic += 3;
    scores.Contemplative += 2;
  }

  // Find top score and runner up
  const sortedCategories = (Object.keys(scores) as VibeCategory[]).sort(
    (a, b) => scores[b] - scores[a]
  );

  let topCategory = sortedCategories[0];
  let topScore = scores[topCategory];

  // If top score is 0, deterministically assign a default based on content hash so it feels consistent
  if (topScore === 0) {
    const charCodeSum = normalizedText.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const fallbackCategories: VibeCategory[] = [
      'Contemplative',
      'Ethereal',
      'Euphoric',
      'Melancholic',
      'Serene',
      'Energetic',
      'Nostalgic',
      'Cosmic',
    ];
    topCategory = fallbackCategories[charCodeSum % fallbackCategories.length];
    topScore = 3;
  }

  const secondCategory = sortedCategories[1];
  const secondScore = scores[secondCategory];

  // Map to 68 - 98 % score
  const confidencePercent = Math.min(98, Math.max(68, 68 + topScore * 4));

  const topTheme = VIBE_THEMES[topCategory];

  return {
    category: topCategory,
    label: topTheme.label,
    emoji: topTheme.emoji,
    score: confidencePercent,
    confidencePercent,
    bgClass: topTheme.bgClass,
    borderClass: topTheme.borderClass,
    textClass: topTheme.textClass,
    glowClass: topTheme.glowClass,
    pulseGlowClass: topTheme.pulseGlowClass,
    gradientText: topTheme.gradientText,
    description: topTheme.description,
    secondaryVibe:
      secondScore > 0
        ? {
            category: secondCategory,
            label: VIBE_THEMES[secondCategory].label,
            emoji: VIBE_THEMES[secondCategory].emoji,
            score: Math.min(92, Math.max(55, 55 + secondScore * 4)),
          }
        : undefined,
    breakdown: scores,
  };
}
