import { HashtagGroup, HashtagTrend, Post, User } from '../types';
import { getCityForHashtag } from './cityRegions';
import { getGroupReadingRank } from './readingEstimator';

export function formatStreamName(tag: string, city?: string, country?: string): string {
  const clean = normalizeTag(tag);
  if (!city) return `#${clean} Stream`;
  if (clean.toLowerCase() === city.toLowerCase() && country && country.toLowerCase() !== city.toLowerCase()) {
    return `#${clean} (${city}, ${country}) Stream`;
  }
  return `#${clean} (${city}) Stream`;
}

export const INITIAL_HASHTAG_GROUPS: HashtagGroup[] = [
  {
    tag: 'Poetry',
    name: '#Poetry (Paris) Stream',
    description: 'A sovereign gathering of poets, chapbook authors, and stanza composers crafting authentic human verse in the encrypted age.',
    category: 'Literature & Verse',
    city: 'Paris',
    country: 'France',
    memberIds: ['usr_me', 'usr_1', 'usr_3', 'usr_5'],
    createdAt: 'January 2025',
    isHot: true,
    bannerGradient: 'from-pink-900/60 via-purple-900/50 to-pink-950/70',
    vibeStatement: 'Rhyme, meter, metaphor, and emotional clarity over algorithmic noise.',
    rules: [
      'Original poetry, chapbooks, and respectful stanza feedback only.',
      'Always credit fellow creators when referencing verse.',
      'PDF chapbooks and companion acoustic scores are celebrated.',
    ],
  },
  {
    tag: 'Mates',
    name: '#Mates (San Francisco) Stream',
    description: 'Dedicated to discovering deep social compatibility, comparing mutual likes and dislikes, and connecting with high depth score peers.',
    category: 'Social Compatibility',
    city: 'San Francisco',
    country: 'United States',
    memberIds: ['usr_me', 'usr_1', 'usr_2', 'usr_3', 'usr_4'],
    createdAt: 'February 2025',
    isHot: true,
    bannerGradient: 'from-fuchsia-900/60 via-pink-900/50 to-rose-950/70',
    vibeStatement: 'Bonding over shared silence and disliking the same artificial distractions.',
    rules: [
      'Encourage transparent opinions on media, art, and philosophy.',
      'Treat compatibility scores as bridges for meaningful dialogue.',
      'No superficial engagement bait.',
    ],
  },
  {
    tag: 'Encrypted',
    name: '#Encrypted (Berlin) Stream',
    description: 'Advocates for Zero-Knowledge profile vaults, client-side AES-256 cryptography, sovereign identity, and peer-to-peer data integrity.',
    category: 'Technology & Freedom',
    city: 'Berlin',
    country: 'Germany',
    memberIds: ['usr_me', 'usr_2', 'usr_6'],
    createdAt: 'January 2025',
    isHot: true,
    bannerGradient: 'from-cyan-950/70 via-slate-900/60 to-pink-950/70',
    vibeStatement: 'Master keys stay in browser memory. Servers are dumb verifiable conduits.',
    rules: [
      'Share verifiable cryptographic insights and architecture whitepapers.',
      'Respect private profile vaults and encrypted channels.',
      'Promote decentralized and client-side tooling.',
    ],
  },
  {
    tag: 'Verse',
    name: '#Verse (London) Stream',
    description: 'Ambient soundscapes, acoustic melodies, and spoken word recordings harmonized with literary verse.',
    category: 'Music & Spoken Word',
    city: 'London',
    country: 'United Kingdom',
    memberIds: ['usr_me', 'usr_3', 'usr_1'],
    createdAt: 'March 2025',
    isHot: false,
    bannerGradient: 'from-violet-950/70 via-pink-950/60 to-slate-900/70',
    vibeStatement: 'Harmonizing acoustic frequency with contemplative writing.',
    rules: [
      'Share companion audio scores, sheet PDFs, and spoken recordings.',
      'Embrace ambient minimalism and late-night listening.',
    ],
  },
  {
    tag: 'deep_',
    name: '#deep_ (Tokyo) Stream',
    description: 'The core collective of deep_ network wanderers exploring intentional connection, mindful social presence, and creative digital life.',
    category: 'Network Ecosystem',
    city: 'Tokyo',
    country: 'Japan',
    memberIds: ['usr_me', 'usr_1', 'usr_2', 'usr_3', 'usr_4', 'usr_5', 'usr_6'],
    createdAt: 'January 2025',
    isHot: true,
    bannerGradient: 'from-pink-900/80 via-black to-pink-950/80',
    vibeStatement: 'Trading endless algorithmic loops for mindful focus and sovereign connections.',
    rules: [
      'Help fellow wanderers calibrate their encrypted vaults and feeds.',
      'Cultivate thoughtful, long-form discussion.',
    ],
  },
  {
    tag: 'Kyoto',
    name: '#Kyoto (Kyoto) Stream',
    description: 'Old quarter aesthetics, traditional calligraphy, bamboo gardens, and quiet contemplative moments from Kyoto.',
    category: 'Places & Aesthetics',
    city: 'Kyoto',
    country: 'Japan',
    memberIds: ['usr_me', 'usr_5'],
    createdAt: 'June 2025',
    isHot: false,
    bannerGradient: 'from-amber-950/70 via-stone-900/60 to-pink-950/70',
    vibeStatement: 'Rain on cedar roofs, tatami shadows, and timeless craftsmanship.',
  },
  {
    tag: 'Cipher',
    name: '#Cipher (Berlin) Stream',
    description: 'Cryptography riddles, steganography, mathematical verse, and concealed messages in art.',
    category: 'Cryptography & Riddles',
    city: 'Berlin',
    country: 'Germany',
    memberIds: ['usr_me', 'usr_1', 'usr_6'],
    createdAt: 'July 2025',
    isHot: false,
    bannerGradient: 'from-sky-950/70 via-slate-900/60 to-pink-950/70',
    vibeStatement: 'Finding meaning in hidden patterns and ancient ciphers.',
  },
  {
    tag: 'Minimalism',
    name: '#Minimalism (Reykjavik) Stream',
    description: 'Focusing on essential design, uncluttered mental spaces, and deliberate digital consumption.',
    category: 'Lifestyle & Philosophy',
    city: 'Reykjavik',
    country: 'Iceland',
    memberIds: ['usr_4', 'usr_5'],
    createdAt: 'April 2025',
    isHot: false,
    bannerGradient: 'from-slate-900 via-neutral-900 to-pink-950/50',
    vibeStatement: 'Less noise, deeper signal.',
  },
  {
    tag: 'Canals',
    name: '#Canals (Amsterdam) Stream',
    description: 'Letterpress publishing, sovereign bicycle culture, open-source printing salons, and reflective canal water stanzas.',
    category: 'Places & Reflections',
    city: 'Amsterdam',
    country: 'Netherlands',
    memberIds: ['usr_me', 'usr_2'],
    createdAt: 'May 2025',
    isHot: false,
    bannerGradient: 'from-amber-950/70 via-emerald-950/60 to-pink-950/70',
    vibeStatement: 'Quiet ripples beneath canal bridges, wooden letterpress ink, and unhurried thought.',
  },
  {
    tag: 'Hanok',
    name: '#Hanok (Seoul) Stream',
    description: 'Historic hanok courtyards, midnight tea houses, Korean hangul calligraphy, and indie analog zine presses.',
    category: 'Architecture & Solitude',
    city: 'Seoul',
    country: 'South Korea',
    memberIds: ['usr_me', 'usr_5'],
    createdAt: 'May 2025',
    isHot: false,
    bannerGradient: 'from-indigo-950/80 via-rose-950/60 to-slate-900/80',
    vibeStatement: 'Balancing ancient woodcraft with midnight contemplation in the quiet alleys.',
  },
];

/**
 * Normalizes a hashtag string (removes '#' and trims).
 */
export function normalizeTag(tag: string): string {
  return tag.replace(/^#+/, '').trim();
}

/**
 * Ensures that EVERY hashtag present in posts or trends has a corresponding Hashtag Group.
 */
export function getAllHashtagGroups(
  posts: Post[],
  trends: HashtagTrend[],
  customGroups: HashtagGroup[] = INITIAL_HASHTAG_GROUPS,
  allUsers: User[] = []
): HashtagGroup[] {
  const groupMap = new Map<string, HashtagGroup>();

  // 1. Seed with known groups
  (customGroups || INITIAL_HASHTAG_GROUPS).forEach((g) => {
    const cleanTag = normalizeTag(g.tag);
    const streamName = g.name.includes('(') ? g.name : formatStreamName(cleanTag, g.city, g.country);
    groupMap.set(cleanTag.toLowerCase(), {
      ...g,
      tag: cleanTag,
      name: streamName,
      memberIds: Array.from(new Set(g.memberIds || [])),
    });
  });

  // 2. Add from HashtagTrend items
  trends.forEach((t) => {
    const cleanTag = normalizeTag(t.tag);
    const key = cleanTag.toLowerCase();
    if (!groupMap.has(key)) {
      // Find author users who have posted in this hashtag
      const authors = posts
        .filter((p) => p.hashtags.some((h) => normalizeTag(h).toLowerCase() === key))
        .map((p) => p.authorId);

      const cityInfo = getCityForHashtag(cleanTag);

      groupMap.set(key, {
        tag: cleanTag,
        name: formatStreamName(cleanTag, cityInfo.city, cityInfo.country),
        description: t.description || `Community and shared creative stream for #${cleanTag} creators.`,
        category: t.category || 'Topic Stream',
        city: cityInfo.city,
        country: cityInfo.country,
        memberIds: Array.from(new Set(authors.length > 0 ? authors : ['usr_1'])),
        isHot: t.isHot,
        createdAt: '2025',
        bannerGradient: 'from-pink-950/70 via-purple-950/60 to-neutral-900',
        vibeStatement: `Discussions, works, and connections centered on #${cleanTag}.`,
      });
    }
  });

  // 3. Scan all posts for any unmapped hashtags
  posts.forEach((post) => {
    post.hashtags.forEach((h) => {
      const cleanTag = normalizeTag(h);
      const key = cleanTag.toLowerCase();
      if (cleanTag && !groupMap.has(key)) {
        const cityInfo = getCityForHashtag(cleanTag);
        groupMap.set(key, {
          tag: cleanTag,
          name: formatStreamName(cleanTag, cityInfo.city, cityInfo.country),
          description: `Stream for everything tagged #${cleanTag}. Join to connect with creators and integrate all #${cleanTag} content into your feed.`,
          category: 'Hashtag Stream',
          city: cityInfo.city,
          country: cityInfo.country,
          memberIds: [post.authorId],
          createdAt: '2026',
          isHot: false,
          bannerGradient: 'from-pink-900/50 via-neutral-900 to-pink-950/60',
          vibeStatement: `Shared depth score for #${cleanTag}.`,
        });
      } else if (cleanTag && groupMap.has(key)) {
        // Ensure author is included in member list if active in tag
        const existing = groupMap.get(key)!;
        if (!existing.memberIds.includes(post.authorId)) {
          existing.memberIds.push(post.authorId);
        }
      }
    });
  });

  // 4. Ensure mock users who joined specific group tags in user.joinedGroupTags are synced in group.memberIds
  allUsers.forEach((u) => {
    (u.joinedGroupTags || []).forEach((tag) => {
      const key = normalizeTag(tag).toLowerCase();
      const grp = groupMap.get(key);
      if (grp && !grp.memberIds.includes(u.id)) {
        grp.memberIds.push(u.id);
      }
    });
  });

  return Array.from(groupMap.values());
}

/**
 * Helper to generate all streams directly from trends, posts and users.
 */
export function generateHashtagGroups(
  trends: HashtagTrend[],
  posts: Post[],
  allUsers: User[] = []
): HashtagGroup[] {
  return getAllHashtagGroups(posts, trends, INITIAL_HASHTAG_GROUPS, allUsers);
}

export const getAllStreams = getAllHashtagGroups;
export const generateStreams = generateHashtagGroups;

export interface PostStreamInfo {
  tag: string;
  streamName: string;
  city?: string;
  country?: string;
  category?: string;
  points: number;
  level: number;
  rankTitle: string;
  badge: string;
  colorClass: string;
  isJoined: boolean;
  nextThreshold: number;
  progress: number;
}

export function getUserStreamPoints(tag: string, user?: User | null): number {
  if (!user || !user.groupPoints) return 0;
  const clean = normalizeTag(tag).toLowerCase();
  for (const [key, val] of Object.entries(user.groupPoints)) {
    if (normalizeTag(key).toLowerCase() === clean) {
      return typeof val === 'number' ? val : Number(val) || 0;
    }
  }
  return 0;
}

/**
 * Resolves the stream name that a post belongs to and the reader level that the user is in that stream.
 */
export function getPostStreamInfo(
  post: Post,
  user?: User | null,
  customGroups?: HashtagGroup[]
): PostStreamInfo {
  let selectedTag = '';
  const postTags = (post.hashtags || []).map((t) => normalizeTag(t)).filter(Boolean);

  if (postTags.length > 0) {
    // 1. Prioritize stream that user has joined
    const joinedMatch = postTags.find((t) =>
      (user?.joinedGroupTags || []).some((j) => normalizeTag(j).toLowerCase() === t.toLowerCase())
    );
    if (joinedMatch) {
      selectedTag = joinedMatch;
    } else {
      // 2. Prioritize stream where user has accumulated reading points
      const pointsMatch = postTags.find((t) => getUserStreamPoints(t, user) > 0);
      if (pointsMatch) {
        selectedTag = pointsMatch;
      } else {
        selectedTag = postTags[0];
      }
    }
  }

  // Fallback to post's city tag or 'General'
  if (!selectedTag) {
    const postCity = post.city || getCityForHashtag('General').city;
    selectedTag = postCity || 'General';
  }

  const cleanTag = normalizeTag(selectedTag);

  // Match against known custom groups or INITIAL_HASHTAG_GROUPS
  const allKnown = customGroups || INITIAL_HASHTAG_GROUPS;
  const matchedGroup = allKnown.find(
    (g) => normalizeTag(g.tag).toLowerCase() === cleanTag.toLowerCase()
  );

  let streamName = '';
  let city = '';
  let country = '';
  let category = '';

  if (matchedGroup) {
    streamName = matchedGroup.name.includes('(')
      ? matchedGroup.name
      : formatStreamName(cleanTag, matchedGroup.city, matchedGroup.country);
    city = matchedGroup.city;
    country = matchedGroup.country || '';
    category = matchedGroup.category;
  } else {
    const cityInfo = getCityForHashtag(cleanTag);
    const effectiveCity = post.city || cityInfo.city;
    const effectiveCountry = cityInfo.country;
    streamName = formatStreamName(cleanTag, effectiveCity, effectiveCountry);
    city = effectiveCity;
    country = effectiveCountry;
    category = 'Hashtag Stream';
  }

  const points = getUserStreamPoints(cleanTag, user);
  const rank = getGroupReadingRank(points);
  const isJoined = (user?.joinedGroupTags || []).some(
    (j) => normalizeTag(j).toLowerCase() === cleanTag.toLowerCase()
  );

  return {
    tag: cleanTag,
    streamName,
    city,
    country,
    category,
    points,
    level: rank.level,
    rankTitle: rank.rankTitle,
    badge: rank.badge,
    colorClass: rank.color,
    isJoined,
    nextThreshold: rank.nextThreshold,
    progress: rank.progress,
  };
}

