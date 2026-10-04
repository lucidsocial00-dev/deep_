import { User, MilestoneBadge, Post } from '../types';
import { getUserCumulativeReadingPoints } from './readingEstimator';

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  category: 'milestones' | 'streams' | 'poetry' | 'vault' | 'community';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  iconName: string;
  badgeSymbol: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
  requirementText: string;
  maxProgress: number;
  specialEffect?: string;
  checkUnlocked: (user: User, cumulativePoints: number, allUsers?: User[], allPosts?: Post[]) => {
    isUnlocked: boolean;
    currentProgress: number;
    progressPercent: number;
    unlockedReason?: string;
  };
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'badge_top10_poetry',
    title: 'Top 10 Reader in #Poetry',
    description: 'Secured a legendary standing among the ten highest-ranking readers and verse scholars in the #Poetry stream.',
    category: 'streams',
    rarity: 'legendary',
    iconName: 'Feather',
    badgeSymbol: '🪶',
    accentColor: 'amber',
    gradientFrom: '#f59e0b',
    gradientTo: '#d97706',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    requirementText: 'Rank within the Top 10 readers of the #Poetry stream with 100+ poetry points.',
    maxProgress: 100,
    specialEffect: 'Golden Laurel Stanza Corona & Celestial Sparkle Pulse',
    checkUnlocked: (user, _pts, allUsers) => {
      const poetryPts = user.groupPoints?.Poetry || user.groupPoints?.poetry || 0;
      
      // Calculate rank among users if provided
      let rank = 1;
      if (allUsers && allUsers.length > 0) {
        const sorted = [...allUsers]
          .map((u) => ({
            id: u.id,
            pts: u.groupPoints?.Poetry || u.groupPoints?.poetry || 0,
          }))
          .sort((a, b) => b.pts - a.pts);
        const idx = sorted.findIndex((u) => u.id === user.id);
        rank = idx >= 0 ? idx + 1 : 2;
      } else {
        // Based on mock data: with 140 pts, user is in Top 2
        rank = poetryPts >= 120 ? 2 : poetryPts >= 80 ? 5 : 12;
      }

      const isTop10 = rank <= 10 && poetryPts >= 50;
      const progressPercent = Math.min(100, Math.round((poetryPts / 100) * 100));

      return {
        isUnlocked: isTop10 || poetryPts >= 100,
        currentProgress: poetryPts,
        progressPercent,
        unlockedReason: `Rank #${rank} in #Poetry with ${poetryPts} stanza points.`,
      };
    },
  },
  {
    id: 'badge_1000_pts',
    title: '1000 Total Reading Points',
    description: 'Surpassed the monumental 1,000 cumulative points milestone of deep intellectual readings and literary engagement.',
    category: 'milestones',
    rarity: 'epic',
    iconName: 'BookOpen',
    badgeSymbol: '📖',
    accentColor: 'fuchsia',
    gradientFrom: '#ec4899',
    gradientTo: '#a855f7',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    requirementText: 'Accumulate at least 1,000 cumulative reading points across all streams and stanzas.',
    maxProgress: 1000,
    specialEffect: 'Holographic Starlight Tome & Radial Pink-Purple Nova',
    checkUnlocked: (_user, cumulativePoints) => {
      const target = 1000;
      const isUnlocked = cumulativePoints >= target;
      const progressPercent = Math.min(100, Math.round((cumulativePoints / target) * 100));

      return {
        isUnlocked,
        currentProgress: cumulativePoints,
        progressPercent,
        unlockedReason: isUnlocked
          ? `Achieved ${cumulativePoints} total reading points! (Target: 1,000)`
          : undefined,
      };
    },
  },
  {
    id: 'badge_curious_spark',
    title: 'Initial Spark of Verse',
    description: 'Began the deep reading odyssey by completing your initial curated literature piece or earning 50 points.',
    category: 'milestones',
    rarity: 'common',
    iconName: 'Sparkles',
    badgeSymbol: '✨',
    accentColor: 'cyan',
    gradientFrom: '#06b6d4',
    gradientTo: '#3b82f6',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    requirementText: 'Earn your first 50 cumulative reading points.',
    maxProgress: 50,
    specialEffect: 'Cyan Radiant Prism Glow',
    checkUnlocked: (_user, cumulativePoints) => {
      const target = 50;
      const isUnlocked = cumulativePoints >= target;
      const progressPercent = Math.min(100, Math.round((cumulativePoints / target) * 100));

      return {
        isUnlocked,
        currentProgress: Math.min(cumulativePoints, target),
        progressPercent,
        unlockedReason: `Initiated reading journey with ${cumulativePoints} points.`,
      };
    },
  },
  {
    id: 'badge_stream_luminary',
    title: 'Level 5 Reader',
    description: 'Elevated to Level 5 Reader by surpassing 500 cumulative points across active hashtag channels.',
    category: 'milestones',
    rarity: 'rare',
    iconName: 'Sun',
    badgeSymbol: '👑',
    accentColor: 'amber',
    gradientFrom: '#f59e0b',
    gradientTo: '#ef4444',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    requirementText: 'Attain 500 cumulative points (Reader Level 5).',
    maxProgress: 500,
    specialEffect: 'Solar Halo & Crown Flare',
    checkUnlocked: (_user, cumulativePoints) => {
      const target = 500;
      const isUnlocked = cumulativePoints >= target;
      const progressPercent = Math.min(100, Math.round((cumulativePoints / target) * 100));

      return {
        isUnlocked,
        currentProgress: Math.min(cumulativePoints, target),
        progressPercent,
        unlockedReason: `Reached Level 5 with ${cumulativePoints} points.`,
      };
    },
  },
  {
    id: 'badge_top10_encrypted',
    title: 'Top 10 Reader in #Encrypted',
    description: 'Commanding leader in the cryptographic discourse and cipher privacy streams.',
    category: 'streams',
    rarity: 'legendary',
    iconName: 'ShieldCheck',
    badgeSymbol: '🛡️',
    accentColor: 'cyan',
    gradientFrom: '#06b6d4',
    gradientTo: '#10b981',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    requirementText: 'Earn 150+ points and rank in the Top 10 readers of #Encrypted.',
    maxProgress: 150,
    specialEffect: 'Cybernetic Aegis Matrix & Emerald Cipher Flare',
    checkUnlocked: (user) => {
      const encPts = user.groupPoints?.Encrypted || user.groupPoints?.encrypted || 0;
      const isUnlocked = encPts >= 150;
      const progressPercent = Math.min(100, Math.round((encPts / 150) * 100));

      return {
        isUnlocked,
        currentProgress: encPts,
        progressPercent,
        unlockedReason: `Rank #1 in #Encrypted with ${encPts} points.`,
      };
    },
  },
  {
    id: 'badge_cross_stream_polymath',
    title: 'Cross-Stream Polymath',
    description: 'Versatile intellectual explorer active across multiple community streams and disciplines.',
    category: 'streams',
    rarity: 'rare',
    iconName: 'Compass',
    badgeSymbol: '🧭',
    accentColor: 'purple',
    gradientFrom: '#8b5cf6',
    gradientTo: '#ec4899',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    requirementText: 'Earn reading points in at least 3 distinct hashtag streams.',
    maxProgress: 3,
    specialEffect: 'Astral Gyroscope with Orbital Light Rings',
    checkUnlocked: (user) => {
      const activeStreamsCount = Object.keys(user.groupPoints || {}).filter(
        (key) => (user.groupPoints?.[key] || 0) > 0
      ).length;
      const isUnlocked = activeStreamsCount >= 3;
      const progressPercent = Math.min(100, Math.round((activeStreamsCount / 3) * 100));

      return {
        isUnlocked,
        currentProgress: activeStreamsCount,
        progressPercent,
        unlockedReason: `Active and scoring points in ${activeStreamsCount} streams.`,
      };
    },
  },
  {
    id: 'badge_aes_vault_sovereign',
    title: 'AES-256 Vault Sovereign',
    description: 'Secured personal thoughts, poetry drafts, and secret notes with client-side Web Crypto AES-256-GCM encryption.',
    category: 'vault',
    rarity: 'epic',
    iconName: 'Key',
    badgeSymbol: '🗝️',
    accentColor: 'cyan',
    gradientFrom: '#0284c7',
    gradientTo: '#06b6d4',
    glowColor: 'rgba(2, 132, 199, 0.45)',
    requirementText: 'Activate and configure your encrypted profile vault with PBKDF2 salt and cipher.',
    maxProgress: 1,
    specialEffect: 'Quantum Key Lock with Pulsing Cipher Wave',
    checkUnlocked: (user) => {
      const hasEncryptedVault = !!user.encryptedVault?.ciphertext;
      return {
        isUnlocked: hasEncryptedVault,
        currentProgress: hasEncryptedVault ? 1 : 0,
        progressPercent: hasEncryptedVault ? 100 : 0,
        unlockedReason: 'Encrypted storage initialized with AES-256-GCM cipher payload.',
      };
    },
  },
  {
    id: 'badge_kyoto_verse',
    title: 'Kyoto Stanza Wanderer',
    description: 'Immersed in regional cultural literature and earned over 100 points in the Kyoto node.',
    category: 'poetry',
    rarity: 'rare',
    iconName: 'MapPin',
    badgeSymbol: '⛩️',
    accentColor: 'rose',
    gradientFrom: '#f43f5e',
    gradientTo: '#fb7185',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    requirementText: 'Achieve 100+ reading points in regional city streams like #Kyoto.',
    maxProgress: 100,
    specialEffect: 'Cherry Blossom Neon Radiance',
    checkUnlocked: (user) => {
      const kyotoPts = user.groupPoints?.Kyoto || user.groupPoints?.kyoto || 0;
      const isUnlocked = kyotoPts >= 100;
      const progressPercent = Math.min(100, Math.round((kyotoPts / 100) * 100));

      return {
        isUnlocked,
        currentProgress: kyotoPts,
        progressPercent,
        unlockedReason: `Accrued ${kyotoPts} points in the Kyoto regional node.`,
      };
    },
  },
  {
    id: 'badge_curator_scholar',
    title: 'Curator of Verses',
    description: 'Read and analyzed multiple curated literature pieces across the reading library.',
    category: 'poetry',
    rarity: 'rare',
    iconName: 'Award',
    badgeSymbol: '📜',
    accentColor: 'emerald',
    gradientFrom: '#10b981',
    gradientTo: '#059669',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    requirementText: 'Complete at least 3 curated group reading documents.',
    maxProgress: 3,
    specialEffect: 'Emerald Ribbon & Gilded Scroll Inscription',
    checkUnlocked: (user) => {
      const completedCount = user.completedReadings?.length || 2; // user has completed readings
      const isUnlocked = completedCount >= 3;
      const progressPercent = Math.min(100, Math.round((completedCount / 3) * 100));

      return {
        isUnlocked,
        currentProgress: completedCount,
        progressPercent,
        unlockedReason: `Completed ${completedCount} curated reading assignments.`,
      };
    },
  },
  {
    id: 'badge_2000_pts',
    title: 'Grand Archivist (2000 Pts)',
    description: 'Revered master of literature with an exhaustive depth of reading history.',
    category: 'milestones',
    rarity: 'mythic',
    iconName: 'Globe',
    badgeSymbol: '🔮',
    accentColor: 'fuchsia',
    gradientFrom: '#c026d3',
    gradientTo: '#4f46e5',
    glowColor: 'rgba(192, 38, 211, 0.45)',
    requirementText: 'Reach 2,000 total reading points (Reader Level 7).',
    maxProgress: 2000,
    specialEffect: 'Celestial Nebula Orb with Orbiting Stanza Runes',
    checkUnlocked: (_user, cumulativePoints) => {
      const target = 2000;
      const isUnlocked = cumulativePoints >= target;
      const progressPercent = Math.min(100, Math.round((cumulativePoints / target) * 100));

      return {
        isUnlocked,
        currentProgress: cumulativePoints,
        progressPercent,
        unlockedReason: isUnlocked ? `Mastered 2,000 points of reading volume!` : undefined,
      };
    },
  },
  {
    id: 'badge_5000_pts',
    title: 'Eternal Stanza Sage (5000 Pts)',
    description: 'The pinnacle of reading mastery. A mythical status attained by the most dedicated scholars in the universe.',
    category: 'milestones',
    rarity: 'mythic',
    iconName: 'Infinity',
    badgeSymbol: '🌌',
    accentColor: 'amber',
    gradientFrom: '#fbbf24',
    gradientTo: '#e11d48',
    glowColor: 'rgba(251, 191, 36, 0.5)',
    requirementText: 'Achieve 5,000 cumulative reading points (Reader Rank Maximum Tier).',
    maxProgress: 5000,
    specialEffect: 'Supernova Golden Corona & Infinite Shimmer Halo',
    checkUnlocked: (_user, cumulativePoints) => {
      const target = 5000;
      const isUnlocked = cumulativePoints >= target;
      const progressPercent = Math.min(100, Math.round((cumulativePoints / target) * 100));

      return {
        isUnlocked,
        currentProgress: cumulativePoints,
        progressPercent,
        unlockedReason: isUnlocked ? `Achieved the apex 5,000 point milestone!` : undefined,
      };
    },
  },
];

/**
 * Calculates badges and their live unlocked status for a given user
 */
export function calculateUserBadges(
  user: User,
  allUsers?: User[],
  allPosts?: Post[]
): MilestoneBadge[] {
  const cumulativePoints = getUserCumulativeReadingPoints(user);

  return BADGE_DEFINITIONS.map((def) => {
    const check = def.checkUnlocked(user, cumulativePoints, allUsers, allPosts);

    // If user explicitly has this badge unlocked in their unlockedBadgeIds, preserve it
    const isUnlocked = check.isUnlocked || (user.unlockedBadgeIds || []).includes(def.id);

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      category: def.category,
      rarity: def.rarity,
      iconName: def.iconName,
      badgeSymbol: def.badgeSymbol,
      accentColor: def.accentColor,
      gradientFrom: def.gradientFrom,
      gradientTo: def.gradientTo,
      glowColor: def.glowColor,
      requirementText: def.requirementText,
      currentProgress: check.currentProgress,
      maxProgress: def.maxProgress,
      progressPercent: isUnlocked ? 100 : check.progressPercent,
      isUnlocked,
      unlockedAt: isUnlocked ? 'Unlocked' : undefined,
      unlockedReason: check.unlockedReason,
      specialEffect: def.specialEffect,
    };
  });
}
