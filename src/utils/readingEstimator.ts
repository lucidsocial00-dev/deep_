import { Post, ReadingLink, User } from '../types';

/**
 * Extracts URLs from a given string (http:// or https://)
 */
export function extractUrlsFromText(text: string): string[] {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlRegex);
  return matches ? Array.from(new Set(matches)) : [];
}

/**
 * Automatically calculates the estimated reading time, word count, and point bounty for any Post.
 * Takes into account:
 * - Post body content
 * - Attached PDF full text / pages (if present)
 * - Attached Reading Links (up to 3 links, if present)
 */
export function getPostReadingStats(post: Post) {
  let totalWords = 0;

  // 1. Post Content
  if (post.content) {
    totalWords += post.content.trim().split(/\s+/).filter(Boolean).length;
  }

  // 2. Attached PDF Document
  if (post.document) {
    if (post.document.fullText) {
      totalWords += post.document.fullText.trim().split(/\s+/).filter(Boolean).length;
    } else {
      totalWords += (post.document.totalPages || 2) * 220;
    }
  }

  // 3. Attached Reading Links (supports up to 3 links or single link)
  const links = getEffectivePostReadingLinks(post);
  if (links.length > 0) {
    for (const link of links) {
      totalWords += link.wordCount || link.estimatedMinutes * 220;
    }
  }

  // Calculate estimated minutes (average reading speed: 200 words/minute)
  let estimatedMinutes = Math.max(1, Math.ceil(totalWords / 200));
  const maxLinkMinutes = links.reduce((max, l) => Math.max(max, l.estimatedMinutes || 0), 0);
  if (maxLinkMinutes > estimatedMinutes) {
    estimatedMinutes = maxLinkMinutes;
  }

  const breakdown = getPointsBreakdown(estimatedMinutes);

  // Extract primary hashtag group
  const rawTag =
    (post.hashtags && post.hashtags[0]) ||
    (links[0]?.hashtag) ||
    (post.readingLink?.hashtag) ||
    'deep_';
  const primaryTag = rawTag.replace(/^#+/, '').trim() || 'deep_';

  return {
    wordCount: totalWords,
    estimatedMinutes,
    points: breakdown.total,
    breakdown,
    difficulty: breakdown.difficulty,
    primaryTag,
    readTimeFormatted: `${estimatedMinutes} min read`,
  };
}

/**
 * Returns all effective reading links for a post (up to 3),
 * checking post.readingLinks, post.readingLink, and falling back to auto-detected URLs from content.
 */
export function getEffectivePostReadingLinks(post: Post): ReadingLink[] {
  if (post.readingLinks && post.readingLinks.length > 0) {
    return post.readingLinks.slice(0, 3);
  }
  if (post.readingLink) {
    return [post.readingLink];
  }
  const detectedUrls = extractUrlsFromText(post.content || '');
  if (detectedUrls.length > 0) {
    const rawTag = (post.hashtags && post.hashtags[0]) || 'deep_';
    const primaryTag = rawTag.replace(/^#+/, '').trim() || 'deep_';
    return detectedUrls.slice(0, 3).map((url) => estimateReadingFromUrl(url, undefined, primaryTag));
  }
  return [];
}

/**
 * Calculates the point breakdown for a given reading duration.
 * Rule:
 * - Base reading reward: 10 points
 * - Points per minute: 10 points/min (more points the longer the reading is)
 * - In-depth longform bonuses:
 *   - 1-3 mins: 0 bonus
 *   - 4-7 mins: +15 bonus
 *   - 8-14 mins: +35 bonus
 *   - 15+ mins: +75 bonus
 */
export function getPointsBreakdown(estimatedMinutes: number) {
  const base = 10;
  const minutePoints = Math.max(1, estimatedMinutes) * 10;
  let depthBonus = 0;
  let difficulty: ReadingLink['difficulty'] = 'Quick Read';

  if (estimatedMinutes >= 15) {
    depthBonus = 75;
    difficulty = 'Longform Scholarly';
  } else if (estimatedMinutes >= 8) {
    depthBonus = 35;
    difficulty = 'Deep Dive';
  } else if (estimatedMinutes >= 4) {
    depthBonus = 15;
    difficulty = 'Moderate Read';
  } else {
    depthBonus = 0;
    difficulty = 'Quick Read';
  }

  const total = base + minutePoints + depthBonus;

  return {
    base,
    minutePoints,
    depthBonus,
    total,
    difficulty,
  };
}

/**
 * Helper to extract domain from a URL safely
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.split('/')[0] || 'web';
  }
}

/**
 * Heuristic fallback for realistic reading generation if raw text is brief or simulated
 */
export function estimateReadingFromUrl(
  url: string,
  textSnippet?: string,
  targetHashtag: string = 'deep_',
  customTitle?: string
): ReadingLink {
  const cleanUrl = url.trim();
  const domain = extractDomain(cleanUrl);
  const cleanTag = targetHashtag.replace(/^#+/, '').trim() || 'deep_';

  // If text is provided, calculate exact word count (average reading speed: 220 wpm)
  let wordCount = 0;
  let excerpt = textSnippet?.trim() || '';

  if (textSnippet && textSnippet.length > 50) {
    wordCount = textSnippet.split(/\s+/).filter(Boolean).length;
    // If it's just a teaser snippet, estimate full article size based on length
    if (wordCount < 100) {
      wordCount = Math.floor(wordCount * 8 + Math.random() * 300 + 400);
    }
  } else {
    // Generate realistic word count based on URL keywords
    const lowerUrl = cleanUrl.toLowerCase();
    if (lowerUrl.includes('research') || lowerUrl.includes('paper') || lowerUrl.includes('manifesto') || lowerUrl.includes('archive')) {
      wordCount = 3200 + Math.floor(Math.random() * 1800);
    } else if (lowerUrl.includes('essay') || lowerUrl.includes('longform') || lowerUrl.includes('philosophy')) {
      wordCount = 1800 + Math.floor(Math.random() * 1200);
    } else if (lowerUrl.includes('poem') || lowerUrl.includes('verse') || lowerUrl.includes('stanza')) {
      wordCount = 450 + Math.floor(Math.random() * 400);
    } else {
      wordCount = 850 + Math.floor(Math.random() * 950);
    }
  }

  const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 220));
  const { total, difficulty } = getPointsBreakdown(estimatedMinutes);

  // Generate an attractive title if customTitle not provided
  let title = customTitle || '';
  if (!title) {
    const slug = cleanUrl.split('/').filter(Boolean).pop() || '';
    const cleanSlug = slug.replace(/[-_]/g, ' ').replace(/\.html?$/i, '');
    if (cleanSlug && cleanSlug.length > 3 && !cleanSlug.startsWith('?')) {
      title = cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1);
    } else {
      title = `${cleanTag} Perspective: Reading from ${domain}`;
    }
  }

  if (!excerpt) {
    excerpt = `An exploration of ${cleanTag} themes and contemporary perspectives published on ${domain}.`;
  }

  return {
    id: 'read_' + Math.random().toString(36).substring(2, 9),
    url: cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`,
    title,
    domain,
    excerpt,
    wordCount,
    estimatedMinutes,
    readingPoints: total,
    hashtag: cleanTag,
    difficulty,
    readTimeFormatted: `${estimatedMinutes} min read`,
    addedAt: 'Just now',
  };
}

/**
 * Fetches reading time and points estimate from server API, falling back to local heuristic
 */
export async function estimateReadingTimeOfLink(
  url: string,
  targetHashtag: string = 'deep_',
  textSnippet?: string,
  title?: string
): Promise<ReadingLink> {
  try {
    const response = await fetch('/api/reading/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, hashtag: targetHashtag, text: textSnippet, title }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.readingLink) {
        return data.readingLink;
      }
    }
  } catch (err) {
    console.warn('Backend reading estimation fallback to client heuristic:', err);
  }

  return estimateReadingFromUrl(url, textSnippet, targetHashtag, title);
}

export const MAX_STREAM_LEVEL = 100;

// Monotonically increasing points thresholds for hashtag group streams (levels 1 to 100)
// Level 1 starts at 0 pts, Level 2 at 19 pts, scaling up smoothly to Level 100 at ~10,000 pts.
export const STREAM_LEVEL_THRESHOLDS: number[] = Array.from({ length: 101 }, (_, l) => {
  if (l <= 1) return 0;
  return Math.round(18 * (l - 1) + 0.83 * Math.pow(l - 1, 2));
});

export interface GroupReadingRankInfo {
  level: number;
  rankTitle: string;
  badge: string;
  color: string;
  currentLevelBase: number;
  nextThreshold: number;
  points: number;
  pointsInLevel: number;
  pointsNeededInLevel: number;
  progress: number;
  isMaxRank: boolean;
  tierName: string;
}

/**
 * Resolves title, badge, tier name and styling for stream levels 1 to 100
 */
function getStreamRankMetadata(level: number) {
  const rankTitle = `Level ${level}`;
  const tierName = `Level ${level}`;

  if (level === 100) {
    return {
      rankTitle,
      badge: '💎',
      color: 'from-amber-400 via-pink-400 to-cyan-300 text-cyan-200 border-cyan-400/80',
      tierName,
    };
  }
  if (level >= 90) {
    return {
      rankTitle,
      badge: '👑',
      color: 'from-amber-400 to-yellow-300 text-yellow-300 border-amber-500/60',
      tierName,
    };
  }
  if (level >= 80) {
    return {
      rankTitle,
      badge: '☀️',
      color: 'from-amber-500 to-yellow-400 text-amber-300 border-amber-500/50',
      tierName,
    };
  }
  if (level >= 70) {
    return {
      rankTitle,
      badge: '🌌',
      color: 'from-fuchsia-500 to-pink-400 text-fuchsia-300 border-fuchsia-500/50',
      tierName,
    };
  }
  if (level >= 60) {
    return {
      rankTitle,
      badge: '🏆',
      color: 'from-rose-500 to-pink-400 text-rose-300 border-rose-500/50',
      tierName,
    };
  }
  if (level >= 50) {
    return {
      rankTitle,
      badge: '⚔️',
      color: 'from-rose-500 to-red-400 text-rose-300 border-rose-500/50',
      tierName,
    };
  }
  if (level >= 40) {
    return {
      rankTitle,
      badge: '🔮',
      color: 'from-indigo-500 to-purple-400 text-indigo-300 border-indigo-500/50',
      tierName,
    };
  }
  if (level >= 30) {
    return {
      rankTitle,
      badge: '📜',
      color: 'from-purple-500 to-pink-400 text-pink-300 border-pink-500/50',
      tierName,
    };
  }
  if (level >= 20) {
    return {
      rankTitle,
      badge: '🌟',
      color: 'from-cyan-500 to-blue-400 text-cyan-300 border-cyan-500/50',
      tierName,
    };
  }
  if (level >= 10) {
    return {
      rankTitle,
      badge: '⚡',
      color: 'from-emerald-500 to-teal-400 text-emerald-300 border-emerald-500/50',
      tierName,
    };
  }
  if (level >= 2) {
    return {
      rankTitle,
      badge: '⚡',
      color: 'from-sky-500 to-cyan-400 text-sky-300 border-sky-500/50',
      tierName,
    };
  }
  return {
    rankTitle,
    badge: '📖',
    color: 'from-slate-600 to-slate-400 text-slate-300 border-slate-600/50',
    tierName,
  };
}

/**
 * Calculates reader rank / level in a hashtag group (stream) based on earned points.
 * Progression goes up to Level 100 with dynamic rank titles, badges, and progress bars.
 */
export function getGroupReadingRank(points: number = 0): GroupReadingRankInfo {
  const pts = Math.max(0, Math.round(points));

  // Determine level from 100 down to 1
  let level = 1;
  for (let l = MAX_STREAM_LEVEL; l >= 1; l--) {
    if (pts >= STREAM_LEVEL_THRESHOLDS[l]) {
      level = l;
      break;
    }
  }

  const isMaxRank = level >= MAX_STREAM_LEVEL;
  const currentLevelBase = STREAM_LEVEL_THRESHOLDS[level];
  const nextThreshold = isMaxRank ? STREAM_LEVEL_THRESHOLDS[MAX_STREAM_LEVEL] : STREAM_LEVEL_THRESHOLDS[level + 1];
  const pointsInLevel = pts - currentLevelBase;
  const pointsNeededInLevel = Math.max(1, nextThreshold - currentLevelBase);

  const progress = isMaxRank
    ? 100
    : Math.min(100, Math.max(0, Math.round((pointsInLevel / pointsNeededInLevel) * 100)));

  const meta = getStreamRankMetadata(level);

  return {
    level,
    rankTitle: meta.rankTitle,
    badge: meta.badge,
    color: meta.color,
    currentLevelBase,
    nextThreshold,
    points: pts,
    pointsInLevel,
    pointsNeededInLevel,
    progress,
    isMaxRank,
    tierName: meta.tierName,
  };
}

export interface CumulativeReaderRankInfo {
  level: number;
  rankTitle: string;
  badge: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  strokeColor: string;
  currentLevelBase: number;
  nextThreshold: number;
  points: number;
  pointsInLevel: number;
  pointsNeededInLevel: number;
  progress: number; // 0 to 100
  isMaxRank: boolean;
}

/**
 * Calculates the total cumulative reading points across all streams/activities for a user
 */
export function getUserCumulativeReadingPoints(user?: Partial<User> | null): number {
  if (!user) return 0;
  const rawTotal = user.totalReadingPoints || 0;
  const pointsSum = Object.values(user.groupPoints || {}).reduce<number>(
    (sum, val) => sum + (typeof val === 'number' ? val : Number(val) || 0),
    0
  );
  return Math.max(rawTotal, pointsSum);
}

/**
 * Calculates cumulative reader rank progression with granular tiers, thresholds, and percentage progress
 */
export function getCumulativeReaderRank(points: number = 0): CumulativeReaderRankInfo {
  const pts = Math.max(0, Math.round(points));

  let level = 1;
  for (let l = MAX_STREAM_LEVEL; l >= 1; l--) {
    if (pts >= STREAM_LEVEL_THRESHOLDS[l]) {
      level = l;
      break;
    }
  }

  const isMaxRank = level >= MAX_STREAM_LEVEL;
  const currentLevelBase = STREAM_LEVEL_THRESHOLDS[level];
  const nextThreshold = isMaxRank ? STREAM_LEVEL_THRESHOLDS[MAX_STREAM_LEVEL] : STREAM_LEVEL_THRESHOLDS[level + 1];
  const pointsInLevel = pts - currentLevelBase;
  const pointsNeededInLevel = Math.max(1, nextThreshold - currentLevelBase);

  const progress = isMaxRank
    ? 100
    : Math.min(100, Math.max(0, Math.round((pointsInLevel / pointsNeededInLevel) * 100)));

  const meta = getStreamRankMetadata(level);

  let gradientFrom = '#64748b';
  let gradientTo = '#ec4899';
  let strokeColor = '#ec4899';

  if (level === 100) {
    gradientFrom = '#f59e0b';
    gradientTo = '#06b6d4';
    strokeColor = '#06b6d4';
  } else if (level >= 90) {
    gradientFrom = '#f59e0b';
    gradientTo = '#eab308';
    strokeColor = '#eab308';
  } else if (level >= 80) {
    gradientFrom = '#f97316';
    gradientTo = '#eab308';
    strokeColor = '#f97316';
  } else if (level >= 70) {
    gradientFrom = '#d946ef';
    gradientTo = '#ec4899';
    strokeColor = '#ec4899';
  } else if (level >= 60) {
    gradientFrom = '#f43f5e';
    gradientTo = '#ec4899';
    strokeColor = '#f43f5e';
  } else if (level >= 50) {
    gradientFrom = '#ef4444';
    gradientTo = '#f43f5e';
    strokeColor = '#ef4444';
  } else if (level >= 40) {
    gradientFrom = '#6366f1';
    gradientTo = '#a855f7';
    strokeColor = '#8b5cf6';
  } else if (level >= 30) {
    gradientFrom = '#a855f7';
    gradientTo = '#ec4899';
    strokeColor = '#a855f7';
  } else if (level >= 20) {
    gradientFrom = '#06b6d4';
    gradientTo = '#3b82f6';
    strokeColor = '#06b6d4';
  } else if (level >= 10) {
    gradientFrom = '#10b981';
    gradientTo = '#14b8a6';
    strokeColor = '#10b981';
  } else if (level >= 2) {
    gradientFrom = '#0ea5e9';
    gradientTo = '#06b6d4';
    strokeColor = '#0ea5e9';
  }

  return {
    level,
    rankTitle: meta.rankTitle,
    badge: meta.badge,
    color: meta.color,
    gradientFrom,
    gradientTo,
    strokeColor,
    currentLevelBase,
    nextThreshold,
    points: pts,
    pointsInLevel,
    pointsNeededInLevel,
    progress,
    isMaxRank,
  };
}

/**
 * Initial Curated Readings for major Hashtag Groups
 */
export const CURATED_GROUP_READINGS: Record<string, ReadingLink[]> = {
  Poetry: [
    {
      id: 'read_poet_1',
      url: 'https://poetryfoundation.org/articles/modern-stanza-rhythm-and-silence',
      title: 'The Architecture of the Unsaid: Silence and Rhythm in Contemporary Stanzas',
      domain: 'poetryfoundation.org',
      excerpt: 'How modern poets use typographical whitespace, cryptographic caesura, and metric pauses to convey unutterable sentiment.',
      wordCount: 1760,
      estimatedMinutes: 8,
      readingPoints: 125, // 10 + 80 + 35 bonus
      hashtag: 'Poetry',
      difficulty: 'Deep Dive',
      readTimeFormatted: '8 min read',
      author: 'Elena Vance',
      addedAt: '3 hours ago',
    },
    {
      id: 'read_poet_2',
      url: 'https://theparisreview.org/essays/haiku-and-the-geometry-of-attention',
      title: 'Haiku and the Geometry of Human Attention',
      domain: 'theparisreview.org',
      excerpt: 'Exploring 17-syllable contemplation, spatial breathing, and the reduction of cognitive noise in verse.',
      wordCount: 780,
      estimatedMinutes: 4,
      readingPoints: 65, // 10 + 40 + 15 bonus
      hashtag: 'Poetry',
      difficulty: 'Moderate Read',
      readTimeFormatted: '4 min read',
      author: 'Ren Tanaka',
      addedAt: 'Yesterday',
    },
    {
      id: 'read_poet_3',
      url: 'https://lithub.com/chapbooks-in-the-digital-sanctuary',
      title: 'Chapbooks in the Digital Sanctuary: Why Tactile Verse Survives',
      domain: 'lithub.com',
      excerpt: 'The renaissance of independent letterpress, PDF chapbooks, and underground poetry exchange in 2026.',
      wordCount: 3300,
      estimatedMinutes: 15,
      readingPoints: 235, // 10 + 150 + 75 bonus
      hashtag: 'Poetry',
      difficulty: 'Longform Scholarly',
      readTimeFormatted: '15 min read',
      author: 'Aria Sol',
      addedAt: '2 days ago',
    },
  ],
  Encrypted: [
    {
      id: 'read_enc_1',
      url: 'https://eff.org/deeplinks/zero-knowledge-profile-vaults-and-client-side-aes',
      title: 'Zero-Knowledge Profile Vaults: Client-Side AES-256 for Sovereign Identity',
      domain: 'eff.org',
      excerpt: 'A comprehensive technical blueprint for keeping social profile telemetry encrypted in browser memory with zero server knowledge.',
      wordCount: 2640,
      estimatedMinutes: 12,
      readingPoints: 165, // 10 + 120 + 35 bonus
      hashtag: 'Encrypted',
      difficulty: 'Deep Dive',
      readTimeFormatted: '12 min read',
      author: 'Kaelen Voss',
      addedAt: '5 hours ago',
    },
    {
      id: 'read_enc_2',
      url: 'https://subgraph.io/research/post-quantum-key-fingerprints-in-mesh-systems',
      title: 'Post-Quantum Key Fingerprinting in Sovereign Mesh Systems',
      domain: 'subgraph.io',
      excerpt: 'Evaluating PBKDF2 iterations, SHA-256 visual hashing, and hardware entropy generation on mobile devices.',
      wordCount: 4400,
      estimatedMinutes: 20,
      readingPoints: 285, // 10 + 200 + 75 bonus
      hashtag: 'Encrypted',
      difficulty: 'Longform Scholarly',
      readTimeFormatted: '20 min read',
      author: 'Maya Lin',
      addedAt: 'Yesterday',
    },
    {
      id: 'read_enc_3',
      url: 'https://privacyguides.org/articles/browser-cryptography-quick-guide',
      title: 'WebCrypto Essentials: 5 Core Rules for Local AES-GCM Encryption',
      domain: 'privacyguides.org',
      excerpt: 'Practical implementation rules for key derivation, non-reusable initialization vectors, and memory safety.',
      wordCount: 660,
      estimatedMinutes: 3,
      readingPoints: 40, // 10 + 30 + 0 bonus
      hashtag: 'Encrypted',
      difficulty: 'Quick Read',
      readTimeFormatted: '3 min read',
      author: 'Kaelen Voss',
      addedAt: '3 days ago',
    },
  ],
  Mates: [
    {
      id: 'read_mat_1',
      url: 'https://theatlantic.com/magazine/archive/2026/the-psychology-of-mutual-dislikes',
      title: 'The Depth of Dislikes: Why Shared Aversions Forge Stronger Friendships',
      domain: 'theatlantic.com',
      excerpt: 'Sociological research reveals that mutual distaste for superficial culture creates deeper trust than superficial mutual interests.',
      wordCount: 1980,
      estimatedMinutes: 9,
      readingPoints: 135, // 10 + 90 + 35 bonus
      hashtag: 'Mates',
      difficulty: 'Deep Dive',
      readTimeFormatted: '9 min read',
      author: 'Marcus Thorne',
      addedAt: '1 day ago',
    },
    {
      id: 'read_mat_2',
      url: 'https://psyche.co/ideas/how-to-find-an-intellectual-counterpart',
      title: 'The Art of Intellectual Counterpoints in Modern Circles',
      domain: 'psyche.co',
      excerpt: 'Finding peers who challenge your creative assumptions while sharing your core ethical and artistic compass.',
      wordCount: 1100,
      estimatedMinutes: 5,
      readingPoints: 75, // 10 + 50 + 15 bonus
      hashtag: 'Mates',
      difficulty: 'Moderate Read',
      readTimeFormatted: '5 min read',
      author: 'Elena Vance',
      addedAt: '4 hours ago',
    },
  ],
  deep_: [
    {
      id: 'read_deep_1',
      url: 'https://deep.network/manifesto/intentional-digital-presence-and-ambient-silence',
      title: 'The deep_ Manifesto: Exiting the Algorithmic Treadmill for Authentic Depth',
      domain: 'deep.network',
      excerpt: 'Principles for intentional social computing, respectful reading time, encrypted identity, and meaningful human connection.',
      wordCount: 2200,
      estimatedMinutes: 10,
      readingPoints: 145, // 10 + 100 + 35 bonus
      hashtag: 'deep_',
      difficulty: 'Deep Dive',
      readTimeFormatted: '10 min read',
      author: 'Lucid Vibe',
      addedAt: 'Yesterday',
    },
    {
      id: 'read_deep_2',
      url: 'https://wired.com/story/reading-time-rewards-in-social-platforms',
      title: 'Mindful Social Media: How Reading Time Estimation Fosters Real Learning',
      domain: 'wired.com',
      excerpt: 'Rewarding users with group standing based on reading duration and article depth rather than viral clickbait.',
      wordCount: 1320,
      estimatedMinutes: 6,
      readingPoints: 85, // 10 + 60 + 15 bonus
      hashtag: 'deep_',
      difficulty: 'Moderate Read',
      readTimeFormatted: '6 min read',
      author: 'Kaelen Voss',
      addedAt: '6 hours ago',
    },
  ],
  Kyoto: [
    {
      id: 'read_kyo_1',
      url: 'https://kyotojournal.org/culture-and-craft/wabi-sabi-in-analog-technology',
      title: 'Wabi-Sabi in Modern Hardware: The Quiet Craft of Kyoto Artisans',
      domain: 'kyotojournal.org',
      excerpt: 'Contemplating rain on bamboo gutters, handcrafted wood enclosures, and tube amplifiers in old Kyoto ateliers.',
      wordCount: 1540,
      estimatedMinutes: 7,
      readingPoints: 95, // 10 + 70 + 15 bonus
      hashtag: 'Kyoto',
      difficulty: 'Moderate Read',
      readTimeFormatted: '7 min read',
      author: 'Ren Tanaka',
      addedAt: '2 days ago',
    },
  ],
  Minimalism: [
    {
      id: 'read_min_1',
      url: 'https://aeon.co/essays/the-zen-of-cognitive-unburdening',
      title: 'Cognitive Unburdening: Subtracting Digital Friction from Daily Thought',
      domain: 'aeon.co',
      excerpt: 'How stripping away continuous notifications and bloated user interfaces restores contemplative depth.',
      wordCount: 2420,
      estimatedMinutes: 11,
      readingPoints: 155, // 10 + 110 + 35 bonus
      hashtag: 'Minimalism',
      difficulty: 'Deep Dive',
      readTimeFormatted: '11 min read',
      author: 'Marcus Thorne',
      addedAt: '3 days ago',
    },
  ],
};

/**
 * Returns curated readings for a given hashtag group
 */
export function getReadingsForHashtag(tag: string): ReadingLink[] {
  const clean = tag.replace(/^#+/, '');
  // Case-insensitive match or fallback to default
  const key = Object.keys(CURATED_GROUP_READINGS).find(
    (k) => k.toLowerCase() === clean.toLowerCase()
  );
  if (key && CURATED_GROUP_READINGS[key]) {
    return CURATED_GROUP_READINGS[key];
  }

  // Generate 2 contextual reading links for any arbitrary hashtag
  return [
    estimateReadingFromUrl(
      `https://medium.com/topic/${clean.toLowerCase()}/deep-analysis-and-future-perspectives`,
      `An essential deep dive exploring the culture, development, and community debates surrounding #${clean}.`,
      clean,
      `The Future of #${clean}: Perspectives and Analysis`
    ),
    estimateReadingFromUrl(
      `https://substack.com/${clean.toLowerCase()}-digest/the-essential-reading-guide`,
      `A curated collection of thoughts, discussions, and essays for #${clean} practitioners.`,
      clean,
      `Essential Readings in #${clean}`
    ),
  ];
}
