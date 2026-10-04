export interface ReadingLink {
  id: string;
  url: string;
  title: string;
  domain: string;
  excerpt?: string;
  wordCount: number;
  estimatedMinutes: number;
  readingPoints: number; // Base points + duration points + longform bonus
  hashtag: string; // The specific hashtag group this reading is for (e.g. "Poetry", "Encrypted", "deep_")
  hashtagTag?: string; // Optional alias for hashtag
  difficulty: 'Quick Read' | 'Moderate Read' | 'Deep Dive' | 'Longform Scholarly';
  author?: string;
  readTimeFormatted?: string;
  addedAt?: string;
  completedBy?: string[]; // User IDs
}

export interface ReadingProgressRecord {
  id?: string;
  linkId: string;
  url: string;
  title?: string;
  hashtag: string;
  hashtagTag?: string;
  pointsEarned: number;
  estimatedMinutes: number;
  completedAt: string;
}

export interface PDFDocument {
  id: string;
  title: string;
  fileName: string;
  fileSize: string;
  totalPages: number;
  excerptText: string;
  fullText: string;
  fileDataUrl?: string; // base64 data url or blob url
  category: 'Poetry' | 'Essay' | 'Research' | 'Journal' | 'Manifesto' | 'Document';
  uploadedAt: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  likesCount: number;
  userLiked?: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  votedUserIds?: string[];
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVotedOptionId?: string;
  expiresAt?: string;
}

export interface PostMood {
  emoji: string;
  label: string;
}

export interface WaveformComment {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  timestampSeconds: number; // e.g. 45
  content: string;
  createdAt: string; // e.g. "Just now"
  likesCount?: number;
  color?: string; // highlight tone
}

export interface PostVoiceNote {
  id: string;
  audioUrl?: string;
  durationSeconds: number; // e.g. 14
  durationFormatted?: string; // e.g. "0:14"
  waveformPeaks?: number[]; // Normalized amplitude peaks between 0.1 and 1.0
  transcript?: string;
  recordedAt?: string;
}

export interface PostSong {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: string; // e.g. "3:45"
  durationSeconds?: number;
  coverArt?: string;
  genre?: string; // e.g. "Ambient", "Lo-Fi", "Acoustic", "Synthesizer", "Jazz"
  audioUrl?: string;
  synthPreset?: 'ambient_calm' | 'lofi_tape' | 'acoustic_strings' | 'night_jazz' | 'deep_drone';
  bpm?: number;
  savedFromPostId?: string;
  savedFromAuthorName?: string;
  savedFromAuthorHandle?: string;
  savedAt?: string;
  waveformComments?: WaveformComment[];
  waveformPeaks?: number[];
}

export interface PostFireBoost {
  active: boolean;
  pointsSpent: number;
  boostScore: number; // Numerical priority boost to place higher in feed order
  activatedAt: string;
}

export interface PostFireGlow {
  active: boolean;
  pointsSpent: number;
  glowStyle?: 'flame' | 'neon' | 'amber';
  activatedAt: string;
}

export interface PostFireMultiplier {
  active: boolean;
  multiplierFactor: number; // e.g. 2, 3, 5
  cyclesRemaining: number;
  totalCycles: number;
  pointsSpent: number;
  activatedAt: string;
}

export interface ViralContagionEvent {
  id: string;
  timestamp: string;
  viewerId: string;
  viewerName: string;
  viewerHandle: string;
  viewerAvatar?: string;
  infectedUserIds: string[];
  infectedUserNames: string[];
  newInfectionsCount: number;
  totalInfectionsAfter: number;
  bountyPointsEarned: number;
  lifespanRemainingAfter: number;
  notes?: string;
}

export interface PostFireViral {
  active: boolean;
  pointsSpent: number;
  infectedProfileIds: string[];
  infectedProfileNames: string[];
  fadeAwayRemainingViews: number; // Cycles/views until contagion fades away
  totalInfections: number;
  activatedAt: string;
  fadedAway?: boolean;
  contagionEvents?: ViralContagionEvent[];
  lastContagionEvent?: ViralContagionEvent;
}

export interface PostFirePowerUps {
  sourceGroupTag?: string; // The specific hashtag group that fueled or is attached to the power-ups
  boost?: PostFireBoost;
  glow?: PostFireGlow;
  multiplier?: PostFireMultiplier;
  viral?: PostFireViral;
}

export type QuoteCardBackground = 'neon' | 'aurora' | 'parchment' | 'noir' | 'emerald' | 'sunset';

export interface QuoteCardData {
  id: string;
  quoteText: string;
  sourceTitle: string;
  sourceType: 'poetry' | 'pdf';
  sourceAuthor?: string;
  sourceAuthorAvatar?: string;
  sourceId?: string; // post ID or doc ID
  sourceDoc?: PDFDocument;
  visualBackground: QuoteCardBackground;
  fontStyle?: 'serif' | 'sans' | 'mono';
  annotation?: string; // Optional user commentary/thoughts
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  timestamp: string;
  content: string;
  poetryFormatted?: boolean;
  hashtags: string[];
  document?: PDFDocument;
  quoteCard?: QuoteCardData; // Attached special styled visual Quote Card
  image?: string;
  song?: PostSong; // Attached audio song / musical piece
  voiceNote?: PostVoiceNote; // Attached recorded voice note / spoken word
  isVoicePost?: boolean; // Post marked as voice post
  readingLink?: ReadingLink;
  readingLinks?: ReadingLink[]; // Up to 3 attached reading links in a post
  poll?: Poll; // Attached interactive poll with multiple options
  mood?: PostMood; // Attached emoji and mood label
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  sharesCount?: number;
  sharedBy?: string[];
  sharedFrom?: {
    authorId: string;
    authorName: string;
    authorHandle: string;
    authorAvatar: string;
    postId: string;
    content: string;
    timestamp: string;
  };
  userReaction?: 'like' | 'dislike' | null;
  likedBy: string[]; // user IDs
  dislikedBy: string[]; // user IDs
  comments: Comment[];
  city?: string;
  coordinates?: { lat: number; lng: number };
  firePowerUps?: PostFirePowerUps;
  isInfected?: boolean; // When true or when viral power-up is actively spreading
  isAdult?: boolean; // 18+ Adult Swim late-night uncensored stream post
}

export interface CityRegion {
  id: string;
  name: string; // e.g. "Kyoto", "Tokyo", "Berlin", "San Francisco", "London", "Reykjavik", "New York", "Paris"
  country: string;
  coordinates: { lat: number; lng: number; xPercent: number; yPercent: number };
  description: string;
  gradient: string;
  highlightTag: string;
  timezone?: string;
  atmosphere?: string;
  vibeQuote?: string;
  flagEmoji?: string;
  popularTags?: string[];
}

export interface BookmarkFolder {
  id: string; // e.g. 'memes' | 'music' | 'general' | 'custom_...'
  name: string; // e.g. 'Meme Collections' | 'Music' | 'General Vault'
  icon?: string; // 'Smile' | 'Music' | 'Bookmark' | 'Folder'
  description?: string;
  isSystem?: boolean;
}

export interface SavedBookmark {
  id: string;
  type: 'post' | 'pdf';
  postId?: string;
  docId?: string;
  post?: Post;
  document?: PDFDocument;
  savedAt: string;
  userNotes?: string;
  folderId?: string;
  folderIds?: string[];
}

export interface DecryptedVaultData {
  privateNotes: string;
  secretInterests: string[];
  privateLocation: string;
  contactEmail: string;
  emergencyKeyHash: string;
  savedBookmarks?: SavedBookmark[];
}

export interface EncryptedProfileVault {
  ciphertext: string;
  iv: string;
  salt: string;
  keyFingerprint: string;
  algorithm: 'AES-256-GCM / PBKDF2';
  lastUpdated: string;
}

export type MemeReactionKey = 'lol' | 'cringe' | 'dank' | 'fire' | 'dead';

export interface MemeItem {
  id: string;
  title: string;
  url: string;
  caption?: string;
  topText?: string;
  bottomText?: string;
  category: 'Cyberpunk' | 'AI & Tech' | 'Philosophy' | 'Reaction' | 'Dank' | 'Wholesome' | 'Crypto' | 'Custom';
  tags: string[];
  likesCount: number;
  isLiked?: boolean;
  collectedAt: string;
  source?: string;
  spicinessScore?: number; // 1-5 🔥
  authorName?: string;
  authorAvatar?: string;
  reactions?: Partial<Record<MemeReactionKey, number>>;
  userReactions?: MemeReactionKey[];
}

export interface UserPhoto {
  id: string;
  url: string;
  caption: string;
  uploadedAt: string;
  category?: string;
  tags: string[];
  isPrivate?: boolean;
  likesCount?: number;
  location?: string;
}

export interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  location: string;
  verified: boolean;
  joinDate: string;
  likedPostIds: string[];
  dislikedPostIds: string[];
  savedPostIds?: string[];
  savedDocIds?: string[];
  savedSongIds?: string[]; // IDs of songs saved from posts into the music library
  savedSongs?: PostSong[]; // Full saved song objects in music library
  savedPostFolders?: Record<string, string[]>; // mapping of postId -> array of folder IDs (e.g. ['memes', 'music'])
  customBookmarkFolders?: BookmarkFolder[];
  collectedMemes?: MemeItem[];
  friends: string[]; // user IDs
  joinedGroupTags?: string[]; // hashtag group tags the user has joined (e.g. ['Poetry', 'Encrypted'])
  vaultLocked: boolean;
  encryptedVault?: EncryptedProfileVault;
  decryptedData?: DecryptedVaultData;
  photos?: UserPhoto[];
  groupPoints?: Record<string, number>; // Points earned in each hashtag group (e.g. { Poetry: 140, Encrypted: 80 })
  totalReadingPoints?: number;
  completedReadings?: ReadingProgressRecord[];
  compatibilityBonuses?: Record<string, number>; // user_id -> match percentage bonus/penalty (+8, -4, etc)
  compatibilityAnswers?: Record<string, CompatibilityAnswerRecord[]>;
  unlockedBadgeIds?: string[];
  featuredBadgeId?: string;
  isAgeVerified?: boolean; // 18+ verification for Adult Swim feed
  ageVerifiedAt?: string;
  interests?: string[]; // Core interest topics (e.g. ['Poetry', 'Cryptography', 'Ambient Music'])
  city?: string; // Standardized city name
}

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type BadgeCategory = 'milestones' | 'streams' | 'poetry' | 'vault' | 'community';

export interface MilestoneBadge {
  id: string;
  title: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  iconName: string;
  badgeSymbol: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
  requirementText: string;
  currentProgress: number;
  maxProgress: number;
  progressPercent: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  unlockedReason?: string;
  specialEffect?: string;
}

export interface CompatibilityOption {
  id: string;
  text: string;
  subtitle?: string;
}

export interface CompatibilityQuestion {
  id: string;
  question: string;
  category: 'Aesthetics & Poetry' | 'Deep Philosophy' | 'Creative Rhythm' | 'Discernment & Values' | 'Night Owl vs Dawn' | 'Privacy & Cipher';
  options: CompatibilityOption[];
  senderAnswer?: string; // option id
  receiverAnswer?: string; // option id
  isAnsweredBySender: boolean;
  isAnsweredByReceiver: boolean;
  scoreMatchDelta: number; // e.g. +7
  scoreDivergeDelta: number; // e.g. -3
  resolved?: boolean;
}

export interface CompatibilityAnswerRecord {
  questionId: string;
  question: string;
  category?: string;
  userAnswerText: string;
  partnerAnswerText: string;
  isMatch?: boolean;
  scoreDelta?: number;
  scoreShift?: number;
  answeredAt: string;
}

export interface HashtagGroup {
  tag: string; // clean tag without hash, e.g. "Poetry"
  name: string; // e.g. "#Poetry Stream"
  description: string;
  category: string;
  city: string; // Primary city node e.g. "Kyoto", "Tokyo", "Berlin", "San Francisco", "London", "Reykjavik", "Paris", "New York"
  country?: string;
  coordinates?: { lat: number; lng: number };
  memberIds: string[]; // List of user IDs who have joined this stream
  createdAt?: string;
  isHot?: boolean;
  bannerGradient?: string;
  vibeStatement?: string;
  rules?: string[];
  curatedReadings?: ReadingLink[];
}

export type HashtagStream = HashtagGroup;
export type Stream = HashtagGroup;

export interface HashtagTrend {
  tag: string;
  postCount: number;
  category: string;
  isHot?: boolean;
  description?: string;
  samplePosts?: string[];
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isEncrypted: boolean;
  attachedDocument?: PDFDocument;
  compatibilityQuestion?: CompatibilityQuestion;
  attachedReadingLink?: ReadingLink;
  attachedPost?: Post;
}

export interface ChatConversation {
  id: string;
  participant: User;
  lastMessage: DirectMessage;
  messages?: DirectMessage[];
  unreadCount: number;
}

export interface PollAlignmentItem {
  postId: string;
  question: string;
  userAChoice: string;
  userBChoice: string;
  isAgreement: boolean;
  scoreImpact: number;
}

export interface CompatibilityResult {
  userA: User;
  userB: User;
  matchPercentage: number;
  mutualLikesCount: number;
  mutualDislikesCount: number;
  totalComparisons: number;
  mutualLikedPosts: Post[];
  mutualDislikedPosts: Post[];
  differingLikedPosts: Post[];
  pollAlignments?: PollAlignmentItem[];
  pollAgreementsCount?: number;
  pollBonusPercentage?: number;
  aiAnalysis?: string;
  synergyHighlights?: string[];
  aiVibeTitle?: string;
}
