/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { PostCard } from './components/PostCard';
import { HashtagTrendsView } from './components/HashtagTrendsView';
import { HashtagGroupDetailModal } from './components/HashtagGroupDetailModal';
import { EncryptedProfileView } from './components/EncryptedProfileView';
import { PDFsLibraryView } from './components/PDFsLibraryView';
import { SavedPostsView } from './components/SavedPostsView';
import { MemoriesLibraryCombinedView } from './components/MemoriesLibraryCombinedView';
import { MemeCreatorView } from './components/MemeCreatorView';
import { MemeCollectorView } from './components/MemeCollectorView';
import { MusicLibraryView } from './components/MusicLibraryView';
import { FeedNewPostComposer } from './components/FeedNewPostComposer';
import { FeedViewsDropdown, FeedFilterMode } from './components/FeedViewsDropdown';
import { StarfieldWarpOverlay } from './components/StarfieldWarpOverlay';
import { AccelerometerHUD } from './components/AccelerometerHUD';
import { AnimatedBackground } from './components/AnimatedBackground';
import { PDFViewerModal } from './components/PDFViewerModal';
import { CompatibilityModal } from './components/CompatibilityModal';
import { ReadingEstimatorModal } from './components/ReadingEstimatorModal';
import { ReadingViewModal } from './components/ReadingViewModal';
import { ChatPopupWindow } from './components/ChatPopupWindow';
import { UploadProfilePhotoModal } from './components/UploadProfilePhotoModal';
import { CityStreamsShowcasePage } from './components/CityStreamsShowcasePage';
import { FriendMoodFeedPage } from './components/FriendMoodFeedPage';
import { MusicFeedBanner } from './components/MusicFeedBanner';
import { AdultSwimAgeGateModal } from './components/AdultSwimAgeGateModal';
import { AdultSwimFeedBanner } from './components/AdultSwimFeedBanner';
import { FindFriendsView } from './components/FindFriendsView';
import { CityLeaderboardWidget } from './components/CityLeaderboardWidget';
import { VibeTrendsWidget } from './components/VibeTrendsWidget';
import { analyzePostVibe } from './utils/sentiment';
import { CreateQuoteCardModal } from './components/CreateQuoteCardModal';
import { motion, AnimatePresence } from 'motion/react';

import {
  MOCK_POSTS,
  MOCK_HASHTAGS,
  MOCK_USERS,
  MOCK_PDFS,
  MOCK_CHAT_CONVERSATIONS,
  CURRENT_USER,
} from './data/mockData';
import {
  ChatConversation,
  CompatibilityAnswerRecord,
  CompatibilityQuestion,
  DirectMessage,
  HashtagGroup,
  PDFDocument,
  Poll,
  PollOption,
  Post,
  ReadingLink,
  User,
  UserPhoto,
  BookmarkFolder,
  PostSong,
  WaveformComment,
  ViralContagionEvent,
} from './types';
import { calculateCompatibility } from './utils/compatibility';
import { COMPATIBILITY_QUESTIONS, getSimulatedPeerAnswer } from './utils/compatibilityQuestions';
import { generateHashtagGroups, formatStreamName } from './utils/hashtagGroups';
import { getCityForHashtag, getAutomaticCityForPost } from './utils/cityRegions';
import { getGroupReadingRank, getPointsBreakdown, getCumulativeReaderRank, getUserCumulativeReadingPoints } from './utils/readingEstimator';
import { triggerLikeVibration, triggerDislikeVibration, triggerReadingRankBadgeVibration } from './utils/haptics';
import {
  Flame,
  Sparkles,
  Hash,
  Heart,
  FileText,
  Filter,
  VolumeX,
  Volume2,
  UserPlus,
  Users,
  UserCheck,
  Search,
  X,
  UserSearch,
  PlusCircle,
  Bookmark,
  Zap,
  MapPin,
  FolderHeart,
  Camera,
  BarChart2,
  Smile,
  Music,
  Radio,
  TrendingUp,
  ArrowRight,
  Moon,
  Mic,
  MicOff,
  Feather,
  BookOpen,
} from 'lucide-react';

// Staggered fade-in variants for feed stream
const feedListContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.065,
      delayChildren: 0.02,
    },
  },
};

const feedItemVariants = {
  hidden: {
    opacity: 0,
    y: 22,
    scale: 0.985,
    filter: 'blur(3px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      opacity: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
      y: { type: 'spring', stiffness: 280, damping: 25, mass: 0.85 },
      scale: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
      filter: { duration: 0.25 },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -14,
    filter: 'blur(3px)',
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

export default function App() {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<
    'feed' | 'hashtags' | 'meme_creator' | 'meme_collector' | 'memories_library' | 'saved' | 'vault' | 'library' | 'music_library' | 'find_friends'
  >('feed');

  // Application State
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
  const [hashtags, setHashtags] = useState(MOCK_HASHTAGS);
  const [pdfs, setPdfs] = useState<PDFDocument[]>(MOCK_PDFS);
  const [conversations, setConversations] = useState<ChatConversation[]>(MOCK_CHAT_CONVERSATIONS);

  // Real-time Feed Drop Tracking for staggered fade-in highlighting
  const [recentNewPostIds, setRecentNewPostIds] = useState<string[]>([]);
  const simulationPoolIndex = useRef(0);

  // Hashtag Group Hubs State
  const [activeGroupDetail, setActiveGroupDetail] = useState<HashtagGroup | null>(null);

  // Dynamic derivation of all Hashtag Groups from trends, posts & users
  const hashtagGroups = useMemo(() => {
    return generateHashtagGroups(hashtags, posts, allUsers);
  }, [hashtags, posts, allUsers]);

  // Modal / Drawer States
  const [activeCityPage, setActiveCityPage] = useState<string | null>(null);
  const [activeFriendMoodPage, setActiveFriendMoodPage] = useState<{ emoji: string; label: string } | null>(null);
  const [activePdfDoc, setActivePdfDoc] = useState<PDFDocument | null>(null);
  const [activeReadingLink, setActiveReadingLink] = useState<ReadingLink | null>(null);
  const [readingLinkSource, setReadingLinkSource] = useState<{
    type: 'chat' | 'feed' | 'group' | 'saved';
    chatId?: string;
    chatTitle?: string;
  } | null>(null);
  const [isEstimatorModalOpen, setIsEstimatorModalOpen] = useState(false);
  const [estimatorInitialTag, setEstimatorInitialTag] = useState('Poetry');
  const [isChatPopupOpen, setIsChatPopupOpen] = useState(false);
  const [popupActiveChatId, setPopupActiveChatId] = useState<string | null>(null);

  // Quote Card Creation Modal State
  const [quoteCardModalState, setQuoteCardModalState] = useState<{
    quoteText: string;
    sourceTitle: string;
    sourceType: 'poetry' | 'pdf';
    sourceAuthor?: string;
    sourceAuthorAvatar?: string;
    sourceId?: string;
    sourceDoc?: PDFDocument;
  } | null>(null);
  const [selectedCompatibilityUser, setSelectedCompatibilityUser] = useState<User | null>(null);
  const [selectedHashtagFilter, setSelectedHashtagFilter] = useState<string | null>(null);
  const [selectedVibeFilter, setSelectedVibeFilter] = useState<string | null>(null);
  const [feedFilterMode, setFeedFilterMode] = useState<FeedFilterMode>('all');
  const [selectedMusicGenre, setSelectedMusicGenre] = useState<string>('all');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string | null>(null);

  // Adult Swim 18+ Age Verification Gate State
  const [isAdultVerified, setIsAdultVerified] = useState<boolean>(() => {
    try {
      return localStorage.getItem('deep_adult_swim_verified') === 'true';
    } catch {
      return false;
    }
  });
  const [userAge, setUserAge] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem('deep_adult_swim_age');
      return stored ? parseInt(stored, 10) || null : null;
    } catch {
      return null;
    }
  });
  const [showAdultAgeGateModal, setShowAdultAgeGateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  const handleToggleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setToastNotification({
        title: 'Voice Search Unavailable',
        message: 'SpeechRecognition API is not supported in this browser.',
        iconType: 'sparkles',
      });
      return;
    }

    if (isVoiceSearching && speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsVoiceSearching(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsVoiceSearching(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setSearchQuery(transcript);
          const inputEl = document.getElementById('feed-search-input') as HTMLInputElement | null;
          if (inputEl) {
            inputEl.value = transcript;
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        setIsVoiceSearching(false);
      };

      recognition.onend = () => {
        setIsVoiceSearching(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsVoiceSearching(false);
    }
  };

  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [warpingTag, setWarpingTag] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [toastNotification, setToastNotification] = useState<{
    title: string;
    message: string;
    badge?: string;
    iconType?: 'heart' | 'poll' | 'sparkles' | 'shield' | 'discovery' | 'trending';
    action?: {
      label: string;
      onClick: () => void;
    };
    streamTag?: string;
    velocityMetric?: string;
  } | null>(null);
  const [isUploadAvatarModalOpen, setIsUploadAvatarModalOpen] = useState(false);

  const mutedUserIds = currentUser.mutedUserIds || [];

  // Track notified milestone thresholds per poll to prevent duplicate alerts
  const notifiedPollMilestonesRef = useRef<Set<string>>(new Set());

  // Auto-dismiss toast notification with optional action button & duration
  const triggerToast = (
    title: string,
    message: string,
    badge?: string,
    iconType?: 'heart' | 'poll' | 'sparkles' | 'shield' | 'discovery' | 'trending',
    action?: { label: string; onClick: () => void },
    duration = 4500,
    extra?: { streamTag?: string; velocityMetric?: string }
  ) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastNotification({
      title,
      message,
      badge,
      iconType,
      action,
      streamTag: extra?.streamTag,
      velocityMetric: extra?.velocityMetric,
    });
    toastTimeoutRef.current = setTimeout(() => {
      setToastNotification(null);
    }, duration);
  };

  // Trigger Discovery Notification for joined hashtag experiencing a high-velocity spike
  const triggerDiscoveryNotification = (tag: string, velocitySpikeRate?: string) => {
    const clean = tag.replace(/^#+/, '');
    const velocity = velocitySpikeRate || `+${Math.floor(220 + Math.random() * 160)}% velocity spike`;

    // Mark hashtag as hot / trending in hashtag lists
    setHashtags((prev) =>
      prev.map((h) => {
        if (
          h.tag.toLowerCase() === clean.toLowerCase() ||
          h.tag.replace(/^#+/, '').toLowerCase() === clean.toLowerCase()
        ) {
          return { ...h, isHot: true, postCount: (h.postCount || 100) + 24 };
        }
        return h;
      })
    );

    triggerReadingRankBadgeVibration();

    triggerToast(
      `📡 Discovery: #${clean} Trending Spike!`,
      `A hashtag you joined (#${clean}) is experiencing a sudden, high-velocity surge in post activity! Fresh stanzas and creator notes are surging right now.`,
      '⚡ Trending Status',
      'discovery',
      {
        label: `Jump into #${clean} Stream →`,
        onClick: () => {
          setToastNotification(null);
          setActiveCityPage(null);
          setActiveTab('feed');
          handleHashtagClick(clean);
        },
      },
      9500,
      {
        streamTag: clean,
        velocityMetric: velocity,
      }
    );
  };

  // Track recent post timestamps per hashtag to detect sudden high-velocity spikes
  const hashtagVelocityTrackerRef = useRef<Map<string, number[]>>(new Map());
  const lastSpikeNotifiedRef = useRef<Map<string, number>>(new Map());

  const checkHashtagVelocitySpike = (tags: string[]) => {
    if (!tags || tags.length === 0) return;
    const now = Date.now();
    const joinedTags = (currentUser.joinedGroupTags || []).map((t) =>
      t.toLowerCase().replace(/^#+/, '')
    );

    tags.forEach((rawTag) => {
      const clean = rawTag.toLowerCase().replace(/^#+/, '');
      if (!joinedTags.includes(clean)) return;

      const tracker = hashtagVelocityTrackerRef.current;
      const history = tracker.get(clean) || [];
      // Keep timestamps within last 3 minutes (180,000 ms)
      const recent = [...history.filter((ts) => now - ts < 180000), now];
      tracker.set(clean, recent);

      const lastNotified = lastSpikeNotifiedRef.current.get(clean) || 0;
      // High-velocity spike threshold: 2 or more posts within recent window on a joined stream
      if (recent.length >= 2 && now - lastNotified > 35000) {
        lastSpikeNotifiedRef.current.set(clean, now);
        const displayTag =
          (currentUser.joinedGroupTags || []).find(
            (t) => t.toLowerCase().replace(/^#+/, '') === clean
          ) || clean;
        const velocityPercentage = `+${Math.floor(190 + recent.length * 50 + Math.random() * 40)}% velocity spike`;
        triggerDiscoveryNotification(displayTag, velocityPercentage);
      }
    });
  };

  // Simulate a sudden high-velocity spike on a joined hashtag
  const handleSimulateVelocitySpike = (specificTag?: string) => {
    const joined = currentUser.joinedGroupTags || ['Poetry'];
    const chosenTag =
      specificTag || joined[Math.floor(Math.random() * joined.length)] || 'Poetry';
    const clean = chosenTag.replace(/^#+/, '');

    // Add 2 simulated rapid stanzas for this stream to make feed match the spike
    const spikePosts: Post[] = [
      {
        id: `spike_${Date.now()}_1`,
        authorId: 'usr_1',
        authorName: 'Elena Rostova',
        authorHandle: '@elena_verse',
        authorAvatar:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
        city: 'Paris',
        content: `⚡ High-velocity verse surge on #${clean}! Waves of live creative stanzas rippling through the sovereign stream node. #deep_ #${clean}`,
        poetryFormatted: true,
        hashtags: [`#${clean}`, '#deep_'],
        timestamp: 'Just now',
        likesCount: 16,
        dislikesCount: 0,
        commentsCount: 4,
        sharesCount: 7,
        likedBy: [],
        dislikedBy: [],
        comments: [],
      },
      {
        id: `spike_${Date.now()}_2`,
        authorId: 'usr_5',
        authorName: 'Ren Tanaka',
        authorHandle: '@ren_zen',
        authorAvatar:
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
        city: 'Kyoto',
        content: `Resonance multiplier active on #${clean}—collective stanzas multiplying in real-time. #${clean} #Zen`,
        poetryFormatted: true,
        hashtags: [`#${clean}`, '#Zen'],
        timestamp: 'Just now',
        likesCount: 22,
        dislikesCount: 0,
        commentsCount: 6,
        sharesCount: 11,
        likedBy: [],
        dislikedBy: [],
        comments: [],
      },
    ];

    setPosts((prev) => [...spikePosts, ...prev]);
    setRecentNewPostIds((prev) => [spikePosts[0].id, spikePosts[1].id, ...prev]);

    const spikeVelocity = `+${Math.floor(260 + Math.random() * 120)}% velocity spike`;
    triggerDiscoveryNotification(clean, spikeVelocity);
  };

  // Initial demo discovery notification after initial browsing so users experience the spike alert
  const hasTriggeredInitialDiscoveryRef = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasTriggeredInitialDiscoveryRef.current && (currentUser.joinedGroupTags || []).length > 0) {
        hasTriggeredInitialDiscoveryRef.current = true;
        const joined = currentUser.joinedGroupTags!;
        const pick = joined[0] || 'Poetry';
        triggerDiscoveryNotification(pick, '+310% velocity spike');
      }
    }, 16000);

    return () => clearTimeout(timer);
  }, [currentUser.joinedGroupTags]);

  // Profile Avatar Update Handler
  const handleUpdateAvatar = (newAvatarUrl: string, addToGallery?: boolean) => {
    setCurrentUser((prev) => {
      let updatedPhotos = prev.photos || [];
      if (addToGallery) {
        const newPhoto: UserPhoto = {
          id: `photo_${Date.now()}`,
          url: newAvatarUrl,
          caption: 'Profile Avatar',
          tags: ['#Avatar', '#deep_'],
          location: prev.location,
          uploadedAt: 'Just now',
          isPrivate: false,
          likesCount: 0,
        };
        updatedPhotos = [newPhoto, ...updatedPhotos];
      }
      return {
        ...prev,
        avatar: newAvatarUrl,
        photos: updatedPhotos,
      };
    });

    // Update posts authored by the user to immediately reflect their new avatar
    setPosts((prev) =>
      prev.map((p) => (p.authorId === currentUser.id ? { ...p, authorAvatar: newAvatarUrl } : p))
    );

    triggerToast('✨ Avatar Updated', 'Your profile picture has been updated across the network!');
  };

  // Global reactive monitor for reading rank promotions and new reading badges
  const prevCumulativeLevelRef = useRef<number>(
    getCumulativeReaderRank(getUserCumulativeReadingPoints(currentUser)).level
  );
  const prevGroupLevelsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const cumulativePoints = getUserCumulativeReadingPoints(currentUser);
    const cumRank = getCumulativeReaderRank(cumulativePoints);
    let didRankUp = false;

    if (cumRank.level > prevCumulativeLevelRef.current) {
      didRankUp = true;
      prevCumulativeLevelRef.current = cumRank.level;
    }

    if (currentUser.groupPoints) {
      for (const [tag, pts] of Object.entries(currentUser.groupPoints)) {
        const groupRank = getGroupReadingRank(typeof pts === 'number' ? pts : Number(pts) || 0);
        const prevLvl = prevGroupLevelsRef.current[tag];
        if (prevLvl !== undefined && groupRank.level > prevLvl) {
          didRankUp = true;
        }
        prevGroupLevelsRef.current[tag] = groupRank.level;
      }
    }

    if (didRankUp) {
      triggerReadingRankBadgeVibration();
    }
  }, [currentUser.totalReadingPoints, currentUser.groupPoints]);

  // Reading Link Point Claim & Completion Handler
  const handleCompleteReading = (reading: ReadingLink) => {
    const points = reading.readingPoints || getPointsBreakdown(reading.estimatedMinutes).total;
    const rawTag = reading.hashtag || reading.hashtagTag || 'Poetry';
    const cleanTag = rawTag.replace(/^#+/, '');

    const previousPoints = ((currentUser.groupPoints && currentUser.groupPoints[cleanTag]) || 0);
    const prevRank = getGroupReadingRank(previousPoints);
    const newPoints = previousPoints + points;
    const rank = getGroupReadingRank(newPoints);

    if (rank.level > prevRank.level) {
      triggerReadingRankBadgeVibration();
    }

    setCurrentUser((prev) => {
      const currentPts = (prev.groupPoints && prev.groupPoints[cleanTag]) || 0;
      const newPts = currentPts + points;
      const newGroupPoints = {
        ...(prev.groupPoints || {}),
        [cleanTag]: newPts,
      };

      const existingRecords = prev.completedReadings || [];
      const isAlreadyDone = existingRecords.some((r) => r.linkId === reading.id || r.url === reading.url);

      const newRecord = {
        id: `cpr_${Date.now()}`,
        linkId: reading.id,
        url: reading.url,
        title: reading.title,
        hashtag: cleanTag,
        hashtagTag: cleanTag,
        pointsEarned: points,
        estimatedMinutes: reading.estimatedMinutes,
        completedAt: 'Just now',
      };

      const newTotal = Object.values(newGroupPoints).reduce<number>((s, v) => s + (Number(v) || 0), 0);

      return {
        ...prev,
        groupPoints: newGroupPoints,
        totalReadingPoints: Math.max(prev.totalReadingPoints || 0, newTotal),
        completedReadings: isAlreadyDone ? existingRecords : [newRecord, ...existingRecords],
      };
    });

    triggerToast(
      `🎉 +${points} Points Earned in #${cleanTag}!`,
      `You completed "${reading.title.slice(0, 45)}...". Your rank in #${cleanTag} is now ${rank.badge} Level ${rank.level}!`
    );
  };

  // Direct Claim Reading Points for any Post with Auto-Estimated Reading Time
  const handleClaimReadingPointsForPost = (post: Post, points: number, hashtag: string) => {
    const cleanTag = (hashtag || post.hashtags?.[0] || 'Poetry').replace(/^#+/, '');

    const previousPoints = ((currentUser.groupPoints && currentUser.groupPoints[cleanTag]) || 0);
    const prevRank = getGroupReadingRank(previousPoints);
    const newPoints = previousPoints + points;
    const rank = getGroupReadingRank(newPoints);

    if (rank.level > prevRank.level) {
      triggerReadingRankBadgeVibration();
    }

    setCurrentUser((prev) => {
      const currentPts = (prev.groupPoints && prev.groupPoints[cleanTag]) || 0;
      const newPts = currentPts + points;
      const newGroupPoints = {
        ...(prev.groupPoints || {}),
        [cleanTag]: newPts,
      };

      const existingRecords = prev.completedReadings || [];
      const isAlreadyDone = existingRecords.some(
        (r) => r.linkId === post.id || (post.readingLink && (r.linkId === post.readingLink.id || r.url === post.readingLink.url))
      );
      if (isAlreadyDone) return prev;

      const newRecord = {
        id: `cpr_${Date.now()}`,
        linkId: post.id,
        url: post.readingLink?.url || '',
        title: post.readingLink?.title || post.document?.title || post.content.slice(0, 45),
        hashtag: cleanTag,
        hashtagTag: cleanTag,
        pointsEarned: points,
        estimatedMinutes: Math.max(1, Math.round(points / 10)),
        completedAt: 'Just now',
      };

      const newTotal = Object.values(newGroupPoints).reduce<number>((s, v) => s + (Number(v) || 0), 0);

      return {
        ...prev,
        groupPoints: newGroupPoints,
        totalReadingPoints: Math.max(prev.totalReadingPoints || 0, newTotal),
        completedReadings: [newRecord, ...existingRecords],
      };
    });

    triggerToast(
      `🎉 +${points} Reading Points Added in #${cleanTag}!`,
      `You read the post by ${post.authorName}. Your reader rank in #${cleanTag} is now ${rank.badge} Level ${rank.level}!`
    );
  };

  // Save Estimated Reading Link from Modal Handler
  const handleSaveEstimatedReading = (reading: ReadingLink) => {
    // Optionally create a new post with this reading link attached
    const rawTag = reading.hashtag || reading.hashtagTag || 'Poetry';
    const cleanTag = rawTag.replace(/^#+/, '');
    // Automatically resolve location for the new post
    const locationInfo = getAutomaticCityForPost(
      { hashtags: [`#${cleanTag}`, '#deep_', '#Readings'] },
      currentUser.city
    );

    const newPost: Post = {
      id: `post_${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorHandle: currentUser.handle,
      authorAvatar: currentUser.avatar,
      timestamp: 'Just now',
      city: locationInfo.city,
      coordinates: locationInfo.coordinates,
      content: `Shared reading for #${cleanTag}: "${reading.title}" (${reading.readTimeFormatted || `${reading.estimatedMinutes} min read`}, +${reading.readingPoints} points for readers). 📖✨`,
      hashtags: [`#${cleanTag}`, '#deep_', '#Readings'],
      readingLink: reading,
      likesCount: 1,
      dislikesCount: 0,
      commentsCount: 0,
      userReaction: 'like',
      likedBy: [currentUser.id],
      dislikedBy: [],
      comments: [],
    };

    setPosts((prev) => [newPost, ...prev]);
    setRecentNewPostIds((prev) => [newPost.id, ...prev.slice(0, 8)]);
    setIsEstimatorModalOpen(false);
    triggerToast(
      `📖 Reading Link Added to #${cleanTag}`,
      `"${reading.title}" is now published to the stream and available for members to read and earn points!`
    );
  };

  // Open Reading Link with Source Context (Supports getting back to chat)
  const handleOpenReadingLink = (
    link: ReadingLink,
    source?: { type: 'chat' | 'feed' | 'group' | 'saved'; chatId?: string; chatTitle?: string }
  ) => {
    setActiveReadingLink(link);
    if (source) {
      setReadingLinkSource(source);
    } else if (isChatPopupOpen) {
      const targetC = conversations.find((c) => c.id === popupActiveChatId) || conversations[0];
      setReadingLinkSource({
        type: 'chat',
        chatId: targetC?.id || 'chat_1',
        chatTitle: targetC?.participant?.name || 'Chat',
      });
    } else {
      setReadingLinkSource(null);
    }
  };

  // Back to original chat screen handler when reading in chat (restores corner chat)
  const handleBackToChat = () => {
    const targetChatId = readingLinkSource?.chatId || popupActiveChatId || conversations[0]?.id || 'chat_1';
    const targetChat = conversations.find((c) => c.id === targetChatId) || conversations[0];

    // Close reading modal
    setActiveReadingLink(null);
    setReadingLinkSource(null);

    // Make sure the conversation is selected & popup is opened in the bottom-right corner
    if (targetChatId) {
      setPopupActiveChatId(targetChatId);
    }
    setIsChatPopupOpen(true);

    triggerToast(
      '💬 Returned to Chat',
      `Back in your chat with ${targetChat?.participant?.name || 'your contact'} in the corner window.`,
      'CHAT',
      'sparkles'
    );
  };

  // Award Points for Viral Infections (+25 Group Points per infected profile to the post's funding group)
  const handleAwardViralInfectionPoints = (infectionCount: number, reason: string, targetGroupTag?: string) => {
    if (infectionCount <= 0) return;
    const POINTS_PER_INFECTION = 25;
    const pointsEarned = infectionCount * POINTS_PER_INFECTION;
    const groupName = (targetGroupTag || 'Poetry').replace(/^#+/, '') || 'Poetry';

    setCurrentUser((prev) => {
      const currentPts = (prev.groupPoints && prev.groupPoints[groupName]) || 0;
      const newGroupPts = currentPts + pointsEarned;
      const newGroupPoints = {
        ...(prev.groupPoints || {}),
        [groupName]: newGroupPts,
      };

      const newRecord = {
        id: `cpr_viral_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        linkId: `viral_reward_${Date.now()}`,
        url: '',
        title: `Viral Infection Bounty (+${pointsEarned} pts to #${groupName}): ${reason}`,
        hashtag: `#${groupName}`,
        hashtagTag: groupName,
        pointsEarned,
        estimatedMinutes: Math.max(1, Math.round(pointsEarned / 10)),
        completedAt: 'Just now',
      };

      const existingRecords = prev.completedReadings || [];
      const newTotal = (prev.totalReadingPoints || 0) + pointsEarned;

      return {
        ...prev,
        groupPoints: newGroupPoints,
        totalReadingPoints: newTotal,
        completedReadings: [newRecord, ...existingRecords],
      };
    });

    triggerReadingRankBadgeVibration();
  };

  // Apply Post Fire Power-Ups (1. Post Boost, 2. Post Glow, 3. Post Multiplier, 4. Viral Posts)
  const handleApplyFirePowerUp = (
    postId: string,
    powerUpType: 'boost' | 'glow' | 'multiplier' | 'viral',
    cost: number,
    params?: {
      boostScore?: number;
      multiplierFactor?: number;
      totalCycles?: number;
    },
    groupTag?: string
  ) => {
    const targetPost = posts.find((p) => p.id === postId);
    const fundingTag = (
      groupTag ||
      targetPost?.firePowerUps?.sourceGroupTag ||
      (targetPost?.hashtags && targetPost.hashtags[0]?.replace(/^#+/, '')) ||
      'Poetry'
    ).replace(/^#+/, '');

    // Check points in the selected hashtag group
    const currentGroupPts = (currentUser.groupPoints && currentUser.groupPoints[fundingTag]) || 0;
    if (currentGroupPts < cost) {
      triggerToast(
        `⚠️ Insufficient Points in #${fundingTag}`,
        `You need ${cost} points from #${fundingTag} group to activate this power-up (you have ${currentGroupPts} pts). Read posts in #${fundingTag} or click "+100 pts" in the Fire menu!`,
        `Low #${fundingTag} Pts`,
        'sparkles'
      );
      return;
    }

    // Deduct points from user's hashtag group
    setCurrentUser((prev) => {
      const prevGroupPts = (prev.groupPoints && prev.groupPoints[fundingTag]) || 0;
      const newGroupPts = Math.max(0, prevGroupPts - cost);
      const newGroupPoints = {
        ...(prev.groupPoints || {}),
        [fundingTag]: newGroupPts,
      };
      const prevTotal = prev.totalReadingPoints || 0;
      const newTotal = Math.max(0, prevTotal - cost);

      return {
        ...prev,
        groupPoints: newGroupPoints,
        totalReadingPoints: newTotal,
      };
    });

    const nowStr = new Date().toISOString();
    let toastTitle = '';
    let toastMessage = '';
    let toastBadge = '';

    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id !== postId) return p;
        const existingPowerUps = p.firePowerUps || {};

        if (powerUpType === 'boost') {
          const boostScore = params?.boostScore || 100;
          const newScore = (existingPowerUps.boost?.boostScore || 0) + boostScore;
          toastTitle = '🔥 Post Boosted to Top of Feed!';
          toastMessage = `Spent ${cost} pts from #${fundingTag}. Priority boost score is now +${newScore}. This post floats to the top of feed order!`;
          toastBadge = '⚡ Priority Boost';

          return {
            ...p,
            firePowerUps: {
              ...existingPowerUps,
              sourceGroupTag: fundingTag,
              boost: {
                active: true,
                pointsSpent: (existingPowerUps.boost?.pointsSpent || 0) + cost,
                boostScore: newScore,
                activatedAt: nowStr,
              },
            },
          };
        }

        if (powerUpType === 'glow') {
          toastTitle = '✨ Post Radiant Glow Activated!';
          toastMessage = `Spent ${cost} pts from #${fundingTag}. Your post is now wrapped in an unmissable fiery neon radiant aura!`;
          toastBadge = '🔥 Radiant Glow';

          return {
            ...p,
            firePowerUps: {
              ...existingPowerUps,
              sourceGroupTag: fundingTag,
              glow: {
                active: true,
                pointsSpent: (existingPowerUps.glow?.pointsSpent || 0) + cost,
                glowStyle: 'flame',
                activatedAt: nowStr,
              },
            },
          };
        }

        if (powerUpType === 'multiplier') {
          const factor = params?.multiplierFactor || 3;
          const cycles = params?.totalCycles || 3;
          toastTitle = `⚡ Post Multiplier (${factor}x) Active!`;
          toastMessage = `Spent ${cost} pts from #${fundingTag}. Post duration is multiplied across ${cycles} active feed cycles.`;
          toastBadge = `${factor}x Multiplier`;

          return {
            ...p,
            firePowerUps: {
              ...existingPowerUps,
              sourceGroupTag: fundingTag,
              multiplier: {
                active: true,
                multiplierFactor: factor,
                cyclesRemaining: cycles,
                totalCycles: cycles,
                pointsSpent: (existingPowerUps.multiplier?.pointsSpent || 0) + cost,
                activatedAt: nowStr,
              },
            },
          };
        }

        if (powerUpType === 'viral') {
          // Immediately spread to the feeds of everyone that the viewer knows
          const viewerFriends = currentUser.friends || [];
          const knownUsers = allUsers.filter((u) => viewerFriends.includes(u.id));
          const knownIds = knownUsers.map((u) => u.id);
          const knownNames = knownUsers.map((u) => u.handle || u.name);

          const existingIds = existingPowerUps.viral?.infectedProfileIds || [];
          const existingNames = existingPowerUps.viral?.infectedProfileNames || [];
          const mergedIds = Array.from(new Set([...existingIds, ...knownIds]));
          const mergedNames = Array.from(new Set([...existingNames, ...knownNames]));
          const newInfectionsCount = mergedIds.filter((id) => !existingIds.includes(id)).length;
          const pointsEarned = newInfectionsCount * 25;

          if (newInfectionsCount > 0) {
            setTimeout(() => {
              handleAwardViralInfectionPoints(
                newInfectionsCount,
                `Initial contagion spread to ${newInfectionsCount} contact${newInfectionsCount > 1 ? 's' : ''}`,
                fundingTag
              );
            }, 50);
          }

          toastTitle = '☣️ Viral Contagion Unleashed!';
          toastMessage = newInfectionsCount > 0
            ? `Spent ${cost} pts from #${fundingTag}. Contagion immediately infected ${knownNames.join(', ')}! You earned +${pointsEarned} pts into #${fundingTag} (+25 pts/infection)!`
            : `Spent ${cost} pts from #${fundingTag}. Contagion active! Every profile infected will earn you +25 pts into #${fundingTag}.`;
          toastBadge = newInfectionsCount > 0 ? `+${pointsEarned} pts Earned` : '☣️ Viral Contagion';

          return {
            ...p,
            firePowerUps: {
              ...existingPowerUps,
              sourceGroupTag: fundingTag,
              viral: {
                active: true,
                pointsSpent: (existingPowerUps.viral?.pointsSpent || 0) + cost,
                infectedProfileIds: mergedIds,
                infectedProfileNames: mergedNames,
                fadeAwayRemainingViews: 6,
                totalInfections: mergedIds.length,
                activatedAt: nowStr,
                fadedAway: false,
              },
            },
          };
        }

        return p;
      })
    );

    triggerReadingRankBadgeVibration();
    triggerToast(toastTitle, toastMessage, toastBadge, 'sparkles');
  };

  // Spread viral contagion whenever a viral post is viewed by a user, tracking unique infections as Contagion Events
  const handleViralPostViewed = (postId: string, viewerUser?: User) => {
    const viewer = viewerUser || currentUser;
    if (!viewer) return;

    setPosts((prevPosts) => {
      let newlyInfectedCount = 0;
      let newlyInfectedHandles: string[] = [];
      let remainingViews = 0;
      let isFaded = false;
      let targetPostAuthor = '';

      const updated = prevPosts.map((p) => {
        if (p.id !== postId) return p;
        const v = p.firePowerUps?.viral;
        if (!v || !v.active || v.fadedAway) return p;

        targetPostAuthor = p.authorName;

        // Everyone that the current viewer knows (viewer's friends list)
        const viewerFriendIds = viewer.friends || [];
        const existingInfectedIds = new Set(v.infectedProfileIds || []);

        // Candidates: everyone the viewer knows + viewer themselves (if viewer is not author and not already infected)
        const candidateProfiles: { id: string; name: string; handle: string }[] = [];

        if (viewer.id !== p.authorId && !existingInfectedIds.has(viewer.id)) {
          candidateProfiles.push({
            id: viewer.id,
            name: viewer.name,
            handle: viewer.handle,
          });
        }

        viewerFriendIds.forEach((friendId) => {
          const matchedUser = allUsers.find((u) => u.id === friendId);
          if (matchedUser) {
            candidateProfiles.push({
              id: matchedUser.id,
              name: matchedUser.name,
              handle: matchedUser.handle,
            });
          } else {
            candidateProfiles.push({
              id: friendId,
              name: `Contact ${friendId.slice(-4)}`,
              handle: `@contact_${friendId.slice(-4)}`,
            });
          }
        });

        // Filter to UNIQUE new infections (not already infected)
        const uniqueNewInfections: { id: string; name: string; handle: string }[] = [];
        const seenInBatch = new Set<string>();

        for (const cand of candidateProfiles) {
          if (!existingInfectedIds.has(cand.id) && !seenInBatch.has(cand.id)) {
            seenInBatch.add(cand.id);
            uniqueNewInfections.push(cand);
          }
        }

        const uniqueNewIds = uniqueNewInfections.map((c) => c.id);
        const uniqueNewHandles = uniqueNewInfections.map((c) => c.handle || c.name);

        const currentRemaining = typeof v.fadeAwayRemainingViews === 'number' ? v.fadeAwayRemainingViews : 6;
        const nextRemaining = Math.max(0, currentRemaining - 1);
        const nextFaded = nextRemaining <= 0;

        remainingViews = nextRemaining;
        isFaded = nextFaded;

        const mergedIds = [...(v.infectedProfileIds || []), ...uniqueNewIds];
        const mergedNames = [...(v.infectedProfileNames || []), ...uniqueNewHandles];
        newlyInfectedCount = uniqueNewIds.length;
        newlyInfectedHandles = uniqueNewHandles;

        // Build the ViralContagionEvent object
        const contagionEvent: ViralContagionEvent = {
          id: `contagion_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          viewerId: viewer.id,
          viewerName: viewer.name,
          viewerHandle: viewer.handle,
          viewerAvatar: viewer.avatar,
          infectedUserIds: uniqueNewIds,
          infectedUserNames: uniqueNewHandles,
          newInfectionsCount: uniqueNewIds.length,
          totalInfectionsAfter: mergedIds.length,
          bountyPointsEarned: uniqueNewIds.length * 25,
          lifespanRemainingAfter: nextRemaining,
          notes: uniqueNewIds.length > 0
            ? `Viewed by ${viewer.handle} → Contagion spread to ${uniqueNewIds.length} contact${uniqueNewIds.length > 1 ? 's' : ''}`
            : `Viewed by ${viewer.handle} (all known contacts were already infected)`,
        };

        return {
          ...p,
          firePowerUps: {
            ...p.firePowerUps,
            viral: {
              ...v,
              infectedProfileIds: mergedIds,
              infectedProfileNames: mergedNames,
              totalInfections: mergedIds.length,
              fadeAwayRemainingViews: nextRemaining,
              fadedAway: nextFaded,
              active: !nextFaded,
              contagionEvents: [contagionEvent, ...(v.contagionEvents || [])],
              lastContagionEvent: contagionEvent,
            },
          },
        };
      });

      if (newlyInfectedCount > 0) {
        setTimeout(() => {
          const targetPost = prevPosts.find((p) => p.id === postId);
          const postGroup = (
            targetPost?.firePowerUps?.sourceGroupTag ||
            (targetPost?.hashtags && targetPost.hashtags[0]?.replace(/^#+/, '')) ||
            'Poetry'
          ).replace(/^#+/, '');
          handleAwardViralInfectionPoints(
            newlyInfectedCount,
            `Contagion Event: ${viewer.handle} viewed post → spread to ${newlyInfectedHandles.join(', ')}`,
            postGroup
          );
          triggerToast(
            `☣️ Contagion Event (+${newlyInfectedCount * 25} pts to #${postGroup})!`,
            `Viral post viewed by ${viewer.handle}! Automatically spread to the feeds of ${newlyInfectedHandles.join(', ')}. (${remainingViews} views left)`,
            `+${newlyInfectedCount * 25} pts`,
            'sparkles'
          );
        }, 50);
      } else if (targetPostAuthor) {
        setTimeout(() => {
          triggerToast(
            '👁️ Contagion View Recorded',
            `Viral post viewed by ${viewer.handle}. Contagion event logged (${remainingViews} views remaining).`,
            'Contagion Event',
            'shield'
          );
        }, 50);
      }

      if (isFaded && targetPostAuthor) {
        setTimeout(() => {
          triggerToast(
            '💨 Contagion Faded Away',
            `Viral outbreak on ${targetPostAuthor}'s post has concluded its contagion lifespan!`,
            'Faded Away',
            'shield'
          );
        }, 650);
      }

      return updated;
    });
  };

  // Simulate Viral Contagion Spread to Next Profile (invoking handleViralPostViewed)
  const handleSimulateInfectNextProfile = (postId: string) => {
    const targetPost = posts.find((p) => p.id === postId);
    const viral = targetPost?.firePowerUps?.viral;
    const currentInfected = new Set(viral?.infectedProfileIds || []);
    const candidateViewer = allUsers.find((u) => !currentInfected.has(u.id)) || allUsers[1] || currentUser;
    handleViralPostViewed(postId, candidateViewer);
  };

  // Advance Feed Cycle (simulates cycle progression for multipliers & viral posts)
  const handleAdvanceFeedCycle = () => {
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (!p.firePowerUps) return p;
        let updatedMultiplier = p.firePowerUps.multiplier;
        let updatedViral = p.firePowerUps.viral;

        if (updatedMultiplier?.active) {
          const newCycles = updatedMultiplier.cyclesRemaining - 1;
          updatedMultiplier = {
            ...updatedMultiplier,
            cyclesRemaining: Math.max(0, newCycles),
            active: newCycles > 0,
          };
        }

        if (updatedViral?.active && !updatedViral.fadedAway) {
          const newViews = updatedViral.fadeAwayRemainingViews - 1;
          updatedViral = {
            ...updatedViral,
            fadeAwayRemainingViews: Math.max(0, newViews),
            active: newViews > 0,
            fadedAway: newViews <= 0,
          };
        }

        return {
          ...p,
          firePowerUps: {
            ...p.firePowerUps,
            multiplier: updatedMultiplier,
            viral: updatedViral,
          },
        };
      })
    );

    triggerToast(
      '🔄 Feed Cycle Advanced',
      'Advanced 1 feed cycle! Multiplier lifespans and viral fade-away counters updated.',
      'Feed Cycle',
      'sparkles'
    );
  };

  // Claim Free Points for quick testing in a specific hashtag group
  const handleClaimFreeSparks = (targetGroupTag?: string) => {
    const groupName = (targetGroupTag || 'Poetry').replace(/^#+/, '') || 'Poetry';
    setCurrentUser((prev) => {
      const newTotal = (prev.totalReadingPoints || 0) + 100;
      const currentPts = (prev.groupPoints && prev.groupPoints[groupName]) || 0;
      const newGroup = {
        ...(prev.groupPoints || {}),
        [groupName]: currentPts + 100,
      };
      return {
        ...prev,
        totalReadingPoints: newTotal,
        groupPoints: newGroup,
      };
    });
    triggerLikeVibration();
    triggerToast(
      `⚡ +100 Points Added to #${groupName}!`,
      `Points balance in #${groupName} increased. Use them to boost posts, ignite glows, multiply cycles, or start viral outbreaks!`,
      `+100 #${groupName}`,
      'sparkles'
    );
  };

  // Mute User Handler (Removes their posts from feed and friend suggestions)
  const handleMuteUser = (userId: string, userName: string, userHandle: string) => {
    setCurrentUser((prev) => {
      const existing = prev.mutedUserIds || [];
      if (existing.includes(userId)) return prev;
      return {
        ...prev,
        mutedUserIds: [...existing, userId],
      };
    });
    triggerToast(
      `🔇 Muted ${userHandle}`,
      `All posts from ${userName} are now removed from your feed and hidden from friend suggestions.`
    );
  };

  // Unmute User Handler
  const handleUnmuteUser = (userId: string, userName?: string) => {
    setCurrentUser((prev) => ({
      ...prev,
      mutedUserIds: (prev.mutedUserIds || []).filter((id) => id !== userId),
    }));
    triggerToast(
      '🔊 User Unmuted',
      `${userName ? userName : 'The user'} has been unmuted. Their posts will appear in your feed again.`
    );
  };

  // Poll Voting Handler
  const handleVotePoll = (postId: string, optionId: string) => {
    let authorUser: User | undefined;
    let oldCompPercentage = 0;
    let newCompPercentage = 0;
    let authorName = '';
    let authorId = '';

    setPosts((prevPosts) => {
      const targetPost = prevPosts.find((p) => p.id === postId);
      if (targetPost && targetPost.authorId !== currentUser.id) {
        authorId = targetPost.authorId;
        authorName = targetPost.authorName;
        authorUser = allUsers.find((u) => u.id === targetPost.authorId) || {
          id: targetPost.authorId,
          name: targetPost.authorName,
          handle: targetPost.authorHandle,
          avatar: targetPost.authorAvatar,
          bio: '',
          location: '',
          verified: true,
          joinDate: '',
          likedPostIds: [],
          dislikedPostIds: [],
          friends: [],
          vaultLocked: true,
        };
        const prevComp = calculateCompatibility(currentUser, authorUser, prevPosts);
        oldCompPercentage = prevComp.matchPercentage;
      }

      const updatedPosts = prevPosts.map((post) => {
        if (post.id !== postId || !post.poll) return post;

        const poll = post.poll;
        const previousTotalVotes = poll.totalVotes;
        const previousVotedOption = poll.options.find(
          (o) => o.id === poll.userVotedOptionId || o.votedUserIds?.includes(currentUser.id)
        );

        const updatedOptions = poll.options.map((opt) => {
          let newVotes = opt.votes;
          let newVotedUserIds = [...(opt.votedUserIds || [])];

          // If switching vote away from this option
          if (previousVotedOption && previousVotedOption.id === opt.id && opt.id !== optionId) {
            newVotes = Math.max(0, newVotes - 1);
            newVotedUserIds = newVotedUserIds.filter((uid) => uid !== currentUser.id);
          }

          // If selecting this option
          if (opt.id === optionId) {
            if (!newVotedUserIds.includes(currentUser.id)) {
              newVotes += 1;
              newVotedUserIds.push(currentUser.id);
            }
          }

          return {
            ...opt,
            votes: newVotes,
            votedUserIds: newVotedUserIds,
          };
        });

        const newTotalVotes = updatedOptions.reduce((acc, o) => acc + o.votes, 0);

        // Check if poll reaches 50 or 100 total votes (and user participated in this poll)
        const milestones = [50, 100];
        for (const milestone of milestones) {
          const milestoneKey = `${poll.id}_${milestone}`;
          if (
            ((previousTotalVotes < milestone && newTotalVotes >= milestone) || newTotalVotes === milestone) &&
            !notifiedPollMilestonesRef.current.has(milestoneKey)
          ) {
            notifiedPollMilestonesRef.current.add(milestoneKey);
            const sortedOptions = [...updatedOptions].sort((a, b) => b.votes - a.votes);
            const leadingOption = sortedOptions[0];
            const leadingPct = newTotalVotes > 0 ? Math.round((leadingOption.votes / newTotalVotes) * 100) : 0;

            triggerToast(
              `📊 Poll Milestone (${milestone} Total Votes!)`,
              `"${poll.question}" has reached ${milestone} votes! Current leading option: "${leadingOption.text}" with ${leadingPct}% (${leadingOption.votes} votes).`,
              `Consensus Milestone: ${milestone} Votes`,
              'poll'
            );
          }
        }

        return {
          ...post,
          poll: {
            ...poll,
            options: updatedOptions,
            totalVotes: newTotalVotes,
            userVotedOptionId: optionId,
          },
        };
      });

      if (authorUser) {
        const nextComp = calculateCompatibility(currentUser, authorUser, updatedPosts);
        newCompPercentage = nextComp.matchPercentage;
      }

      return updatedPosts;
    });

    if (authorUser && authorId) {
      const delta = newCompPercentage - oldCompPercentage;
      if (delta !== 0) {
        const sign = delta > 0 ? '+' : '';
        triggerToast(
          `⚡ Compatibility Score Updated (${sign}${delta}%)`,
          `Your poll vote shifted your depth score with ${authorName} to ${newCompPercentage}% (${sign}${delta}%)!`,
          `Synergy: ${newCompPercentage}%`,
          'sparkles',
          {
            label: 'View Breakdown',
            onClick: () => handleInspectCompatibility(authorId),
          }
        );
      }
    }
  };

  // Add Friend Handler
  const handleAddFriend = (userId: string, userName: string) => {
    setCurrentUser((prev) => {
      if (prev.friends.includes(userId)) return prev;
      return {
        ...prev,
        friends: [...prev.friends, userId],
      };
    });
    triggerToast('🤝 Friend Added', `You are now connected with ${userName}!`);
  };

  // Remove Friend Handler
  const handleRemoveFriend = (userId: string, userName?: string) => {
    setCurrentUser((prev) => ({
      ...prev,
      friends: prev.friends.filter((id) => id !== userId),
    }));
    triggerToast('Circle Updated', userName ? `Disconnected with ${userName}.` : 'Friend removed from circle.');
  };

  // Toggle Join Hashtag Group Hub Handler
  const handleToggleJoinGroup = (tag: string) => {
    const clean = tag.replace(/^#+/, '');
    setCurrentUser((prev) => {
      const existing = prev.joinedGroupTags || [];
      const isJoined = existing.some((t) => t.toLowerCase() === clean.toLowerCase());
      const updatedTags = isJoined
        ? existing.filter((t) => t.toLowerCase() !== clean.toLowerCase())
        : [...existing, clean];

      triggerToast(
        isJoined ? `Left #${clean} Group` : `Joined #${clean} Group! 🎉`,
        isJoined
          ? `Posts from #${clean} group will no longer be prioritized in your personal feed.`
          : `All posts tagged #${clean} and from this circle are now integrated into your feed stream!`
      );

      return {
        ...prev,
        joinedGroupTags: updatedTags,
      };
    });
  };

  // Inspect Friend Compatibility Breakdown Handler
  const handleInspectCompatibility = (userId: string) => {
    const targetUser = allUsers.find((u) => u.id === userId);
    if (targetUser) {
      setSelectedCompatibilityUser(targetUser);
    } else {
      // Find author from posts if not in mock user list directly
      const authorPost = posts.find((p) => p.authorId === userId);
      if (authorPost) {
        setSelectedCompatibilityUser({
          id: authorPost.authorId,
          name: authorPost.authorName,
          handle: authorPost.authorHandle,
          avatar: authorPost.authorAvatar,
          bio: 'Fellow creator on Vibe Verse.',
          location: 'Earth',
          verified: true,
          joinDate: '2026',
          likedPostIds: [],
          dislikedPostIds: [],
          friends: [],
          vaultLocked: true,
        });
      }
    }

    // Option 4: Viral Posts infect every profile that views them until they fade away
    const targetId = targetUser?.id || userId;
    setPosts((prevPosts) => {
      let infectedAny = false;
      let infectedPostAuthor = '';
      let remainingViews = 0;
      let isFaded = false;

      const updated = prevPosts.map((p) => {
        const v = p.firePowerUps?.viral;
        if (!v || !v.active || v.fadedAway || v.fadeAwayRemainingViews <= 0) return p;
        if (v.infectedProfileIds.includes(targetId)) return p;

        infectedAny = true;
        infectedPostAuthor = p.authorName;
        const newRemaining = v.fadeAwayRemainingViews - 1;
        isFaded = newRemaining <= 0;
        remainingViews = Math.max(0, newRemaining);

        const targetName = targetUser?.name || 'Inspected Profile';
        const targetHandle = targetUser?.handle || '@user';

        return {
          ...p,
          firePowerUps: {
            ...p.firePowerUps,
            viral: {
              ...v,
              infectedProfileIds: [...v.infectedProfileIds, targetId],
              infectedProfileNames: [...v.infectedProfileNames, targetHandle || targetName],
              totalInfections: v.totalInfections + 1,
              fadeAwayRemainingViews: remainingViews,
              fadedAway: isFaded,
              active: !isFaded,
            },
          },
        };
      });

      if (infectedAny) {
        handleAwardViralInfectionPoints(1, `Profile inspected: ${targetUser?.name || 'User'}`);
        triggerToast(
          '🎉 +25 Spark Points! ☣️ Viral Contagion Transmitted!',
          `${targetUser?.name || 'Profile'} has been infected by ${infectedPostAuthor}'s viral post! You earned +25 Spark Points (+25 pts/infection). (${remainingViews} views until fade away)`,
          '+25 pts Bounty',
          'sparkles'
        );
      }
      return updated;
    });
  };

  // Start Chat Handler (Opens Pop-Up Window in Bottom Right)
  const handleStartChatWithUser = (targetUser: User) => {
    const chatId = 'chat_' + targetUser.id;
    const existing = conversations.find((c) => c.participant.id === targetUser.id);
    if (!existing) {
      const initialMessage: DirectMessage = {
        id: 'msg_' + Date.now(),
        senderId: targetUser.id,
        receiverId: currentUser.id,
        content: `Connected with ${currentUser.name}! Direct encrypted session established.`,
        timestamp: 'Just now',
        isEncrypted: true,
      };
      const newConv: ChatConversation = {
        id: chatId,
        participant: targetUser,
        unreadCount: 0,
        lastMessage: initialMessage,
      };
      setConversations((prev) => [newConv, ...prev]);
    }
    setPopupActiveChatId(chatId);
    setIsChatPopupOpen(true);
    triggerToast(
      '💬 Encrypted Chat Opened',
      `Direct encrypted session with ${targetUser.name} opened in the bottom-right window.`
    );
  };

  // Post Actions: Like
  const handleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const isCurrentlyLiked = p.userReaction === 'like' || p.likedBy.includes(currentUser.id);
        let updatedLikedBy = [...p.likedBy];
        let updatedDislikedBy = p.dislikedBy.filter((id) => id !== currentUser.id);

        if (isCurrentlyLiked) {
          updatedLikedBy = updatedLikedBy.filter((id) => id !== currentUser.id);
        } else {
          updatedLikedBy.push(currentUser.id);
          // Subtle device vibration feedback on successful like
          triggerLikeVibration();
        }

        return {
          ...p,
          likesCount: updatedLikedBy.length,
          dislikesCount: updatedDislikedBy.length,
          userReaction: isCurrentlyLiked ? null : 'like',
          likedBy: updatedLikedBy,
          dislikedBy: updatedDislikedBy,
        };
      })
    );

    // Update user's liked post list for compatibility matching
    setCurrentUser((prev) => {
      const exists = prev.likedPostIds.includes(postId);
      return {
        ...prev,
        likedPostIds: exists
          ? prev.likedPostIds.filter((id) => id !== postId)
          : [...prev.likedPostIds, postId],
        dislikedPostIds: prev.dislikedPostIds.filter((id) => id !== postId),
      };
    });
  };

  // Post Actions: Dislike (Crucial for Compatibility!)
  const handleDislikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const isCurrentlyDisliked = p.userReaction === 'dislike' || p.dislikedBy.includes(currentUser.id);
        let updatedDislikedBy = [...p.dislikedBy];
        let updatedLikedBy = p.likedBy.filter((id) => id !== currentUser.id);

        if (isCurrentlyDisliked) {
          updatedDislikedBy = updatedDislikedBy.filter((id) => id !== currentUser.id);
        } else {
          updatedDislikedBy.push(currentUser.id);
          // Subtle device vibration feedback on dislike
          triggerDislikeVibration();
        }

        return {
          ...p,
          likesCount: updatedLikedBy.length,
          dislikesCount: updatedDislikedBy.length,
          userReaction: isCurrentlyDisliked ? null : 'dislike',
          likedBy: updatedLikedBy,
          dislikedBy: updatedDislikedBy,
        };
      })
    );

    // Update user's disliked post list for compatibility matching
    setCurrentUser((prev) => {
      const exists = prev.dislikedPostIds.includes(postId);
      return {
        ...prev,
        dislikedPostIds: exists
          ? prev.dislikedPostIds.filter((id) => id !== postId)
          : [...prev.dislikedPostIds, postId],
        likedPostIds: prev.likedPostIds.filter((id) => id !== postId),
      };
    });
  };

  // Add Comment
  const handleAddComment = (postId: string, commentText: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const newComment = {
          id: 'c_' + Date.now(),
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorHandle: currentUser.handle,
          authorAvatar: currentUser.avatar,
          content: commentText,
          timestamp: 'Just now',
          likesCount: 0,
        };

        return {
          ...p,
          commentsCount: p.comments.length + 1,
          comments: [...p.comments, newComment],
        };
      })
    );
  };

  // Add New Post (with automatic location tag integration)
  const handleCreatePost = (newPost: Post) => {
    const loc = getAutomaticCityForPost(newPost, currentUser.city);
    const resolvedPost: Post = {
      ...newPost,
      city: newPost.city || loc.city,
      coordinates: newPost.coordinates || loc.coordinates,
    };

    // Deduct hashtag group points if power-ups were pre-armed in post creator
    let powerUpsCost = 0;
    if (resolvedPost.firePowerUps?.boost?.active) powerUpsCost += resolvedPost.firePowerUps.boost.pointsSpent || 0;
    if (resolvedPost.firePowerUps?.glow?.active) powerUpsCost += resolvedPost.firePowerUps.glow.pointsSpent || 0;
    if (resolvedPost.firePowerUps?.multiplier?.active) powerUpsCost += resolvedPost.firePowerUps.multiplier.pointsSpent || 0;
    if (resolvedPost.firePowerUps?.viral?.active) powerUpsCost += resolvedPost.firePowerUps.viral.pointsSpent || 0;

    const fundingTag = (
      resolvedPost.firePowerUps?.sourceGroupTag ||
      (resolvedPost.hashtags && resolvedPost.hashtags[0]?.replace(/^#+/, '')) ||
      'Poetry'
    ).replace(/^#+/, '');

    if (powerUpsCost > 0) {
      setCurrentUser((prev) => {
        const prevTotal = prev.totalReadingPoints || 0;
        const newTotal = Math.max(0, prevTotal - powerUpsCost);
        const currentGroupPts = (prev.groupPoints && prev.groupPoints[fundingTag]) || 0;
        const newGroupPoints = {
          ...(prev.groupPoints || {}),
          [fundingTag]: Math.max(0, currentGroupPts - powerUpsCost),
        };
        return {
          ...prev,
          totalReadingPoints: newTotal,
          groupPoints: newGroupPoints,
        };
      });

      const activeList: string[] = [];
      if (resolvedPost.firePowerUps?.boost?.active) activeList.push(`Boost (+${resolvedPost.firePowerUps.boost.boostScore})`);
      if (resolvedPost.firePowerUps?.glow?.active) activeList.push('Radiant Glow');
      if (resolvedPost.firePowerUps?.multiplier?.active) activeList.push(`${resolvedPost.firePowerUps.multiplier.multiplierFactor}x Multiplier`);
      if (resolvedPost.firePowerUps?.viral?.active) activeList.push('Viral Outbreak');

      triggerToast(
        '🔥 Power-Ups Armed & Ignited!',
        `Your post was published with ${activeList.join(', ')} (${powerUpsCost} pts from #${fundingTag} spent).`,
        `Armed #${fundingTag}`,
        'sparkles'
      );
    }

    setPosts([resolvedPost, ...posts]);
    setRecentNewPostIds((prev) => [resolvedPost.id, ...prev.slice(0, 8)]);
    if (resolvedPost.document) {
      setPdfs((prev) => [resolvedPost.document!, ...prev]);
    }
    checkHashtagVelocitySpike(resolvedPost.hashtags);
  };

  // Launch Quote Card Creation Modal
  const handleRequestCreateQuoteCard = (data: {
    quoteText: string;
    sourceTitle: string;
    sourceType: 'poetry' | 'pdf';
    sourceAuthor?: string;
    sourceAuthorAvatar?: string;
    sourceId?: string;
    sourceDoc?: PDFDocument;
  }) => {
    setQuoteCardModalState(data);
  };

  // Share generated Quote Card as a post
  const handleShareQuoteCardAsPost = (newPost: Post) => {
    handleCreatePost(newPost);
    setActiveTab('feed');
    triggerToast(
      '✨ Quote Card Published!',
      `Excerpt from "${newPost.quoteCard?.sourceTitle || 'Poetry / Document'}" was shared to the feed.`,
      'Card Shared',
      'sparkles'
    );
  };

  // Real-Time Incoming Post Simulation for Stream Testing
  const handleSimulateLivePost = () => {
    const liveAuthors = [
      {
        id: 'usr_5',
        name: 'Ren Tanaka',
        handle: '@ren_zen',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
        city: 'Kyoto',
        content: 'Old ink drying on mulberry paper,\nthe quiet resonance of an evening bell across Gion—\nno algorithmic noise here.\n\n#Poetry #Kyoto #Zen #Minimalism',
        poetryFormatted: true,
        hashtags: ['#Poetry', '#Kyoto', '#Zen'],
        mood: { emoji: '🎋', label: 'Serene' },
      },
      {
        id: 'usr_2',
        name: 'Kaelen Voss',
        handle: '@kaelen_tech',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
        city: 'Berlin',
        content: 'Fresh modular patch recorded live through a vintage analog tape head in Kreuzberg. Real-time warmth & analog decay. 🎧✨ #ModularSynth #Berlin #Soundscapes',
        hashtags: ['#ModularSynth', '#Berlin', '#Soundscapes'],
        mood: { emoji: '⚡', label: 'Energetic' },
        song: {
          id: 'sim_song_' + Date.now(),
          title: 'Kreuzberg Tape Loops (Live Drop)',
          artist: 'Kaelen Voss',
          album: 'Cypher Soundscapes Vol. 2',
          duration: '3:12',
          durationSeconds: 192,
          coverArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=400',
          genre: 'Modular Synth',
          synthPreset: 'deep_drone' as const,
          bpm: 88,
        },
      },
      {
        id: 'usr_1',
        name: 'Elena Rostova',
        handle: '@elena_verse',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
        city: 'Paris',
        content: 'Between the stone bridges of the Seine, the evening light writes its own verse. Slowness is a craft we must fiercely preserve. 🕯️📜 #Poetry #Paris #Philosophy',
        poetryFormatted: true,
        hashtags: ['#Poetry', '#Paris', '#Philosophy'],
        mood: { emoji: '🕯️', label: 'Contemplative' },
      },
      {
        id: 'usr_6',
        name: 'Maya Lin',
        handle: '@maya_cipher',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        city: 'San Francisco',
        content: 'Real-time inquiry for the encrypted verse network: which temporal window yields your deepest creative focus?',
        hashtags: ['#Cipher', '#CreativeFlow', '#SanFrancisco'],
        mood: { emoji: '🔮', label: 'Ethereal' },
        poll: {
          id: 'sim_poll_' + Date.now(),
          question: 'Which temporal window yields your deepest creative focus?',
          options: [
            { id: 'opt_1', text: 'Twilight (18:00 - 21:00)', votes: 14, votedUserIds: [] },
            { id: 'opt_2', text: 'Late Night Witching Hour (01:00 - 04:00)', votes: 29, votedUserIds: [] },
            { id: 'opt_3', text: 'Dawn Solitude (05:00 - 08:00)', votes: 18, votedUserIds: [] },
          ],
          totalVotes: 61,
        },
      },
      {
        id: 'usr_4',
        name: 'Aria Sol',
        handle: '@aria_music',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
        city: 'Reykjavik',
        content: 'Northern aurora frequencies captured through our geothermal hydrophone receiver. Listen closely to the glacial hum. ❄️🌌 #Reykjavik #Ambient #Soundscapes',
        hashtags: ['#Reykjavik', '#Ambient', '#Soundscapes'],
        mood: { emoji: '❄️', label: 'Transcendent' },
        song: {
          id: 'sim_song_reyk_' + Date.now(),
          title: 'Glacial Aurora Drift (Live Stream)',
          artist: 'Aria Sol',
          album: 'Sub-Arctic Echoes',
          duration: '3:40',
          durationSeconds: 220,
          coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
          genre: 'Ambient Acoustic',
          synthPreset: 'acoustic_strings' as const,
          bpm: 68,
        },
      },
    ];

    const template = liveAuthors[simulationPoolIndex.current % liveAuthors.length];
    simulationPoolIndex.current += 1;

    const newSimPost: Post = {
      id: 'live_post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      authorId: template.id,
      authorName: template.name,
      authorHandle: template.handle,
      authorAvatar: template.avatar,
      timestamp: 'Just now',
      content: template.content,
      poetryFormatted: template.poetryFormatted,
      hashtags: template.hashtags,
      city: template.city,
      song: template.song,
      poll: template.poll,
      mood: template.mood,
      likesCount: 0,
      dislikesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      likedBy: [],
      dislikedBy: [],
      comments: [],
    };

    setPosts((prev) => [newSimPost, ...prev]);
    setRecentNewPostIds((prev) => [newSimPost.id, ...prev.slice(0, 8)]);
    triggerToast(
      `⚡ Live Post: ${template.name}`,
      `Real-time post from ${template.city} streamed in with staggered entrance.`
    );
    checkHashtagVelocitySpike(newSimPost.hashtags);
  };

  // Send Direct Message
  const handleSendMessage = (
    chatId: string,
    content: string,
    attachedDoc?: PDFDocument,
    compatibilityQuestion?: CompatibilityQuestion,
    attachedReadingLink?: ReadingLink
  ) => {
    setConversations((prev) =>
      prev.map((chat) => {
        if (chat.id !== chatId) return chat;

        const newMessage: DirectMessage = {
          id: 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          senderId: currentUser.id,
          receiverId: chat.participant.id,
          content: compatibilityQuestion
            ? `⚡ Compatibility Question: "${compatibilityQuestion.question}"`
            : content ||
              (attachedReadingLink
                ? `Shared reading: "${attachedReadingLink.title}"`
                : attachedDoc
                ? `Shared PDF: ${attachedDoc.title}`
                : ''),
          timestamp: 'Just now',
          isEncrypted: true,
          attachedDocument: attachedDoc,
          compatibilityQuestion: compatibilityQuestion,
          attachedReadingLink: attachedReadingLink,
        };

        const existingMessages = chat.messages || (chat.lastMessage ? [chat.lastMessage] : []);

        return {
          ...chat,
          lastMessage: newMessage,
          messages: [...existingMessages, newMessage],
          unreadCount: 0,
        };
      })
    );

    if (compatibilityQuestion) {
      triggerToast(
        '⚡ Compatibility Question Sent',
        `Sent question: "${compatibilityQuestion.question.slice(0, 40)}..." - answers will influence your match score!`,
        'COMPATIBILITY',
        'sparkles'
      );
    }
  };

  // Handle answering compatibility question and updating match score
  const handleAnswerCompatibilityQuestion = (
    chatId: string,
    messageId: string,
    questionId: string,
    optionId: string,
    simulatePeer: boolean = true
  ) => {
    const targetChat = conversations.find((c) => c.id === chatId);
    if (!targetChat) return;

    const partner = targetChat.participant;
    const existingMsg = targetChat.messages?.find((m) => m.id === messageId) || targetChat.lastMessage;
    const baseQuestion =
      existingMsg?.compatibilityQuestion ||
      COMPATIBILITY_QUESTIONS.find((q) => q.id === questionId) ||
      COMPATIBILITY_QUESTIONS[0];

    const isSenderMe = (existingMsg?.senderId || currentUser.id) === currentUser.id;

    // Determine answers
    let myOptionId = optionId;
    let partnerOptionId = isSenderMe
      ? existingMsg?.compatibilityQuestion?.receiverAnswer
      : existingMsg?.compatibilityQuestion?.senderAnswer;

    if (!partnerOptionId && simulatePeer) {
      // Simulate peer answer based on their personality profile
      partnerOptionId = getSimulatedPeerAnswer(baseQuestion, partner.id);
    }

    const senderAns = isSenderMe ? myOptionId : (partnerOptionId || optionId);
    const receiverAns = isSenderMe ? (partnerOptionId || optionId) : myOptionId;

    const selectedOptObj = baseQuestion.options.find((o) => o.id === optionId);
    const partnerOptObj = baseQuestion.options.find((o) => o.id === partnerOptionId);

    // Calculate score modifier:
    // 1. Option bonus/penalty based on user choice
    let bonusDelta = selectedOptObj?.scoreImpact || 6;

    // 2. Pair alignment modifier (matching vs contrasting answers)
    if (partnerOptionId) {
      if (myOptionId === partnerOptionId) {
        bonusDelta += 8; // Synchronized alignment bonus
      } else {
        const partnerDelta = partnerOptObj?.scoreImpact || 4;
        if (bonusDelta > 0 && partnerDelta > 0) {
          bonusDelta += 4; // Complementary depth
        } else if (bonusDelta < 0 && partnerDelta < 0) {
          bonusDelta -= 4; // Mutual discord
        } else {
          bonusDelta += 2; // Intriguing contrast
        }
      }
    }

    const currentBonus = currentUser.compatibilityBonuses?.[partner.id] || 0;
    const newBonus = Math.max(-25, Math.min(30, currentBonus + bonusDelta));

    const answerRecord: CompatibilityAnswerRecord = {
      questionId: baseQuestion.id,
      question: baseQuestion.question,
      category: baseQuestion.category,
      userAnswerText: selectedOptObj?.text || '',
      partnerAnswerText: partnerOptObj?.text || '',
      isMatch: myOptionId === partnerOptionId,
      scoreDelta: bonusDelta,
      scoreShift: bonusDelta,
      answeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update currentUser state
    setCurrentUser((prev) => {
      const prevAnswers = prev.compatibilityAnswers?.[partner.id] || [];
      const filteredAnswers = prevAnswers.filter((a) => a.questionId !== baseQuestion.id);
      return {
        ...prev,
        compatibilityBonuses: {
          ...(prev.compatibilityBonuses || {}),
          [partner.id]: newBonus,
        },
        compatibilityAnswers: {
          ...(prev.compatibilityAnswers || {}),
          [partner.id]: [...filteredAnswers, answerRecord],
        },
      };
    });

    // Update partner in allUsers if present
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id !== partner.id) return u;
        return {
          ...u,
          compatibilityBonuses: {
            ...(u.compatibilityBonuses || {}),
            [currentUser.id]: newBonus,
          },
        };
      })
    );

    // Update conversation messages
    const updatedQuestionObj: CompatibilityQuestion = {
      ...baseQuestion,
      isAnsweredBySender: true,
      isAnsweredByReceiver: !!partnerOptionId,
      senderAnswer: senderAns,
      receiverAnswer: receiverAns,
      impactSummary: `${bonusDelta >= 0 ? '+' : ''}${bonusDelta}% Compatibility ${
        bonusDelta >= 0 ? 'Depth Score Boost' : 'Variance'
      }`,
    };

    setConversations((prev) =>
      prev.map((chat) => {
        if (chat.id !== chatId) return chat;

        const updatedMessages = (chat.messages || (chat.lastMessage ? [chat.lastMessage] : [])).map((m) => {
          if (m.id === messageId || (m.compatibilityQuestion && m.compatibilityQuestion.id === questionId)) {
            return {
              ...m,
              compatibilityQuestion: updatedQuestionObj,
            };
          }
          return m;
        });

        const isLastMsgTarget = chat.lastMessage?.id === messageId || chat.lastMessage?.compatibilityQuestion?.id === questionId;

        return {
          ...chat,
          messages: updatedMessages,
          lastMessage: isLastMsgTarget
            ? {
                ...chat.lastMessage,
                compatibilityQuestion: updatedQuestionObj,
              }
            : chat.lastMessage,
        };
      })
    );

    // Trigger feedback Toast
    const sign = bonusDelta >= 0 ? '+' : '';
    triggerToast(
      `⚡ Compatibility Score Updated (${sign}${bonusDelta}%)`,
      `You & ${partner.name} aligned on "${baseQuestion.question.slice(0, 35)}..."! New score adjusted.`,
      'COMPATIBILITY',
      'sparkles'
    );
  };

  // Share post, PDF, or Reading Link to chat (Opens pop-up window in bottom right)
  const handleShareToChat = (item: Post | PDFDocument | ReadingLink) => {
    setIsChatPopupOpen(true);
    let shareText = '';
    let docToAttach: PDFDocument | undefined;
    let readingToAttach: ReadingLink | undefined;
    let toastSummary = '';

    if ('readingPoints' in item) {
      readingToAttach = item as ReadingLink;
      shareText = `Check out this reading: "${item.title}" (+${item.readingPoints} pts)`;
      toastSummary = item.title;
    } else if ('category' in item) {
      docToAttach = item as PDFDocument;
      shareText = `Sharing document: "${item.title}"`;
      toastSummary = item.title;
    } else {
      const post = item as Post;
      shareText = `Check out this post by ${post.authorName}: "${post.content.slice(0, 100)}..."`;
      docToAttach = post.document;
      readingToAttach = post.readingLink;
      toastSummary = post.content.slice(0, 30);
    }

    const targetChatId = popupActiveChatId || conversations[0]?.id || 'chat_1';
    handleSendMessage(
      targetChatId,
      shareText,
      docToAttach,
      undefined,
      readingToAttach
    );
    triggerToast(
      '💬 Shared to Chat',
      `Shared "${toastSummary}..." to your encrypted chat in the bottom-right window.`
    );
  };

  // Comprehensive Share Post Handler (Rewards Original Author with +1 Like)
  const handleSharePost = (post: Post, method: 'feed' | 'chat' | 'copy') => {
    // 1. Give the original post / poster a like if not already liked
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== post.id) return p;

        const isCurrentlyLiked = p.userReaction === 'like' || p.likedBy.includes(currentUser.id);
        const updatedLikedBy = isCurrentlyLiked ? p.likedBy : [...p.likedBy, currentUser.id];
        const updatedDislikedBy = p.dislikedBy.filter((id) => id !== currentUser.id);

        return {
          ...p,
          likesCount: updatedLikedBy.length,
          dislikesCount: updatedDislikedBy.length,
          userReaction: 'like',
          likedBy: updatedLikedBy,
          dislikedBy: updatedDislikedBy,
          sharesCount: (p.sharesCount || 0) + 1,
          sharedBy: [...(p.sharedBy || []), currentUser.id],
        };
      })
    );

    // Update currentUser's liked posts list
    setCurrentUser((prev) => ({
      ...prev,
      likedPostIds: prev.likedPostIds.includes(post.id)
        ? prev.likedPostIds
        : [...prev.likedPostIds, post.id],
      dislikedPostIds: prev.dislikedPostIds.filter((id) => id !== post.id),
    }));

    // 2. Perform specific share actions
    if (method === 'feed') {
      const newSharedPost: Post = {
        id: 'post_shared_' + Date.now(),
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorHandle: currentUser.handle,
        authorAvatar: currentUser.avatar,
        timestamp: 'Just now',
        content: `Reposted thought from ${post.authorName} (${post.authorHandle}):\n\n"${post.content}"`,
        poetryFormatted: post.poetryFormatted,
        hashtags: [...post.hashtags],
        document: post.document,
        image: post.image,
        likesCount: 1,
        dislikesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        userReaction: 'like',
        likedBy: [currentUser.id],
        dislikedBy: [],
        comments: [],
        sharedFrom: {
          authorId: post.authorId,
          authorName: post.authorName,
          authorHandle: post.authorHandle,
          authorAvatar: post.authorAvatar,
          postId: post.id,
          content: post.content,
          timestamp: post.timestamp,
        },
      };

      setPosts((prev) => [newSharedPost, ...prev]);
      setRecentNewPostIds((prev) => [newSharedPost.id, ...prev.slice(0, 8)]);
      triggerToast(
        'Post Reposted to Feed! 🚀',
        `Awarded +1 Like to ${post.authorName} (${post.authorHandle}) automatically!`
      );
    } else if (method === 'chat') {
      handleShareToChat(post);
      triggerToast(
        'Post Sent to Chat! 💬',
        `Awarded +1 Like to ${post.authorName} (${post.authorHandle}) automatically!`
      );
    } else if (method === 'copy') {
      triggerToast(
        'Share Link Copied! 📋',
        `Awarded +1 Like to ${post.authorName} (${post.authorHandle}) automatically!`
      );
    }
  };

  // Bookmark Post Handler (Supports Folders: 'memes', 'music', 'general', and custom collections)
  const handleToggleBookmarkPost = (postId: string, folderId?: string) => {
    setCurrentUser((prev) => {
      const currentSaved = prev.savedPostIds || [];
      const currentFoldersMap = { ...(prev.savedPostFolders || {}) };
      const currentPostFolders = currentFoldersMap[postId] ? [...currentFoldersMap[postId]] : [];

      let updatedPostIds = [...currentSaved];
      let updatedFoldersMap = { ...currentFoldersMap };
      let toastTitle = '';
      let toastMsg = '';
      let toastIcon: 'sparkles' | 'shield' | 'heart' | undefined = 'sparkles';

      if (folderId) {
        // Toggle this specific folder for this post
        const folderIndex = currentPostFolders.indexOf(folderId);
        const folderName =
          folderId === 'memes'
            ? 'Meme Collections'
            : folderId === 'music'
            ? 'Music'
            : folderId === 'general'
            ? 'General Vault'
            : (prev.customBookmarkFolders || []).find((f) => f.id === folderId)?.name || 'Collection';

        if (folderIndex >= 0) {
          // Remove from folder
          currentPostFolders.splice(folderIndex, 1);
          toastTitle = `Removed from ${folderName}`;
          toastMsg = `Post removed from your "${folderName}" folder.`;
        } else {
          // Add to folder
          currentPostFolders.push(folderId);
          toastTitle = `Saved to ${folderName}`;
          toastMsg = `Post organized into your "${folderName}" collection.`;
          if (folderId === 'memes') toastIcon = 'sparkles';
          else if (folderId === 'music') toastIcon = 'heart';
          else toastIcon = 'shield';
        }

        if (currentPostFolders.length > 0) {
          updatedFoldersMap[postId] = currentPostFolders;
          if (!updatedPostIds.includes(postId)) {
            updatedPostIds.push(postId);
          }
        } else {
          // Removed from all folders -> unsave post completely
          delete updatedFoldersMap[postId];
          updatedPostIds = updatedPostIds.filter((id) => id !== postId);
        }
      } else {
        // Quick toggle on/off
        const exists = currentSaved.includes(postId);
        if (exists) {
          updatedPostIds = currentSaved.filter((id) => id !== postId);
          delete updatedFoldersMap[postId];
          toastTitle = 'Removed from Vault';
          toastMsg = 'Post removed from saved bookmarks.';
        } else {
          updatedPostIds = [...currentSaved, postId];
          updatedFoldersMap[postId] = ['general'];
          toastTitle = 'Saved to General Vault';
          toastMsg = 'Post encrypted and stored in your vault.';
          toastIcon = 'shield';
        }
      }

      // Update decrypted bookmark metadata
      let updatedDecrypted = prev.decryptedData ? { ...prev.decryptedData } : undefined;
      if (updatedDecrypted) {
        let bookmarks = updatedDecrypted.savedBookmarks ? [...updatedDecrypted.savedBookmarks] : [];
        if (!updatedPostIds.includes(postId)) {
          bookmarks = bookmarks.filter((b) => b.postId !== postId);
        } else {
          const postObj = posts.find((p) => p.id === postId);
          const existingBmIndex = bookmarks.findIndex((b) => b.postId === postId);
          const activeFolders = updatedFoldersMap[postId] || ['general'];
          if (existingBmIndex >= 0) {
            bookmarks[existingBmIndex] = {
              ...bookmarks[existingBmIndex],
              folderIds: activeFolders,
              folderId: activeFolders[0],
            };
          } else {
            bookmarks.push({
              id: 'bm_p_' + postId,
              type: 'post',
              postId,
              post: postObj,
              savedAt: new Date().toISOString().slice(0, 10),
              userNotes: '',
              folderIds: activeFolders,
              folderId: activeFolders[0],
            });
          }
        }
        updatedDecrypted.savedBookmarks = bookmarks;
      }

      if (toastTitle) {
        triggerToast(toastTitle, toastMsg, undefined, toastIcon);
      }

      let updatedSavedSongs = prev.savedSongs ? [...prev.savedSongs] : [];
      let updatedSavedSongIds = prev.savedSongIds ? [...prev.savedSongIds] : [];

      // Sync post song if folder is 'music'
      const targetPost = posts.find((p) => p.id === postId);
      if (targetPost && targetPost.song) {
        if (folderId === 'music') {
          const isNowInMusicFolder = (updatedFoldersMap[postId] || []).includes('music');
          if (!isNowInMusicFolder) {
            // removed from music folder
            updatedSavedSongIds = updatedSavedSongIds.filter((id) => id !== targetPost.song!.id);
            updatedSavedSongs = updatedSavedSongs.filter((s) => s.id !== targetPost.song!.id);
          } else {
            // added to music folder
            if (!updatedSavedSongIds.includes(targetPost.song.id)) {
              updatedSavedSongIds.push(targetPost.song.id);
              updatedSavedSongs.unshift({
                ...targetPost.song,
                savedFromPostId: postId,
                savedAt: 'Just now',
              });
            }
          }
        }
      }

      return {
        ...prev,
        savedPostIds: updatedPostIds,
        savedPostFolders: updatedFoldersMap,
        savedSongIds: updatedSavedSongIds,
        savedSongs: updatedSavedSongs,
        decryptedData: updatedDecrypted,
      };
    });
  };

  // Toggle Save Song directly to/from Music Library
  const handleToggleSaveSong = (song: PostSong, postId?: string) => {
    setCurrentUser((prev) => {
      const currentSavedSongIds = prev.savedSongIds ? [...prev.savedSongIds] : [];
      const currentSavedSongs = prev.savedSongs ? [...prev.savedSongs] : [];
      const isAlreadySaved = currentSavedSongIds.includes(song.id);

      let updatedSongIds: string[];
      let updatedSongs: PostSong[];

      if (isAlreadySaved) {
        updatedSongIds = currentSavedSongIds.filter((id) => id !== song.id);
        updatedSongs = currentSavedSongs.filter((s) => s.id !== song.id);
        triggerToast('Removed from Music Vault', `"${song.title}" by ${song.artist} removed from your library.`);
      } else {
        updatedSongIds = [...currentSavedSongIds, song.id];
        const newSong: PostSong = {
          ...song,
          savedFromPostId: postId || song.savedFromPostId,
          savedAt: 'Just now',
        };
        updatedSongs = [newSong, ...currentSavedSongs.filter((s) => s.id !== song.id)];
        triggerToast('🎵 Song Saved to Music Vault!', `"${song.title}" by ${song.artist} saved to your music library.`);
      }

      // Also mark post in 'music' folder if postId is provided
      let updatedSavedPostIds = prev.savedPostIds ? [...prev.savedPostIds] : [];
      let updatedSavedFolders = { ...(prev.savedPostFolders || {}) };

      if (postId) {
        const postFolders = updatedSavedFolders[postId] ? [...updatedSavedFolders[postId]] : [];
        if (!isAlreadySaved) {
          if (!postFolders.includes('music')) {
            postFolders.push('music');
          }
          updatedSavedFolders[postId] = postFolders;
          if (!updatedSavedPostIds.includes(postId)) {
            updatedSavedPostIds.push(postId);
          }
        }
      }

      return {
        ...prev,
        savedSongIds: updatedSongIds,
        savedSongs: updatedSongs,
        savedPostIds: updatedSavedPostIds,
        savedPostFolders: updatedSavedFolders,
      };
    });
  };

  // Bulk Save all music tracks from the feed into user's library
  const handleBulkSaveAllMusicSongs = () => {
    const musicPosts = posts.filter(
      (p) =>
        Boolean(p.song) &&
        !mutedUserIds.includes(p.authorId) &&
        (!p.sharedFrom || !mutedUserIds.includes(p.sharedFrom.authorId))
    );
    const feedSongs = musicPosts.map((p) => p.song).filter(Boolean) as PostSong[];
    if (feedSongs.length === 0) return;

    setCurrentUser((prev) => {
      const existingIds = new Set(prev.savedSongIds || []);
      const newSongsToSave = feedSongs.filter((s) => !existingIds.has(s.id));
      if (newSongsToSave.length === 0) {
        triggerToast('🎵 Already Saved', 'All music tracks in the feed are already in your library!', undefined, 'sparkles');
        return prev;
      }

      const updatedIds = [...(prev.savedSongIds || []), ...newSongsToSave.map((s) => s.id)];
      const updatedSongs = [
        ...newSongsToSave.map((s) => ({ ...s, savedAt: 'Just now' })),
        ...(prev.savedSongs || []),
      ];

      triggerToast(
        `🎵 Saved ${newSongsToSave.length} Tracks to Vault!`,
        `Added ${newSongsToSave.length} music tracks from the Music Feed to your Music Library.`,
        undefined,
        'sparkles'
      );

      return {
        ...prev,
        savedSongIds: updatedIds,
        savedSongs: updatedSongs,
      };
    });
  };

  // Waveform Timed Comment Handler
  const handleAddWaveformComment = (songId: string, comment: WaveformComment, postId?: string) => {
    // 1. Update post song if it matches
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.song && (p.song.id === songId || p.id === postId)) {
          const existingComments = p.song.waveformComments || [];
          return {
            ...p,
            song: {
              ...p.song,
              waveformComments: [...existingComments, comment],
            },
          };
        }
        return p;
      })
    );

    // 2. Update currentUser savedSongs if present
    setCurrentUser((prev) => {
      const savedSongs = prev.savedSongs || [];
      const updatedSaved = savedSongs.map((s) => {
        if (s.id === songId) {
          return {
            ...s,
            waveformComments: [...(s.waveformComments || []), comment],
          };
        }
        return s;
      });
      return {
        ...prev,
        savedSongs: updatedSaved,
      };
    });

    const mins = Math.floor(comment.timestampSeconds / 60);
    const secs = Math.floor(comment.timestampSeconds % 60);
    const timeFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;
    triggerToast(
      '🎵 Timed Waveform Comment Pinned',
      `Pinned at [${timeFormatted}]: "${comment.content.slice(0, 32)}${comment.content.length > 32 ? '...' : ''}"`,
      undefined,
      'sparkles'
    );
  };

  // Create New Bookmark Folder Handler
  const handleCreateBookmarkFolder = (folderName: string, postIdToSave?: string) => {
    const trimmed = folderName.trim();
    if (!trimmed) return;
    const folderId = 'folder_' + trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
    const newFolder: BookmarkFolder = {
      id: folderId,
      name: trimmed,
      icon: 'Folder',
      description: `Custom collection: ${trimmed}`,
    };

    setCurrentUser((prev) => {
      const custom = prev.customBookmarkFolders || [];
      const updatedFolders = [...custom, newFolder];
      let updatedSavedPostFolders = { ...(prev.savedPostFolders || {}) };
      let updatedSavedPostIds = prev.savedPostIds ? [...prev.savedPostIds] : [];

      if (postIdToSave) {
        const currentPostFolders = updatedSavedPostFolders[postIdToSave]
          ? [...updatedSavedPostFolders[postIdToSave]]
          : [];
        if (!currentPostFolders.includes(folderId)) {
          currentPostFolders.push(folderId);
        }
        updatedSavedPostFolders[postIdToSave] = currentPostFolders;
        if (!updatedSavedPostIds.includes(postIdToSave)) {
          updatedSavedPostIds.push(postIdToSave);
        }
      }

      return {
        ...prev,
        customBookmarkFolders: updatedFolders,
        savedPostFolders: updatedSavedPostFolders,
        savedPostIds: updatedSavedPostIds,
      };
    });

    triggerToast(
      `📁 Folder Created: "${trimmed}"`,
      postIdToSave
        ? `Created folder and saved post into "${trimmed}".`
        : `Created custom folder "${trimmed}".`,
      undefined,
      'sparkles'
    );
  };

  // Bookmark PDF Handler
  const handleToggleBookmarkDoc = (docId: string) => {
    setCurrentUser((prev) => {
      const currentSaved = prev.savedDocIds || [];
      const exists = currentSaved.includes(docId);
      const updatedDocIds = exists
        ? currentSaved.filter((id) => id !== docId)
        : [...currentSaved, docId];

      let updatedDecrypted = prev.decryptedData ? { ...prev.decryptedData } : undefined;
      if (updatedDecrypted) {
        let bookmarks = updatedDecrypted.savedBookmarks ? [...updatedDecrypted.savedBookmarks] : [];
        if (exists) {
          bookmarks = bookmarks.filter((b) => b.docId !== docId);
        } else {
          const docObj = pdfs.find((d) => d.id === docId);
          bookmarks.push({
            id: 'bm_d_' + docId,
            type: 'pdf',
            docId,
            document: docObj,
            savedAt: new Date().toISOString().slice(0, 10),
            userNotes: '',
          });
        }
        updatedDecrypted.savedBookmarks = bookmarks;
      }

      return {
        ...prev,
        savedDocIds: updatedDocIds,
        decryptedData: updatedDecrypted,
      };
    });
  };

  // City Click Handler: open dedicated City Showcase Page with Top 10 Streams
  const handleCityClick = (cityName: string) => {
    if (!cityName) return;
    setActiveCityPage(cityName.trim());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Adult Swim 18+ Age Verification Confirmation Handler
  const handleConfirmAgeVerification = (data: { birthDate: string; age: number; remember: boolean }) => {
    setIsAdultVerified(true);
    setUserAge(data.age);
    setShowAdultAgeGateModal(false);
    setFeedFilterMode('adult_swim');
    if (data.remember) {
      try {
        localStorage.setItem('deep_adult_swim_verified', 'true');
        localStorage.setItem('deep_adult_swim_age', String(data.age));
        localStorage.setItem('deep_adult_swim_dob', data.birthDate);
      } catch (err) {
        console.error('Failed saving adult swim verification to localStorage', err);
      }
    }
    setCurrentUser((prev) => ({
      ...prev,
      isAgeVerified: true,
      ageVerifiedAt: new Date().toISOString(),
    }));
    setToastNotification({
      title: '18+ Age Verified',
      message: `Welcome to [adult swim] (Age: ${data.age}). Uncensored after-hours stream unlocked.`,
      icon: '🌙',
    });
  };

  // Lock Adult Swim Gate (Clears age token and relocks view)
  const handleLockAdultSwimGate = () => {
    try {
      localStorage.removeItem('deep_adult_swim_verified');
      localStorage.removeItem('deep_adult_swim_age');
      localStorage.removeItem('deep_adult_swim_dob');
    } catch (err) {
      console.error('Failed clearing adult swim verification from localStorage', err);
    }
    setIsAdultVerified(false);
    setUserAge(null);
    setFeedFilterMode('all');
    setToastNotification({
      title: 'Adult Swim Locked',
      message: '18+ age verification token cleared. The Adult Swim feed is now locked.',
      icon: '🔒',
    });
  };

  // Hashtag / Feed Warp click handler: Warps into the Stream Hub with starfield hyperspace animation
  const handleHashtagClick = (tag: string) => {
    // Clean tag formatting
    const clean = tag.replace(/^#+/, '');
    const formattedTag = `#${clean}`;

    // If attempting to warp into #AdultSwim or 18+ content without verification, trigger Age Gate
    if (
      (clean.toLowerCase() === 'adultswim' || clean.toLowerCase() === 'adult_swim' || clean.toLowerCase() === '18plus') &&
      !isAdultVerified
    ) {
      setShowAdultAgeGateModal(true);
      return;
    }

    setWarpingTag(formattedTag);
    setSelectedHashtagFilter(formattedTag);

    // Locate the matching stream group or create a dynamic sovereign stream
    const cityInfo = getCityForHashtag(clean);
    const assignedCity = cityInfo.city || 'Global';
    const assignedCountry = cityInfo.country || 'International';
    const foundGroup = hashtagGroups.find(
      (g) => g.tag.toLowerCase() === clean.toLowerCase() || g.tag.replace(/^#+/, '').toLowerCase() === clean.toLowerCase()
    ) || {
      tag: clean,
      name: formatStreamName(clean, assignedCity, assignedCountry),
      description: `Sovereign stream for #${clean}. Explore stanzas, documents, and connected creators.`,
      category: 'Hashtag Stream',
      city: assignedCity,
      country: assignedCountry,
      memberIds: [currentUser.id],
      isHot: true,
      rules: [
        'Respect all creator stanzas and expressions.',
        'Tag relevant creative writing and PDF manuscripts.',
      ],
    };

    setActiveGroupDetail(foundGroup);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter feed posts (excluding posts from muted users and reposts from muted users)
  // Option 1. Post Boost: spend points to make your post higher in the feed order
  const displayedPosts = useMemo(() => {
    const filtered = posts.filter((p) => {
      // Exclude muted authors
      if (mutedUserIds.includes(p.authorId)) return false;
      if (p.sharedFrom && mutedUserIds.includes(p.sharedFrom.authorId)) return false;

      if (selectedHashtagFilter) {
        const matchesHashtag = p.hashtags.some((h) =>
          h.toLowerCase().includes(selectedHashtagFilter.toLowerCase())
        );
        if (!matchesHashtag) return false;
      }

      if (selectedVibeFilter) {
        const vibe = analyzePostVibe(p.content, p.hashtags, p.mood);
        if (vibe.category !== selectedVibeFilter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const postCity = (p.city || getAutomaticCityForPost(p).city || '').toLowerCase();
        const postCountry = (p.country || '').toLowerCase();
        const matchesSearch =
          p.content.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q) ||
          p.hashtags.some((h) => h.toLowerCase().includes(q)) ||
          postCity.includes(q) ||
          postCountry.includes(q);
        if (!matchesSearch) return false;
      }

      if (feedFilterMode === 'poetry') {
        return (
          Boolean(p.poetryFormatted) ||
          (p.hashtags || []).some((h) => {
            const low = h.toLowerCase().replace(/^#+/, '');
            return ['poetry', 'poem', 'poems', 'verse', 'haiku', 'rhyme', 'sonnet', 'ballad', 'stanzas', 'stanza'].includes(low);
          })
        );
      }
      if (feedFilterMode === 'literature') {
        // PDF, manuscripts, books, and long articles
        if (p.document) return true;
        if (p.readingLink || (p.readingLinks && p.readingLinks.length > 0)) return true;
        if (p.quoteCard?.sourceType === 'pdf') return true;
        const hasLitTag = (p.hashtags || []).some((h) => {
          const low = h.toLowerCase().replace(/^#+/, '');
          return [
            'literature',
            'pdf',
            'manuscript',
            'manuscripts',
            'book',
            'books',
            'article',
            'articles',
            'longread',
            'essay',
            'essays',
            'reading',
            'treatise',
            'prose',
            'anthology',
            'publication',
          ].includes(low);
        });
        if (hasLitTag) return true;
        const text = (p.content || '').toLowerCase();
        return (
          (p.content || '').trim().length >= 350 &&
          (text.includes('article') ||
            text.includes('manuscript') ||
            text.includes('chapter') ||
            text.includes('essay') ||
            text.includes('book') ||
            text.includes('pdf') ||
            text.includes('treatise') ||
            text.includes('reading') ||
            text.includes('publication'))
        );
      }
      if (feedFilterMode === 'music') {
        if (!p.song) return false;
        if (selectedMusicGenre !== 'all' && p.song.genre) {
          return p.song.genre.toLowerCase() === selectedMusicGenre.toLowerCase();
        }
        return true;
      }
      if (feedFilterMode === 'friends') {
        const isViralSpread = Boolean(p.firePowerUps?.viral?.active && !p.firePowerUps.viral.fadedAway);
        return currentUser.friends.includes(p.authorId) || p.authorId === currentUser.id || isViralSpread;
      }
      if (feedFilterMode === 'groups') {
        const myJoined = (currentUser.joinedGroupTags || []).map((t) => t.toLowerCase().replace(/^#+/, ''));
        return p.hashtags.some((h) => myJoined.includes(h.toLowerCase().replace(/^#+/, '')));
      }
      if (feedFilterMode === 'media') {
        return Boolean(p.image);
      }
      if (feedFilterMode === 'adult_swim') {
        return Boolean(
          p.isAdult ||
          p.hashtags.some((h) => {
            const low = h.toLowerCase().replace(/^#+/, '');
            return (
              low === 'adultswim' ||
              low === 'adult_swim' ||
              low === '18plus' ||
              low === 'afterhours' ||
              low === 'afterdark' ||
              low === 'raw' ||
              low === 'uncensored' ||
              low === 'poetryafterdark'
            );
          })
        );
      }
      if (feedFilterMode === 'mood') {
        if (!p.mood) return false;
        if (selectedMoodFilter) {
          return (
            p.mood.label.toLowerCase() === selectedMoodFilter.toLowerCase() ||
            p.mood.emoji === selectedMoodFilter
          );
        }
        return true;
      }

      return true;
    });

    // Option 1: Post Boost sorts boosted posts higher in the feed order based on boostScore
    return [...filtered].sort((a, b) => {
      const aBoost = a.firePowerUps?.boost?.active ? (a.firePowerUps.boost.boostScore || 100) : 0;
      const bBoost = b.firePowerUps?.boost?.active ? (b.firePowerUps.boost.boostScore || 100) : 0;
      if (bBoost !== aBoost) {
        return bBoost - aBoost; // Highest boost score appears at top of feed!
      }
      return 0;
    });
  }, [
    posts,
    mutedUserIds,
    selectedHashtagFilter,
    selectedVibeFilter,
    searchQuery,
    feedFilterMode,
    selectedMusicGenre,
    selectedMoodFilter,
    currentUser.friends,
    currentUser.id,
    currentUser.joinedGroupTags,
  ]);

  // Count active Music & Soundtrack posts
  const allMusicPosts = useMemo(() => {
    return posts.filter(
      (p) =>
        Boolean(p.song) &&
        !mutedUserIds.includes(p.authorId) &&
        (!p.sharedFrom || !mutedUserIds.includes(p.sharedFrom.authorId))
    );
  }, [posts, mutedUserIds]);

  const musicPostsCount = allMusicPosts.length;

  // Count active Poetry posts (strictly poetry verses/stanzas)
  const poetryPostsCount = useMemo(() => {
    return posts.filter(
      (p) =>
        (Boolean(p.poetryFormatted) ||
          (p.hashtags || []).some((h) => {
            const low = h.toLowerCase().replace(/^#+/, '');
            return ['poetry', 'poem', 'poems', 'verse', 'haiku', 'rhyme', 'sonnet', 'ballad', 'stanzas', 'stanza'].includes(low);
          })) &&
        !mutedUserIds.includes(p.authorId) &&
        (!p.sharedFrom || !mutedUserIds.includes(p.sharedFrom.authorId))
    ).length;
  }, [posts, mutedUserIds]);

  // Count active Literature posts (PDF, manuscripts, books, and long articles)
  const literaturePostsCount = useMemo(() => {
    return posts.filter((p) => {
      if (mutedUserIds.includes(p.authorId)) return false;
      if (p.sharedFrom && mutedUserIds.includes(p.sharedFrom.authorId)) return false;
      if (p.document) return true;
      if (p.readingLink || (p.readingLinks && p.readingLinks.length > 0)) return true;
      if (p.quoteCard?.sourceType === 'pdf') return true;
      const hasLitTag = (p.hashtags || []).some((h) => {
        const low = h.toLowerCase().replace(/^#+/, '');
        return [
          'literature',
          'pdf',
          'manuscript',
          'manuscripts',
          'book',
          'books',
          'article',
          'articles',
          'longread',
          'essay',
          'essays',
          'reading',
          'treatise',
          'prose',
          'anthology',
          'publication',
        ].includes(low);
      });
      if (hasLitTag) return true;
      const text = (p.content || '').toLowerCase();
      return (
        (p.content || '').trim().length >= 350 &&
        (text.includes('article') ||
          text.includes('manuscript') ||
          text.includes('chapter') ||
          text.includes('essay') ||
          text.includes('book') ||
          text.includes('pdf') ||
          text.includes('treatise') ||
          text.includes('reading') ||
          text.includes('publication'))
      );
    }).length;
  }, [posts, mutedUserIds]);

  // Count active Joined Hashtag Group posts
  const joinedGroupsPostsCount = posts.filter((p) => {
    if (mutedUserIds.includes(p.authorId)) return false;
    const myJoined = (currentUser.joinedGroupTags || []).map((t) => t.toLowerCase().replace(/^#+/, ''));
    return p.hashtags.some((h) => myJoined.includes(h.toLowerCase().replace(/^#+/, '')));
  }).length;

  // Count active Media / Photo posts
  const mediaPostsCount = posts.filter(
    (p) =>
      Boolean(p.image) &&
      !mutedUserIds.includes(p.authorId) &&
      (!p.sharedFrom || !mutedUserIds.includes(p.sharedFrom.authorId))
  ).length;

  // Count active Mood / Vibrational posts
  const moodPostsCount = posts.filter(
    (p) =>
      Boolean(p.mood) &&
      !mutedUserIds.includes(p.authorId) &&
      (!p.sharedFrom || !mutedUserIds.includes(p.sharedFrom.authorId))
  ).length;

  // Count active Adult Swim 18+ posts
  const adultSwimPostsCount = posts.filter(
    (p) =>
      (p.isAdult ||
        p.hashtags.some((h) => {
          const low = h.toLowerCase().replace(/^#+/, '');
          return (
            low === 'adultswim' ||
            low === 'adult_swim' ||
            low === '18plus' ||
            low === 'afterhours' ||
            low === 'afterdark' ||
            low === 'raw' ||
            low === 'uncensored' ||
            low === 'poetryafterdark'
          );
        })) &&
      !mutedUserIds.includes(p.authorId) &&
      (!p.sharedFrom || !mutedUserIds.includes(p.sharedFrom.authorId))
  ).length;

  // Available unique moods across active posts
  const availableMoods = useMemo(() => {
    const moodMap = new Map<string, { emoji: string; label: string; count: number }>();
    posts.forEach((p) => {
      if (
        p.mood &&
        !mutedUserIds.includes(p.authorId) &&
        (!p.sharedFrom || !mutedUserIds.includes(p.sharedFrom.authorId))
      ) {
        const key = p.mood.label.toLowerCase();
        const existing = moodMap.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          moodMap.set(key, { emoji: p.mood.emoji, label: p.mood.label, count: 1 });
        }
      }
    });
    return Array.from(moodMap.values()).sort((a, b) => b.count - a.count);
  }, [posts, mutedUserIds]);

  // Filter friend suggestions or friend search results (exclude current user and muted users)
  const isFriendSearching = friendSearchQuery.trim().length > 0;
  const displayedFriendsList = allUsers.filter((u) => {
    if (u.id === currentUser.id) return false;
    if (mutedUserIds.includes(u.id)) return false;

    if (isFriendSearching) {
      const q = friendSearchQuery.toLowerCase().trim();
      return u.name.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q);
    }

    // Default suggested friends: not yet added as friends
    return !currentUser.friends.includes(u.id);
  });

  return (
    <div className="min-h-screen bg-transparent text-slate-100 font-sans selection:bg-pink-600 selection:text-white flex flex-col">
      {/* GPU-Accelerated Hardware Canvas Moving Dot Background */}
      <AnimatedBackground />

      {/* Header */}
      <Header
        activeTab={activeCityPage || activeFriendMoodPage ? ('' as any) : activeTab}
        setActiveTab={(tab) => {
          setActiveCityPage(null);
          setActiveFriendMoodPage(null);
          setActiveTab(tab);
        }}
        currentUser={currentUser}
        onOpenUploadAvatarModal={() => setIsUploadAvatarModalOpen(true)}
      />

      {/* Global Toast Notification */}
      {toastNotification && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="relative group">
            {toastNotification.iconType === 'discovery' || toastNotification.iconType === 'trending' ? (
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500/50 via-rose-500/50 to-pink-500/50 blur-xl opacity-95 transition-all pointer-events-none animate-pulse" />
            ) : (
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-pink-500/40 via-purple-500/40 to-pink-500/40 blur-xl opacity-90 transition-all pointer-events-none" />
            )}
            <div
              className={`relative bg-black/95 backdrop-blur-xl p-4 rounded-2xl flex flex-col gap-3 transition-all ${
                toastNotification.iconType === 'discovery' || toastNotification.iconType === 'trending'
                  ? 'border-2 border-amber-400/90 shadow-[0_0_35px_rgba(251,191,36,0.35),0_10px_25px_rgba(0,0,0,0.85)]'
                  : 'border-2 border-pink-400 shadow-[0_0_30px_rgba(244,114,182,0.5),0_10px_25px_rgba(0,0,0,0.8)]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(244,114,182,0.4)] ${
                    toastNotification.iconType === 'discovery' || toastNotification.iconType === 'trending'
                      ? 'bg-amber-500/20 border border-amber-400/80 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                      : 'bg-pink-500/20 border border-pink-400/50 text-pink-300'
                  }`}
                >
                  {toastNotification.iconType === 'discovery' || toastNotification.iconType === 'trending' ? (
                    <TrendingUp className="w-5 h-5 text-amber-300 animate-bounce" />
                  ) : toastNotification.iconType === 'poll' ? (
                    <BarChart2 className="w-5 h-5 text-pink-400 animate-pulse" />
                  ) : toastNotification.iconType === 'sparkles' ? (
                    <Sparkles className="w-5 h-5 text-pink-400 animate-pulse" />
                  ) : (
                    <Heart className="w-5 h-5 fill-pink-400 text-pink-400 animate-pulse" />
                  )}
                </div>
                <div className="flex-1 pr-2">
                  <h4
                    className={`font-bold text-sm ${
                      toastNotification.iconType === 'discovery' || toastNotification.iconType === 'trending'
                        ? 'text-amber-200'
                        : 'text-pink-200'
                    }`}
                  >
                    {toastNotification.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {toastNotification.message}
                  </p>
                  
                  {/* Badges and Velocity Indicators */}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {toastNotification.velocityMetric && (
                      <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/70 px-2.5 py-0.5 rounded-full border border-amber-400/50 shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                        <TrendingUp className="w-3 h-3 text-amber-400" />
                        <span>{toastNotification.velocityMetric}</span>
                      </div>
                    )}
                    {(toastNotification.badge || toastNotification.message.includes('Awarded +1 Like')) && (
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-pink-300 bg-pink-950/60 px-2 py-0.5 rounded-full border border-pink-500/40">
                        <Sparkles className="w-3 h-3 text-pink-400" />
                        <span>{toastNotification.badge || 'Original Author Received +1 Like'}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setToastNotification(null)}
                  className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded-lg hover:bg-neutral-800 transition-all cursor-pointer"
                  title="Dismiss notification"
                >
                  ✕
                </button>
              </div>

              {/* One-Click Button to Jump Directly into the Stream */}
              {toastNotification.action && (
                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    Trending stream active
                  </span>
                  <button
                    type="button"
                    onClick={toastNotification.action.onClick}
                    className="w-full sm:w-auto ml-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:from-amber-400 hover:via-rose-400 hover:to-pink-400 text-white font-bold text-xs shadow-[0_0_18px_rgba(244,63,94,0.4)] hover:shadow-[0_0_26px_rgba(244,63,94,0.6)] transition-all transform active:scale-95 cursor-pointer"
                  >
                    <span>{toastNotification.action.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* VIEW: CITY TOP 10 STREAMS SHOWCASE PAGE */}
        {activeCityPage ? (
          <CityStreamsShowcasePage
            cityName={activeCityPage}
            allPosts={posts}
            allUsers={allUsers}
            allGroups={hashtagGroups}
            currentUser={currentUser}
            onClose={() => setActiveCityPage(null)}
            onSelectCity={(newCity) => setActiveCityPage(newCity)}
            onOpenStreamDetail={(group) => setActiveGroupDetail(group)}
            onWarpToStreamFeed={(tag) => {
              setActiveCityPage(null);
              handleHashtagClick(tag);
            }}
            onToggleJoinGroup={handleToggleJoinGroup}
            onLikePost={handleLikePost}
            onDislikePost={handleDislikePost}
            onAddComment={handleAddComment}
            onOpenPdf={(doc) => setActivePdfDoc(doc)}
            onShareToChat={() => setIsChatPopupOpen(true)}
            onSharePost={handleSharePost}
            onToggleBookmarkPost={handleToggleBookmarkPost}
            onInspectCompatibility={handleInspectCompatibility}
            onCityClick={handleCityClick}
            onOpenReadingLink={(link) => handleOpenReadingLink(link, { type: 'saved' })}
            onClaimReadingPoints={handleClaimReadingPointsForPost}
            onVotePoll={handleVotePoll}
            onMoodClick={(mood) => {
              setActiveCityPage(null);
              setActiveFriendMoodPage({ emoji: mood.emoji, label: mood.label });
            }}
          />
        ) : activeFriendMoodPage ? (
          <FriendMoodFeedPage
            mood={activeFriendMoodPage}
            allPosts={posts}
            allUsers={allUsers}
            currentUser={currentUser}
            customGroups={hashtagGroups}
            onClose={() => setActiveFriendMoodPage(null)}
            onSelectMood={(newMood) => setActiveFriendMoodPage(newMood)}
            onLikePost={handleLikePost}
            onDislikePost={handleDislikePost}
            onAddComment={handleAddComment}
            onOpenPdf={(doc) => setActivePdfDoc(doc)}
            onShareToChat={handleShareToChat}
            onSharePost={handleSharePost}
            onToggleBookmarkPost={handleToggleBookmarkPost}
            onCreateBookmarkFolder={handleCreateBookmarkFolder}
            onMuteUser={handleMuteUser}
            onInspectCompatibility={handleInspectCompatibility}
            onCityClick={handleCityClick}
            onOpenReadingLink={(link) => handleOpenReadingLink(link, { type: 'saved' })}
            onClaimReadingPoints={handleClaimReadingPointsForPost}
            onVotePoll={handleVotePoll}
            onToggleSaveSong={handleToggleSaveSong}
            onAddWaveformComment={handleAddWaveformComment}
            onApplyFirePowerUp={handleApplyFirePowerUp}
            onSimulateInfectNextProfile={handleSimulateInfectNextProfile}
            onViralPostViewed={handleViralPostViewed}
            onAdvanceFeedCycle={handleAdvanceFeedCycle}
            onClaimFreeSparks={handleClaimFreeSparks}
            onRequestComposeWithMood={(mood) => {
              setActiveFriendMoodPage(null);
              setActiveTab('feed');
            }}
          />
        ) : (
          <>
            {/* VIEW 1: GLOBAL FEED */}
            {activeTab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Feed Filter & User Mini Card Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* Active User Card */}
              <div className="relative group">
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-pink-400/15 via-pink-300/20 to-pink-500/15 blur-lg opacity-30 group-hover:opacity-75 group-hover:scale-[1.02] transition-all duration-300 ease-out pointer-events-none" />
                <div
                  onClick={() => setActiveTab('vault')}
                  className="relative bg-black/75 backdrop-blur-md border border-pink-500/40 hover:border-pink-400 rounded-2xl p-5 card-pink-glow cursor-pointer transition-all duration-300 ease-out transform-gpu hover:scale-[1.02] shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_0_28px_rgba(236,72,153,0.32),0_14px_35px_rgba(0,0,0,0.65)] group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {/* User Profile Avatar with Click to Upload */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsUploadAvatarModalOpen(true);
                      }}
                      className="relative group/photo cursor-pointer shrink-0"
                      title="Click to upload new profile photo"
                    >
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-pink-400/60 group-hover/photo:ring-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.25)] group-hover/photo:scale-105 transition-all"
                      />
                      <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-4 h-4 text-pink-300 animate-pulse" />
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-100 text-sm group-hover:text-pink-300 transition-colors flex items-center gap-1.5">
                        <span>{currentUser.name}</span>
                      </h3>
                      <p className="text-xs text-pink-400 font-mono">{currentUser.handle}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">{currentUser.bio}</p>

                  <div className="pt-3 border-t border-pink-500/20 flex items-center justify-between text-xs text-slate-400">
                    <span>Photos: <strong className="text-pink-300">{currentUser.photos?.length || 0}</strong></span>
                    <span>Friends: <strong className="text-pink-300">{currentUser.friends.length}</strong></span>
                    <span className="text-white font-semibold">
                      Encrypted Profile
                    </span>
                  </div>
                </div>
              </div>

              {/* Feed Category Filter Dropdown Menu */}
              <FeedViewsDropdown
                currentMode={feedFilterMode}
                onSelectMode={(mode) => {
                  if (mode === 'adult_swim' && !isAdultVerified) {
                    setShowAdultAgeGateModal(true);
                    return;
                  }
                  setFeedFilterMode(mode);
                  if (mode !== 'mood') setSelectedMoodFilter(null);
                  if (mode !== 'music') setSelectedMusicGenre('all');
                }}
                selectedHashtagFilter={selectedHashtagFilter}
                onClearHashtagFilter={() => setSelectedHashtagFilter(null)}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                selectedMoodFilter={selectedMoodFilter}
                onSelectMoodFilter={(mood) => setSelectedMoodFilter(mood)}
                onOpenFriendMoodPage={(m) => setActiveFriendMoodPage(m)}
                availableMoods={availableMoods}
                counts={{
                  all: posts.length,
                  poetry: poetryPostsCount,
                  literature: literaturePostsCount,
                  music: musicPostsCount,
                  friends: currentUser.friends.length,
                  groups: joinedGroupsPostsCount,
                  media: mediaPostsCount,
                  mood: moodPostsCount,
                  adult_swim: adultSwimPostsCount,
                  cities: 8,
                  saved: (currentUser.savedPostIds?.length || 0) + (currentUser.savedDocIds?.length || 0),
                }}
                isAdultVerified={isAdultVerified}
                variant="sidebar"
              />

              {/* Active Hashtag Filter Badge if set */}
              {selectedHashtagFilter && (
                <div className="bg-pink-950/40 backdrop-blur-md border border-pink-500/60 p-3 rounded-2xl flex items-center justify-between text-xs shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                  <span className="text-pink-300 font-medium">Filtering by <strong>#{selectedHashtagFilter.replace(/^#+/, '')}</strong></span>
                  <button
                    onClick={() => setSelectedHashtagFilter(null)}
                    className="text-slate-400 hover:text-white font-bold"
                  >
                    ✕ Clear
                  </button>
                </div>
              )}

              {/* Active Vibe Filter Badge if set */}
              {selectedVibeFilter && (
                <div className="bg-fuchsia-950/50 backdrop-blur-md border border-fuchsia-500/60 p-3 rounded-2xl flex items-center justify-between text-xs shadow-[0_0_15px_rgba(217,70,239,0.35)]">
                  <span className="text-fuchsia-200 font-medium flex items-center gap-1.5">
                    <span>✨ Filtering by Vibe Score:</span>
                    <strong className="text-white font-bold font-mono">{selectedVibeFilter}</strong>
                  </span>
                  <button
                    onClick={() => setSelectedVibeFilter(null)}
                    className="text-slate-400 hover:text-white font-bold cursor-pointer"
                  >
                    ✕ Clear
                  </button>
                </div>
              )}

              {/* Trending Streams Sidebar (Moved to Left Side) */}
              <div className="relative group">
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-pink-400/10 via-pink-300/15 to-pink-500/10 blur-md opacity-30 group-hover:opacity-50 transition-all duration-300 pointer-events-none" />
                <div className="relative bg-black/75 backdrop-blur-md border border-pink-500/40 rounded-2xl p-4 space-y-3 card-pink-glow">
                  <div className="flex items-center justify-between border-b border-pink-500/20 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                      <Flame className="w-4 h-4 text-pink-400" />
                      <span>Trending Streams</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('hashtags')}
                      className="text-[11px] text-pink-400 hover:text-pink-300 font-semibold"
                    >
                      View All →
                    </button>
                  </div>

                  <div className="space-y-2">
                    {hashtags.slice(0, 4).map((h) => (
                      <div
                        key={h.tag}
                        onClick={() => handleHashtagClick(h.tag)}
                        className="p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-900 border border-pink-500/20 hover:border-pink-500/60 hover:shadow-[0_0_10px_rgba(236,72,153,0.3)] cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-xs text-slate-200 hover:text-pink-300 flex items-center gap-1">
                            <span>#{h.tag}</span>
                            <span className="text-[10px] text-pink-400 font-light">Stream</span>
                          </p>
                          <span className="text-[10px] text-slate-400">{h.category}</span>
                        </div>
                        <span className="text-[10px] text-pink-300 bg-black/60 border border-pink-500/30 px-2 py-0.5 rounded font-mono">
                          {h.postCount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Middle Main Post Stream Column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search Bar - Positioned just above where you make posts */}
              <div id="feed-search-container" className="relative group">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-pink-400 absolute left-3.5 pointer-events-none transition-colors group-focus-within:text-pink-300" />
                  <input
                    id="feed-search-input"
                    type="text"
                    placeholder={isVoiceSearching ? 'Listening... Speak now...' : 'Search posts, #hashtags, authors, or poetry...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full bg-neutral-900/90 hover:bg-neutral-900 border ${
                      isVoiceSearching
                        ? 'border-pink-500 ring-2 ring-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.35)]'
                        : 'border-pink-500/30 focus:border-pink-500'
                    } rounded-2xl pl-10 pr-20 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.12)] transition-all`}
                  />

                  {/* Search Actions: Clear Button & Voice Search Mic Button */}
                  <div className="absolute right-2.5 flex items-center gap-1">
                    {searchQuery && (
                      <button
                        id="feed-search-clear-btn"
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      id="feed-search-mic-btn"
                      type="button"
                      onClick={handleToggleVoiceSearch}
                      className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                        isVoiceSearching
                          ? 'bg-pink-600 text-white shadow-[0_0_14px_rgba(236,72,153,0.85)] animate-pulse ring-2 ring-pink-400/60'
                          : 'text-slate-400 hover:text-pink-300 hover:bg-neutral-800/80 active:scale-95'
                      }`}
                      title={isVoiceSearching ? 'Listening... Click to stop' : 'Search by voice'}
                      aria-label="Voice search microphone"
                    >
                      {isVoiceSearching ? (
                        <MicOff className="w-4 h-4 text-white" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Active listening status hint */}
                <AnimatePresence>
                  {isVoiceSearching && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute -bottom-5 left-3 flex items-center gap-1.5 text-[10px] font-mono text-pink-300 pointer-events-none z-10"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
                      <span>Listening... Speak to populate search</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Top of Feed: Active New Post Composer Area */}
              <FeedNewPostComposer
                currentUser={currentUser}
                allUsers={allUsers}
                onSubmitPost={handleCreatePost}
                defaultHashtag={selectedHashtagFilter || (feedFilterMode === 'adult_swim' ? '#AdultSwim' : undefined)}
                onCityClick={handleCityClick}
                isMusicMode={feedFilterMode === 'music'}
                onToggleMusicMode={() => {
                  if (feedFilterMode === 'music') {
                    setFeedFilterMode('all');
                    setSelectedMusicGenre('all');
                  } else {
                    setFeedFilterMode('music');
                    setSelectedMusicGenre('all');
                  }
                }}
                musicPostsCount={musicPostsCount}
                feedFilterMode={feedFilterMode}
                onSelectFeedFilterMode={(mode) => {
                  if (mode === 'adult_swim' && !isAdultVerified) {
                    setShowAdultAgeGateModal(true);
                    return;
                  }
                  setFeedFilterMode(mode as FeedFilterMode);
                  if (mode !== 'mood') setSelectedMoodFilter(null);
                  if (mode !== 'music') setSelectedMusicGenre('all');
                }}
                poetryPostsCount={poetryPostsCount}
                literaturePostsCount={literaturePostsCount}
                onClaimFreeSparks={handleClaimFreeSparks}
                isAdultSwimMode={feedFilterMode === 'adult_swim'}
              />

              {/* Poetry Mode Feed Banner */}
              {feedFilterMode === 'poetry' && (
                <div className="bg-gradient-to-r from-pink-950/80 via-neutral-950 to-rose-950/80 border border-pink-500/50 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(236,72,153,0.25)]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-400/50 flex items-center justify-center text-pink-300 shrink-0 shadow-[0_0_10px_rgba(236,72,153,0.4)]">
                      <Feather className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-pink-100">Poetry Mode Active</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-950 border border-pink-400/50 text-pink-200">
                          {poetryPostsCount} {poetryPostsCount === 1 ? 'poem' : 'poems'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 truncate">
                        Stream filtered exclusively to stanzas, verses, haikus, and rhyming reflections.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedFilterMode('all')}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-pink-500/30 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
                  >
                    Exit Poetry Mode
                  </button>
                </div>
              )}

              {/* Literature Mode Feed Banner */}
              {feedFilterMode === 'literature' && (
                <div className="bg-gradient-to-r from-amber-950/80 via-neutral-950 to-orange-950/80 border border-amber-500/50 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                      <BookOpen className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-amber-100">Literature Mode Active</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 border border-amber-400/50 text-amber-200">
                          {literaturePostsCount} {literaturePostsCount === 1 ? 'work' : 'works'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 truncate">
                        Stream filtered to PDF documents, manuscripts, books, and long-form articles.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedFilterMode('all')}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-amber-500/30 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
                  >
                    Exit Literature Mode
                  </button>
                </div>
              )}

              {/* Adult Swim 18+ Feed Banner when in Adult Swim View */}
              {feedFilterMode === 'adult_swim' && (
                <AdultSwimFeedBanner
                  postCount={adultSwimPostsCount}
                  userAge={userAge}
                  onExitAdultSwim={() => {
                    setFeedFilterMode('all');
                  }}
                  onLockAgeGate={handleLockAdultSwimGate}
                  onComposePost={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {/* Music Feed Banner & Soundscape Player when in Music Feed View */}
              {feedFilterMode === 'music' && (
                <MusicFeedBanner
                  currentUser={currentUser}
                  musicPosts={allMusicPosts}
                  selectedGenre={selectedMusicGenre}
                  onSelectGenre={(genre) => setSelectedMusicGenre(genre)}
                  onExitMusicView={() => {
                    setFeedFilterMode('all');
                    setSelectedMusicGenre('all');
                  }}
                  onOpenMusicVault={() => {
                    setActiveTab('music_library');
                  }}
                  onBulkSaveAllSongs={handleBulkSaveAllMusicSongs}
                />
              )}

              {/* Vibrational Search Status & Filter Bar */}
              {feedFilterMode === 'mood' && (
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-slate-300">
                        <Smile className="w-4 h-4 text-pink-400" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                            <span>Vibrational search</span>
                            <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-neutral-900 text-slate-300 border border-neutral-800">
                              Mood Depth
                            </span>
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Viewing stream filtered by emotional state and mood frequency.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFeedFilterMode('all');
                        setSelectedMoodFilter(null);
                      }}
                      className="text-xs text-slate-400 hover:text-pink-300 transition-colors px-2.5 py-1 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900 cursor-pointer"
                    >
                      ✕ Exit View
                    </button>
                  </div>

                  {/* Vibe Filter Pills */}
                  {availableMoods.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-neutral-800">
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mr-1">
                        Vibe:
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedMoodFilter(null)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer border ${
                          !selectedMoodFilter
                            ? 'bg-neutral-800 text-white font-bold border-neutral-700'
                            : 'bg-neutral-900 text-slate-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
                        }`}
                      >
                        ✨ All Vibrations ({moodPostsCount})
                      </button>

                      {availableMoods.map((m) => {
                        const isSelected =
                          selectedMoodFilter?.toLowerCase() === m.label.toLowerCase();
                        return (
                          <button
                            key={m.label}
                            type="button"
                            onClick={() =>
                              setActiveFriendMoodPage({ emoji: m.emoji, label: m.label })
                            }
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer border ${
                              isSelected
                                ? 'bg-pink-700 text-white font-bold border-pink-600'
                                : 'bg-neutral-900 text-slate-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
                            }`}
                          >
                            <span>{m.emoji}</span>
                            <span>{m.label}</span>
                            <span className="text-[10px] opacity-70">({m.count})</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Active Search / Location Tag Filter Banner */}
              {searchQuery.trim() && (
                <div className="flex items-center justify-between bg-neutral-950/90 border border-pink-500/40 rounded-2xl px-4 py-2.5 text-xs shadow-[0_0_15px_rgba(236,72,153,0.15)] animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-400 font-mono text-[11px]">Filtered by:</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-950/80 border border-pink-500/50 text-pink-300 font-mono font-semibold text-xs">
                      <MapPin className="w-3 h-3 text-pink-400 shrink-0" />
                      <span>{searchQuery}</span>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="ml-1 hover:text-white text-pink-400 font-bold cursor-pointer text-sm leading-none"
                        title="Clear filter"
                      >
                        ×
                      </button>
                    </span>
                    <span className="text-slate-500 text-[11px]">({displayedPosts.length} posts found)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[11px] font-mono text-slate-400 hover:text-pink-300 hover:underline cursor-pointer transition-colors shrink-0 ml-2"
                  >
                    Clear filter
                  </button>
                </div>
              )}

              {/* Real-time Stream Activity Status Bar */}
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-neutral-950/85 border border-pink-500/30 backdrop-blur-md text-xs shadow-[0_0_15px_rgba(236,72,153,0.1)]">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">
                      Live Stream Active
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      • Real-time updates with staggered cascade entrance
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={() => handleSimulateVelocitySpike()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-medium transition-all shadow-[0_0_12px_rgba(251,191,36,0.2)] hover:shadow-[0_0_18px_rgba(251,191,36,0.35)] cursor-pointer"
                    title="Simulate a sudden high-velocity spike on a joined stream and trigger Discovery Notification"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>Simulate Velocity Spike</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateLivePost}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-950/70 hover:bg-pink-900/80 border border-pink-500/40 text-pink-300 hover:text-white text-xs font-medium transition-all shadow-[0_0_12px_rgba(236,72,153,0.2)] hover:shadow-[0_0_18px_rgba(236,72,153,0.35)] cursor-pointer"
                    title="Drop a live incoming post into the stream to observe staggered fade-in animation"
                  >
                    <Radio className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                    <span className="hidden sm:inline">Simulate Incoming Post</span>
                    <span className="sm:hidden">Live Post</span>
                  </button>
                </div>
              </div>

              {/* Posts Stream */}
              {displayedPosts.length > 0 ? (
                <motion.div
                  key={`feed-stream-${feedFilterMode}-${selectedMusicGenre}-${selectedHashtagFilter || 'all'}-${selectedMoodFilter || 'all'}-${searchQuery.trim()}`}
                  variants={feedListContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <AnimatePresence initial={false}>
                    {displayedPosts.map((post) => {
                      const isRealtimeNew = recentNewPostIds.includes(post.id);
                      const authorUser = allUsers.find((u) => u.id === post.authorId);
                      const authorComp = calculateCompatibility(
                        currentUser,
                        authorUser || {
                          id: post.authorId,
                          name: post.authorName,
                          handle: post.authorHandle,
                          avatar: post.authorAvatar,
                          bio: '',
                          location: '',
                          verified: true,
                          joinDate: '',
                          likedPostIds: [],
                          dislikedPostIds: [],
                          friends: [],
                          vaultLocked: true,
                        },
                        posts
                      );

                      return (
                        <motion.div
                          key={post.id}
                          layout="position"
                          variants={feedItemVariants}
                          initial={isRealtimeNew ? { opacity: 0, y: -24, scale: 0.98, filter: 'blur(4px)' } : 'hidden'}
                          animate="visible"
                          exit="exit"
                          transition={{
                            layout: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
                          }}
                          className="relative w-full"
                        >
                          <PostCard
                            post={post}
                            currentUser={currentUser}
                            customGroups={hashtagGroups}
                            onLike={handleLikePost}
                            onDislike={handleDislikePost}
                            onAddComment={handleAddComment}
                            onHashtagClick={handleHashtagClick}
                            onOpenPdf={(doc) => setActivePdfDoc(doc)}
                            onShareToChat={handleShareToChat}
                            onSharePost={handleSharePost}
                            onToggleBookmark={handleToggleBookmarkPost}
                            onCreateBookmarkFolder={handleCreateBookmarkFolder}
                            onMuteUser={handleMuteUser}
                            isBookmarked={(currentUser.savedPostIds || []).includes(post.id)}
                            authorCompatibilityPercent={authorComp.matchPercentage}
                            onInspectCompatibility={handleInspectCompatibility}
                            onOpenHashtagGroup={(tag) => {
                              const grp = hashtagGroups.find((g) => g.tag.replace(/^#+/, '').toLowerCase() === tag.toLowerCase());
                              if (grp) setActiveGroupDetail(grp);
                            }}
                            onCityClick={handleCityClick}
                            onOpenReadingLink={(link) => handleOpenReadingLink(link, { type: 'feed' })}
                            onClaimReadingPoints={handleClaimReadingPointsForPost}
                            onVotePoll={handleVotePoll}
                            onToggleSaveSong={handleToggleSaveSong}
                            onAddWaveformComment={handleAddWaveformComment}
                            isRealtimeNew={isRealtimeNew}
                            onApplyFirePowerUp={handleApplyFirePowerUp}
                            onSimulateInfectNextProfile={handleSimulateInfectNextProfile}
                            onViralPostViewed={handleViralPostViewed}
                            onAdvanceFeedCycle={handleAdvanceFeedCycle}
                            onClaimFreeSparks={handleClaimFreeSparks}
                            allUsers={allUsers}
                            onRequestCreateQuoteCard={handleRequestCreateQuoteCard}
                            onMoodClick={(mood) => setActiveFriendMoodPage({ emoji: mood.emoji, label: mood.label })}
                            onVibeClick={(vibeCat) => setSelectedVibeFilter(vibeCat === selectedVibeFilter ? null : vibeCat)}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              ) : feedFilterMode === 'poetry' ? (
                <div className="bg-black/60 backdrop-blur-md border border-pink-500/40 p-12 rounded-2xl text-center space-y-3 shadow-[0_0_20px_rgba(236,72,153,0.15)]">
                  <Feather className="w-10 h-10 text-pink-400 mx-auto animate-pulse" />
                  <h3 className="font-semibold text-slate-100">No poetry matches this query</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Try clearing your search query or compose an original stanza, haiku, or poem using the composer above!
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedHashtagFilter(null);
                    }}
                    className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-[0_0_12px_rgba(236,72,153,0.5)] transition-all cursor-pointer"
                  >
                    View All Poetry Posts
                  </button>
                </div>
              ) : feedFilterMode === 'literature' ? (
                <div className="bg-black/60 backdrop-blur-md border border-amber-500/40 p-12 rounded-2xl text-center space-y-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                  <BookOpen className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
                  <h3 className="font-semibold text-slate-100">No literature works found for this query</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Upload a PDF document, cite a manuscript, or write a long article to enrich the literature library!
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedHashtagFilter(null);
                    }}
                    className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-[0_0_12px_rgba(245,158,11,0.5)] transition-all cursor-pointer"
                  >
                    View All Literature Works
                  </button>
                </div>
              ) : feedFilterMode === 'adult_swim' ? (
                <div className="bg-black/80 backdrop-blur-md border border-rose-500/50 p-12 rounded-2xl text-center space-y-3 shadow-[0_0_25px_rgba(225,29,72,0.2)]">
                  <Moon className="w-10 h-10 text-rose-400 mx-auto animate-pulse" />
                  <h3 className="font-semibold text-rose-200">No late-night broadcasts found</h3>
                  <p className="text-xs text-rose-300/70 max-w-sm mx-auto font-mono">
                    The pool is calm. Be the first to drop an uncensored confession, verse, or after-hours track into [adult swim] using the composer above.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                    }}
                    className="bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/60 px-4 py-2 rounded-xl text-xs font-mono font-bold shadow-[0_0_12px_rgba(225,29,72,0.4)] transition-all cursor-pointer"
                  >
                    Clear Search Query
                  </button>
                </div>
              ) : feedFilterMode === 'music' ? (
                <div className="bg-black/60 backdrop-blur-md border border-sky-500/40 p-12 rounded-2xl text-center space-y-3 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
                  <Music className="w-10 h-10 text-sky-400 mx-auto animate-pulse" />
                  <h3 className="font-semibold text-slate-200">No tracks found for this music filter</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {selectedMusicGenre !== 'all'
                      ? `No tracks found in the "${selectedMusicGenre}" genre. Switch to "All Tracks" or compose a post with an attached song.`
                      : 'No posts currently have an attached song or music link. Attach a music link when composing to start the music stream!'}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedMusicGenre('all');
                      setSearchQuery('');
                    }}
                    className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-[0_0_12px_rgba(56,189,248,0.5)] transition-all cursor-pointer"
                  >
                    View All Music Tracks
                  </button>
                </div>
              ) : (
                <div className="bg-black/60 backdrop-blur-md border border-pink-500/40 p-12 rounded-2xl text-center space-y-3 shadow-[0_0_15px_rgba(236,72,153,0.15)]">
                  <FileText className="w-10 h-10 text-pink-500/60 mx-auto" />
                  <h3 className="font-semibold text-slate-200">No posts found for this view</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Try clearing search query or publishing your own verse or PDF document!
                  </p>
                  <button
                    onClick={() => {
                      setFeedFilterMode('all');
                      setSelectedHashtagFilter(null);
                      setSelectedMoodFilter(null);
                      setSearchQuery('');
                    }}
                    className="bg-pink-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-[0_0_12px_rgba(236,72,153,0.5)]"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}

            </div>

            {/* Right Quick Sidebar Column (Friend Search, Suggested Friends & Trending Hashtags) */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* Friend Search Bar (Directly Above Suggested Friends Section) */}
              <div className="relative group">
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-pink-500/20 via-pink-400/20 to-pink-500/20 blur-md opacity-30 group-focus-within:opacity-75 transition-all duration-300 pointer-events-none" />
                <div className="relative bg-black/80 backdrop-blur-md border border-pink-500/40 rounded-2xl p-2.5 flex items-center gap-2.5 card-pink-glow focus-within:border-pink-400 transition-all">
                  <div className="w-7 h-7 rounded-lg bg-pink-950/70 border border-pink-500/30 text-pink-300 flex items-center justify-center shrink-0">
                    <Search className="w-3.5 h-3.5 text-pink-400" />
                  </div>
                  <input
                    type="text"
                    value={friendSearchQuery}
                    onChange={(e) => setFriendSearchQuery(e.target.value)}
                    placeholder="Search friends or @handle..."
                    className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-400 focus:outline-none pr-1"
                  />
                  {friendSearchQuery && (
                    <button
                      onClick={() => setFriendSearchQuery('')}
                      className="p-1 rounded-md text-slate-400 hover:text-pink-300 hover:bg-pink-950/50 transition-all shrink-0"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Suggested Friends / Friend Search Results Widget */}
              <div className="relative group">
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-pink-400/10 via-pink-300/15 to-pink-500/10 blur-md opacity-30 group-hover:opacity-50 transition-all duration-300 pointer-events-none" />
                <div className="relative bg-black/75 backdrop-blur-md border border-pink-500/40 rounded-2xl p-4 space-y-3 card-pink-glow">
                  <div className="flex items-center justify-between border-b border-pink-500/20 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                      {isFriendSearching ? (
                        <>
                          <UserSearch className="w-4 h-4 text-pink-400" />
                          <span>Search Results</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4 text-pink-400" />
                          <span>Suggested Friends</span>
                        </>
                      )}
                    </div>
                    <span className="text-[10px] text-pink-300 bg-pink-950/60 border border-pink-500/30 px-2 py-0.5 rounded-full font-mono">
                      {displayedFriendsList.length}
                    </span>
                  </div>

                  {displayedFriendsList.length === 0 ? (
                    <div className="py-4 text-center space-y-2">
                      <p className="text-xs text-slate-400">
                        {isFriendSearching
                          ? `No users found matching "${friendSearchQuery}"`
                          : 'No new friend suggestions right now.'}
                      </p>
                      {isFriendSearching && (
                        <button
                          onClick={() => setFriendSearchQuery('')}
                          className="text-[11px] text-pink-400 hover:text-pink-300 underline font-medium"
                        >
                          Clear friend search
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {(isFriendSearching ? displayedFriendsList : displayedFriendsList.slice(0, 4)).map((user) => {
                        const isAlreadyFriend = currentUser.friends.includes(user.id);
                        const comp = calculateCompatibility(currentUser, user, posts);

                        return (
                          <div
                            key={user.id}
                            className="p-2.5 rounded-xl bg-neutral-900/80 border border-pink-500/20 hover:border-pink-500/50 transition-all flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-8 h-8 rounded-lg object-cover ring-1 ring-pink-500/40 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-xs text-slate-200 truncate">{user.name}</p>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-[10px] text-pink-300/80 truncate font-mono">{user.handle}</p>
                                  {/* Friend Compatibility Percent Badge */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInspectCompatibility(user.id);
                                    }}
                                    title={`Click to view ${comp.matchPercentage}% compatibility breakdown with ${user.name}`}
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-pink-950/80 hover:bg-pink-900 border border-pink-400/40 text-pink-200 text-[9px] font-mono font-bold hover:scale-105 transition-all cursor-pointer"
                                  >
                                    <Zap className="w-2.5 h-2.5 text-pink-400 fill-pink-400" />
                                    <span>{comp.matchPercentage}%</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isAlreadyFriend ? (
                                <span
                                  title="Already Friends"
                                  className="flex items-center gap-1 text-[10px] text-pink-300 bg-pink-950/70 border border-pink-500/30 px-2 py-1 rounded-lg font-medium"
                                >
                                  <UserCheck className="w-3 h-3 text-pink-400" />
                                  <span className="hidden sm:inline">Friend</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleAddFriend(user.id, user.name)}
                                  title={`Add ${user.name} as friend`}
                                  className="p-1.5 rounded-lg bg-pink-600/40 hover:bg-pink-600 border border-pink-500/50 text-pink-200 hover:text-white transition-all text-xs flex items-center gap-1"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-medium hidden sm:inline">Add</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleMuteUser(user.id, user.name, user.handle)}
                                title={`Mute ${user.handle} (removes posts from feed)`}
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950/60 border border-neutral-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-all text-xs"
                              >
                                <VolumeX className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Vibe Trends Sidebar Widget - Aggregates real-time emotional sentiment */}
              <VibeTrendsWidget
                posts={posts}
                activeVibeFilter={selectedVibeFilter}
                onSelectVibeFilter={(vibe) => setSelectedVibeFilter(vibe)}
              />

              {/* City Leaderboard Widget - Shows rank in your city right below suggested friends */}
              <CityLeaderboardWidget
                currentUser={currentUser}
                allUsers={allUsers}
                posts={posts}
                onAddFriend={handleAddFriend}
                onInspectCompatibility={handleInspectCompatibility}
                onCityClick={handleCityClick}
              />

              {/* Quick Muted Accounts Banner (If Any Accounts Are Muted) */}
              {mutedUserIds.length > 0 && (
                <div className="relative group">
                  <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-pink-300/10 to-rose-500/10 blur-md opacity-30 pointer-events-none" />
                  <div className="relative bg-black/75 backdrop-blur-md border border-rose-500/30 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-rose-500/20 pb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                        <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                        <span>Muted Accounts ({mutedUserIds.length})</span>
                      </div>
                      <button
                        onClick={() => setActiveTab('vault')}
                        className="text-[10px] text-pink-400 hover:text-pink-300 font-semibold"
                      >
                        Vault →
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {mutedUserIds.slice(0, 3).map((id) => {
                        const user = allUsers.find((u) => u.id === id);
                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/60 border border-rose-500/20 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                                alt={user?.name || id}
                                className="w-6 h-6 rounded-md object-cover ring-1 ring-rose-500/30 shrink-0"
                              />
                              <span className="text-[11px] text-slate-300 truncate font-mono">
                                {user?.handle || `@user_${id}`}
                              </span>
                            </div>
                            <button
                              onClick={() => handleUnmuteUser(id, user?.name)}
                              className="text-[10px] text-rose-300 hover:text-rose-100 font-semibold px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 border border-rose-500/30 transition-all shrink-0"
                            >
                              Unmute
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* VIEW 2: HASHTAG TRENDS */}
        {activeTab === 'hashtags' && (
          <HashtagTrendsView
            hashtags={hashtags}
            groups={hashtagGroups}
            allPosts={posts}
            currentUser={currentUser}
            selectedHashtag={selectedHashtagFilter}
            onSelectHashtag={handleHashtagClick}
            onOpenGroupDetail={(group) => setActiveGroupDetail(group)}
            onToggleJoinGroup={handleToggleJoinGroup}
            onCityClick={handleCityClick}
            onSimulateVelocitySpike={handleSimulateVelocitySpike}
          />
        )}

        {/* TAB 3: DEDICATED MEME CREATOR STUDIO */}
        {activeTab === 'meme_creator' && (
          <MemeCreatorView
            currentUser={currentUser}
            allPosts={posts}
            onShareToChat={handleShareToChat}
            onNavigateToCollector={() => setActiveTab('meme_collector')}
            onShareToFeed={(data) => {
              const locationInfo = getAutomaticCityForPost({ hashtags: data.hashtags }, currentUser.city);
              const newPost: Post = {
                id: `post_meme_${Date.now()}`,
                authorId: currentUser.id,
                authorName: currentUser.name,
                authorHandle: currentUser.handle,
                authorAvatar: currentUser.avatar,
                timestamp: 'Just now',
                city: locationInfo.city,
                coordinates: locationInfo.coordinates,
                content: data.content,
                hashtags: data.hashtags,
                image: data.image,
                likesCount: 1,
                dislikesCount: 0,
                commentsCount: 0,
                userReaction: 'like',
                likedBy: [currentUser.id],
                dislikedBy: [],
                comments: [],
              };
              setPosts((prev) => [newPost, ...prev]);
              setRecentNewPostIds((prev) => [newPost.id, ...prev.slice(0, 8)]);
              triggerToast('🚀 Meme Broadcasted!', 'Your crafted meme is now live on the global feed stream.');
            }}
          />
        )}

        {/* TAB 4: DEDICATED MEME COLLECTOR STASH & VAULT */}
        {activeTab === 'meme_collector' && (
          <MemeCollectorView
            currentUser={currentUser}
            allPosts={posts}
            onHashtagClick={handleHashtagClick}
            onNavigateToCreator={() => setActiveTab('meme_creator')}
            onShareToChat={(meme) => {
              handleShareToChat({
                id: `post_meme_${meme.id}`,
                authorId: currentUser.id,
                authorName: currentUser.name,
                authorHandle: currentUser.handle,
                authorAvatar: currentUser.avatar,
                timestamp: 'Just now',
                content: `${meme.title}\n${meme.caption || ''}`,
                hashtags: meme.tags,
                image: meme.url,
                likesCount: meme.likesCount,
                dislikesCount: 0,
                commentsCount: 0,
                likedBy: [],
                dislikedBy: [],
                comments: [],
              } as Post);
            }}
            onShareToFeed={(data) => {
              const locationInfo = getAutomaticCityForPost({ hashtags: data.hashtags }, currentUser.city);
              const newPost: Post = {
                id: `post_meme_${Date.now()}`,
                authorId: currentUser.id,
                authorName: currentUser.name,
                authorHandle: currentUser.handle,
                authorAvatar: currentUser.avatar,
                timestamp: 'Just now',
                city: locationInfo.city,
                coordinates: locationInfo.coordinates,
                content: data.content,
                hashtags: data.hashtags,
                image: data.image,
                likesCount: 1,
                dislikesCount: 0,
                commentsCount: 0,
                userReaction: 'like',
                likedBy: [currentUser.id],
                dislikedBy: [],
                comments: [],
              };
              setPosts((prev) => [newPost, ...prev]);
              setRecentNewPostIds((prev) => [newPost.id, ...prev.slice(0, 8)]);
              triggerToast('🚀 Meme Broadcasted!', 'Your collected meme is now live on the global feed stream.');
            }}
          />
        )}

        {/* ARCHIVED CREATIVE VAULT & DOCUMENT LIBRARY */}
        {(activeTab === 'memories_library' || activeTab === 'saved' || activeTab === 'library' || (activeTab as string) === 'pdfs') && (
          <MemoriesLibraryCombinedView
            currentUser={currentUser}
            allPosts={posts}
            allPdfs={pdfs}
            allUsers={allUsers}
            onLike={handleLikePost}
            onDislike={handleDislikePost}
            onAddComment={handleAddComment}
            onHashtagClick={handleHashtagClick}
            onOpenPdf={(doc) => setActivePdfDoc(doc)}
            onShareToChat={handleShareToChat}
            onSharePost={handleSharePost}
            onShareMemeToFeed={(data) => {
              const locationInfo = getAutomaticCityForPost({ hashtags: data.hashtags }, currentUser.city);
              const newPost: Post = {
                id: `post_meme_${Date.now()}`,
                authorId: currentUser.id,
                authorName: currentUser.name,
                authorHandle: currentUser.handle,
                authorAvatar: currentUser.avatar,
                timestamp: 'Just now',
                city: locationInfo.city,
                coordinates: locationInfo.coordinates,
                content: data.content,
                hashtags: data.hashtags,
                image: data.image,
                likesCount: 1,
                dislikesCount: 0,
                commentsCount: 0,
                userReaction: 'like',
                likedBy: [currentUser.id],
                dislikedBy: [],
                comments: [],
              };
              setPosts((prev) => [newPost, ...prev]);
              setRecentNewPostIds((prev) => [newPost.id, ...prev.slice(0, 8)]);
              triggerToast('🚀 Meme Broadcasted!', 'Your meme is now live on the global feed stream.');
            }}
            onToggleBookmarkPost={handleToggleBookmarkPost}
            onCreateBookmarkFolder={handleCreateBookmarkFolder}
            onToggleBookmarkDoc={handleToggleBookmarkDoc}
            onToggleSaveSong={handleToggleSaveSong}
            onNavigateToFeed={() => setActiveTab('feed')}
            onInspectCompatibility={handleInspectCompatibility}
            onCityClick={handleCityClick}
            onOpenReadingLink={(link) => handleOpenReadingLink(link, { type: 'saved' })}
            onClaimReadingPoints={handleClaimReadingPointsForPost}
            onVotePoll={handleVotePoll}
            onAddWaveformComment={handleAddWaveformComment}
            onRequestCreateQuoteCard={handleRequestCreateQuoteCard}
            onMoodClick={(mood) => setActiveFriendMoodPage({ emoji: mood.emoji, label: mood.label })}
          />
        )}

        {/* VIEW 5: DEDICATED MUSIC LIBRARY TAB */}
        {activeTab === 'music_library' && (
          <MusicLibraryView
            currentUser={currentUser}
            allPosts={posts}
            onToggleSaveSong={handleToggleSaveSong}
            onAddWaveformComment={handleAddWaveformComment}
            onShareToChat={handleShareToChat}
            onSharePost={handleSharePost}
            onNavigateToFeed={() => setActiveTab('feed')}
            onHashtagClick={handleHashtagClick}
          />
        )}

        {/* VIEW 5b: DEDICATED FIND FRIENDS & COMPATIBILITY VIEW */}
        {activeTab === 'find_friends' && (
          <FindFriendsView
            currentUser={currentUser}
            allUsers={allUsers}
            allPosts={posts}
            onAddFriend={handleAddFriend}
            onRemoveFriend={handleRemoveFriend}
            onInspectCompatibility={handleInspectCompatibility}
            onStartChat={handleStartChatWithUser}
            onHashtagClick={handleHashtagClick}
            onNavigateToFeed={() => setActiveTab('feed')}
            onSendMessage={handleSendMessage}
          />
        )}

        {/* VIEW 6: ENCRYPTED PROFILE VAULT & TIMELINE */}
        {activeTab === 'vault' && (
          <EncryptedProfileView
            currentUser={currentUser}
            allPosts={posts}
            allPdfs={pdfs}
            allUsers={allUsers}
            allTrends={hashtags}
            onUpdateProfileVault={(updated) => setCurrentUser(updated)}
            onOpenPdf={(doc) => setActivePdfDoc(doc)}
            onShareToChat={handleShareToChat}
            onSharePost={handleSharePost}
            onToggleBookmarkPost={handleToggleBookmarkPost}
            onCreateBookmarkFolder={handleCreateBookmarkFolder}
            onToggleBookmarkDoc={handleToggleBookmarkDoc}
            onUnmuteUser={handleUnmuteUser}
            onMuteUser={handleMuteUser}
            onLikePost={handleLikePost}
            onDislikePost={handleDislikePost}
            onAddComment={handleAddComment}
            onHashtagClick={handleHashtagClick}
            onInspectCompatibility={handleInspectCompatibility}
            onStartChat={handleStartChatWithUser}
            onAddFriend={handleAddFriend}
            onToggleJoinGroup={handleToggleJoinGroup}
            onOpenGroupDetail={(group) => setActiveGroupDetail(group)}
            onCityClick={handleCityClick}
            onVotePoll={handleVotePoll}
            onApplyFirePowerUp={handleApplyFirePowerUp}
            onSimulateInfectNextProfile={handleSimulateInfectNextProfile}
            onViralPostViewed={handleViralPostViewed}
            onAdvanceFeedCycle={handleAdvanceFeedCycle}
            onClaimFreeSparks={handleClaimFreeSparks}
            onOpenFindFriendsTab={() => setActiveTab('find_friends')}
            onRequestCreateQuoteCard={handleRequestCreateQuoteCard}
            onMoodClick={(mood) => setActiveFriendMoodPage({ emoji: mood.emoji, label: mood.label })}
          />
        )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-pink-500/30 bg-black/60 backdrop-blur-md py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 <span className="font-space-mono font-bold text-pink-400 pink-glow-text">deep_</span> Social & Poetry Network. Zero-Knowledge Web Crypto Profile Vault.</p>
          <div className="flex items-center gap-4">
            <span className="text-pink-400 font-mono">AES-256-GCM Encrypted</span>
            <span>Atmospheric Vibe Engine</span>
          </div>
        </div>
      </footer>

      {/* Friend Compatibility & Synergy Analysis Modal */}
      {selectedCompatibilityUser && (
        <CompatibilityModal
          isOpen={true}
          currentUser={currentUser}
          targetUser={selectedCompatibilityUser}
          result={calculateCompatibility(currentUser, selectedCompatibilityUser, posts)}
          compatibility={calculateCompatibility(currentUser, selectedCompatibilityUser, posts)}
          isFriend={currentUser.friends.includes(selectedCompatibilityUser.id)}
          onClose={() => setSelectedCompatibilityUser(null)}
          onAddFriend={handleAddFriend}
          onStartChat={(target) => {
            setSelectedCompatibilityUser(null);
            handleStartChatWithUser(target);
          }}
        />
      )}

      {/* Hashtag Group Hub Detail Modal */}
      {activeGroupDetail && (
        <HashtagGroupDetailModal
          group={activeGroupDetail}
          allPosts={posts}
          allUsers={allUsers}
          currentUser={currentUser}
          onClose={() => setActiveGroupDetail(null)}
          onToggleJoinGroup={handleToggleJoinGroup}
          onLikePost={handleLikePost}
          onDislikePost={handleDislikePost}
          onAddComment={handleAddComment}
          onOpenPdf={(doc) => setActivePdfDoc(doc)}
          onShareToChat={handleShareToChat}
          onSharePost={handleSharePost}
          onToggleBookmarkPost={handleToggleBookmarkPost}
          onToggleSaveSong={handleToggleSaveSong}
          onAddWaveformComment={handleAddWaveformComment}
          onMuteUser={handleMuteUser}
          onInspectCompatibility={handleInspectCompatibility}
          onStartChat={handleStartChatWithUser}
          onAddFriend={handleAddFriend}
          onOpenReadingLink={(link) => handleOpenReadingLink(link, { type: 'group' })}
          onClaimReadingPoints={handleClaimReadingPointsForPost}
          onAddReadingToStream={handleSaveEstimatedReading}
          onCityClick={handleCityClick}
          onRequestCreateQuoteCard={handleRequestCreateQuoteCard}
          onMoodClick={(mood) => {
            setActiveGroupDetail(null);
            setActiveFriendMoodPage({ emoji: mood.emoji, label: mood.label });
          }}
          onHashtagWarp={(tag) => {
            handleHashtagClick(tag);
          }}
          onWarpToMainFeed={(tag) => {
            setActiveGroupDetail(null);
            const clean = tag.replace(/^#+/, '');
            setWarpingTag(`#${clean}`);
            setSelectedHashtagFilter(`#${clean}`);
            setActiveTab('feed');
          }}
        />
      )}

      {/* PDF Document Reader Modal */}
      {activePdfDoc && (
        <PDFViewerModal
          document={activePdfDoc}
          onClose={() => setActivePdfDoc(null)}
          onShareToChat={handleShareToChat}
          onRequestCreateQuoteCard={handleRequestCreateQuoteCard}
        />
      )}

      {/* Interactive Reading View Modal with Automatic Points Awarding */}
      {activeReadingLink && (
        <ReadingViewModal
          readingLink={activeReadingLink}
          currentUser={currentUser}
          isAlreadyCompleted={currentUser.completedReadings?.some((r) => r.linkId === activeReadingLink.id || r.url === activeReadingLink.url)}
          onClose={() => {
            if (readingLinkSource?.type === 'chat') {
              handleBackToChat();
            } else {
              setActiveReadingLink(null);
              setReadingLinkSource(null);
            }
          }}
          onCompleteReading={handleCompleteReading}
          onShareToChat={(postOrDoc) => handleShareToChat(postOrDoc)}
          onRequestCreateQuoteCard={handleRequestCreateQuoteCard}
          sourceScreen={readingLinkSource?.type}
          sourceChatTitle={readingLinkSource?.chatTitle}
          onBackToChat={readingLinkSource?.type === 'chat' ? handleBackToChat : undefined}
        />
      )}

      {/* Quote Card Creator Modal */}
      {quoteCardModalState && (
        <CreateQuoteCardModal
          isOpen={Boolean(quoteCardModalState)}
          onClose={() => setQuoteCardModalState(null)}
          currentUser={currentUser}
          initialQuoteText={quoteCardModalState.quoteText}
          initialSourceTitle={quoteCardModalState.sourceTitle}
          sourceType={quoteCardModalState.sourceType}
          sourceAuthor={quoteCardModalState.sourceAuthor}
          sourceDoc={quoteCardModalState.sourceDoc}
          onShareAsPost={handleShareQuoteCardAsPost}
        />
      )}

      {/* Reading Time & Points Estimator Modal */}
      {isEstimatorModalOpen && (
        <ReadingEstimatorModal
          isOpen={isEstimatorModalOpen}
          initialHashtag={estimatorInitialTag}
          onClose={() => setIsEstimatorModalOpen(false)}
          onSaveReadingLink={handleSaveEstimatedReading}
        />
      )}

      {/* Starfield Hyperspace Warp Overlay Animation */}
      <StarfieldWarpOverlay
        activeTag={warpingTag}
        onWarpComplete={() => setWarpingTag(null)}
      />

      {/* 3D Phone Accelerometer HUD & Controls */}
      <AccelerometerHUD />

      {/* Pop-Up Chat Window & Launcher in Bottom Right Corner */}
      <ChatPopupWindow
        isOpen={isChatPopupOpen}
        onClose={() => setIsChatPopupOpen(false)}
        onToggleOpen={() => setIsChatPopupOpen((prev) => !prev)}
        conversations={conversations}
        currentUser={currentUser}
        allPdfs={pdfs}
        allPosts={posts}
        activeChatId={popupActiveChatId}
        onSelectChat={(chatId) => setPopupActiveChatId(chatId)}
        onOpenPdf={(doc) => setActivePdfDoc(doc)}
        onOpenReadingLink={(link, chatContext) =>
          handleOpenReadingLink(link, {
            type: 'chat',
            chatId: chatContext?.chatId || popupActiveChatId || undefined,
            chatTitle: chatContext?.chatTitle,
          })
        }
        onSendMessage={handleSendMessage}
        onAnswerCompatibilityQuestion={handleAnswerCompatibilityQuestion}
        onInspectCompatibility={handleInspectCompatibility}
      />

      {/* Global Upload & Change Profile Photo Modal */}
      {isUploadAvatarModalOpen && (
        <UploadProfilePhotoModal
          currentUser={currentUser}
          isOpen={isUploadAvatarModalOpen}
          onClose={() => setIsUploadAvatarModalOpen(false)}
          onUpdateAvatar={handleUpdateAvatar}
        />
      )}

      {/* Adult Swim 18+ Age Verification Modal */}
      <AdultSwimAgeGateModal
        isOpen={showAdultAgeGateModal}
        onClose={() => setShowAdultAgeGateModal(false)}
        onConfirmVerification={handleConfirmAgeVerification}
      />

    </div>
  );
}
