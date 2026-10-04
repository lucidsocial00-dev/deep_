/**
 * Automatic Post Content Scanner & Intelligent Tag Generator
 * Analyzes content text, structure, audio, poetry form, documents, and locations
 * to automatically generate and curate contextual hashtags in real time.
 */

export interface ScannedTagResult {
  tags: string[];
  detectedThemes: string[];
  primaryCategory?: string;
  confidence: number;
  reasoning: string;
}

interface ScanParams {
  content: string;
  isPoetry?: boolean;
  isVoicePost?: boolean;
  isAdult?: boolean;
  hasDocument?: boolean;
  documentTitle?: string;
  documentExcerpt?: string;
  hasSong?: boolean;
  songGenre?: string;
  city?: string;
  moodLabel?: string;
}

interface RuleDefinition {
  tag: string;
  theme: string;
  keywords: string[];
  weight: number;
  condition?: (params: ScanParams) => boolean;
}

const SCANNER_RULES: RuleDefinition[] = [
  // Voice Post & Spoken Word
  {
    tag: 'VoicePost',
    theme: 'Voice Recording',
    keywords: ['voice', 'spoken', 'recording', 'audio verse', 'rec', 'speaking', 'microphone', 'mic', 'listen', 'cadence', 'soundwave'],
    weight: 3.5,
    condition: (p) => !!p.isVoicePost,
  },
  {
    tag: 'SpokenWord',
    theme: 'Spoken Word Performance',
    keywords: ['spoken word', 'spoken verse', 'oratory', 'monologue', 'vocal performance', 'intonation', 'speech'],
    weight: 3.0,
    condition: (p) => !!p.isVoicePost,
  },
  {
    tag: 'AudioVerse',
    theme: 'Audio Verse',
    keywords: ['audio verse', 'verse recording', 'spoken poetry', 'voice note', 'recited'],
    weight: 2.8,
  },

  // Poetry & Verse Form
  {
    tag: 'Poetry',
    theme: 'Poetry & Lyricism',
    keywords: ['poetry', 'poem', 'poet', 'stanza', 'verse', 'rhyme', 'sonnet', 'haiku', 'canto', 'couplet', 'quatrain', 'lyric', 'lines'],
    weight: 3.2,
    condition: (p) => !!p.isPoetry,
  },
  {
    tag: 'Verse',
    theme: 'Poetic Meter',
    keywords: ['verse', 'stanzas', 'meter', 'iambic', 'cadence', 'ballad', 'poetic', 'rhyming', 'versecraft'],
    weight: 2.8,
    condition: (p) => !!p.isPoetry,
  },

  // Cryptography, Encryption & Privacy
  {
    tag: 'Encrypted',
    theme: 'Cryptography & Zero-Knowledge',
    keywords: ['encrypt', 'encrypted', 'encryption', 'cipher', 'crypto', 'zero-knowledge', 'zk', 'private', 'privacy', 'keys', 'aes', 'hash', 'security', 'shield'],
    weight: 3.2,
  },
  {
    tag: 'Cipher',
    theme: 'Cryptographic Ciphers',
    keywords: ['cipher', 'ciphertext', 'decode', 'secret key', 'cryptogram', 'decryption', 'ciphers'],
    weight: 3.0,
  },
  {
    tag: 'Privacy',
    theme: 'Digital Privacy & Autonomy',
    keywords: ['privacy', 'private', 'anonymous', 'autonomy', 'surveillance', 'confidential', 'zero knowledge', 'untraceable'],
    weight: 2.6,
  },

  // Nocturnal & Night Reflections
  {
    tag: 'Nocturnal',
    theme: 'Nocturnal Reflections',
    keywords: ['nocturnal', 'midnight', 'night', 'dark', 'darkness', 'candle', 'lantern', 'shadow', 'shadows', 'twilight', 'moon', 'stars', 'dusk', 'nightfall', 'insomnia'],
    weight: 2.5,
  },
  {
    tag: 'Night',
    theme: 'Nightscape',
    keywords: ['night', 'after hours', 'late night', 'midnight', 'moonlit', 'dusk', 'evening'],
    weight: 2.2,
  },

  // Philosophy, Mind & Authenticity
  {
    tag: 'Philosophy',
    theme: 'Philosophy & Consciousness',
    keywords: ['philosophy', 'philosophical', 'truth', 'existence', 'existential', 'epistemology', 'consciousness', 'authenticity', 'authentic', 'meaning', 'soul', 'ethics', 'mind'],
    weight: 2.8,
  },
  {
    tag: 'Contemplative',
    theme: 'Quiet Contemplation',
    keywords: ['contemplate', 'contemplative', 'reflect', 'reflection', 'thought', 'meditate', 'ponder', 'solitude', 'introspection'],
    weight: 2.4,
  },
  {
    tag: 'deep_',
    theme: 'Deep Thought Network',
    keywords: ['deep', 'depth', 'authentic', 'connection', 'substance', 'meaningful', 'resonant', 'genuine'],
    weight: 2.0,
  },

  // Technology & Cybernetic Systems
  {
    tag: 'Tech',
    theme: 'Technology & Code',
    keywords: ['tech', 'technology', 'code', 'software', 'algorithm', 'system', 'network', 'computing', 'developer', 'hardware', 'interface', 'terminal'],
    weight: 2.7,
  },
  {
    tag: 'Cyber',
    theme: 'Cybernetic Infrastructure',
    keywords: ['cyber', 'cyberpunk', 'matrix', 'terminal', 'protocol', 'node', 'wire', 'decentralized', 'web3', 'digital'],
    weight: 2.6,
  },
  {
    tag: 'OpenSource',
    theme: 'Open Source Community',
    keywords: ['open source', 'opensource', 'git', 'repository', 'freedom', 'public domain', 'collaborative'],
    weight: 2.4,
  },

  // Zen & Serenity
  {
    tag: 'Zen',
    theme: 'Zen Minimalism',
    keywords: ['zen', 'bamboo', 'stillness', 'calm', 'quiet', 'silence', 'peace', 'tea', 'temple', 'tatami', 'garden', 'breathe'],
    weight: 2.9,
  },
  {
    tag: 'Solitude',
    theme: 'Sacred Solitude',
    keywords: ['solitude', 'alone', 'quietude', 'solitary', 'refuge', 'peaceful isolation'],
    weight: 2.5,
  },

  // Music, Sound & Tape
  {
    tag: 'Music',
    theme: 'Musical Composition',
    keywords: ['music', 'song', 'track', 'album', 'melody', 'harmony', 'tempo', 'audio', 'soundscape'],
    weight: 2.8,
    condition: (p) => !!p.hasSong,
  },
  {
    tag: 'Soundtrack',
    theme: 'Atmospheric Soundtrack',
    keywords: ['soundtrack', 'score', 'ambient', 'cinematic', 'composition', 'instrumental'],
    weight: 2.6,
    condition: (p) => !!p.hasSong,
  },
  {
    tag: 'Ambient',
    theme: 'Ambient Frequencies',
    keywords: ['ambient', 'drone', 'reverb', 'synth', 'pad', 'synthesizer', 'meditative sound'],
    weight: 2.5,
    condition: (p) => p.songGenre?.toLowerCase().includes('ambient') || false,
  },
  {
    tag: 'Acoustic',
    theme: 'Acoustic Resonance',
    keywords: ['acoustic', 'strings', 'guitar', 'pluck', 'wooden', 'unplugged', 'folk'],
    weight: 2.4,
    condition: (p) => p.songGenre?.toLowerCase().includes('acoustic') || false,
  },

  // Literature, Essays & Scholarly
  {
    tag: 'Literature',
    theme: 'Literature & Prose',
    keywords: ['literature', 'literary', 'book', 'author', 'manuscript', 'prose', 'text', 'novel', 'anthology', 'folio'],
    weight: 2.8,
    condition: (p) => !!p.hasDocument,
  },
  {
    tag: 'Essays',
    theme: 'Essays & Treatises',
    keywords: ['essay', 'essays', 'thesis', 'treatise', 'paper', 'manuscript', 'argument', 'discourse', 'commentary'],
    weight: 2.6,
    condition: (p) => !!p.hasDocument,
  },

  // Adult Swim / After-Hours
  {
    tag: 'AdultSwim',
    theme: 'Adult Swim Broadcast',
    keywords: ['adult swim', 'adultswim', 'late night broadcast', 'after hours', 'uncensored', 'explicit mix', 'raw stream'],
    weight: 3.5,
    condition: (p) => !!p.isAdult,
  },
  {
    tag: 'AfterHours',
    theme: 'After-Hours Stream',
    keywords: ['after hours', 'afterhours', 'late-night', 'night broadcast', '3am', 'closed blinds'],
    weight: 2.9,
    condition: (p) => !!p.isAdult,
  },

  // Geographic Nodes
  {
    tag: 'Kyoto',
    theme: 'Kyoto Node',
    keywords: ['kyoto', 'gion', 'kamogawa', 'arashiyama', 'tatami', 'heian'],
    weight: 3.0,
    condition: (p) => p.city?.toLowerCase() === 'kyoto',
  },
  {
    tag: 'Berlin',
    theme: 'Berlin Node',
    keywords: ['berlin', 'kreuzberg', 'mitte', 'spree', 'berghain', 'neukolln'],
    weight: 3.0,
    condition: (p) => p.city?.toLowerCase() === 'berlin',
  },
  {
    tag: 'Tokyo',
    theme: 'Tokyo Node',
    keywords: ['tokyo', 'shibuya', 'shinjuku', 'akihabara', 'roppongi', 'ginza'],
    weight: 3.0,
    condition: (p) => p.city?.toLowerCase() === 'tokyo',
  },
  {
    tag: 'Paris',
    theme: 'Paris Node',
    keywords: ['paris', 'seine', 'montmartre', 'marais', 'latin quarter', 'bastille'],
    weight: 3.0,
    condition: (p) => p.city?.toLowerCase() === 'paris',
  },
  {
    tag: 'NewYork',
    theme: 'New York Node',
    keywords: ['new york', 'nyc', 'manhattan', 'brooklyn', 'greenwich village', 'village'],
    weight: 3.0,
    condition: (p) => p.city?.toLowerCase().includes('new york'),
  },
  {
    tag: 'London',
    theme: 'London Node',
    keywords: ['london', 'bloomsbury', 'soho', 'thames', 'hackney', 'camden'],
    weight: 3.0,
    condition: (p) => p.city?.toLowerCase() === 'london',
  },
  {
    tag: 'Reykjavik',
    theme: 'Reykjavik Node',
    keywords: ['reykjavik', 'iceland', 'basalt', 'geothermal', 'aurora'],
    weight: 3.0,
    condition: (p) => p.city?.toLowerCase() === 'reykjavik',
  },
];

/**
 * Automatically scan post content, structure, and attachments
 * to generate ranked, relevant hashtags.
 */
export function scanPostContentForTags(params: ScanParams): ScannedTagResult {
  const fullText = [
    params.content || '',
    params.documentTitle || '',
    params.documentExcerpt || '',
    params.city || '',
    params.moodLabel || '',
  ].join(' ').toLowerCase();

  const scoredRules: { tag: string; theme: string; score: number }[] = [];

  for (const rule of SCANNER_RULES) {
    let score = 0;

    // Check custom condition bonus (e.g. poetryFormatted, isVoicePost, city match)
    if (rule.condition && rule.condition(params)) {
      score += rule.weight * 2.2;
    }

    // Keyword matching
    for (const kw of rule.keywords) {
      if (fullText.includes(kw)) {
        // Boost for whole-word matches
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        const match = regex.test(fullText);
        score += match ? rule.weight * 1.5 : rule.weight * 0.8;
      }
    }

    if (score > 0) {
      scoredRules.push({
        tag: rule.tag,
        theme: rule.theme,
        score,
      });
    }
  }

  // Sort by highest relevance score
  scoredRules.sort((a, b) => b.score - a.score);

  // Take top unique tags (up to 5 tags)
  const uniqueTags: string[] = [];
  const detectedThemes: string[] = [];

  for (const r of scoredRules) {
    if (!uniqueTags.includes(r.tag)) {
      uniqueTags.push(r.tag);
      if (!detectedThemes.includes(r.theme)) {
        detectedThemes.push(r.theme);
      }
    }
    if (uniqueTags.length >= 5) break;
  }

  // Default fallback tags if content is short or minimal
  if (uniqueTags.length === 0) {
    if (params.isVoicePost) {
      uniqueTags.push('VoicePost', 'SpokenWord');
      detectedThemes.push('Voice Recording');
    } else if (params.isPoetry) {
      uniqueTags.push('Poetry', 'Verse');
      detectedThemes.push('Poetry & Lyricism');
    } else if (params.isAdult) {
      uniqueTags.push('AdultSwim', 'AfterHours');
      detectedThemes.push('Adult Swim Broadcast');
    } else {
      uniqueTags.push('deep_', 'Philosophy');
      detectedThemes.push('Deep Thought Network');
    }
  }

  // Primary category summary
  const primaryCategory = detectedThemes[0] || 'General Verse';
  const confidence = Math.min(0.98, Math.max(0.65, 0.5 + uniqueTags.length * 0.1));
  const reasoning = detectedThemes.length > 0
    ? `Content scanned: Detected ${detectedThemes.slice(0, 3).join(' • ')}`
    : 'Automatically scanned text content and semantic themes.';

  return {
    tags: uniqueTags,
    detectedThemes,
    primaryCategory,
    confidence,
    reasoning,
  };
}
