import React, { useState, useRef, useEffect } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  MessageSquare,
  Share2,
  FileText,
  BadgeCheck,
  Send,
  Download,
  BookOpen,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Repeat,
  Link,
  Check,
  Heart,
  ExternalLink,
  Zap,
  MapPin,
  MoreHorizontal,
  VolumeX,
  UserX,
  Clock,
  Award,
  CheckCircle2,
  BarChart2,
  Radio,
  Music,
  Smile,
  FolderPlus,
  Folder,
  FolderHeart,
  ChevronDown,
  Plus,
  Trash2,
  X,
  Play,
  Pause,
  Disc,
  Flame,
  Quote,
  Feather,
} from 'lucide-react';
import { HashtagGroup, PDFDocument, Post, PostMood, PostSong, ReadingLink, User, WaveformComment } from '../types';
import { QuoteCardPreview } from './QuoteCardPreview';
import { musicAudioEngine } from '../utils/musicAudioEngine';
import { TrackWaveform } from './TrackWaveform';
import { VoicePostWaveformPlayer } from './VoicePostWaveformPlayer';
import { useDeviceTilt } from '../hooks/useDeviceTilt';
import { ReadingLinkCard } from './ReadingLinkCard';
import { getPostReadingStats, extractUrlsFromText, estimateReadingFromUrl, getEffectivePostReadingLinks, getGroupReadingRank } from '../utils/readingEstimator';
import { getAutomaticCityForPost } from '../utils/cityRegions';
import { getPostStreamInfo, getUserStreamPoints } from '../utils/hashtagGroups';
import { formatRelativeTime } from '../utils/timeAgo';
import { CountUpPoints } from './CountUpPoints';
import { triggerLikeVibration, triggerDislikeVibration, triggerReadingRankBadgeVibration, triggerPollVoteVibration } from '../utils/haptics';
import { PostFireMenu } from './PostFireMenu';
import { PostFireBadges } from './PostFireBadges';
import { FirePostAura, FireIgnitionBurst, FireButtonEmbers } from './FireAnimation';
import { ViralSpreadModal } from './ViralSpreadModal';
import { ViralContagionEffect, ContagionSpreadFeedBanner } from './ViralContagionEffect';
import { PollCompatibilityAnimation } from './PollCompatibilityAnimation';
import { VibeScoreBadge } from './VibeScoreBadge';
import { motion, AnimatePresence, type Variants } from 'motion/react';

// Motion-framer variants for tactile power-up activation triggers
const fireTriggerButtonVariants: Variants = {
  idle: {
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 500, damping: 25 },
  },
  hover: {
    scale: 1.04,
    y: -1,
    transition: { type: 'spring', stiffness: 550, damping: 18 },
  },
  tap: {
    scale: 0.93,
    y: 0,
    transition: { type: 'spring', stiffness: 650, damping: 20 },
  },
  active: {
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 500, damping: 25 },
  },
  igniting: {
    scale: [1, 1.18, 0.94, 1.06, 1],
    rotate: [0, -3, 3, -1, 0],
    transition: {
      type: 'keyframes',
      duration: 0.6,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
};

const flameIconVariants: Variants = {
  idle: { scale: 1, rotate: 0 },
  hover: { scale: 1.15, rotate: [0, -6, 6, 0], transition: { type: 'keyframes', duration: 0.3 } },
  active: {
    scale: [1.1, 1.22, 1.12, 1.2, 1.1],
    rotate: [0, -4, 4, -2, 0],
    transition: { type: 'keyframes', repeat: Infinity, duration: 2.2, ease: 'easeInOut' },
  },
  igniting: {
    scale: [1, 1.55, 1.1, 1.35, 1.15],
    rotate: [0, -12, 12, -6, 0],
    transition: { type: 'keyframes', duration: 0.65, ease: 'easeOut' },
  },
};

const fireStatusLabelVariants: Variants = {
  initial: { opacity: 0, y: 4, filter: 'blur(2px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 500, damping: 22 },
  },
  exit: {
    opacity: 0,
    y: -4,
    filter: 'blur(2px)',
    transition: { duration: 0.15 },
  },
};

const cardIgnitionTactilePulseVariants: Variants = {
  initial: { opacity: 0, scale: 0.99 },
  animate: {
    opacity: [0, 0.85, 0.35, 0.75, 0],
    scale: [0.99, 1.006, 1],
    transition: { type: 'keyframes', duration: 0.75, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.22 },
  },
};

const fireDropdownWrapperVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.88,
    y: 10,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 440,
      damping: 26,
      mass: 0.75,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 8,
    filter: 'blur(6px)',
    transition: {
      duration: 0.18,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

interface PostCardProps {
  post: Post;
  currentUser: User;
  customGroups?: HashtagGroup[];
  onLike: (postId: string) => void;
  onDislike: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onHashtagClick?: (tag: string) => void;
  onOpenPdf: (doc: PDFDocument) => void;
  onShareToChat?: (post: Post) => void;
  onSharePost?: (post: Post, method: 'feed' | 'chat' | 'copy' | 'sms') => void;
  onToggleBookmark?: (postId: string, folderId?: string) => void;
  onCreateBookmarkFolder?: (folderName: string, postIdToSave?: string) => void;
  onMuteUser?: (userId: string, userName: string, userHandle: string) => void;
  isBookmarked?: boolean;
  authorCompatibilityPercent?: number;
  onInspectCompatibility?: (userId: string) => void;
  onOpenHashtagGroup?: (tag: string) => void;
  onCityClick?: (city: string) => void;
  onOpenReadingLink?: (link: ReadingLink) => void;
  onClaimReadingPoints?: (post: Post, points: number, hashtag: string) => void;
  onVotePoll?: (postId: string, optionId: string) => void;
  onToggleSaveSong?: (song: PostSong, postId?: string) => void;
  onAddWaveformComment?: (songId: string, comment: WaveformComment, postId?: string) => void;
  isRealtimeNew?: boolean;
  onApplyFirePowerUp?: (
    postId: string,
    powerUpType: 'boost' | 'glow' | 'multiplier' | 'viral',
    cost: number,
    params?: {
      boostScore?: number;
      multiplierFactor?: number;
      totalCycles?: number;
    },
    groupTag?: string
  ) => void;
  onSimulateInfectNextProfile?: (postId: string) => void;
  onViralPostViewed?: (postId: string, viewerUser?: User) => void;
  onAdvanceFeedCycle?: () => void;
  onClaimFreeSparks?: () => void;
  allUsers?: User[];
  onRequestCreateQuoteCard?: (data: {
    quoteText: string;
    sourceTitle: string;
    sourceType: 'poetry' | 'pdf';
    sourceAuthor?: string;
    sourceAuthorAvatar?: string;
    sourceId?: string;
    sourceDoc?: PDFDocument;
  }) => void;
  onMoodClick?: (mood: PostMood) => void;
  onVibeClick?: (vibeCategory: string) => void;
}

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  shape: 'circle' | 'rect' | 'star' | 'heart';
  duration: number;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  customGroups,
  onLike,
  onDislike,
  onAddComment,
  onHashtagClick,
  onOpenPdf,
  onShareToChat,
  onSharePost,
  onToggleBookmark,
  onCreateBookmarkFolder,
  onMuteUser,
  isBookmarked = false,
  authorCompatibilityPercent,
  onInspectCompatibility,
  onOpenHashtagGroup,
  onCityClick,
  onOpenReadingLink,
  onClaimReadingPoints,
  onVotePoll,
  onToggleSaveSong,
  onAddWaveformComment,
  isRealtimeNew = false,
  onApplyFirePowerUp,
  onSimulateInfectNextProfile,
  onViralPostViewed,
  onAdvanceFeedCycle,
  onClaimFreeSparks,
  allUsers = [],
  onRequestCreateQuoteCard,
  onMoodClick,
  onVibeClick,
}) => {
  const streamInfo = getPostStreamInfo(post, currentUser, customGroups);

  const myJoinedTags = (currentUser.joinedGroupTags || []).map((t) => t.toLowerCase().replace(/^#+/, ''));
  const matchingJoinedTags = post.hashtags.filter((h) =>
    myJoinedTags.includes(h.toLowerCase().replace(/^#+/, ''))
  );
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showAuthorMenu, setShowAuthorMenu] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isShareAnimating, setIsShareAnimating] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<ConfettiParticle[]>([]);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [likeConfettiParticles, setLikeConfettiParticles] = useState<ConfettiParticle[]>([]);
  const [isDislikeAnimating, setIsDislikeAnimating] = useState(false);
  const [dislikeParticles, setDislikeParticles] = useState<ConfettiParticle[]>([]);
  const [isRankUpAnimating, setIsRankUpAnimating] = useState(false);
  const [rankUpParticles, setRankUpParticles] = useState<ConfettiParticle[]>([]);
  const [rankUpAnnouncement, setRankUpAnnouncement] = useState<{
    level: number;
    title: string;
    badge: string;
  } | null>(null);

  // Subtle CSS-Animated 'Pulse' Ring Expanding on Like or Share
  const [pulseRingType, setPulseRingType] = useState<'like' | 'share' | null>(null);
  const [pulseRingKey, setPulseRingKey] = useState<number>(0);
  const prevLikesRef = useRef<number>(post.likes);
  const prevSharesRef = useRef<number>(post.sharesCount || 0);
  const isFirstRenderRef = useRef<boolean>(true);

  // High engagement indicator: 5+ likes, or 2+ shares, or 3+ comments
  const isHighEngagement =
    post.likes >= 5 ||
    (post.sharesCount !== undefined && post.sharesCount >= 2) ||
    (post.comments && post.comments.length >= 3);

  // Monitor incoming likes or shares and trigger expanding pulse ring
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevLikesRef.current = post.likes;
      prevSharesRef.current = post.sharesCount || 0;
      return;
    }

    const currentShares = post.sharesCount || 0;
    if (post.likes > prevLikesRef.current) {
      setPulseRingType('like');
      setPulseRingKey((k) => k + 1);
    } else if (currentShares > prevSharesRef.current) {
      setPulseRingType('share');
      setPulseRingKey((k) => k + 1);
    }

    prevLikesRef.current = post.likes;
    prevSharesRef.current = currentShares;
  }, [post.likes, post.sharesCount]);

  useEffect(() => {
    if (!pulseRingType) return;
    const timer = setTimeout(() => {
      setPulseRingType(null);
    }, 1500);
    return () => clearTimeout(timer);
  }, [pulseRingKey, pulseRingType]);

  const prevStreamTagRef = useRef<string>(streamInfo.tag);
  const prevRankLevelRef = useRef<number>(streamInfo.level);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const authorMenuRef = useRef<HTMLDivElement>(null);
  const saveMenuRef = useRef<HTMLDivElement>(null);
  const fireMenuRef = useRef<HTMLDivElement>(null);

  // Fire Boosts & Power-Ups Menu State
  const [showFireMenu, setShowFireMenu] = useState(false);
  const [showViralGraphModal, setShowViralGraphModal] = useState(false);

  // Quote Card Selection State
  const [selectedPoetryText, setSelectedPoetryText] = useState('');
  const [quoteSelectionCoords, setQuoteSelectionCoords] = useState<{ x: number; y: number } | null>(null);

  const handlePoetrySelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setQuoteSelectionCoords(null);
      return;
    }
    const text = sel.toString().trim();
    if (text.length >= 3) {
      setSelectedPoetryText(text);
      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setQuoteSelectionCoords({
          x: Math.max(20, Math.min(window.innerWidth - 100, rect.left + rect.width / 2)),
          y: Math.max(30, rect.top - 10),
        });
      } catch {
        setQuoteSelectionCoords(null);
      }
    } else {
      setQuoteSelectionCoords(null);
    }
  };

  const handleLaunchPoetryQuote = (customText?: string) => {
    const text = customText || selectedPoetryText || post.content;
    if (onRequestCreateQuoteCard) {
      onRequestCreateQuoteCard({
        quoteText: text,
        sourceTitle: post.poetryFormatted ? 'Poem by ' + post.authorName : 'Post by ' + post.authorName,
        sourceType: post.poetryFormatted ? 'poetry' : (post.document ? 'pdf' : 'poetry'),
        sourceAuthor: post.authorName,
        sourceAuthorAvatar: post.authorAvatar,
        sourceId: post.id,
        sourceDoc: post.document,
      });
    }
    setQuoteSelectionCoords(null);
    setSelectedPoetryText('');
  };
  const isPostGlowActive = Boolean(post.firePowerUps?.glow?.active);
  const isPostBoostActive = Boolean(post.firePowerUps?.boost?.active);
  const isPostMultiplierActive = Boolean(post.firePowerUps?.multiplier?.active && post.firePowerUps.multiplier.cyclesRemaining > 0);
  const isPostViralActive = Boolean(post.isInfected || (post.firePowerUps?.viral?.active && !post.firePowerUps.viral.fadedAway));
  const activeFireCount = [isPostBoostActive, isPostGlowActive, isPostMultiplierActive, isPostViralActive].filter(Boolean).length;
  const hasActiveFire = activeFireCount > 0;

  // Fire Ignition Burst Animation State
  const [ignitingPowerUp, setIgnitingPowerUp] = useState<{
    type: 'boost' | 'glow' | 'multiplier' | 'viral';
    title?: string;
    badge?: string;
  } | null>(null);
  const ignitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerIgnitionAnimation = (
    type: 'boost' | 'glow' | 'multiplier' | 'viral',
    title?: string,
    badge?: string
  ) => {
    if (ignitionTimeoutRef.current) {
      clearTimeout(ignitionTimeoutRef.current);
    }
    setIgnitingPowerUp({ type, title, badge });
    triggerReadingRankBadgeVibration();
    ignitionTimeoutRef.current = setTimeout(() => {
      setIgnitingPowerUp(null);
    }, 1800);
  };

  useEffect(() => {
    return () => {
      if (ignitionTimeoutRef.current) {
        clearTimeout(ignitionTimeoutRef.current);
      }
    };
  }, []);

  // Save Menu State & Folder Collections
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  // Auto-estimate Reading Stats for this post (supporting up to 3 links)
  const readingStats = getPostReadingStats(post);
  const effectiveReadingLinks = getEffectivePostReadingLinks(post);
  const primaryReadingLink = effectiveReadingLinks[0] || null;

  const isLinkClaimed = (link: ReadingLink) =>
    (currentUser.completedReadings || []).some(
      (cr) =>
        cr.linkId === link.id ||
        cr.url === link.url ||
        cr.linkId === post.id
    );

  const isReadingClaimed =
    effectiveReadingLinks.length > 0
      ? effectiveReadingLinks.every((link) => isLinkClaimed(link))
      : (currentUser.completedReadings || []).some((cr) => cr.linkId === post.id);

  // Poll state & interactive voting
  const [localPoll, setLocalPoll] = useState(post.poll);
  const [pollCompatibilityImpact, setPollCompatibilityImpact] = useState<{
    delta: number;
    oldScore: number;
    newScore: number;
    votedOptionText: string;
    peerVoterNames: string[];
    isAgreementWithAuthor: boolean;
  } | null>(null);
  const [optionBurstId, setOptionBurstId] = useState<string | null>(null);
  const [headerBadgePulse, setHeaderBadgePulse] = useState(false);
  const prevCompatibilityScoreRef = useRef<number | undefined>(authorCompatibilityPercent);

  // Subtle Pop-Up Indicator State for Compatibility Depth change
  const [depthPopupOptionId, setDepthPopupOptionId] = useState<string | null>(null);
  const [depthPopupData, setDepthPopupData] = useState<{
    delta: number;
    oldScore: number;
    newScore: number;
    votedOptionText: string;
    peerCount: number;
    authorName: string;
    authorHandle: string;
    hasPeerConsensus: boolean;
  } | null>(null);

  useEffect(() => {
    if (depthPopupOptionId) {
      const handleGlobalClick = () => {
        setDepthPopupOptionId(null);
        setOptionBurstId(null);
      };

      const timer = setTimeout(() => {
        setDepthPopupOptionId(null);
      }, 5500);

      // Listen for window click outside to dismiss
      const listenerTimeout = setTimeout(() => {
        window.addEventListener('click', handleGlobalClick);
      }, 100);

      return () => {
        clearTimeout(timer);
        clearTimeout(listenerTimeout);
        window.removeEventListener('click', handleGlobalClick);
      };
    }
  }, [depthPopupOptionId]);

  useEffect(() => {
    setLocalPoll(post.poll);
  }, [post.poll]);

  useEffect(() => {
    if (
      prevCompatibilityScoreRef.current !== undefined &&
      authorCompatibilityPercent !== undefined &&
      authorCompatibilityPercent !== prevCompatibilityScoreRef.current
    ) {
      setHeaderBadgePulse(true);
      const timer = setTimeout(() => setHeaderBadgePulse(false), 2800);
      return () => clearTimeout(timer);
    }
    prevCompatibilityScoreRef.current = authorCompatibilityPercent;
  }, [authorCompatibilityPercent]);

  const userVotedOptionId =
    localPoll?.userVotedOptionId ||
    localPoll?.options.find((opt) => opt.votedUserIds?.includes(currentUser.id))?.id;

  const handleOptionVote = (optionId: string) => {
    if (!localPoll) return;

    if (depthPopupOptionId === optionId) {
      // Toggle close if already showing for this option
      setDepthPopupOptionId(null);
      setOptionBurstId(null);
      setPollCompatibilityImpact(null);
      return;
    }

    const alreadyVotedOption = localPoll.options.find(
      (o) => o.id === userVotedOptionId || o.votedUserIds?.includes(currentUser.id)
    );

    const updatedOptions = localPoll.options.map((opt) => {
      let newVotes = opt.votes;
      let newVotedUserIds = [...(opt.votedUserIds || [])];

      if (alreadyVotedOption && alreadyVotedOption.id === opt.id && opt.id !== optionId) {
        newVotes = Math.max(0, newVotes - 1);
        newVotedUserIds = newVotedUserIds.filter((uid) => uid !== currentUser.id);
      }

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

    setLocalPoll({
      ...localPoll,
      options: updatedOptions,
      totalVotes: newTotalVotes,
      userVotedOptionId: optionId,
    });

    // If user clicked the same option and depth popup or compatibility impact is currently open, dismiss it
    if (userVotedOptionId === optionId && (depthPopupOptionId === optionId || pollCompatibilityImpact)) {
      setDepthPopupOptionId(null);
      setOptionBurstId(null);
      setPollCompatibilityImpact(null);
      return;
    }

    // Calculate interactive score impact animation for this poll vote
    const votedOption = localPoll.options.find((o) => o.id === optionId);
    const currentScore = authorCompatibilityPercent ?? 76;
    const isAlreadyVoted = Boolean(userVotedOptionId);

    // Find peer voter names who picked this option
    const peerIds = (votedOption?.votedUserIds || []).filter((uid) => uid !== currentUser.id);
    const hasPeerConsensus = peerIds.length > 0;

    // Calculate Compatibility Depth change triggered by the vote:
    // +4% base community depth, +5% with peer consensus, +2% on vote change
    let computedDelta = 4;
    if (isAlreadyVoted) {
      computedDelta = userVotedOptionId === optionId ? 0 : 2;
    } else if (hasPeerConsensus) {
      computedDelta = 5;
    }
    const computedNewScore = Math.min(99, Math.max(40, currentScore + computedDelta));

    const peerNames = peerIds.map((uid) => {
      if (uid === 'usr_1') return 'Elena Vance';
      if (uid === 'usr_2') return 'Kaelen Voss';
      if (uid === 'usr_3') return 'Aria Sol';
      if (uid === 'usr_4') return 'Marcus Thorne';
      return 'Peer Explorer';
    });

    setOptionBurstId(optionId);
    setHeaderBadgePulse(true);

    // Trigger subtle pop-up indicator calculating Compatibility Depth change directly next to voting animation
    setDepthPopupOptionId(optionId);
    setDepthPopupData({
      delta: computedDelta,
      oldScore: currentScore,
      newScore: computedNewScore,
      votedOptionText: votedOption?.text || '',
      peerCount: peerIds.length,
      authorName: post.authorName,
      authorHandle: post.authorHandle || post.authorName.toLowerCase().replace(/\s+/g, '_'),
      hasPeerConsensus,
    });

    setPollCompatibilityImpact({
      delta: computedDelta,
      oldScore: currentScore,
      newScore: computedNewScore,
      votedOptionText: votedOption?.text || '',
      peerVoterNames: peerNames,
      isAgreementWithAuthor: true,
    });

    // Trigger subtle tactile haptic vibration for ballot drop
    triggerPollVoteVibration();

    // Reset option ripple after 1.5 seconds
    setTimeout(() => {
      setOptionBurstId(null);
    }, 1500);

    if (onVotePoll) {
      onVotePoll(post.id, optionId);
    }
  };

  // Generate subtle pastel confetti particles for share
  const generateConfettiParticles = (): ConfettiParticle[] => {
    const colors = ['#f472b6', '#ec4899', '#fb7185', '#c084fc', '#38bdf8', '#fbbf24', '#ffffff'];
    const shapes: ('circle' | 'rect' | 'star')[] = ['circle', 'rect', 'star'];
    const count = 14;

    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI + (Math.random() * 0.4 - 0.2);
      const distance = 26 + Math.random() * 32;
      return {
        id: Date.now() + i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - (Math.random() * 10 + 4),
        color: colors[i % colors.length],
        size: 3.5 + Math.random() * 3.5,
        rotation: Math.random() * 360,
        shape: shapes[i % shapes.length],
        duration: 0.75 + Math.random() * 0.35,
      };
    });
  };

  // Generate vibrant romantic confetti particles for like (hearts, stars, sparkles, dots)
  const generateLikeConfettiParticles = (): ConfettiParticle[] => {
    const colors = ['#f43f5e', '#ec4899', '#fb7185', '#fda4af', '#f472b6', '#ffedd5', '#fbbf24'];
    const shapes: ('circle' | 'rect' | 'star' | 'heart')[] = ['heart', 'heart', 'star', 'circle', 'heart', 'star'];
    const count = 16;

    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI + (Math.random() * 0.5 - 0.25);
      const distance = 28 + Math.random() * 34;
      return {
        id: Date.now() + i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - (Math.random() * 14 + 6), // biased upward
        color: colors[i % colors.length],
        size: 4 + Math.random() * 4.5,
        rotation: Math.random() * 360,
        shape: shapes[i % shapes.length],
        duration: 0.75 + Math.random() * 0.4,
      };
    });
  };

  // Generate playful particles for dislike
  const generateDislikeParticles = (): ConfettiParticle[] => {
    const colors = ['#f43f5e', '#e11d48', '#fda4af', '#fb7185', '#cbd5e1', '#94a3b8'];
    const shapes: ('circle' | 'rect' | 'star')[] = ['circle', 'rect', 'star'];
    const count = 12;

    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI + (Math.random() * 0.4 - 0.2);
      const distance = 24 + Math.random() * 28;
      return {
        id: Date.now() + i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - (Math.random() * 10 + 4),
        color: colors[i % colors.length],
        size: 3.5 + Math.random() * 3.5,
        rotation: Math.random() * 360,
        shape: shapes[i % shapes.length],
        duration: 0.7 + Math.random() * 0.35,
      };
    });
  };

  // Generate celebratory golden & prismatic particles for reader rank up
  const generateRankUpParticles = (): ConfettiParticle[] => {
    const colors = ['#fbbf24', '#f59e0b', '#ec4899', '#f472b6', '#a855f7', '#38bdf8', '#34d399', '#ffffff'];
    const shapes: ('circle' | 'rect' | 'star' | 'heart')[] = ['star', 'circle', 'star', 'rect', 'heart', 'star'];
    const count = 28;

    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI + (Math.random() * 0.4 - 0.2);
      const distance = 36 + Math.random() * 46;
      return {
        id: Date.now() + i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - (Math.random() * 18 + 8),
        color: colors[i % colors.length],
        size: 4 + Math.random() * 5,
        rotation: Math.random() * 360,
        shape: shapes[i % shapes.length],
        duration: 0.85 + Math.random() * 0.4,
      };
    });
  };

  // Trigger rank-up particle animation whenever the reader rank for this stream increases
  useEffect(() => {
    // If stream changed because the post/card was switched, synchronize tag & level refs
    if (prevStreamTagRef.current !== streamInfo.tag) {
      prevStreamTagRef.current = streamInfo.tag;
      prevRankLevelRef.current = streamInfo.level;
      return;
    }

    if (streamInfo.level > prevRankLevelRef.current) {
      const newLevel = streamInfo.level;
      prevRankLevelRef.current = newLevel;

      triggerReadingRankBadgeVibration();
      setIsRankUpAnimating(true);
      setRankUpParticles(generateRankUpParticles());
      setRankUpAnnouncement({
        level: newLevel,
        title: streamInfo.rankTitle,
        badge: streamInfo.badge,
      });

      const timer = setTimeout(() => {
        setIsRankUpAnimating(false);
        setRankUpAnnouncement(null);
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      prevRankLevelRef.current = streamInfo.level;
    }
  }, [streamInfo.level, streamInfo.tag, streamInfo.rankTitle, streamInfo.badge]);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
      if (authorMenuRef.current && !authorMenuRef.current.contains(e.target as Node)) {
        setShowAuthorMenu(false);
      }
      if (saveMenuRef.current && !saveMenuRef.current.contains(e.target as Node)) {
        setShowSaveMenu(false);
        setShowNewFolderInput(false);
      }
      if (fireMenuRef.current && !fireMenuRef.current.contains(e.target as Node)) {
        setShowFireMenu(false);
      }
    };
    if (showShareMenu || showAuthorMenu || showSaveMenu || showFireMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu, showAuthorMenu, showSaveMenu, showFireMenu]);

  // Trigger Share Action & Reward Like
  const handleTriggerShare = (method: 'feed' | 'chat' | 'copy' | 'sms') => {
    setShowShareMenu(false);

    // Trigger subtle confetti burst, expanding pulse ring and glowing animation
    setIsShareAnimating(true);
    setPulseRingType('share');
    setPulseRingKey((k) => k + 1);
    setConfettiParticles(generateConfettiParticles());
    setTimeout(() => {
      setIsShareAnimating(false);
    }, 1600);

    // Call parent handler
    if (onSharePost) {
      onSharePost(post, method);
    } else if (method === 'chat' && onShareToChat) {
      onShareToChat(post);
    }

    if (method === 'copy') {
      setCopiedLink(true);
      navigator.clipboard?.writeText?.(
        `${window.location.origin}/post/${post.id} — "${post.content.slice(0, 80)}..." by ${post.authorName}`
      );
      setTimeout(() => setCopiedLink(false), 2000);
    }

    if (method === 'sms') {
      const shareText = `"${post.content}" - ${post.authorName} (${window.location.origin}/post/${post.id})`;
      const smsUri = `sms:?body=${encodeURIComponent(shareText)}`;
      window.open(smsUri, '_self');
    }

    // Set local delightful reward banner
    setShareFeedback(`+1 Like awarded to ${post.authorName}! 💖`);
    setTimeout(() => {
      setShareFeedback(null);
    }, 3200);
  };

  // Handle Like with Confetti Burst Feedback
  const handleLikeClick = () => {
    // If not currently liked, trigger subtle device vibration, confetti burst & expanding pulse ring
    if (!isLiked) {
      triggerLikeVibration();
      setIsLikeAnimating(true);
      setPulseRingType('like');
      setPulseRingKey((k) => k + 1);
      setLikeConfettiParticles(generateLikeConfettiParticles());
      setTimeout(() => {
        setIsLikeAnimating(false);
      }, 1400);
    }
    onLike(post.id);
  };

  // Handle Dislike with "can't like em all!" Animated Badge Feedback
  const handleDislikeClick = () => {
    if (!isDisliked) {
      triggerDislikeVibration();
      setIsDislikeAnimating(true);
      setDislikeParticles(generateDislikeParticles());
      setTimeout(() => {
        setIsDislikeAnimating(false);
      }, 1500);
    }
    onDislike(post.id);
  };

  // 3D Tilt & Accelerometer State
  const cardRef = useRef<HTMLElement>(null);
  const deviceTilt = useDeviceTilt();
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  // Effective 3D angles combining phone accelerometer and mouse hover
  const effectiveRotateX = isHovered ? rotateX : deviceTilt.rotateX;
  const effectiveRotateY = isHovered ? rotateY : deviceTilt.rotateY;
  const effectiveGlareX = isHovered ? mousePos.x : deviceTilt.glareX;
  const effectiveGlareY = isHovered ? mousePos.y : deviceTilt.glareY;
  const hasActiveTilt = isHovered || Math.abs(deviceTilt.rotateX) > 0.2 || Math.abs(deviceTilt.rotateY) > 0.2;

  const isLiked = post.userReaction === 'like' || post.likedBy.includes(currentUser.id);
  const isDisliked = post.userReaction === 'dislike' || post.dislikedBy.includes(currentUser.id);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Gentle, restrained 3D tilt angle calculation with reduced sensitivity
    const maxTilt = 4.5;
    const normalizedX = Math.max(-1, Math.min(1, (x - centerX) / centerX));
    const normalizedY = Math.max(-1, Math.min(1, (y - centerY) / centerY));
    const rotX = -normalizedY * maxTilt;
    const rotY = normalizedX * maxTilt;

    setRotateX(rotX);
    setRotateY(rotY);
    setMousePos({
      x: Math.round((x / rect.width) * 100),
      y: Math.round((y / rect.height) * 100),
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  // Track viewport visibility: when a viral post is viewed, automatically spread to feeds of everyone the viewer knows
  const lastViralViewTimeRef = useRef<number>(0);

  useEffect(() => {
    const viral = post.firePowerUps?.viral;
    if (!viral?.active || viral.fadedAway) return;
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            const now = Date.now();
            // Debounce rapid triggers for the same post card
            if (now - lastViralViewTimeRef.current > 6000) {
              lastViralViewTimeRef.current = now;
              onViralPostViewed?.(post.id, currentUser);
            }
          }
        }
      },
      {
        threshold: [0.35, 0.7],
      }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [post.id, post.firePowerUps?.viral?.active, post.firePowerUps?.viral?.fadedAway, currentUser, onViralPostViewed]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onAddComment(post.id, commentInput.trim());
    setCommentInput('');
  };

  // Saved folders state for this post
  const rawPostFolders = currentUser.savedPostFolders?.[post.id];
  const postFolders: string[] =
    rawPostFolders && rawPostFolders.length > 0
      ? rawPostFolders
      : isBookmarked || (currentUser.savedPostIds || []).includes(post.id)
      ? ['general']
      : [];
  const isPostSaved =
    (currentUser.savedPostIds || []).includes(post.id) || isBookmarked || postFolders.length > 0;
  const isInMemes = postFolders.includes('memes');
  const isInMusic = postFolders.includes('music');
  const isInGeneral = postFolders.includes('general');

  const customFolders = currentUser.customBookmarkFolders || [];

  const getSaveButtonLabel = () => {
    if (!isPostSaved) return 'Save';
    if (postFolders.length === 1) {
      if (postFolders[0] === 'memes') return 'In Memes';
      if (postFolders[0] === 'music') return 'In Music';
      if (postFolders[0] === 'general') return 'Saved';
      const custom = customFolders.find((f) => f.id === postFolders[0]);
      if (custom) return custom.name.length > 10 ? `${custom.name.slice(0, 9)}…` : custom.name;
    }
    if (postFolders.length > 1) {
      return `${postFolders.length} Folders`;
    }
    return 'Saved';
  };

  const isSongSaved = Boolean(
    post.song &&
      ((currentUser.savedSongIds || []).includes(post.song.id) ||
        (currentUser.savedSongs || []).some((s) => s.id === post.song?.id) ||
        isInMusic)
  );

  const [isPlayingSong, setIsPlayingSong] = useState(false);

  useEffect(() => {
    if (!post.song) return;
    const unsub = musicAudioEngine.subscribe((state) => {
      setIsPlayingSong(state.isPlaying && state.trackId === post.song?.id);
    });
    return unsub;
  }, [post.song?.id]);

  const handleTogglePlaySong = () => {
    if (!post.song) return;
    if (isPlayingSong) {
      musicAudioEngine.stop();
      setIsPlayingSong(false);
    } else {
      musicAudioEngine.playPreset(post.song.synthPreset || 'ambient_calm', post.song.id, post.song.durationSeconds);
      setIsPlayingSong(true);
    }
  };

  const handleToggleSaveSongAction = () => {
    if (!post.song) return;
    if (onToggleSaveSong) {
      onToggleSaveSong(post.song, post.id);
    } else if (onToggleBookmark) {
      onToggleBookmark(post.id, 'music');
    }
  };

  const handleToggleFolder = (folderId: string) => {
    if (folderId === 'music' && post.song && onToggleSaveSong) {
      onToggleSaveSong(post.song, post.id);
    }
    if (onToggleBookmark) {
      onToggleBookmark(post.id, folderId);
    }
  };

  const handleQuickSaveAllToggle = () => {
    if (onToggleBookmark) {
      onToggleBookmark(post.id);
    }
  };

  const handleCreateNewFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    if (onCreateBookmarkFolder) {
      onCreateBookmarkFolder(trimmed, post.id);
    } else if (onToggleBookmark) {
      const customId = 'folder_' + trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_');
      onToggleBookmark(post.id, customId);
    }
    setNewFolderName('');
    setShowNewFolderInput(false);
  };

  return (
    <motion.div
      className="py-1 animate-card-float hover:[animation-play-state:paused] relative group post-card-container"
      style={{ perspective: '1000px' }}
      whileHover={{
        scale: 1.02,
        filter: 'drop-shadow(0 25px 35px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 25px rgba(244, 114, 182, 0.35))',
      }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 25,
      }}
    >
      {/* Subtle Light Pink Ambient Back-Glow Layer behind card */}
      <div
        className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r ${
          isRealtimeNew
            ? 'from-pink-500/40 via-purple-500/40 to-pink-500/40 blur-lg animate-pulse'
            : 'from-pink-400/20 via-pink-300/25 to-pink-500/20 blur-md'
        } transition-all duration-300 pointer-events-none ${
          isHovered ? 'opacity-70 scale-[1.018]' : isRealtimeNew ? 'opacity-90 scale-[1.01]' : 'opacity-25 scale-100'
        }`}
      />

      <article
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: hasActiveTilt
            ? `rotateX(${effectiveRotateX.toFixed(2)}deg) rotateY(${effectiveRotateY.toFixed(2)}deg) translateZ(${isHovered ? '8px' : '2px'}) translateY(${isHovered ? '-2px' : '0px'})`
            : `rotateX(0deg) rotateY(0deg) translateZ(0px) translateY(${isHovered ? '-2px' : '0px'})`,
          boxShadow: isPostViralActive
            ? isHovered
              ? '0 25px 60px -10px rgba(0, 0, 0, 0.95), 0 0 45px 6px rgba(163, 230, 53, 0.7), 0 0 80px 2px rgba(132, 204, 22, 0.5)'
              : '0 6px 25px -3px rgba(0, 0, 0, 0.6), 0 0 28px 3px rgba(163, 230, 53, 0.5), 0 0 50px 0px rgba(132, 204, 22, 0.3)'
            : isPostGlowActive
            ? isHovered
              ? '0 25px 60px -10px rgba(0, 0, 0, 0.95), 0 0 45px 6px rgba(249, 115, 22, 0.7), 0 0 80px 2px rgba(239, 68, 68, 0.45)'
              : '0 6px 25px -3px rgba(0, 0, 0, 0.6), 0 0 28px 3px rgba(249, 115, 22, 0.45), 0 0 50px 0px rgba(239, 68, 68, 0.25)'
            : isHovered
            ? '0 25px 55px -10px rgba(0, 0, 0, 0.95), 0 0 35px 4px rgba(244, 114, 182, 0.48), 0 0 65px 0px rgba(236, 72, 153, 0.3)'
            : '0 6px 20px -3px rgba(0, 0, 0, 0.55), 0 0 12px 1px rgba(244, 114, 182, 0.16)',
          transition: isHovered
            ? 'transform 0.38s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.32s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.25s ease-out'
            : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease-out',
          transformStyle: 'preserve-3d',
          willChange: 'transform, box-shadow',
        }}
        className={`relative backdrop-blur-md border rounded-2xl p-5 sm:p-6 cursor-pointer transition-all duration-300 ${
          isPostViralActive
            ? 'bg-lime-950/25 border-2 border-lime-400 shadow-[0_0_35px_rgba(163,230,53,0.5),inset_0_0_24px_rgba(163,230,53,0.08)] ring-1 ring-lime-400/90 text-lime-50 animate-contagion-border-pulse'
            : isPostGlowActive
            ? 'bg-black/75 border-orange-500/90 ring-2 ring-orange-400/50 shadow-[0_0_35px_rgba(249,115,22,0.45)] animate-fire-pulse-border'
            : hasActiveFire
            ? 'bg-black/75 border-orange-500/60 shadow-[0_0_20px_rgba(249,115,22,0.25)] hover:border-orange-400/80'
            : isHovered || hasActiveTilt
            ? 'border-pink-400 bg-neutral-950/85 ring-1 ring-pink-400/40 card-pink-glow'
            : isHighEngagement
            ? 'bg-black/75 border-pink-500/50 hover:border-pink-400/80 animate-high-engagement-ambient'
            : 'bg-black/75 border-pink-500/40 hover:border-pink-400/70 card-pink-glow'
        }`}
      >
        {/* Subtle CSS-Animated 'Pulse' Ring Expanding on Like or Share */}
        {pulseRingType && (
          <div className="pointer-events-none absolute -inset-1 sm:-inset-1.5 rounded-2xl z-30 overflow-visible">
            {/* Primary Expanding Pulse Ring */}
            <div
              key={`pulse-ring-primary-${pulseRingKey}`}
              className={`absolute inset-0 rounded-2xl border ${
                pulseRingType === 'like'
                  ? 'border-pink-400/90 bg-pink-500/10 animate-card-pulse-ring-like'
                  : 'border-sky-400/90 bg-sky-500/10 animate-card-pulse-ring-share'
              }`}
            />
            {/* Secondary Delayed Halo Pulse Ring */}
            <div
              key={`pulse-ring-secondary-${pulseRingKey}`}
              className={`absolute inset-0 rounded-2xl border ${
                pulseRingType === 'like'
                  ? 'border-rose-400/60 animate-card-pulse-ring-like-delayed'
                  : 'border-cyan-400/60 animate-card-pulse-ring-share-delayed'
              }`}
            />
          </div>
        )}

        {/* Continuous Fiery Bottom Flame Tongues & Rising Embers for Active Power-Ups */}
        <FirePostAura firePowerUps={post.firePowerUps} isHovered={isHovered} />

        {/* Subtle Contagion Entry Animation & Green-Tinted Particle Effect Pulsing from Post Border */}
        {isPostViralActive && (
          <ViralContagionEffect
            isActive={isPostViralActive}
            totalInfections={post.firePowerUps?.viral?.totalInfections}
            infectedNames={post.firePowerUps?.viral?.infectedProfileNames}
            isHovered={isHovered}
            onOpenGraph={() => setShowViralGraphModal(true)}
          />
        )}

        {/* Explosive Ignition Burst Animation when a power-up is activated with AnimatePresence */}
        <AnimatePresence mode="wait">
          {ignitingPowerUp && (
            <FireIgnitionBurst
              key={`ignition-${ignitingPowerUp.type}-${ignitingPowerUp.title}`}
              powerUpType={ignitingPowerUp.type}
              title={ignitingPowerUp.title}
              badge={ignitingPowerUp.badge}
            />
          )}
        </AnimatePresence>

        {/* Tactile ignition pulse border flash across the card */}
        <AnimatePresence>
          {ignitingPowerUp && (
            <motion.div
              key={`card-pulse-${ignitingPowerUp.type}`}
              variants={cardIgnitionTactilePulseVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`pointer-events-none absolute inset-0 rounded-2xl z-30 border-2 overflow-hidden ${
                ignitingPowerUp.type === 'glow'
                  ? 'border-orange-400 shadow-[0_0_35px_rgba(249,115,22,0.65)] bg-orange-500/10'
                  : ignitingPowerUp.type === 'boost'
                  ? 'border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.65)] bg-amber-500/10'
                  : ignitingPowerUp.type === 'multiplier'
                  ? 'border-purple-400 shadow-[0_0_35px_rgba(168,85,247,0.65)] bg-purple-500/10'
                  : 'border-lime-400 shadow-[0_0_35px_rgba(163,230,53,0.75)] bg-lime-500/15'
              }`}
            />
          )}
        </AnimatePresence>
        {/* Dynamic Glass Specular Glare / Light Highlight overlay driven by phone accelerometer & mouse */}
        {hasActiveTilt && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl z-20 transition-opacity duration-300 opacity-90"
            style={{
              background: isPostViralActive
                ? `radial-gradient(circle at ${effectiveGlareX.toFixed(1)}% ${effectiveGlareY.toFixed(1)}%, rgba(163, 230, 53, 0.2) 0%, rgba(132, 204, 22, 0.06) 40%, transparent 70%)`
                : `radial-gradient(circle at ${effectiveGlareX.toFixed(1)}% ${effectiveGlareY.toFixed(1)}%, rgba(244, 114, 182, 0.18) 0%, rgba(236, 72, 153, 0.05) 40%, transparent 70%)`,
            }}
          />
        )}

        {/* Share Reward Floating Banner Notification */}
        {shareFeedback && (
          <div className="mb-3 px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-950/90 via-purple-950/90 to-pink-950/90 border border-pink-400/80 text-pink-200 text-xs font-semibold flex items-center justify-between shadow-[0_0_20px_rgba(244,114,182,0.45)] animate-pulse">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
              <span>{shareFeedback}</span>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-pink-500/30 text-pink-100 border border-pink-400/50">
              Poster Liked!
            </span>
          </div>
        )}

        {/* Repost Header if this is a Shared Post */}
        {post.sharedFrom && (
          <div className="mb-3 p-2.5 rounded-xl bg-pink-950/40 border border-pink-500/30 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Repeat className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-slate-400">Reposted from</span>
              <span className="font-semibold text-pink-300">{post.sharedFrom.authorName}</span>
              <span className="text-slate-500">{post.sharedFrom.authorHandle}</span>
              {post.sharedFrom.timestamp && (
                <>
                  <span className="text-slate-600 select-none">•</span>
                  <span
                    className="text-slate-400 font-mono text-[11px] inline-flex items-center gap-1"
                    title={`Originally posted ${formatRelativeTime(post.sharedFrom.timestamp)}`}
                  >
                    <Clock className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                    <span>{formatRelativeTime(post.sharedFrom.timestamp)}</span>
                  </span>
                </>
              )}
            </div>
            <span className="text-[10px] text-pink-300 bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/40 flex items-center gap-1">
              <Heart className="w-2.5 h-2.5 fill-pink-400 text-pink-400" />
              Author Liked
            </span>
          </div>
        )}
      
        {/* Real-time Stream Drop Notification Banner */}
        {isRealtimeNew && (
          <div className="mb-3 px-3 py-1.5 rounded-xl bg-pink-950/70 border border-pink-500/50 text-pink-200 text-xs font-medium flex items-center justify-between shadow-[0_0_15px_rgba(236,72,153,0.3)]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
              </span>
              <span className="font-mono text-[11px] text-pink-300 font-semibold tracking-wide">⚡ Real-Time Stream Drop</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/25 text-pink-300 border border-pink-500/40">
              Just now
            </span>
          </div>
        )}

        {/* Viral Contagion Spread Banner showing active spread across the viewer's network */}
        {isPostViralActive && (
          <ContagionSpreadFeedBanner
            post={post}
            infectedCount={post.firePowerUps?.viral?.totalInfections || 0}
            infectedNames={post.firePowerUps?.viral?.infectedProfileNames || []}
            remainingViews={post.firePowerUps?.viral?.fadeAwayRemainingViews}
            contagionEvents={post.firePowerUps?.viral?.contagionEvents}
            lastEvent={post.firePowerUps?.viral?.lastContagionEvent}
            onOpenGraph={() => setShowViralGraphModal(true)}
            onTriggerView={(viewer) => onViralPostViewed?.(post.id, viewer)}
            allUsers={allUsers}
            currentUser={currentUser}
          />
        )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <img
            src={post.authorAvatar}
            alt={post.authorName}
            className={`w-10 h-10 rounded-xl object-cover ring-2 transition-all ${
              isPostViralActive
                ? 'ring-lime-400 shadow-[0_0_14px_rgba(163,230,53,0.6)]'
                : 'ring-pink-500/50 shadow-[0_0_8px_rgba(236,72,153,0.3)]'
            }`}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className={`font-semibold text-sm ${isPostViralActive ? 'text-lime-200' : 'text-slate-100'}`}>{post.authorName}</h4>
              <BadgeCheck className={`w-4 h-4 ${isPostViralActive ? 'text-lime-400' : 'text-pink-400'}`} />
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
              <span className={isPostViralActive ? 'text-lime-300/80 font-mono' : ''}>{post.authorHandle}</span>
              <span className="text-slate-600 select-none">•</span>
              <span
                className={`transition-colors inline-flex items-center gap-1 font-mono text-[11px] ${
                  isPostViralActive ? 'text-lime-400/90 font-semibold' : 'text-slate-400 hover:text-slate-300'
                }`}
                title={`Created ${formatRelativeTime(post.timestamp)} (${post.timestamp})`}
              >
                <Clock className={`w-3 h-3 shrink-0 ${isPostViralActive ? 'text-lime-400' : 'text-slate-500'}`} />
                <span>{formatRelativeTime(post.timestamp)}</span>
              </span>
              <span className="text-slate-600 select-none">•</span>
              {(() => {
                const postLocation = post.city || getAutomaticCityForPost(post).city;
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCityClick) onCityClick(postLocation);
                    }}
                    className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border transition-all cursor-pointer active:scale-95 group/loctag ${
                      isPostViralActive
                        ? 'text-lime-300 bg-lime-950/60 hover:bg-lime-900/80 border-lime-400/60 hover:border-lime-300 hover:text-white shadow-[0_0_8px_rgba(163,230,53,0.25)]'
                        : 'text-pink-300 bg-pink-950/50 hover:bg-pink-900/80 border-pink-500/40 hover:border-pink-400 hover:text-white'
                    }`}
                    title={`Filter feed by location tag: ${postLocation}`}
                  >
                    <MapPin className={`w-2.5 h-2.5 shrink-0 transition-colors ${
                      isPostViralActive ? 'text-lime-400 group-hover/loctag:text-lime-300' : 'text-pink-400 group-hover/loctag:text-pink-300'
                    }`} />
                    <span>{postLocation}</span>
                  </button>
                );
              })()}
              {post.mood && (
                <>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onMoodClick && post.mood) {
                        onMoodClick(post.mood);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full border transition-all cursor-pointer hover:scale-105 active:scale-95 group/moodbtn ${
                      isPostViralActive
                        ? 'bg-lime-950/40 border-lime-500/30 text-lime-200 hover:border-lime-400 hover:bg-lime-900/60 shadow-[0_0_8px_rgba(163,230,53,0.3)]'
                        : 'bg-neutral-900/90 border-pink-500/30 hover:border-pink-400 text-slate-300 hover:text-pink-200 hover:bg-pink-950/40 shadow-sm'
                    }`}
                    title={`Click to view friends' posts feeling ${post.mood.label}`}
                  >
                    <span className="text-xs leading-none group-hover/moodbtn:scale-110 transition-transform">{post.mood.emoji}</span>
                    <span className={isPostViralActive ? 'text-lime-400/80 font-normal' : 'text-slate-400 font-normal'}>feeling</span>
                    <span className={`font-semibold ${isPostViralActive ? 'text-lime-200' : 'text-pink-300 group-hover/moodbtn:text-white'}`}>{post.mood.label}</span>
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Real-Time Sentiment Vibe Score Badge */}
          <VibeScoreBadge
            content={post.content}
            hashtags={post.hashtags}
            mood={post.mood}
            isViral={isPostViralActive}
            onVibeClick={onVibeClick}
          />

          {/* Reading Time & Stream Points Bounty Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold ${
              isPostViralActive
                ? 'bg-lime-950/90 border border-lime-400/70 text-lime-200 shadow-[0_0_14px_rgba(163,230,53,0.4)]'
                : 'bg-pink-950/80 border border-pink-400/50 text-pink-200 shadow-[0_0_10px_rgba(236,72,153,0.3)]'
            }`}
            title={`Reading time: ${readingStats.readTimeFormatted} (~${readingStats.wordCount} words) • Awards +${readingStats.points} points in #${readingStats.primaryTag}`}
          >
            <Clock className={`w-3 h-3 ${isPostViralActive ? 'text-lime-400' : 'text-pink-400'}`} />
            <span>{readingStats.readTimeFormatted}</span>
            <span className={isPostViralActive ? 'text-lime-500/50' : 'text-pink-500/50'}>•</span>
            <span className={isPostViralActive ? 'text-lime-300 font-bold' : 'text-amber-300 font-bold'}>+{readingStats.points} pts in #{readingStats.primaryTag}</span>
          </div>

          {/* Friend Compatibility Percentage Badge */}
          {post.authorId !== currentUser.id && authorCompatibilityPercent !== undefined && (
            <div className="relative inline-flex items-center">
              <motion.button
                animate={headerBadgePulse ? {
                  scale: [1, 1.32, 0.94, 1.1, 1],
                  boxShadow: [
                    '0 0 0px rgba(244,114,182,0)',
                    '0 0 24px rgba(244,114,182,0.85)',
                    '0 0 8px rgba(244,114,182,0.4)',
                  ],
                } : {}}
                transition={{ type: 'keyframes', duration: 0.7, ease: 'easeOut' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onInspectCompatibility) onInspectCompatibility(post.authorId);
                }}
                title={`You have a ${authorCompatibilityPercent}% friend compatibility match with ${post.authorName}! Click to view breakdown.`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono transition-all cursor-pointer group/comp ${
                  isPostViralActive
                    ? 'bg-gradient-to-r from-lime-950/90 via-neutral-900 to-emerald-950/90 text-lime-200 border border-lime-400/60 hover:border-lime-300 hover:shadow-[0_0_14px_rgba(163,230,53,0.5)]'
                    : 'bg-gradient-to-r from-pink-950/80 via-neutral-900 to-cyan-950/80 text-pink-200 border border-pink-400/50 hover:border-pink-300 hover:shadow-[0_0_12px_rgba(244,114,182,0.4)]'
                }`}
              >
                <Zap className={`w-3 h-3 group-hover/comp:scale-110 transition-transform ${
                  headerBadgePulse ? 'animate-bounce text-pink-300 fill-pink-300' : isPostViralActive ? 'text-lime-400 fill-lime-400' : 'text-pink-400 fill-pink-400'
                }`} />
                <span>{authorCompatibilityPercent}%</span>
                <span className={`hidden sm:inline font-sans text-[10px] font-semibold ${
                  isPostViralActive ? 'text-lime-300/80' : 'text-pink-300/80'
                }`}>Match</span>
              </motion.button>

              {/* Floating +X% particle drifting upward */}
              <AnimatePresence>
                {headerBadgePulse && pollCompatibilityImpact && (
                  <motion.span
                    initial={{ opacity: 0, y: 0, scale: 0.7 }}
                    animate={{ opacity: 1, y: -26, scale: 1.15 }}
                    exit={{ opacity: 0, y: -38, scale: 0.8 }}
                    transition={{ duration: 1.4, ease: 'easeOut' }}
                    className="absolute -top-1 left-1/2 -translate-x-1/2 pointer-events-none text-[10px] font-mono font-black text-pink-200 bg-pink-950/95 border border-pink-400 px-2 py-0.5 rounded-full shadow-[0_0_15px_rgba(244,114,182,0.9)] whitespace-nowrap z-30"
                  >
                    +{pollCompatibilityImpact.delta}% Match
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          )}

          {post.quoteCard && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-gradient-to-r from-pink-950/80 to-purple-950/80 text-pink-300 border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.3)]">
              <Quote className="w-3 h-3 text-pink-400" />
              <span>Quote Card</span>
            </span>
          )}

          {post.poetryFormatted && (
            <div className="flex items-center gap-1.5">
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                isPostViralActive
                  ? 'bg-lime-950/60 text-lime-300 border-lime-400/50 shadow-[0_0_10px_rgba(163,230,53,0.3)]'
                  : 'bg-pink-950/50 text-pink-300 border-pink-500/40 shadow-[0_0_8px_rgba(236,72,153,0.3)]'
              }`}>
                <Sparkles className={`w-3 h-3 ${isPostViralActive ? 'text-lime-400' : 'text-pink-400'}`} />
                Verse & Poetry
              </span>
              {onRequestCreateQuoteCard && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLaunchPoetryQuote();
                  }}
                  title="Create Quote Card from this poem"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-900/90 hover:bg-pink-950/70 text-pink-300 hover:text-white border border-pink-500/40 hover:border-pink-400 transition-all cursor-pointer shadow-[0_0_8px_rgba(236,72,153,0.25)]"
                >
                  <Quote className="w-3 h-3 text-pink-400" />
                  <span>Quote Lines</span>
                </button>
              )}
            </div>
          )}

          {/* Adult Swim / 18+ Badge */}
          {(post.isAdult || post.hashtags.some((h) => h.toLowerCase().includes('adultswim') || h.toLowerCase() === '#18plus')) && (
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-500/60 shadow-[0_0_10px_rgba(225,29,72,0.3)]"
              title="Adult Swim 18+ Uncensored Stream Post"
            >
              <span className="text-white bg-black px-1 rounded text-[9px] font-black tracking-tighter">[as]</span>
              <span>18+</span>
            </span>
          )}

          {/* Author Options / Mute Menu */}
          {post.authorId !== currentUser.id && (
            <div className="relative" ref={authorMenuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAuthorMenu(!showAuthorMenu);
                }}
                title="Post and author options"
                className="p-1.5 rounded-lg text-slate-400 hover:text-pink-300 hover:bg-neutral-800 transition-all"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showAuthorMenu && (
                <div className="absolute right-0 top-8 z-30 w-56 bg-neutral-950/95 backdrop-blur-md border border-pink-500/50 rounded-xl shadow-[0_4px_25px_rgba(0,0,0,0.8),0_0_15px_rgba(236,72,153,0.3)] p-1.5 text-xs animate-in fade-in zoom-in-95 duration-150">
                  {authorCompatibilityPercent !== undefined && onInspectCompatibility && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAuthorMenu(false);
                        onInspectCompatibility(post.authorId);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-pink-300 hover:bg-pink-950/40 hover:text-pink-100 transition-all text-left font-medium border-b border-pink-500/20 mb-1"
                    >
                      <Zap className="w-4 h-4 text-pink-400 fill-pink-400 shrink-0" />
                      <div>
                        <div className="font-semibold">Friend Compatibility</div>
                        <div className="text-[10px] text-pink-300/70">{authorCompatibilityPercent}% Depth Score</div>
                      </div>
                    </button>
                  )}

                  {onMuteUser && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAuthorMenu(false);
                        onMuteUser(post.authorId, post.authorName, post.authorHandle);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-all text-left font-medium"
                    >
                      <VolumeX className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <div className="font-semibold">Mute {post.authorHandle}</div>
                        <div className="text-[10px] text-slate-400">Remove their posts from feed</div>
                      </div>
                    </button>
                  )}

                  {post.sharedFrom && post.sharedFrom.authorId !== currentUser.id && post.sharedFrom.authorId !== post.authorId && onMuteUser && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAuthorMenu(false);
                        onMuteUser(post.sharedFrom.authorId, post.sharedFrom.authorName, post.sharedFrom.authorHandle);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:bg-neutral-800/80 transition-all text-left font-medium border-t border-pink-500/20 mt-1"
                    >
                      <UserX className="w-4 h-4 text-pink-400 shrink-0" />
                      <div>
                        <div className="font-semibold">Mute original author</div>
                        <div className="text-[10px] text-slate-400">{post.sharedFrom.authorHandle}</div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Fire Power-Up Badges (Boost, Radiant Glow, Multiplier, Viral Contagion) */}
      <PostFireBadges
        firePowerUps={post.firePowerUps}
        onOpenFireMenu={() => setShowFireMenu(true)}
        onOpenViralGraph={() => setShowViralGraphModal(true)}
      />

      {/* Stream & Reader Level - Positioned directly above the post text */}
      <div className="mb-2.5 flex items-center gap-2 flex-wrap text-[11px] font-mono relative">
        <div
          className={`relative inline-flex items-center gap-2 px-2.5 py-1 rounded-full border transition-all duration-300 ${
            isRankUpAnimating
              ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/70 shadow-[0_0_24px_rgba(245,158,11,0.65)] text-amber-200 scale-105'
              : 'bg-neutral-900/80 hover:bg-neutral-800/90 border-neutral-800/90 hover:border-pink-500/30 text-slate-400'
          }`}
        >
          {/* Confetti Particles Burst on Reader Rank Up */}
          {isRankUpAnimating && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-40 overflow-visible">
              {rankUpParticles.map((p) => (
                <span
                  key={p.id}
                  style={
                    {
                      backgroundColor: p.shape === 'circle' || p.shape === 'rect' ? p.color : 'transparent',
                      width: `${p.size}px`,
                      height: p.shape === 'rect' ? `${p.size * 1.6}px` : `${p.size}px`,
                      borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'rect' ? '2px' : '0px',
                      '--target-x': `${p.x}px`,
                      '--target-y': `${p.y}px`,
                      '--target-rot': `${p.rotation + 270}deg`,
                      '--particle-duration': `${p.duration}s`,
                    } as React.CSSProperties
                  }
                  className="absolute animate-confetti-particle shadow-[0_0_10px_currentColor] flex items-center justify-center"
                >
                  {p.shape === 'star' && (
                    <Sparkles
                      style={{ color: p.color, width: `${p.size * 1.5}px`, height: `${p.size * 1.5}px` }}
                      className="drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                    />
                  )}
                  {p.shape === 'heart' && (
                    <Heart
                      style={{ color: p.color, fill: p.color, width: `${p.size * 1.4}px`, height: `${p.size * 1.4}px` }}
                      className="drop-shadow-[0_0_8px_rgba(244,114,182,0.9)]"
                    />
                  )}
                </span>
              ))}

              {/* Celebratory Floating Rank-Up Badge */}
              {rankUpAnnouncement && (
                <span className="absolute left-1/2 -translate-x-1/2 -top-7 whitespace-nowrap px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-950/95 via-purple-950/95 to-pink-950/95 border border-amber-400 text-amber-200 text-[11px] font-bold font-mono shadow-[0_0_20px_rgba(245,158,11,0.7)] flex items-center gap-1.5 animate-share-badge pointer-events-none z-50">
                  <Sparkles className="w-3 h-3 text-yellow-300 fill-yellow-300 animate-spin" />
                  <span>Rank Up! Level {rankUpAnnouncement.level} {rankUpAnnouncement.badge}</span>
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenHashtagGroup) {
                onOpenHashtagGroup(streamInfo.tag);
              } else if (onHashtagClick) {
                onHashtagClick(streamInfo.tag);
              }
            }}
            className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer group/stream truncate max-w-[200px] sm:max-w-xs font-semibold ${
              isPostViralActive ? 'text-lime-200 hover:text-lime-100' : 'text-slate-300 hover:text-pink-300'
            }`}
            title={`Stream: ${streamInfo.streamName} • Click to explore stream`}
          >
            <Radio className={`w-3 h-3 shrink-0 ${isPostViralActive ? 'text-lime-400' : 'text-pink-400/80 group-hover/stream:text-pink-300'}`} />
            <span className="truncate">{streamInfo.streamName}</span>
          </button>

          <span className="text-neutral-600 select-none">•</span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenHashtagGroup) {
                onOpenHashtagGroup(streamInfo.tag);
              } else if (onHashtagClick) {
                onHashtagClick(streamInfo.tag);
              }
            }}
            className={`inline-flex items-center gap-1 transition-colors cursor-pointer ${
              isPostViralActive ? 'text-lime-300 hover:text-lime-100' : 'text-slate-400 hover:text-pink-300'
            }`}
            title={`Your reader progression in ${streamInfo.streamName}: Level ${streamInfo.level} with ${streamInfo.points} pts`}
          >
            <span className={isPostViralActive ? 'text-lime-500 text-[10px]' : 'text-slate-500 text-[10px]'}>Your Level:</span>
            <span className="text-xs leading-none">{streamInfo.badge}</span>
            <span className={`font-semibold transition-colors ${
              isRankUpAnimating
                ? 'text-amber-300 font-bold'
                : isPostViralActive
                ? 'text-lime-300 font-bold'
                : 'text-pink-300/90'
            }`}>
              Level {streamInfo.level}
            </span>
            <span className={isPostViralActive ? 'text-lime-500 text-[10px] inline-flex items-center gap-0.5' : 'text-slate-500 text-[10px] inline-flex items-center gap-0.5'}>
              (<CountUpPoints value={streamInfo.points} /> pts)
            </span>
          </button>
        </div>
      </div>

      {/* Attached Quote Card with Special Visual Background */}
      {post.quoteCard && (
        <div className="mb-4">
          <QuoteCardPreview
            quoteCard={post.quoteCard}
            onOpenPdf={onOpenPdf}
            interactive={true}
          />
        </div>
      )}

      {/* Main Text Content */}
      <div
        onMouseUp={handlePoetrySelection}
        onTouchEnd={handlePoetrySelection}
        onKeyUp={handlePoetrySelection}
        className={`mb-4 text-slate-200 leading-relaxed text-sm whitespace-pre-line select-text relative ${
          post.poetryFormatted
            ? isPostViralActive
              ? 'font-serif italic text-base pl-4 border-l-2 border-lime-400 bg-lime-950/20 py-3 pr-3 rounded-r-xl border-t border-b border-r border-lime-400/30 text-lime-50'
              : 'font-serif italic text-base pl-4 border-l-2 border-pink-500/80 bg-neutral-900/60 py-3 pr-3 rounded-r-xl border-t border-b border-r border-pink-500/20'
            : ''
        }`}
      >
        {post.content}
      </div>

      {/* Floating Quick Quote Card Tooltip on Selected Text */}
      {quoteSelectionCoords && selectedPoetryText && onRequestCreateQuoteCard && (
        <div
          style={{ left: `${quoteSelectionCoords.x}px`, top: `${quoteSelectionCoords.y}px` }}
          className="fixed z-50 -translate-x-1/2 -translate-y-full mb-2 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleLaunchPoetryQuote(selectedPoetryText);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(236,72,153,0.6)] border border-pink-300 transition-all hover:scale-105 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>Create Quote Card</span>
          </button>
        </div>
      )}

      {/* Embedded Image if any */}
      {post.image && (
        <div className={`mb-4 rounded-xl overflow-hidden border max-h-80 ${
          isPostViralActive
            ? 'border-lime-400/60 shadow-[0_0_14px_rgba(163,230,53,0.3)]'
            : 'border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.2)]'
        }`}>
          <img src={post.image} alt="Attachment" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Attached PDF Document Card */}
      {post.document && (
        <div className={`mb-4 bg-neutral-950/90 border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
          isPostViralActive
            ? 'border-lime-400/60 hover:border-lime-400 shadow-[0_0_14px_rgba(163,230,53,0.25)]'
            : 'border-pink-500/40 hover:border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.2)]'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
              isPostViralActive
                ? 'bg-lime-950/70 text-lime-400 border-lime-400/50 shadow-[0_0_10px_rgba(163,230,53,0.35)]'
                : 'bg-pink-950/60 text-pink-400 border-pink-500/40 shadow-[0_0_8px_rgba(236,72,153,0.3)]'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                  isPostViralActive
                    ? 'bg-lime-500/20 text-lime-300 border-lime-400/40'
                    : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                }`}>
                  {post.document.category} PDF
                </span>
                <span className="text-xs text-slate-400">{post.document.fileSize} • {post.document.totalPages} pages</span>
              </div>
              <h5 className="font-semibold text-slate-100 text-sm mt-1">{post.document.title}</h5>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 italic font-serif">
                "{post.document.excerptText.split('\n')[0]}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => onOpenPdf(post.document!)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isPostViralActive
                  ? 'bg-lime-500 hover:bg-lime-400 text-black shadow-[0_0_14px_rgba(163,230,53,0.5)] border border-lime-300'
                  : 'bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.4)] border border-pink-400/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read Document</span>
            </button>
          </div>
        </div>
      )}

      {/* Attached Voice Post Waveform Player with Play Button */}
      {(post.voiceNote || post.isVoicePost || post.hashtags?.some(h => {
        const tag = h.toLowerCase();
        return tag === '#voicepost' || tag === '#spokenword' || tag === '#audioverse' || tag === '#voice';
      }) || post.content?.toLowerCase().includes('#voicepost')) && (
        <div className="mb-4">
          <VoicePostWaveformPlayer
            voiceNote={post.voiceNote}
            postContent={post.content}
            authorName={post.authorName}
            authorAvatar={post.authorAvatar}
            postId={post.id}
            isViralActive={isPostViralActive}
            theme={isPostViralActive ? 'lime' : 'pink'}
          />
        </div>
      )}

      {/* Attached Song / Audio Track Card */}
      {/* Song Attachment with Stylized Interactive Waveform & Timed Comments */}
      {post.song && (
        <div className={`mb-4 bg-neutral-950/95 border rounded-xl p-3.5 flex flex-col gap-3 transition-all relative group ${
          isPostViralActive
            ? 'border-lime-400/60 hover:border-lime-400 shadow-[0_0_16px_rgba(163,230,53,0.25)]'
            : 'border-pink-500/40 hover:border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.15)]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="flex items-center gap-3 min-w-0">
              {/* Vinyl Record / Album Art Thumbnail */}
              <div className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border shadow-md ${
                isPostViralActive ? 'border-lime-400/50' : 'border-pink-500/30'
              }`}>
                <img
                  src={post.song.coverArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'}
                  alt={post.song.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handleTogglePlaySong}
                  className={`absolute inset-0 flex items-center justify-center transition-all cursor-pointer ${
                    isPlayingSong
                      ? isPostViralActive
                        ? 'bg-black/50 text-lime-400'
                        : 'bg-black/50 text-pink-400'
                      : 'bg-black/30 text-white hover:bg-black/50'
                  }`}
                  title={isPlayingSong ? 'Pause Track' : 'Play Track'}
                >
                  {isPlayingSong ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                    isPostViralActive
                      ? 'bg-lime-500/20 text-lime-300 border-lime-400/40'
                      : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                  }`}>
                    {post.song.genre || 'Soundtrack'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {post.song.duration}
                  </span>
                  {isPlayingSong && (
                    <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                      isPostViralActive ? 'text-lime-400' : 'text-pink-400'
                    }`}>
                      <Disc className="w-3 h-3 animate-spin" />
                      <span>Playing</span>
                    </span>
                  )}
                </div>
                <h5 className="font-semibold text-slate-100 text-sm mt-0.5 truncate">{post.song.title}</h5>
                <p className="text-xs text-slate-400 truncate">
                  {post.song.artist} {post.song.album ? `• ${post.song.album}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {/* Play/Pause Button */}
              <button
                onClick={handleTogglePlaySong}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isPlayingSong
                    ? isPostViralActive
                      ? 'bg-lime-500 text-black font-bold shadow-[0_0_12px_rgba(163,230,53,0.6)]'
                      : 'bg-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                    : isPostViralActive
                    ? 'bg-lime-950 hover:bg-lime-900 text-lime-300 border border-lime-400/50'
                    : 'bg-pink-950 hover:bg-pink-900 text-pink-300 border border-pink-500/40'
                }`}
              >
                {isPlayingSong ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlayingSong ? 'Pause' : 'Play Track'}</span>
              </button>

              {/* Save Song / In Library Button */}
              <button
                onClick={handleToggleSaveSongAction}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSongSaved
                    ? isPostViralActive
                      ? 'bg-lime-500/20 border border-lime-400 text-lime-300 shadow-[0_0_10px_rgba(163,230,53,0.3)]'
                      : 'bg-pink-500/20 border border-pink-400 text-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                    : isPostViralActive
                    ? 'bg-neutral-900 hover:bg-neutral-800 text-slate-200 border border-neutral-700 hover:border-lime-400/50'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-slate-200 border border-neutral-700 hover:border-pink-500/40'
                }`}
                title={isSongSaved ? 'Remove from Music Library' : 'Save to Music Library'}
              >
                {isSongSaved ? (
                  <>
                    <Check className={`w-3.5 h-3.5 ${isPostViralActive ? 'text-lime-400' : 'text-pink-400'}`} />
                    <span>In Music Library</span>
                  </>
                ) : (
                  <>
                    <Music className={`w-3.5 h-3.5 ${isPostViralActive ? 'text-lime-400' : 'text-pink-400'}`} />
                    <span>Save Song</span>
                  </>
                )}
              </button>

              {/* External Music Link Button if URL exists */}
              {post.song.audioUrl && (post.song.audioUrl.startsWith('http://') || post.song.audioUrl.startsWith('https://')) && (
                <a
                  href={post.song.audioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-pink-300 hover:text-pink-200 border border-pink-500/40 hover:border-pink-400 transition-all cursor-pointer shadow-sm"
                  title={`Open music link: ${post.song.audioUrl}`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open Link</span>
                </a>
              )}
            </div>
          </div>

          {/* Stylized Audio Waveform with Timed Comment Pins */}
          <TrackWaveform
            song={post.song}
            currentUser={currentUser}
            isPlaying={isPlayingSong}
            onTogglePlay={handleTogglePlaySong}
            onAddComment={(songId, comment) => {
              if (onAddWaveformComment) {
                onAddWaveformComment(songId, comment, post.id);
              }
            }}
            theme={isPostViralActive ? 'lime' : 'pink'}
          />
        </div>
      )}

      {/* Attached Reading Links (up to 3) with Auto-Estimated Time & Points */}
      {effectiveReadingLinks.length > 0 && (
        <div className="mb-4 space-y-2.5">
          {effectiveReadingLinks.length > 1 && (
            <div className={`flex items-center justify-between text-[11px] font-mono font-semibold px-0.5 ${
              isPostViralActive ? 'text-lime-300' : 'text-pink-300'
            }`}>
              <span className="flex items-center gap-1.5">
                <Clock className={`w-3.5 h-3.5 ${isPostViralActive ? 'text-lime-400' : 'text-pink-400'}`} />
                Attached Readings ({effectiveReadingLinks.length})
              </span>
              <span className="text-[10px] text-slate-400">Read & earn points</span>
            </div>
          )}
          {effectiveReadingLinks.map((link, idx) => (
            <ReadingLinkCard
              key={link.id || link.url || idx}
              readingLink={link}
              isInfected={isPostViralActive}
              onReadLink={(l) => {
                if (onOpenReadingLink) onOpenReadingLink(l);
              }}
              isCompleted={isLinkClaimed(link)}
              onHashtagClick={(tag) => onHashtagClick && onHashtagClick(tag)}
            />
          ))}
        </div>
      )}

      {/* Interactive Community Poll */}
      {localPoll && (
        <div className={`mb-4 p-4 rounded-2xl bg-neutral-950/85 border transition-all ${
          isPostViralActive
            ? 'border-lime-400/60 hover:border-lime-400 shadow-[0_0_16px_rgba(163,230,53,0.2)]'
            : 'border-pink-500/35 hover:border-pink-500/50 shadow-[0_0_16px_rgba(236,72,153,0.12)]'
        }`}>
          {/* Poll Header */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg border flex items-center justify-center ${
                isPostViralActive
                  ? 'bg-lime-950/80 border-lime-400/50 text-lime-400'
                  : 'bg-pink-950/80 border-pink-500/40 text-pink-400'
              }`}>
                <BarChart2 className="w-3.5 h-3.5" />
              </div>
              <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                isPostViralActive ? 'text-lime-300' : 'text-pink-300'
              }`}>
                Community Poll
              </span>
            </div>
            <span className={`text-[11px] font-mono text-slate-400 bg-neutral-900 px-2.5 py-0.5 rounded-full border ${
              isPostViralActive ? 'border-lime-500/30' : 'border-pink-500/20'
            }`}>
              {localPoll.totalVotes} {localPoll.totalVotes === 1 ? 'vote' : 'votes'}
            </span>
          </div>

          {/* Poll Question */}
          <h5 className="text-sm font-semibold text-slate-100 mb-3 leading-snug">
            {localPoll.question}
          </h5>

          {/* Animated Poll Compatibility Impact Banner */}
          <AnimatePresence>
            {pollCompatibilityImpact && (
              <PollCompatibilityAnimation
                key={`poll-compat-${post.id}-${pollCompatibilityImpact.newScore}-${pollCompatibilityImpact.delta}`}
                post={post}
                currentUser={currentUser}
                authorCompatibilityPercent={authorCompatibilityPercent}
                delta={pollCompatibilityImpact.delta}
                oldScore={pollCompatibilityImpact.oldScore}
                newScore={pollCompatibilityImpact.newScore}
                votedOptionText={pollCompatibilityImpact.votedOptionText}
                peerVoterNames={pollCompatibilityImpact.peerVoterNames}
                isAgreementWithAuthor={pollCompatibilityImpact.isAgreementWithAuthor}
                isFriend={(currentUser.friends || []).includes(post.authorId)}
                onInspectCompatibility={onInspectCompatibility}
                onDismiss={() => setPollCompatibilityImpact(null)}
              />
            )}
          </AnimatePresence>

          {/* Poll Options */}
          <div className="space-y-2">
            {localPoll.options.map((option) => {
              const isSelected = userVotedOptionId === option.id;
              const total = localPoll.totalVotes;
              const percentage = total > 0 ? Math.round((option.votes / total) * 100) : 0;
              const hasVoted = Boolean(userVotedOptionId);

              return (
                <div key={option.id} className={`relative group/opt-row ${depthPopupOptionId === option.id ? 'z-50' : 'z-10'}`}>
                  <motion.div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOptionVote(option.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOptionVote(option.id);
                      }
                    }}
                    whileHover={{ scale: 1.012 }}
                    whileTap={{ scale: 0.985 }}
                    animate={
                      optionBurstId === option.id
                        ? { scale: [1, 1.035, 0.99, 1] }
                        : { scale: 1 }
                    }
                    transition={
                      optionBurstId === option.id
                        ? { type: 'keyframes', duration: 0.38, ease: 'easeOut' }
                        : { type: 'spring', stiffness: 500, damping: 22 }
                    }
                    className={`w-full text-left relative overflow-hidden rounded-xl border transition-colors duration-200 group/opt cursor-pointer select-none ${
                      isSelected
                        ? isPostViralActive
                          ? 'border-lime-400 bg-lime-950/40 shadow-[0_0_12px_rgba(163,230,53,0.25)]'
                          : 'border-pink-400 bg-pink-950/40 shadow-[0_0_12px_rgba(236,72,153,0.25)]'
                        : isPostViralActive
                        ? 'border-lime-500/25 hover:border-lime-400/60 bg-neutral-900/80 hover:bg-neutral-850'
                        : 'border-pink-500/25 hover:border-pink-400/60 bg-neutral-900/80 hover:bg-neutral-850'
                    }`}
                  >
                    {/* Interactive Burst Ripple on Voted Option */}
                    <AnimatePresence>
                      {optionBurstId === option.id && (
                        <>
                          <motion.span
                            initial={{ scale: 0.85, opacity: 0.85 }}
                            animate={{ scale: 1.8, opacity: 0 }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className={`absolute inset-0 rounded-xl border-2 pointer-events-none ${
                              isPostViralActive ? 'border-lime-400' : 'border-pink-400'
                            }`}
                          />
                          <motion.span
                            initial={{ y: 0, opacity: 1, scale: 0.8 }}
                            animate={{ y: -28, opacity: 0, scale: 1.15 }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOptionBurstId(null);
                              setDepthPopupOptionId(null);
                              setPollCompatibilityImpact(null);
                            }}
                            title="Click to dismiss Compatibility Depth animation"
                            className={`absolute right-3 top-0 pointer-events-auto cursor-pointer text-[10px] font-mono font-black px-2 py-0.5 rounded-full z-40 flex items-center gap-1 border shadow-lg hover:scale-105 active:scale-95 transition-transform ${
                              isPostViralActive
                                ? 'text-lime-200 bg-lime-950/95 border-lime-400 shadow-[0_0_14px_rgba(163,230,53,0.8)]'
                                : 'text-pink-200 bg-pink-950/95 border-pink-400 shadow-[0_0_14px_rgba(244,114,182,0.8)]'
                            }`}
                          >
                            <Zap className="w-2.5 h-2.5 fill-current" />
                            <span>+{depthPopupData?.delta || 4}% Compatibility Depth</span>
                            <X className="w-2.5 h-2.5 ml-0.5 opacity-70 hover:opacity-100" />
                          </motion.span>
                        </>
                      )}
                    </AnimatePresence>

                    {/* Background percentage progress fill if user has voted */}
                    {hasVoted && (
                      <div
                        className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
                          isSelected
                            ? isPostViralActive
                              ? 'bg-gradient-to-r from-lime-600/40 to-lime-500/25 border-r border-lime-400/50'
                              : 'bg-gradient-to-r from-pink-600/40 to-pink-500/25 border-r border-pink-400/50'
                            : isPostViralActive
                            ? 'bg-gradient-to-r from-lime-950/60 to-lime-900/30'
                            : 'bg-gradient-to-r from-pink-950/60 to-pink-900/30'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    )}

                    {/* Foreground Content */}
                    <div className="relative px-3 py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {/* Radio / Check indicator */}
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? isPostViralActive
                                ? 'border-lime-400 bg-lime-500 text-black shadow-[0_0_8px_rgba(163,230,53,0.6)]'
                                : 'border-pink-400 bg-pink-600 text-white shadow-[0_0_8px_rgba(236,72,153,0.6)]'
                              : isPostViralActive
                              ? 'border-slate-600 group-hover/opt:border-lime-400/80 bg-neutral-950/60'
                              : 'border-slate-600 group-hover/opt:border-pink-400/80 bg-neutral-950/60'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>

                        <span
                          className={`truncate font-medium ${
                            isSelected
                              ? isPostViralActive
                                ? 'text-lime-100 font-semibold'
                                : 'text-pink-100 font-semibold'
                              : 'text-slate-200'
                          }`}
                        >
                          {option.text}
                        </span>

                        {isSelected && (
                          <span 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDepthPopupOptionId(null);
                              setOptionBurstId(null);
                              setPollCompatibilityImpact(null);
                            }}
                            title="Click to dismiss Compatibility Depth"
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0 border flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${
                              isPostViralActive
                                ? 'text-lime-300 bg-lime-950/80 border-lime-400/40'
                                : 'text-pink-300 bg-pink-950/80 border-pink-500/40'
                            }`}
                          >
                            <Zap className="w-2.5 h-2.5 fill-current" />
                            <span>Depth +{depthPopupData?.delta || 4}%</span>
                            <X className="w-2.5 h-2.5 ml-0.5 opacity-60 hover:opacity-100" />
                          </span>
                        )}
                      </div>

                      {/* Stats: percentage & vote count */}
                      {hasVoted && (
                        <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                          <span className={`font-bold ${
                            isSelected
                              ? isPostViralActive
                                ? 'text-lime-300'
                                : 'text-pink-300'
                              : 'text-slate-300'
                          }`}>
                            {percentage}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({option.votes})
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Subtle Pop-Up Indicator calculating Compatibility Depth change directly next to voting animation */}
                  <AnimatePresence>
                    {depthPopupOptionId === option.id && depthPopupData && (
                      <motion.div
                        key={`depth-popup-${option.id}-${depthPopupData.newScore}`}
                        initial={{ opacity: 0, scale: 0.85, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -4 }}
                        transition={{ type: 'spring', stiffness: 520, damping: 26 }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDepthPopupOptionId(null);
                          setOptionBurstId(null);
                          setPollCompatibilityImpact(null);
                        }}
                        title="Click to dismiss Compatibility Depth"
                        className={`absolute -top-11 right-1 sm:right-3 z-50 flex items-center gap-2.5 px-3 py-1.5 rounded-xl border backdrop-blur-xl shadow-2xl pointer-events-auto cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform select-none ${
                          isPostViralActive
                            ? 'bg-neutral-950/95 border-lime-400/80 shadow-[0_0_20px_rgba(163,230,53,0.4)]'
                            : 'bg-neutral-950/95 border-pink-500/80 shadow-[0_0_25px_rgba(236,72,153,0.45),0_8px_20px_rgba(0,0,0,0.85)]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-lg flex items-center justify-center border shrink-0 ${
                            isPostViralActive
                              ? 'bg-lime-950/90 border-lime-400/50 text-lime-400'
                              : 'bg-pink-950/90 border-pink-500/50 text-pink-400'
                          }`}>
                            <Zap className="w-3 h-3 fill-current animate-pulse" />
                          </span>
                          <div className="flex flex-col text-left">
                            <div className="flex items-center gap-1.5 leading-none">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-pink-200">
                                Compatibility Depth
                              </span>
                              <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full border ${
                                isPostViralActive
                                  ? 'bg-lime-950 text-lime-200 border-lime-400/60 shadow-[0_0_8px_rgba(163,230,53,0.5)]'
                                  : 'bg-pink-950 text-pink-200 border-pink-400/60 shadow-[0_0_8px_rgba(244,114,182,0.5)]'
                              }`}>
                                +{depthPopupData.delta}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-300 mt-0.5 leading-none">
                              <span className="text-slate-400">{depthPopupData.oldScore}%</span>
                              <span className="text-pink-400 text-[10px]">➔</span>
                              <span className="text-white font-bold">{depthPopupData.newScore}% Depth</span>
                              {post.authorId !== currentUser.id && (
                                <span className="text-slate-400 text-[10px] ml-0.5">
                                  with @{depthPopupData.authorHandle}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDepthPopupOptionId(null);
                            setOptionBurstId(null);
                            setPollCompatibilityImpact(null);
                          }}
                          className="ml-1 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 cursor-pointer transition-colors"
                          title="Dismiss indicator"
                          aria-label="Dismiss indicator"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Persistent Compatibility Synergy summary link */}
          {userVotedOptionId && post.authorId !== currentUser.id && (
            <div className="mt-2.5 pt-2 border-t border-pink-500/20 flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-pink-300">
                <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400 animate-pulse" />
                <span>
                  {(currentUser.friends || []).includes(post.authorId)
                    ? 'Deep poll vote actively strengthening friend bond'
                    : 'Deep poll vote actively boosting friendship synergy'}
                </span>
              </div>
              {onInspectCompatibility && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInspectCompatibility(post.authorId);
                  }}
                  className="text-[10px] text-pink-300 hover:text-white underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>View Friendship Matrix</span>
                </button>
              )}
            </div>
          )}

          {/* Poll Footer info */}
          <div className={`flex items-center justify-between mt-3 pt-2.5 border-t text-[10px] text-slate-400 font-mono ${
            isPostViralActive ? 'border-lime-400/20' : 'border-pink-500/15'
          }`}>
            <span className={`flex items-center gap-1.5 ${isPostViralActive ? 'text-lime-300/90' : 'text-pink-300/80'}`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isPostViralActive ? 'bg-lime-400' : 'bg-pink-400'}`} />
              Live stream consensus
            </span>
            <span>
              {userVotedOptionId ? 'Click any option to change vote' : 'Select an option to vote'}
            </span>
          </div>
        </div>
      )}

      {/* Clickable Hashtags with Feed Warps to Stream Hub */}
      {post.hashtags.length > 0 && (
        <div className="mb-4 space-y-1.5">
          <div className={`flex items-center justify-between text-[11px] font-mono font-semibold tracking-wide ${
            isPostViralActive ? 'text-lime-400' : 'text-pink-400/90'
          }`}>
            <div className="flex items-center gap-1.5">
              <Zap className={`w-3.5 h-3.5 ${isPostViralActive ? 'text-lime-400 fill-lime-400/20' : 'text-pink-400 fill-pink-400/20'}`} />
              <span>Feed Warps</span>
            </div>
            {matchingJoinedTags.length > 0 && (
              <span className="text-[10px] text-white font-mono bg-sky-500/30 px-2 py-0.5 rounded-full border border-sky-400/60 flex items-center gap-1 shadow-[0_0_8px_rgba(56,189,248,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                In your stream
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {post.hashtags.map((tag) => {
              const clean = tag.replace(/^#+/, '');
              const isJoinedThis = myJoinedTags.includes(clean.toLowerCase());
              const streamPoints = getUserStreamPoints(clean, currentUser);
              const rank = getGroupReadingRank(streamPoints);

              return (
                <button
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onHashtagClick) {
                      onHashtagClick(clean);
                    }
                  }}
                  className={`group/warp inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    isPostViralActive
                      ? 'bg-lime-950/80 border-lime-400/80 text-lime-200 shadow-[0_0_12px_rgba(163,230,53,0.35)] hover:border-lime-300 hover:scale-[1.03]'
                      : isJoinedThis
                      ? 'bg-pink-950/80 border-pink-400/80 text-pink-200 shadow-[0_0_12px_rgba(236,72,153,0.35)] hover:border-pink-300 hover:scale-[1.03]'
                      : 'bg-neutral-900/90 border-pink-500/30 text-pink-300 hover:text-white hover:border-pink-400 hover:bg-pink-950/60 hover:shadow-[0_0_12px_rgba(236,72,153,0.3)] hover:scale-[1.03]'
                  }`}
                  title={`Feed Warp: Enter #${clean} Stream • Reader Level ${rank.level} (${streamPoints} pts)`}
                >
                  <Zap className={`w-3 h-3 group-hover/warp:text-white group-hover/warp:scale-110 transition-transform shrink-0 ${
                    isPostViralActive ? 'text-lime-400 fill-lime-400/40' : 'text-pink-400 fill-pink-400/40'
                  }`} />
                  <span>#{clean}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-black/40 border border-white/10 ${
                    isPostViralActive ? 'text-lime-300' : 'text-pink-300/90'
                  }`}>
                    Level {rank.level}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Bar (Likes, Dislikes, Comments, Share, Bookmark) */}
      <div className={`flex items-center justify-between pt-3 text-xs ${
        isPostViralActive ? 'border-t border-lime-400/25 text-lime-200/70' : 'border-t border-pink-500/20 text-slate-400'
      }`}>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Like Button with Dynamic Heart/Star Confetti Animation */}
          <div className="relative">
            <button
              onClick={handleLikeClick}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
                isLikeAnimating
                  ? isPostViralActive
                    ? 'animate-like-pulse bg-lime-500/40 text-lime-100 font-semibold border border-lime-400 shadow-[0_0_16px_rgba(163,230,53,0.7)] ring-2 ring-lime-400/50'
                    : 'animate-like-pulse bg-pink-600/40 text-pink-200 font-semibold border border-pink-400 shadow-[0_0_16px_rgba(244,114,182,0.7)] ring-2 ring-pink-400/50'
                  : isLiked
                  ? isPostViralActive
                    ? 'bg-lime-500/25 text-lime-300 font-semibold border border-lime-400/60 shadow-[0_0_8px_rgba(163,230,53,0.4)]'
                    : 'bg-pink-600/30 text-pink-300 font-semibold border border-pink-500/60 shadow-[0_0_8px_rgba(236,72,153,0.4)]'
                  : isPostViralActive
                  ? 'hover:bg-neutral-900 hover:text-lime-200 border border-transparent'
                  : 'hover:bg-neutral-900 hover:text-slate-200 border border-transparent'
              }`}
              title={isLiked ? 'Liked' : 'Like Post'}
            >
              {/* Radiant Like Pulse Rings */}
              {isLikeAnimating && (
                <>
                  <span className={`absolute inset-0 rounded-lg border-2 pointer-events-none ${
                    isPostViralActive
                      ? 'border-lime-400 shadow-[0_0_14px_rgba(163,230,53,0.8)] animate-like-ripple-1'
                      : 'border-pink-400 shadow-[0_0_14px_rgba(244,114,182,0.8)] animate-like-ripple-1'
                  }`} />
                  <span className={`absolute inset-0 rounded-lg pointer-events-none animate-like-ripple-2 ${
                    isPostViralActive ? 'bg-lime-500/25' : 'bg-pink-500/25'
                  }`} />
                </>
              )}

              {/* Confetti Hearts & Sparkles Burst */}
              {isLikeAnimating && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30 overflow-visible">
                  {likeConfettiParticles.map((p) => (
                    <span
                      key={p.id}
                      style={
                        {
                          backgroundColor: p.shape === 'circle' || p.shape === 'rect' ? p.color : 'transparent',
                          width: `${p.size}px`,
                          height: p.shape === 'rect' ? `${p.size * 1.5}px` : `${p.size}px`,
                          borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'rect' ? '2px' : '0px',
                          '--target-x': `${p.x}px`,
                          '--target-y': `${p.y}px`,
                          '--target-rot': `${p.rotation + 180}deg`,
                          '--particle-duration': `${p.duration}s`,
                        } as React.CSSProperties
                      }
                      className="absolute animate-confetti-particle shadow-[0_0_8px_currentColor] flex items-center justify-center"
                    >
                      {p.shape === 'heart' && (
                        <Heart
                          style={{ color: p.color, fill: p.color, width: `${p.size * 1.6}px`, height: `${p.size * 1.6}px` }}
                          className="drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]"
                        />
                      )}
                      {p.shape === 'star' && (
                        <Sparkles
                          style={{ color: p.color, width: `${p.size * 1.4}px`, height: `${p.size * 1.4}px` }}
                          className="drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                        />
                      )}
                    </span>
                  ))}

                  {/* Floating Mini Like Indicator */}
                  <span className={`absolute left-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold font-mono flex items-center gap-1 animate-like-badge pointer-events-none ${
                    isPostViralActive
                      ? 'bg-lime-950/95 border border-lime-400 text-lime-200 shadow-[0_0_12px_rgba(163,230,53,0.6)]'
                      : 'bg-pink-950/95 border border-pink-400 text-pink-200 shadow-[0_0_12px_rgba(244,114,182,0.6)]'
                  }`}>
                    <Heart className={`w-2.5 h-2.5 animate-pulse ${isPostViralActive ? 'fill-lime-400 text-lime-400' : 'fill-pink-400 text-pink-400'}`} />
                    <span>+1 Liked!</span>
                  </span>
                </div>
              )}

              <ThumbsUp
                className={`w-4 h-4 transition-transform ${
                  isLikeAnimating
                    ? isPostViralActive
                      ? 'scale-125 rotate-[-12deg] fill-lime-300 text-lime-200'
                      : 'scale-125 rotate-[-12deg] fill-pink-300 text-pink-200'
                    : isLiked
                    ? isPostViralActive
                      ? 'fill-lime-400 text-lime-400'
                      : 'fill-pink-400 text-pink-400'
                    : isPostViralActive
                    ? 'text-lime-400'
                    : ''
                }`}
              />
              <span className={isLiked && isPostViralActive ? 'text-lime-300' : ''}>{post.likesCount}</span>
            </button>
          </div>

          {/* Dislike Button with Animated "can't like em all!" Feedback */}
          <div className="relative">
            <button
              onClick={handleDislikeClick}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
                isDislikeAnimating
                  ? 'animate-dislike-wobble bg-rose-600/40 text-rose-200 font-semibold border border-rose-400 shadow-[0_0_16px_rgba(244,63,94,0.7)] ring-2 ring-rose-400/50'
                  : isDisliked
                  ? 'bg-rose-600/30 text-rose-300 font-semibold border border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                  : 'hover:bg-neutral-900 hover:text-slate-200 border border-transparent'
              }`}
              title={isDisliked ? 'Disliked' : 'Dislike Post'}
            >
              {/* Radiant Dislike Pulse Rings */}
              {isDislikeAnimating && (
                <>
                  <span className="absolute inset-0 rounded-lg border-2 border-rose-400 pointer-events-none shadow-[0_0_14px_rgba(244,63,94,0.8)] animate-dislike-ripple-1" />
                  <span className="absolute inset-0 rounded-lg bg-rose-500/25 pointer-events-none animate-dislike-ripple-2" />
                </>
              )}

              {/* Dislike Particle Burst & Floating "can't like em all!" Badge */}
              {isDislikeAnimating && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30 overflow-visible">
                  {dislikeParticles.map((p) => (
                    <span
                      key={p.id}
                      style={
                        {
                          backgroundColor: p.shape === 'circle' || p.shape === 'rect' ? p.color : 'transparent',
                          width: `${p.size}px`,
                          height: p.shape === 'rect' ? `${p.size * 1.5}px` : `${p.size}px`,
                          borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'rect' ? '2px' : '0px',
                          '--target-x': `${p.x}px`,
                          '--target-y': `${p.y}px`,
                          '--target-rot': `${p.rotation + 180}deg`,
                          '--particle-duration': `${p.duration}s`,
                        } as React.CSSProperties
                      }
                      className="absolute animate-confetti-particle shadow-[0_0_8px_currentColor] flex items-center justify-center"
                    >
                      {p.shape === 'star' && (
                        <Sparkles
                          style={{ color: p.color, width: `${p.size * 1.4}px`, height: `${p.size * 1.4}px` }}
                          className="drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]"
                        />
                      )}
                    </span>
                  ))}

                  {/* Floating Animated "can't like em all!" Badge */}
                  <span className="absolute left-1/2 whitespace-nowrap px-2.5 py-1 rounded-full bg-rose-950/95 border border-rose-400 text-rose-200 text-[11px] font-bold font-sans shadow-[0_0_15px_rgba(244,63,94,0.7)] flex items-center gap-1.5 animate-dislike-badge pointer-events-none">
                    <ThumbsDown className="w-3 h-3 text-rose-400 fill-rose-400/40 animate-pulse" />
                    <span>can't like em all!</span>
                  </span>
                </div>
              )}

              <ThumbsDown
                className={`w-4 h-4 transition-transform ${
                  isDislikeAnimating
                    ? 'scale-125 rotate-12 fill-rose-300 text-rose-200'
                    : isDisliked
                    ? 'fill-rose-400 text-rose-400'
                    : ''
                }`}
              />
              <span>{post.dislikesCount}</span>
            </button>
          </div>

          {/* Comment Button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all border ${
              isPostViralActive
                ? 'hover:bg-neutral-900 text-lime-300/80 hover:text-lime-200 border-transparent hover:border-lime-400/40'
                : 'hover:bg-neutral-900 text-slate-400 hover:text-slate-200 border-transparent hover:border-pink-500/30'
            }`}
          >
            <MessageCircle className={`w-4 h-4 ${isPostViralActive ? 'text-lime-400' : 'text-pink-400'}`} />
            <span>{post.comments.length}</span>
          </button>

          {/* Share Button with Automatic Like-Original-Poster Bonus & Confetti/Pulse Feedback */}
          <div className="relative" ref={shareMenuRef}>
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all border active:scale-95 ${
                isShareAnimating
                  ? isPostViralActive
                    ? 'animate-share-pulse bg-lime-500/30 text-lime-100 border-lime-400 shadow-[0_0_18px_rgba(163,230,53,0.6)] ring-2 ring-lime-400/50'
                    : 'animate-share-pulse bg-pink-500/30 text-pink-200 border-pink-400 shadow-[0_0_18px_rgba(244,114,182,0.6)] ring-2 ring-pink-400/50'
                  : showShareMenu || (post.sharesCount && post.sharesCount > 0)
                  ? isPostViralActive
                    ? 'bg-lime-500/20 text-lime-300 border-lime-400/50 shadow-[0_0_10px_rgba(163,230,53,0.3)]'
                    : 'bg-pink-500/20 text-pink-300 border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                  : isPostViralActive
                  ? 'hover:bg-neutral-900 text-lime-300/90 hover:text-lime-200 border-lime-400/30'
                  : 'hover:bg-neutral-900 text-slate-300 hover:text-pink-300 border-pink-500/30'
              }`}
              title="Share Post (Gives original poster a like!)"
            >
              {/* Radiant Pulse Rings */}
              {isShareAnimating && (
                <>
                  <span className={`absolute inset-0 rounded-lg border-2 pointer-events-none ${
                    isPostViralActive
                      ? 'border-lime-400 shadow-[0_0_14px_rgba(163,230,53,0.8)] animate-share-ripple-1'
                      : 'border-pink-400 shadow-[0_0_14px_rgba(244,114,182,0.8)] animate-share-ripple-1'
                  }`} />
                  <span className={`absolute inset-0 rounded-lg pointer-events-none animate-share-ripple-2 ${
                    isPostViralActive ? 'bg-lime-500/25' : 'bg-pink-500/25'
                  }`} />
                </>
              )}

              {/* Confetti Particles Burst */}
              {isShareAnimating && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30 overflow-visible">
                  {confettiParticles.map((p) => (
                    <span
                      key={p.id}
                      style={
                        {
                          backgroundColor: p.shape !== 'star' ? p.color : 'transparent',
                          width: `${p.size}px`,
                          height: p.shape === 'rect' ? `${p.size * 1.6}px` : `${p.size}px`,
                          borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'rect' ? '2px' : '0px',
                          '--target-x': `${p.x}px`,
                          '--target-y': `${p.y}px`,
                          '--target-rot': `${p.rotation + 180}deg`,
                          '--particle-duration': `${p.duration}s`,
                        } as React.CSSProperties
                      }
                      className="absolute animate-confetti-particle shadow-[0_0_8px_currentColor]"
                    >
                      {p.shape === 'star' && (
                        <Sparkles
                          style={{ color: p.color, width: `${p.size * 1.5}px`, height: `${p.size * 1.5}px` }}
                          className="drop-shadow-[0_0_6px_rgba(244,114,182,0.8)]"
                        />
                      )}
                    </span>
                  ))}

                  {/* Floating Mini Bonus Indicator */}
                  <span className={`absolute left-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold font-mono flex items-center gap-1 animate-share-badge pointer-events-none ${
                    isPostViralActive
                      ? 'bg-lime-950/95 border border-lime-400 text-lime-200 shadow-[0_0_12px_rgba(163,230,53,0.6)]'
                      : 'bg-pink-950/95 border border-pink-400 text-pink-200 shadow-[0_0_12px_rgba(244,114,182,0.6)]'
                  }`}>
                    <Heart className={`w-2.5 h-2.5 animate-pulse ${isPostViralActive ? 'fill-lime-400 text-lime-400' : 'fill-pink-400 text-pink-400'}`} />
                    <span>+1 Liked!</span>
                  </span>
                </div>
              )}

              <Share2
                className={`w-4 h-4 transition-transform ${
                  isPostViralActive
                    ? isShareAnimating ? 'scale-125 rotate-12 text-lime-200' : 'text-lime-400'
                    : isShareAnimating ? 'scale-125 rotate-12 text-pink-200' : 'text-pink-400'
                }`}
              />
              <span className="font-semibold">{post.sharesCount || 0}</span>
              <span className={`hidden sm:inline text-[11px] font-medium ${
                isPostViralActive ? 'text-lime-300/90' : 'text-pink-300/90'
              }`}>
                {isShareAnimating ? 'Shared!' : 'Share'}
              </span>
            </button>

            {/* Share Dropdown Menu with Like Reward Promise */}
            {showShareMenu && (
              <div className="absolute left-0 bottom-full mb-2 w-72 bg-neutral-950/85 backdrop-blur-xl border border-pink-500/50 rounded-2xl p-2.5 shadow-[0_0_25px_rgba(236,72,153,0.35),0_15px_35px_rgba(0,0,0,0.8)] z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Reward Callout */}
                <div className="bg-pink-950/60 border border-pink-500/40 rounded-xl p-2.5 mb-2 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-300 flex items-center justify-center shrink-0">
                    <Heart className="w-4 h-4 fill-pink-400 text-pink-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-pink-200">Like Bonus Enabled</p>
                    <p className="text-[10px] text-slate-400">
                      Sharing gives <span className="text-pink-300 font-medium">{post.authorName}</span> +1 like automatically!
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  {/* Share Option 1: Repost to Feed */}
                  <button
                    onClick={() => handleTriggerShare('feed')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-slate-200 hover:text-pink-200 hover:bg-pink-950/40 border border-transparent hover:border-pink-500/30 transition-all group/opt"
                  >
                    <Repeat className="w-4 h-4 text-pink-400 group-hover/opt:scale-110 transition-transform" />
                    <div className="flex-1">
                      <p className="font-semibold">Repost to Feed</p>
                      <p className="text-[10px] text-slate-400">Share to timeline & award author +1 like</p>
                    </div>
                  </button>

                  {/* Share Option 2: Send in Direct Message */}
                  <button
                    onClick={() => handleTriggerShare('chat')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-slate-200 hover:text-pink-200 hover:bg-pink-950/40 border border-transparent hover:border-pink-500/30 transition-all group/opt"
                  >
                    <Send className="w-4 h-4 text-pink-400 group-hover/opt:scale-110 transition-transform" />
                    <div className="flex-1">
                      <p className="font-semibold">Send in Private Chat</p>
                      <p className="text-[10px] text-slate-400">DM to friend & award author +1 like</p>
                    </div>
                  </button>

                  {/* Share Option 3: Copy Link */}
                  <button
                    onClick={() => handleTriggerShare('copy')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-slate-200 hover:text-pink-200 hover:bg-pink-950/40 border border-transparent hover:border-pink-500/30 transition-all group/opt"
                  >
                    {copiedLink ? (
                      <Check className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Link className="w-4 h-4 text-pink-400 group-hover/opt:scale-110 transition-transform" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</p>
                      <p className="text-[10px] text-slate-400">Copy link & award author +1 like</p>
                    </div>
                  </button>

                  {/* Share Option 4: Share via SMS */}
                  <button
                    onClick={() => handleTriggerShare('sms')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-slate-200 hover:text-pink-200 hover:bg-pink-950/40 border border-transparent hover:border-pink-500/30 transition-all group/opt"
                  >
                    <MessageSquare className="w-4 h-4 text-pink-400 group-hover/opt:scale-110 transition-transform" />
                    <div className="flex-1">
                      <p className="font-semibold">Share via SMS</p>
                      <p className="text-[10px] text-slate-400">Deep-link to Messages app & award author +1 like</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 🔥 Fire Power-Ups Button & Dropdown Menu */}
          <div className="relative" ref={fireMenuRef}>
            <motion.button
              type="button"
              variants={fireTriggerButtonVariants}
              initial="idle"
              animate={Boolean(ignitingPowerUp) ? 'igniting' : hasActiveFire ? 'active' : 'idle'}
              whileHover="hover"
              whileTap="tap"
              onClick={(e) => {
                e.stopPropagation();
                setShowFireMenu((prev) => !prev);
              }}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors border cursor-pointer overflow-hidden ${
                hasActiveFire
                  ? 'bg-gradient-to-r from-orange-950/90 via-amber-950/80 to-red-950/90 text-orange-200 border-orange-500/80 shadow-[0_0_16px_rgba(249,115,22,0.5)] ring-1 ring-orange-400/60 font-semibold'
                  : showFireMenu
                  ? 'bg-orange-950/40 text-orange-300 border-orange-500/60'
                  : 'hover:bg-neutral-900 text-slate-300 hover:text-orange-400 border-orange-500/30'
              }`}
              title="Go Viral! Power-Ups: 1. Boost feed order, 2. Glow, 3. Multiplier cycles, 4. Viral contagion"
            >
              <AnimatePresence>
                {hasActiveFire && (
                  <motion.span
                    key="fire-embers"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FireButtonEmbers />
                  </motion.span>
                )}
              </AnimatePresence>
              <motion.div
                variants={flameIconVariants}
                animate={Boolean(ignitingPowerUp) ? 'igniting' : hasActiveFire ? 'active' : 'idle'}
                whileHover="hover"
                className="flex items-center justify-center"
              >
                <Flame
                  className={`w-4 h-4 ${
                    hasActiveFire
                      ? 'fill-orange-400 text-orange-400 drop-shadow-[0_0_6px_#f97316]'
                      : 'text-orange-400/90'
                  }`}
                />
              </motion.div>
              <div className="font-semibold text-orange-300 overflow-hidden min-w-[54px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={
                      hasActiveFire
                        ? activeFireCount > 1
                          ? `powerups-${activeFireCount}`
                          : isPostBoostActive
                          ? 'boosted'
                          : isPostMultiplierActive
                          ? 'multiplier'
                          : isPostViralActive
                          ? 'viral'
                          : 'goviral'
                        : 'goviral'
                    }
                    variants={fireStatusLabelVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    {hasActiveFire
                      ? activeFireCount > 1
                        ? `${activeFireCount} Power-Ups`
                        : isPostBoostActive
                        ? 'Boosted'
                        : isPostMultiplierActive
                        ? 'Multiplier'
                        : isPostViralActive
                        ? 'Viral'
                        : 'Go Viral!'
                      : 'Go Viral!'}
                  </motion.span>
                </AnimatePresence>
              </div>
            </motion.button>

            {/* Fire Dropdown Menu with AnimatePresence */}
            <AnimatePresence>
              {showFireMenu && (
                <motion.div
                  key={`fire-menu-wrap-${post.id}`}
                  variants={fireDropdownWrapperVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute left-0 bottom-full mb-2 z-50 pointer-events-auto"
                >
                  <PostFireMenu
                    post={post}
                    currentUser={currentUser}
                    allUsers={allUsers}
                    isOpen={showFireMenu}
                    onClose={() => setShowFireMenu(false)}
                    onPreviewFireBurst={(type: 'boost' | 'glow' | 'multiplier' | 'viral' = 'glow') => {
                      triggerIgnitionAnimation(
                        type,
                        type === 'boost'
                          ? '⚡ Feed Priority Boost Tested'
                          : type === 'glow'
                          ? '🔥 Radiant Flame Glow Tested'
                          : type === 'multiplier'
                          ? '3x Lifespan Multiplier Tested'
                          : '☣️ Viral Contagion Tested',
                        'Test'
                      );
                    }}
                    onApplyPowerUp={(powerUpType, cost, params, groupTag) => {
                      triggerIgnitionAnimation(
                        powerUpType,
                        powerUpType === 'boost'
                          ? `+${params?.boostScore || 100} Feed Priority Boost`
                          : powerUpType === 'glow'
                          ? 'Radiant Flame Glow'
                          : powerUpType === 'multiplier'
                          ? `${params?.multiplierFactor || 3}x Lifespan Multiplier`
                          : 'Viral Profile Contagion',
                        '🔥 Ignited'
                      );
                      if (onApplyFirePowerUp) {
                        onApplyFirePowerUp(post.id, powerUpType, cost, params, groupTag);
                      }
                    }}
                    onOpenViralGraph={() => setShowViralGraphModal(true)}
                    onSimulateInfectNextProfile={onSimulateInfectNextProfile}
                    onAdvanceFeedCycle={onAdvanceFeedCycle}
                    onClaimFreeSparks={onClaimFreeSparks}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Read & Intellectual Points Action */}
          {onClaimReadingPoints && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (primaryReadingLink && onOpenReadingLink) {
                  onOpenReadingLink(primaryReadingLink);
                } else {
                  onClaimReadingPoints(post, readingStats.points, readingStats.primaryTag);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                isReadingClaimed
                  ? 'bg-sky-950/70 border-sky-500/40 text-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.2)]'
                  : 'bg-gradient-to-r from-pink-950/90 to-purple-950/90 hover:from-pink-900 hover:to-purple-900 border-pink-500/50 hover:border-pink-400 text-pink-200 hover:text-white shadow-[0_0_10px_rgba(236,72,153,0.3)] active:scale-95'
              }`}
              title={
                isReadingClaimed
                  ? `Earned +${readingStats.points} pts in #${readingStats.primaryTag} for reading this post!`
                  : `Read post (+${readingStats.points} pts in #${readingStats.primaryTag})`
              }
            >
              {isReadingClaimed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-mono text-[11px]">Completed (+{readingStats.points} pts)</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono text-[11px]">Read (+{readingStats.points} pts)</span>
                </>
              )}
            </button>
          )}

          {/* Bookmark Button & Save Menu */}
          {onToggleBookmark && (
            <div className="relative" ref={saveMenuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSaveMenu((prev) => !prev);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all border cursor-pointer ${
                  isPostSaved
                    ? 'bg-pink-500/20 text-pink-300 border-pink-400/60 shadow-[0_0_10px_rgba(244,114,182,0.35)]'
                    : 'hover:bg-neutral-900 text-slate-400 hover:text-pink-300 border-transparent hover:border-pink-500/30'
                }`}
                title={isPostSaved ? 'Saved in vault • Click to manage folders' : 'Save to folders & collections'}
              >
                {isPostSaved ? (
                  <BookmarkCheck className="w-4 h-4 text-pink-300 fill-pink-400/30 shrink-0" />
                ) : (
                  <Bookmark className="w-4 h-4 text-pink-300/80 shrink-0" />
                )}
                <span className="hidden sm:inline text-xs font-medium">{getSaveButtonLabel()}</span>
                <ChevronDown
                  className={`w-3 h-3 text-pink-400/70 transition-transform duration-200 shrink-0 ${
                    showSaveMenu ? 'rotate-180 text-pink-300' : ''
                  }`}
                />
              </button>

              {/* Save Menu Dropdown */}
              {showSaveMenu && (
                <div
                  className="absolute right-0 bottom-full mb-2 w-72 sm:w-80 bg-neutral-950/95 backdrop-blur-xl border border-pink-500/50 rounded-2xl p-3 shadow-[0_0_25px_rgba(236,72,153,0.35),0_15px_35px_rgba(0,0,0,0.85)] z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Menu Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-pink-500/20">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-300 flex items-center justify-center">
                        <FolderHeart className="w-3.5 h-3.5 text-pink-300" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">Save to Folders</h4>
                        <p className="text-[10px] text-slate-400">Organize this post in your vault</p>
                      </div>
                    </div>
                    {isPostSaved && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-950/80 border border-pink-500/40 text-pink-300 font-semibold">
                        {postFolders.length} {postFolders.length === 1 ? 'folder' : 'folders'}
                      </span>
                    )}
                  </div>

                  {/* Folder Options List */}
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5 custom-scrollbar">
                    {/* 1. Meme Collections Folder */}
                    <button
                      type="button"
                      onClick={() => handleToggleFolder('memes')}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all border cursor-pointer group ${
                        isInMemes
                          ? 'bg-purple-950/60 border-purple-500/60 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                          : 'bg-neutral-900/60 hover:bg-neutral-800/80 border-neutral-800/80 hover:border-purple-500/40 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isInMemes ? 'bg-purple-500/30 text-purple-200 ring-1 ring-purple-400/50' : 'bg-purple-950/40 text-purple-400 group-hover:text-purple-300'
                          }`}
                        >
                          <Smile className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-100">Meme Collections</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/70 text-purple-300 font-mono border border-purple-500/30">
                              Folder
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            Memes, humor & reaction media
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-2">
                        {isInMemes ? (
                          <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-[0_0_8px_rgba(168,85,247,0.7)]">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-neutral-700 group-hover:border-purple-400/60 flex items-center justify-center text-slate-500 group-hover:text-purple-300">
                            <Plus className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </button>

                    {/* 2. Music Folder */}
                    <button
                      type="button"
                      onClick={() => handleToggleFolder('music')}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all border cursor-pointer group ${
                        isInMusic
                          ? 'bg-pink-950/60 border-pink-500/60 text-pink-200 shadow-[0_0_12px_rgba(236,72,153,0.25)]'
                          : 'bg-neutral-900/60 hover:bg-neutral-800/80 border-neutral-800/80 hover:border-pink-500/40 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isInMusic ? 'bg-pink-500/30 text-pink-200 ring-1 ring-pink-400/50' : 'bg-pink-950/40 text-pink-400 group-hover:text-pink-300'
                          }`}
                        >
                          <Music className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-100">Music</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-900/70 text-pink-300 font-mono border border-pink-500/30">
                              Folder
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            Audio drops, lyrics & melodies
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-2">
                        {isInMusic ? (
                          <div className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-[0_0_8px_rgba(236,72,153,0.7)]">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-neutral-700 group-hover:border-pink-400/60 flex items-center justify-center text-slate-500 group-hover:text-pink-300">
                            <Plus className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </button>

                    {/* 3. General Vault Folder */}
                    <button
                      type="button"
                      onClick={() => handleToggleFolder('general')}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all border cursor-pointer group ${
                        isInGeneral
                          ? 'bg-pink-950/60 border-pink-500/60 text-pink-200 shadow-[0_0_12px_rgba(244,114,182,0.25)]'
                          : 'bg-neutral-900/60 hover:bg-neutral-800/80 border-neutral-800/80 hover:border-pink-500/40 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isInGeneral ? 'bg-pink-500/30 text-pink-200 ring-1 ring-pink-400/50' : 'bg-pink-950/40 text-pink-400 group-hover:text-pink-300'
                          }`}
                        >
                          <BookmarkCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-100">General Vault</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-900/70 text-pink-300 font-mono border border-pink-500/30">
                              Default
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            Encrypted bookmarks & favorites
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-2">
                        {isInGeneral ? (
                          <div className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-[0_0_8px_rgba(244,114,182,0.7)]">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-neutral-700 group-hover:border-pink-400/60 flex items-center justify-center text-slate-500 group-hover:text-pink-300">
                            <Plus className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Custom User Folders */}
                    {customFolders.map((cf) => {
                      const isInCustom = postFolders.includes(cf.id);
                      return (
                        <button
                          key={cf.id}
                          type="button"
                          onClick={() => handleToggleFolder(cf.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all border cursor-pointer group ${
                            isInCustom
                              ? 'bg-sky-950/60 border-sky-500/60 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                              : 'bg-neutral-900/60 hover:bg-neutral-800/80 border-neutral-800/80 hover:border-sky-500/40 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isInCustom ? 'bg-sky-500/30 text-sky-200 ring-1 ring-sky-400/50' : 'bg-sky-950/40 text-sky-400 group-hover:text-sky-300'
                              }`}
                            >
                              <Folder className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-100 truncate block">{cf.name}</span>
                              <p className="text-[10px] text-slate-400 truncate">{cf.description || 'Custom collection'}</p>
                            </div>
                          </div>
                          <div className="shrink-0 ml-2">
                            {isInCustom ? (
                              <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-[0_0_8px_rgba(56,189,248,0.7)]">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-neutral-700 group-hover:border-sky-400/60 flex items-center justify-center text-slate-500 group-hover:text-sky-300">
                                <Plus className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Create New Folder Section */}
                  <div className="mt-2.5 pt-2 border-t border-pink-500/15">
                    {showNewFolderInput ? (
                      <form onSubmit={handleCreateNewFolder} className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="New folder name..."
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            autoFocus
                            className="flex-1 bg-neutral-900 border border-pink-500/40 focus:border-pink-500 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={!newFolderName.trim()}
                            className="bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewFolderInput(false);
                              setNewFolderName('');
                            }}
                            className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowNewFolderInput(true)}
                          className="flex items-center gap-1.5 text-xs text-pink-300 hover:text-pink-200 hover:underline cursor-pointer font-medium"
                        >
                          <FolderPlus className="w-3.5 h-3.5 text-pink-400" />
                          <span>+ Create New Folder</span>
                        </button>

                        {isPostSaved && (
                          <button
                            type="button"
                            onClick={handleQuickSaveAllToggle}
                            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Remove from all folders"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove All</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comment Section Drawer */}
      {showComments && (
        <div className={`mt-4 pt-4 border-t space-y-3 ${
          isPostViralActive ? 'border-lime-400/25' : 'border-pink-500/20'
        }`}>
          {/* Comment List */}
          {post.comments.length > 0 ? (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {post.comments.map((comment) => (
                <div key={comment.id} className={`p-3 rounded-xl border bg-neutral-900/90 ${
                  isPostViralActive
                    ? 'border-lime-400/40 shadow-[0_0_10px_rgba(163,230,53,0.15)]'
                    : 'border-pink-500/30 shadow-[0_0_8px_rgba(236,72,153,0.15)]'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <img
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        className={`w-5 h-5 rounded-full object-cover ring-1 ${
                          isPostViralActive ? 'ring-lime-400/60' : 'ring-pink-500/50'
                        }`}
                      />
                      <span className={`font-medium text-xs ${isPostViralActive ? 'text-lime-200' : 'text-slate-200'}`}>{comment.authorName}</span>
                      <span
                        className="text-[10px] text-slate-500 font-mono"
                        title={comment.timestamp}
                      >
                        {formatRelativeTime(comment.timestamp)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 pl-7">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-2">
              No comments yet. Be the first to share your thoughts!
            </p>
          )}

          {/* New Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Write a thoughtful comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className={`flex-1 bg-neutral-900 border rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 ${
                isPostViralActive
                  ? 'border-lime-400/40 focus:border-lime-400 focus:ring-lime-400/50'
                  : 'border-pink-500/30 focus:border-pink-500 focus:ring-pink-500/50'
              }`}
            />
            <button
              type="submit"
              disabled={!commentInput.trim()}
              className={`disabled:opacity-40 p-2 rounded-xl transition-all ${
                isPostViralActive
                  ? 'bg-lime-500 hover:bg-lime-400 text-black shadow-[0_0_10px_rgba(163,230,53,0.4)]'
                  : 'bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_8px_rgba(236,72,153,0.4)]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* D3 Viral Spread Connection Graph Modal */}
      {showViralGraphModal && (
        <ViralSpreadModal
          post={post}
          allUsers={allUsers}
          currentUser={currentUser}
          isOpen={showViralGraphModal}
          onClose={() => setShowViralGraphModal(false)}
          onSimulateInfectNextProfile={onSimulateInfectNextProfile}
          onViralPostViewed={onViralPostViewed}
        />
      )}

    </article>
  </motion.div>
  );
};
