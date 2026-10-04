import { CityRegion, Post, User } from '../types';
import { CITY_REGIONS } from './cityRegions';

export interface CityLeaderboardEntry {
  user: User;
  rank: number;
  totalScore: number;
  readingPoints: number;
  activityPoints: number;
  postsCount: number;
  rankTier: string;
  badgeEmoji: string;
  trend: 'up' | 'steady' | 'new';
  trendDelta?: number;
  isCurrentUser: boolean;
}

export interface CityLeaderboardResult {
  cityRegion: CityRegion;
  currentUserRank: number;
  currentUserEntry: CityLeaderboardEntry | null;
  entries: CityLeaderboardEntry[];
  totalCitizens: number;
  pointsToNextRank: number;
  nextRankUser: CityLeaderboardEntry | null;
  isCurrentUserLeader: boolean;
}

const TIER_TITLES: Record<string, string[]> = {
  kyoto: ['Zen Grandmaster', 'Bamboo Stanza Scholar', 'Tatami Archivist', 'Haiku Artisan', 'Contemplative Scribe', 'Old Quarter Novice'],
  berlin: ['Cypher Architect', 'Modular Synthesist', 'Zero-Knowledge Sentinel', 'Underground Archivist', 'Privacy Scholar', 'Node Contributor'],
  paris: ['Salon Laureate', 'Seine Verse Architect', 'Existential Stanza Scholar', 'Chapbook Artisan', 'Lyric Essayist', 'Salon Observer'],
  tokyo: ['Neon Ambient Luminary', 'Cyber-Literary Maestro', 'Analog Field Recordist', 'Late-Night Node Curator', 'Sub-Bass Poet', 'Metro Voyager'],
  san_francisco: ['Sovereign Protocol Lead', 'ZK Proof Researcher', 'Pacific Stanza Explorer', 'Identity Pioneer', 'Algorithmic Critic', 'Fog Wanderer'],
  london: ['Literary Chancellor', 'Chapbook Archivist', 'Spoken Word Master', 'Rainy-Day Lyricist', 'Acoustic Soloist', 'Fleet Stanza Novice'],
  reykjavik: ['Glacial Solitude Master', 'Aurora Soundscape Bard', 'Basalt Minimalist', 'Arctic Verse Archivist', 'Quiet Signal Seeker', 'Lichen Wanderer'],
  amsterdam: ['Canal Letterpress Master', 'Open-Source Typographer', 'Sovereign Cycling Poet', 'Printmaker Scribe', 'Reflective Stanza Artisan', 'Bridge Observer'],
  seoul: ['Midnight Hanok Luminary', 'Hangul Calligrapher', 'Zine Press Master', 'Tea House Scribe', 'Quiet Alley Essayist', 'Contemplative Reader'],
};

/**
 * Normalizes city string for matching
 */
export function normalizeCityName(cityStr?: string): string {
  if (!cityStr) return 'kyoto';
  const clean = cityStr.toLowerCase().trim();
  if (clean.includes('kyoto')) return 'kyoto';
  if (clean.includes('berlin')) return 'berlin';
  if (clean.includes('paris')) return 'paris';
  if (clean.includes('tokyo')) return 'tokyo';
  if (clean.includes('san francisco') || clean.includes('san_francisco') || clean.includes('sf')) return 'san_francisco';
  if (clean.includes('london')) return 'london';
  if (clean.includes('reykjavik') || clean.includes('reykjavík')) return 'reykjavik';
  if (clean.includes('amsterdam')) return 'amsterdam';
  if (clean.includes('seoul')) return 'seoul';
  if (clean.includes('new york') || clean.includes('new_york') || clean.includes('nyc')) return 'new_york';
  return clean;
}

/**
 * Calculates a comprehensive city leaderboard for the specified city.
 */
export function getCityLeaderboard(
  targetCity: string,
  currentUser: User,
  allUsers: User[],
  posts: Post[] = []
): CityLeaderboardResult {
  const normCity = normalizeCityName(targetCity);
  const region = CITY_REGIONS.find((r) => r.id === normCity || r.name.toLowerCase() === normCity) || CITY_REGIONS[0];

  // 1. Gather all users belonging to this city
  const cityUsers = allUsers.filter((u) => {
    const userCityNorm = normalizeCityName(u.city || u.location);
    return userCityNorm === region.id || userCityNorm === region.name.toLowerCase();
  });

  // Ensure current user is included if their city matches
  const currentUserNorm = normalizeCityName(currentUser.city || currentUser.location);
  const isCurrentUserInThisCity = currentUserNorm === region.id || currentUserNorm === region.name.toLowerCase();

  if (isCurrentUserInThisCity && !cityUsers.some((u) => u.id === currentUser.id)) {
    cityUsers.push(currentUser);
  }

  // 2. Score each user in this city
  const userScores = cityUsers.map((user) => {
    const isSelf = user.id === currentUser.id;
    // Current user's dynamic points
    const readingPts = isSelf ? (user.totalReadingPoints || 0) : (user.totalReadingPoints || 1400);
    
    // Calculate post activity in this city
    const userCityPosts = posts.filter(
      (p) => (p.authorId === user.id || p.authorHandle === user.handle)
    );
    const postLikes = userCityPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
    const postComments = userCityPosts.reduce((acc, p) => acc + (p.commentsCount || 0), 0);
    const activityPts = (userCityPosts.length * 45) + (postLikes * 8) + (postComments * 12);

    const totalScore = readingPts + activityPts;

    return {
      user,
      readingPoints: readingPts,
      activityPoints: activityPts,
      postsCount: userCityPosts.length,
      totalScore,
      isCurrentUser: isSelf,
    };
  });

  // 3. Sort descending by total score
  userScores.sort((a, b) => b.totalScore - a.totalScore);

  // 4. Assign ranks, tier titles, trends, and badge emojis
  const tierList = TIER_TITLES[region.id] || TIER_TITLES.kyoto;

  const entries: CityLeaderboardEntry[] = userScores.map((item, index) => {
    const rank = index + 1;
    const tierIndex = Math.min(index, tierList.length - 1);
    const rankTier = tierList[tierIndex];

    let badgeEmoji = '🎖️';
    if (rank === 1) badgeEmoji = '👑';
    else if (rank === 2) badgeEmoji = '🥈';
    else if (rank === 3) badgeEmoji = '🥉';
    else if (rank <= 5) badgeEmoji = '✨';

    // Calculate simulated trend
    let trend: 'up' | 'steady' | 'new' = 'steady';
    let trendDelta = 0;
    if (rank === 1) {
      trend = 'steady';
    } else if (item.isCurrentUser) {
      trend = 'up';
      trendDelta = 1;
    } else if (index % 3 === 0) {
      trend = 'up';
      trendDelta = (index % 2) + 1;
    }

    return {
      user: item.user,
      rank,
      totalScore: item.totalScore,
      readingPoints: item.readingPoints,
      activityPoints: item.activityPoints,
      postsCount: item.postsCount,
      rankTier,
      badgeEmoji,
      trend,
      trendDelta,
      isCurrentUser: item.isCurrentUser,
    };
  });

  // 5. Compute Current User's standing
  const currentUserEntry = entries.find((e) => e.isCurrentUser) || null;
  const currentUserRank = currentUserEntry ? currentUserEntry.rank : (entries.length + 1);
  const isCurrentUserLeader = currentUserRank === 1;

  let pointsToNextRank = 0;
  let nextRankUser: CityLeaderboardEntry | null = null;

  if (currentUserEntry && currentUserRank > 1) {
    nextRankUser = entries[currentUserRank - 2] || null;
    if (nextRankUser) {
      pointsToNextRank = Math.max(1, nextRankUser.totalScore - currentUserEntry.totalScore + 10);
    }
  }

  return {
    cityRegion: region,
    currentUserRank,
    currentUserEntry,
    entries,
    totalCitizens: entries.length,
    pointsToNextRank,
    nextRankUser,
    isCurrentUserLeader,
  };
}
