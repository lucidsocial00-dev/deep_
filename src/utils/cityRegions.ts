import { CityRegion, HashtagGroup, Post } from '../types';

export const CITY_REGIONS: CityRegion[] = [
  {
    id: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    coordinates: { lat: 35.0116, lng: 135.7681, xPercent: 82.5, yPercent: 43.5 },
    description: 'Traditional bamboo paths, ink poetry on wet cedar, tatami sanctuaries, and contemplative zen aesthetics.',
    gradient: 'from-amber-900/70 via-stone-900/60 to-pink-950/80',
    highlightTag: 'Kyoto',
    timezone: 'Asia/Tokyo',
    atmosphere: '🎋 Misty Bamboo Sanctuary',
    vibeQuote: 'Rain on cedar roofs, tatami shadows, and timeless craftsmanship.',
    flagEmoji: '🇯🇵',
    popularTags: ['Kyoto', 'Zen', 'Haiku', 'Tea'],
  },
  {
    id: 'berlin',
    name: 'Berlin',
    country: 'Germany',
    coordinates: { lat: 52.5200, lng: 13.4050, xPercent: 52.8, yPercent: 29.5 },
    description: 'Underground cryptography collectives, client-side encryption manifests, hardware modular synthesizers, and sovereign privacy networks.',
    gradient: 'from-cyan-950/80 via-slate-900/70 to-pink-950/80',
    highlightTag: 'Encrypted',
    timezone: 'Europe/Berlin',
    atmosphere: '⚡ High Privacy & Cryptographic Pulse',
    vibeQuote: 'Master keys stay in client memory. Servers are dumb verifiable pipes.',
    flagEmoji: '🇩🇪',
    popularTags: ['Encrypted', 'Cipher', 'Privacy', 'Cyber', 'Underground'],
  },
  {
    id: 'san_francisco',
    name: 'San Francisco',
    country: 'United States',
    coordinates: { lat: 37.7749, lng: -122.4194, xPercent: 19.5, yPercent: 39.8 },
    description: 'Zero-knowledge algorithms, decentralized identity protocols, mate compatibility matrices, and deep tech explorations.',
    gradient: 'from-fuchsia-900/70 via-pink-900/60 to-rose-950/80',
    highlightTag: 'Tech',
    timezone: 'America/Los_Angeles',
    atmosphere: '🌉 Pacific Fog & Sovereign Tech Hub',
    vibeQuote: 'Bonding over shared silence and disliking the same artificial distractions.',
    flagEmoji: '🇺🇸',
    popularTags: ['Tech', 'Mates', 'Crypto', 'AI', 'Sovereign'],
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    coordinates: { lat: 51.5074, lng: -0.1278, xPercent: 48.2, yPercent: 30.8 },
    description: 'Literary chapbooks, spoken word recordings, acoustic solitude scores, and rainy-day philosophical stanzas.',
    gradient: 'from-violet-950/80 via-pink-950/70 to-slate-900/80',
    highlightTag: 'Verse',
    timezone: 'Europe/London',
    atmosphere: '🌧️ Rainy Chapbook Salon & Spoken Word',
    vibeQuote: 'Harmonizing acoustic frequency with contemplative writing.',
    flagEmoji: '🇬🇧',
    popularTags: ['Verse', 'Literature', 'Acoustic', 'Essays'],
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    coordinates: { lat: 35.6762, lng: 139.6503, xPercent: 84.8, yPercent: 42.6 },
    description: 'Neon alleys, late-night deep_ network hubs, ambient sound design, and cyber-literary experimentation.',
    gradient: 'from-pink-900/80 via-purple-950/70 to-neutral-950',
    highlightTag: 'deep_',
    timezone: 'Asia/Tokyo',
    atmosphere: '🌌 Midnight Neon & Ambient Network Node',
    vibeQuote: 'Trading endless algorithmic loops for mindful focus and sovereign connections.',
    flagEmoji: '🇯🇵',
    popularTags: ['deep_', 'NeoTokyo', 'Ambient', 'Hardware'],
  },
  {
    id: 'reykjavik',
    name: 'Reykjavik',
    country: 'Iceland',
    coordinates: { lat: 64.1466, lng: -21.9426, xPercent: 42.5, yPercent: 18.5 },
    description: 'Basalt shores, aurora soundscapes, intentional minimalism, and undisturbed creative solitude.',
    gradient: 'from-slate-900 via-neutral-900 to-pink-950/70',
    highlightTag: 'Minimalism',
    timezone: 'Atlantic/Reykjavik',
    atmosphere: '❄️ Glacial Solitude & Aurora Haven',
    vibeQuote: 'Less noise, deeper signal.',
    flagEmoji: '🇮🇸',
    popularTags: ['Minimalism', 'Solitude', 'Aurora', 'Glacier'],
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    coordinates: { lat: 48.8566, lng: 2.3522, xPercent: 49.5, yPercent: 34.0 },
    description: 'Classical verse architecture, salon discourse, existential philosophy, and printed PDF chapbooks.',
    gradient: 'from-rose-950/80 via-stone-900/70 to-pink-950/80',
    highlightTag: 'Poetry',
    timezone: 'Europe/Paris',
    atmosphere: '🍷 Seine Salon & Stanza Architecture',
    vibeQuote: 'Rhyme, meter, metaphor, and emotional clarity over algorithmic noise.',
    flagEmoji: '🇫🇷',
    popularTags: ['Poetry', 'Philosophy', 'Art', 'Chapbook', 'Stanza'],
  },
  {
    id: 'new_york',
    name: 'New York',
    country: 'United States',
    coordinates: { lat: 40.7128, lng: -74.0060, xPercent: 29.2, yPercent: 36.8 },
    description: 'Nocturnal coffeehouse readings, jazz rhythm meters, indie cryptography, and urban stanza compositions.',
    gradient: 'from-amber-950/80 via-slate-900/70 to-pink-950/80',
    highlightTag: 'Mates',
    timezone: 'America/New_York',
    atmosphere: '🎷 Nocturnal Jazz & Indie Cipher Hub',
    vibeQuote: 'Finding depth amid the nocturnal pulse of the creative metropolis.',
    flagEmoji: '🇺🇸',
    popularTags: ['Night', 'Urban', 'Jazz', 'Indie'],
  },
  {
    id: 'amsterdam',
    name: 'Amsterdam',
    country: 'Netherlands',
    coordinates: { lat: 52.3676, lng: 4.9041, xPercent: 50.8, yPercent: 29.8 },
    description: 'Canal-side letterpress workshops, sovereign cycling routes, open-source printing salons, and reflective water stanzas.',
    gradient: 'from-amber-950/70 via-emerald-950/60 to-pink-950/80',
    highlightTag: 'Canals',
    timezone: 'Europe/Amsterdam',
    atmosphere: '🚲 Canal Printmakers & Open-Source Salons',
    vibeQuote: 'Quiet ripples beneath canal bridges, wooden letterpress ink, and unhurried thought.',
    flagEmoji: '🇳🇱',
    popularTags: ['Canals', 'Print', 'OpenSource', 'Bicycle', 'Typography'],
  },
  {
    id: 'seoul',
    name: 'Seoul',
    country: 'South Korea',
    coordinates: { lat: 37.5665, lng: 126.9780, xPercent: 80.2, yPercent: 40.2 },
    description: 'Historic hanok courtyards, midnight tea houses, Korean hangul calligraphy, and indie analog zine presses.',
    gradient: 'from-indigo-950/80 via-rose-950/60 to-slate-900/80',
    highlightTag: 'Hanok',
    timezone: 'Asia/Seoul',
    atmosphere: '🏮 Midnight Hanok & Calligraphy Courtyards',
    vibeQuote: 'Balancing ancient woodcraft with midnight contemplation in the quiet alleys.',
    flagEmoji: '🇰🇷',
    popularTags: ['Hanok', 'Calligraphy', 'TeaHouse', 'NightCity', 'Zines'],
  },
];

/**
 * Default city assignment map for hashtags.
 */
export const TAG_CITY_MAPPING: Record<string, string> = {
  kyoto: 'Kyoto',
  zen: 'Kyoto',
  haiku: 'Kyoto',
  tea: 'Kyoto',
  
  encrypted: 'Berlin',
  cyber: 'Berlin',
  cipher: 'Berlin',
  privacy: 'Berlin',
  underground: 'Berlin',

  tech: 'San Francisco',
  mates: 'San Francisco',
  crypto: 'San Francisco',
  ai: 'San Francisco',
  sovereign: 'San Francisco',

  verse: 'London',
  literature: 'London',
  acoustic: 'London',
  essays: 'London',

  deep_: 'Tokyo',
  neotokyo: 'Tokyo',
  ambient: 'Tokyo',
  hardware: 'Tokyo',

  minimalism: 'Reykjavik',
  solitude: 'Reykjavik',
  aurora: 'Reykjavik',
  glacier: 'Reykjavik',

  poetry: 'Paris',
  philosophy: 'Paris',
  art: 'Paris',
  chapbook: 'Paris',
  stanza: 'Paris',

  night: 'New York',
  urban: 'New York',
  jazz: 'New York',
  indie: 'New York',

  canals: 'Amsterdam',
  print: 'Amsterdam',
  opensource: 'Amsterdam',
  bicycle: 'Amsterdam',
  typography: 'Amsterdam',

  hanok: 'Seoul',
  calligraphy: 'Seoul',
  teahouse: 'Seoul',
  nightcity: 'Seoul',
  zines: 'Seoul',
};

/**
 * Derives a city for any given hashtag.
 */
export function getCityForHashtag(tag: string): { city: string; country: string } {
  const clean = tag.toLowerCase().replace(/^#+/, '').trim();
  const matchedCityName = TAG_CITY_MAPPING[clean];

  if (matchedCityName) {
    const region = CITY_REGIONS.find((r) => r.name.toLowerCase() === matchedCityName.toLowerCase());
    return {
      city: matchedCityName,
      country: region?.country || 'Global',
    };
  }

  // Deterministic fallback based on tag string hash
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CITY_REGIONS.length;
  const region = CITY_REGIONS[index];

  return {
    city: region.name,
    country: region.country,
  };
}

/**
 * Automatically calculates and assigns the geographic city and coordinates for any post.
 * Evaluates hashtags, content keywords, author city, or defaults to the primary node.
 */
export function getAutomaticCityForPost(
  post: { city?: string; hashtags?: string[]; content?: string },
  authorCity?: string
): { city: string; coordinates: { lat: number; lng: number } } {
  // 1. If explicit city is provided and valid
  if (post.city) {
    const region = CITY_REGIONS.find((r) => r.name.toLowerCase() === post.city?.toLowerCase());
    if (region) {
      return { city: region.name, coordinates: { lat: region.coordinates.lat, lng: region.coordinates.lng } };
    }
  }

  // 2. Check hashtags for direct city matches or mapped categories
  if (post.hashtags && post.hashtags.length > 0) {
    for (const tag of post.hashtags) {
      const clean = tag.toLowerCase().replace(/^#+/, '').trim();
      const directMatch = CITY_REGIONS.find((r) => r.name.toLowerCase() === clean || r.id.toLowerCase() === clean);
      if (directMatch) {
        return { city: directMatch.name, coordinates: { lat: directMatch.coordinates.lat, lng: directMatch.coordinates.lng } };
      }
      if (TAG_CITY_MAPPING[clean]) {
        const mapped = CITY_REGIONS.find((r) => r.name.toLowerCase() === TAG_CITY_MAPPING[clean].toLowerCase());
        if (mapped) {
          return { city: mapped.name, coordinates: { lat: mapped.coordinates.lat, lng: mapped.coordinates.lng } };
        }
      }
    }
  }

  // 3. Check content text for city name mentions
  if (post.content) {
    const lowerContent = post.content.toLowerCase();
    for (const region of CITY_REGIONS) {
      if (lowerContent.includes(region.name.toLowerCase())) {
        return { city: region.name, coordinates: { lat: region.coordinates.lat, lng: region.coordinates.lng } };
      }
    }
  }

  // 4. Fall back to author city
  if (authorCity) {
    const authorRegion = CITY_REGIONS.find((r) => r.name.toLowerCase() === authorCity.toLowerCase() || r.id === authorCity.toLowerCase());
    if (authorRegion) {
      return { city: authorRegion.name, coordinates: { lat: authorRegion.coordinates.lat, lng: authorRegion.coordinates.lng } };
    }
  }

  // 5. Default primary node (Kyoto)
  const defaultRegion = CITY_REGIONS[0];
  return {
    city: defaultRegion.name,
    coordinates: { lat: defaultRegion.coordinates.lat, lng: defaultRegion.coordinates.lng },
  };
}

/**
 * Gets all posts matching a specific city either directly via post.city or by matching hashtags.
 */
export function getPostsByCity(posts: Post[], cityName: string): Post[] {
  if (!cityName || cityName.toLowerCase() === 'all') return posts;
  const target = cityName.toLowerCase();

  return posts.filter((post) => {
    if (post.city && post.city.toLowerCase() === target) return true;
    return post.hashtags.some((h) => {
      const cityInfo = getCityForHashtag(h);
      return cityInfo.city.toLowerCase() === target;
    });
  });
}

/**
 * Groups hashtag groups by city.
 */
export function groupHashtagsByCity(
  groups: HashtagGroup[]
): Record<string, { city: CityRegion; groups: HashtagGroup[] }> {
  const result: Record<string, { city: CityRegion; groups: HashtagGroup[] }> = {};

  CITY_REGIONS.forEach((region) => {
    result[region.name] = {
      city: region,
      groups: [],
    };
  });

  groups.forEach((group) => {
    const cityName = group.city || getCityForHashtag(group.tag).city;
    if (!result[cityName]) {
      const foundRegion = CITY_REGIONS.find((r) => r.name.toLowerCase() === cityName.toLowerCase());
      result[cityName] = {
        city: foundRegion || {
          id: cityName.toLowerCase().replace(/\s+/g, '_'),
          name: cityName,
          country: group.country || 'Global',
          coordinates: { lat: 0, lng: 0, xPercent: 50, yPercent: 50 },
          description: `Hashtag groups and regional creators based in ${cityName}.`,
          gradient: 'from-pink-900/60 to-neutral-900',
          highlightTag: group.tag,
        },
        groups: [],
      };
    }
    result[cityName].groups.push({
      ...group,
      city: cityName,
    });
  });

  return result;
}

/**
 * Returns the most popular streams for a given city, ranked by member count, post volume, and hot momentum.
 */
export function getPopularStreamsForCity(
  groups: HashtagGroup[],
  cityName: string,
  allPosts: Post[] = []
): HashtagGroup[] {
  if (!cityName || cityName.toLowerCase() === 'all') {
    return [...groups].sort((a, b) => (b.memberIds?.length || 0) - (a.memberIds?.length || 0));
  }

  const cleanCity = cityName.toLowerCase().trim();
  const region = CITY_REGIONS.find((r) => r.name.toLowerCase() === cleanCity || r.id === cleanCity);
  const popularTags = (region?.popularTags || []).map((t) => t.toLowerCase());

  // Match streams explicitly tagged with city or belonging to popularTags
  const cityStreams = groups.filter((g) => {
    const streamCity = (g.city || getCityForHashtag(g.tag).city).toLowerCase();
    if (streamCity === cleanCity) return true;
    const cleanTag = g.tag.toLowerCase().replace(/^#+/, '');
    if (popularTags.includes(cleanTag)) return true;
    return false;
  });

  // Calculate popularity score for each stream
  return [...cityStreams].sort((a, b) => {
    const cleanA = a.tag.toLowerCase().replace(/^#+/, '');
    const cleanB = b.tag.toLowerCase().replace(/^#+/, '');

    const postsA = allPosts.filter((p) =>
      p.hashtags.some((h) => h.toLowerCase().replace(/^#+/, '') === cleanA)
    ).length;
    const postsB = allPosts.filter((p) =>
      p.hashtags.some((h) => h.toLowerCase().replace(/^#+/, '') === cleanB)
    ).length;

    const scoreA = (a.memberIds?.length || 0) * 3 + postsA * 2 + (a.isHot ? 15 : 0) + (cleanA === region?.highlightTag.toLowerCase() ? 25 : 0);
    const scoreB = (b.memberIds?.length || 0) * 3 + postsB * 2 + (b.isHot ? 15 : 0) + (cleanB === region?.highlightTag.toLowerCase() ? 25 : 0);

    return scoreB - scoreA;
  });
}

/**
 * Derives local time string for a given city.
 */
export function getCityLocalTime(cityName: string): string {
  const region = CITY_REGIONS.find(
    (r) => r.name.toLowerCase() === cityName.toLowerCase() || r.id === cityName.toLowerCase()
  );

  const timeZone = region?.timezone || 'UTC';
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });
    return formatter.format(new Date());
  } catch {
    return '12:00 PM';
  }
}

/**
 * Finds a CityRegion by city id, name, or hashtag name.
 */
export function findCityByNameOrTag(nameOrTag: string): CityRegion | null {
  if (!nameOrTag) return null;
  const clean = nameOrTag.toLowerCase().replace(/^#+/, '').trim();

  // Match by region id or region name
  const byRegion = CITY_REGIONS.find(
    (r) => r.id.toLowerCase() === clean || r.name.toLowerCase() === clean
  );
  if (byRegion) return byRegion;

  // Match by hashtag mapping
  const mappedCity = TAG_CITY_MAPPING[clean];
  if (mappedCity) {
    return CITY_REGIONS.find((r) => r.name.toLowerCase() === mappedCity.toLowerCase()) || null;
  }

  // Fallback to tag derivation
  const derived = getCityForHashtag(clean);
  return CITY_REGIONS.find((r) => r.name.toLowerCase() === derived.city.toLowerCase()) || null;
}

/**
 * Finds the closest city region given geographic coordinates or lat/lng numbers.
 */
export function findNearestCityRegion(
  latOrCoords?: number | { lat: number; lng: number } | null,
  lng?: number
): CityRegion {
  let lat = 0;
  let lon = 0;

  if (typeof latOrCoords === 'number') {
    lat = latOrCoords;
    lon = lng ?? 0;
  } else if (latOrCoords && typeof latOrCoords === 'object') {
    lat = latOrCoords.lat ?? 0;
    lon = latOrCoords.lng ?? 0;
  }

  let closest = CITY_REGIONS[0];
  let minDistance = Infinity;

  for (const region of CITY_REGIONS) {
    const dLat = region.coordinates.lat - lat;
    const dLng = region.coordinates.lng - lon;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < minDistance) {
      minDistance = dist;
      closest = region;
    }
  }
  return closest;
}

