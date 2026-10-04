import { HashtagGroup, Post } from '../types';
import { normalizeTag } from './hashtagGroups';

export interface PostScoreBreakdown {
  totalScore: number;
  baseEngagement: number;
  likesPoints: number;
  dislikesPenalty: number;
  commentsPoints: number;
  sharesPoints: number;
  powerUpBonus: number;
  multiplierFactor?: number;
  multiplierBonus: number;
  boostBonus: number;
  viralBonus: number;
  mediaBonus: number;
  mediaTypes: string[];
}

export interface GroupScoredPost {
  post: Post;
  groupTag: string;
  rank: number; // 1-based index
  scoreBreakdown: PostScoreBreakdown;
  isFirstPlace: boolean;
  medalEmoji: string;
  trophyColor: 'gold' | 'silver' | 'bronze' | 'slate';
}

export interface HashtagGroupTopScoreData {
  group: HashtagGroup;
  tag: string;
  cleanTag: string;
  totalPosts: number;
  topScore: number;
  averageScore: number;
  topScoredPosts: GroupScoredPost[];
  leadAuthor?: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
  };
}

/**
 * Calculates a transparent, multi-factor depth & engagement score for any post
 */
export function calculatePostScore(post: Post): PostScoreBreakdown {
  const likesPoints = (post.likesCount || 0) * 10;
  const dislikesPenalty = (post.dislikesCount || 0) * 3;
  const commentsPoints = (post.commentsCount || 0) * 6;
  const sharesPoints = (post.sharesCount || 0) * 8;

  const rawBase = likesPoints - dislikesPenalty + commentsPoints + sharesPoints;
  const baseEngagement = Math.max(0, rawBase);

  // Power-Ups bonus calculation
  let multiplierBonus = 0;
  let multiplierFactor: number | undefined;
  if (post.firePowerUps?.multiplier?.active) {
    multiplierFactor = post.firePowerUps.multiplier.multiplierFactor || 2;
    multiplierBonus = Math.round(baseEngagement * (multiplierFactor - 1));
    if (multiplierBonus <= 0) {
      multiplierBonus = multiplierFactor * 15;
    }
  }

  let boostBonus = 0;
  if (post.firePowerUps?.boost?.active) {
    boostBonus = post.firePowerUps.boost.boostScore || 25;
  }

  let viralBonus = 0;
  if (post.firePowerUps?.viral?.active) {
    const infections = post.firePowerUps.viral.totalInfections || 1;
    viralBonus = infections * 12;
  }

  const powerUpBonus = multiplierBonus + boostBonus + viralBonus;

  // Media richness bonus
  let mediaBonus = 0;
  const mediaTypes: string[] = [];

  if (post.document) {
    mediaBonus += 15;
    mediaTypes.push('Chapbook PDF');
  }
  if (post.song) {
    mediaBonus += 15;
    mediaTypes.push('Original Audio');
  }
  if (post.readingLinks && post.readingLinks.length > 0) {
    mediaBonus += post.readingLinks.length * 6;
    mediaTypes.push(`${post.readingLinks.length} Reading Link${post.readingLinks.length > 1 ? 's' : ''}`);
  } else if (post.readingLink) {
    mediaBonus += 6;
    mediaTypes.push('Reading Link');
  }
  if (post.poll) {
    mediaBonus += 10;
    mediaTypes.push('Poll');
  }
  if (post.image) {
    mediaBonus += 8;
    mediaTypes.push('Visual Art');
  }

  const total = Math.max(5, baseEngagement + powerUpBonus + mediaBonus);

  return {
    totalScore: total,
    baseEngagement,
    likesPoints,
    dislikesPenalty,
    commentsPoints,
    sharesPoints,
    powerUpBonus,
    multiplierFactor,
    multiplierBonus,
    boostBonus,
    viralBonus,
    mediaBonus,
    mediaTypes,
  };
}

/**
 * Gets ranked top-scoring posts for a single hashtag group
 */
export function getTopScoringPostsForGroup(
  groupTag: string,
  allPosts: Post[],
  limit = 10
): GroupScoredPost[] {
  const clean = normalizeTag(groupTag).toLowerCase();

  // Find all posts containing this hashtag
  const matching = allPosts.filter((p) =>
    p.hashtags.some((h) => normalizeTag(h).toLowerCase() === clean)
  );

  const scoredList = matching.map((post) => {
    const breakdown = calculatePostScore(post);
    return {
      post,
      groupTag: clean,
      scoreBreakdown: breakdown,
    };
  });

  // Sort descending by total score, secondary sort by likesCount then commentsCount
  scoredList.sort((a, b) => {
    if (b.scoreBreakdown.totalScore !== a.scoreBreakdown.totalScore) {
      return b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore;
    }
    if (b.post.likesCount !== a.post.likesCount) {
      return b.post.likesCount - a.post.likesCount;
    }
    return (b.post.commentsCount || 0) - (a.post.commentsCount || 0);
  });

  const sliced = scoredList.slice(0, limit);

  return sliced.map((item, index) => {
    const rank = index + 1;
    let medalEmoji = `#${rank}`;
    let trophyColor: 'gold' | 'silver' | 'bronze' | 'slate' = 'slate';

    if (rank === 1) {
      medalEmoji = '🥇';
      trophyColor = 'gold';
    } else if (rank === 2) {
      medalEmoji = '🥈';
      trophyColor = 'silver';
    } else if (rank === 3) {
      medalEmoji = '🥉';
      trophyColor = 'bronze';
    }

    return {
      post: item.post,
      groupTag: clean,
      rank,
      scoreBreakdown: item.scoreBreakdown,
      isFirstPlace: rank === 1,
      medalEmoji,
      trophyColor,
    };
  });
}

/**
 * Aggregates top scoring posts data across all hashtag groups
 */
export function getAllGroupsTopScoringData(
  groups: HashtagGroup[],
  allPosts: Post[],
  limitPerGroup = 5
): HashtagGroupTopScoreData[] {
  return groups.map((group) => {
    const cleanTag = normalizeTag(group.tag);
    const topScoredPosts = getTopScoringPostsForGroup(cleanTag, allPosts, limitPerGroup);

    const totalPosts = allPosts.filter((p) =>
      p.hashtags.some((h) => normalizeTag(h).toLowerCase() === cleanTag.toLowerCase())
    ).length;

    const topScore = topScoredPosts.length > 0 ? topScoredPosts[0].scoreBreakdown.totalScore : 0;
    const averageScore =
      topScoredPosts.length > 0
        ? Math.round(
            topScoredPosts.reduce((acc, curr) => acc + curr.scoreBreakdown.totalScore, 0) /
              topScoredPosts.length
          )
        : 0;

    const leadAuthor =
      topScoredPosts.length > 0
        ? {
            id: topScoredPosts[0].post.authorId,
            name: topScoredPosts[0].post.authorName,
            handle: topScoredPosts[0].post.authorHandle,
            avatar: topScoredPosts[0].post.authorAvatar,
          }
        : undefined;

    return {
      group,
      tag: group.tag,
      cleanTag,
      totalPosts,
      topScore,
      averageScore,
      topScoredPosts,
      leadAuthor,
    };
  });
}
