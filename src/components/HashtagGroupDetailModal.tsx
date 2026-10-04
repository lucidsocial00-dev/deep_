import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Hash,
  Users,
  UserPlus,
  MessageSquare,
  Sparkles,
  Flame,
  Shield,
  FileText,
  PlusCircle,
  X,
  Zap,
  CheckCircle2,
  Share2,
  Info,
  Search,
  MapPin,
  ArrowLeft,
  BookOpen,
  Award,
  Clock,
  ExternalLink,
  Plus,
  Link as LinkIcon,
  Loader2,
  Check,
  Trophy,
  Crown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { HashtagGroup, PDFDocument, Post, PostSong, ReadingLink, User, WaveformComment, PostMood } from '../types';
import { PostCard } from './PostCard';
import { calculateCompatibility } from '../utils/compatibility';
import { StreamActivityHeatmap } from './StreamActivityHeatmap';
import { getReadingsForHashtag, getGroupReadingRank, estimateReadingTimeOfLink, estimateReadingFromUrl } from '../utils/readingEstimator';
import { ReadingLinkCard } from './ReadingLinkCard';
import { getTopScoringPostsForGroup, calculatePostScore, GroupScoredPost } from '../utils/hashtagScoring';

interface HashtagGroupDetailModalProps {
  group: HashtagGroup;
  allPosts: Post[];
  allUsers: User[];
  currentUser: User;
  onClose: () => void;
  onToggleJoinGroup: (tag: string) => void;
  onLikePost: (postId: string) => void;
  onDislikePost: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onOpenPdf: (doc: PDFDocument) => void;
  onShareToChat: (item: Post | PDFDocument) => void;
  onSharePost: (post: Post, method: 'feed' | 'chat' | 'copy' | 'sms') => void;
  onToggleBookmarkPost: (postId: string) => void;
  onMuteUser?: (userId: string, userName: string, userHandle: string) => void;
  onInspectCompatibility?: (userId: string) => void;
  onStartChat?: (user: User) => void;
  onAddFriend?: (userId: string, userName: string) => void;
  onHashtagWarp?: (tag: string) => void;
  onWarpToMainFeed?: (tag: string) => void;
  onCityClick?: (cityName: string) => void;
  onOpenReadingLink?: (link: ReadingLink) => void;
  onOpenEstimator?: (tag: string) => void;
  onClaimReadingPoints?: (post: Post, points: number, hashtag: string) => void;
  onAddReadingToStream?: (reading: ReadingLink) => void;
  onToggleSaveSong?: (song: PostSong, postId?: string) => void;
  onAddWaveformComment?: (songId: string, comment: WaveformComment, postId?: string) => void;
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
}

export const HashtagGroupDetailModal: React.FC<HashtagGroupDetailModalProps> = ({
  group,
  allPosts,
  allUsers,
  currentUser,
  onClose,
  onToggleJoinGroup,
  onLikePost,
  onDislikePost,
  onAddComment,
  onOpenPdf,
  onShareToChat,
  onSharePost,
  onToggleBookmarkPost,
  onMuteUser,
  onInspectCompatibility,
  onStartChat,
  onAddFriend,
  onHashtagWarp,
  onWarpToMainFeed,
  onCityClick,
  onOpenReadingLink,
  onOpenEstimator,
  onClaimReadingPoints,
  onAddReadingToStream,
  onToggleSaveSong,
  onAddWaveformComment,
  onRequestCreateQuoteCard,
  onMoodClick,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'top_scoring' | 'readings' | 'members' | 'about'>('feed');
  const [feedSortMode, setFeedSortMode] = useState<'top_scoring' | 'chronological'>('top_scoring');
  const [expandedDetailScorers, setExpandedDetailScorers] = useState<Record<string, boolean>>({});
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [readingLengthFilter, setReadingLengthFilter] = useState<'all' | 'quick' | 'medium' | 'long'>('all');

  // Auto-estimator state for quick link adding
  const [quickLinkInput, setQuickLinkInput] = useState('');
  const [isQuickEstimating, setIsQuickEstimating] = useState(false);
  const [quickEstimatedReading, setQuickEstimatedReading] = useState<ReadingLink | null>(null);
  const [quickAddedSuccess, setQuickAddedSuccess] = useState(false);
  const quickDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-estimate when user pastes/types link in Quick Estimator Bar
  useEffect(() => {
    if (quickDebounceRef.current) clearTimeout(quickDebounceRef.current);

    const trimmed = quickLinkInput.trim();
    if (!trimmed || !trimmed.startsWith('http')) {
      setQuickEstimatedReading(null);
      setIsQuickEstimating(false);
      return;
    }

    setIsQuickEstimating(true);
    quickDebounceRef.current = setTimeout(async () => {
      try {
        const est = await estimateReadingTimeOfLink(trimmed, group.tag);
        setQuickEstimatedReading(est);
      } catch {
        setQuickEstimatedReading(estimateReadingFromUrl(trimmed, undefined, group.tag));
      } finally {
        setIsQuickEstimating(false);
      }
    }, 400);

    return () => {
      if (quickDebounceRef.current) clearTimeout(quickDebounceRef.current);
    };
  }, [quickLinkInput, group.tag]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const cleanTag = group.tag.replace(/^#+/, '');
  const isJoined = (currentUser.joinedGroupTags || []).some(
    (t) => t.toLowerCase() === cleanTag.toLowerCase()
  );

  // Group readings
  const groupReadings = getReadingsForHashtag(cleanTag);
  const filteredReadings = groupReadings.filter((r) => {
    if (readingLengthFilter === 'quick') return r.estimatedMinutes <= 4;
    if (readingLengthFilter === 'medium') return r.estimatedMinutes > 4 && r.estimatedMinutes <= 9;
    if (readingLengthFilter === 'long') return r.estimatedMinutes >= 10;
    return true;
  });

  // User points in this group
  const userGroupPoints = currentUser.groupPoints?.[cleanTag] || 0;
  const userRankInfo = getGroupReadingRank(userGroupPoints);

  // Group posts: filter all posts containing this hashtag
  const groupPosts = allPosts.filter((p) =>
    p.hashtags.some((h) => h.replace(/^#+/, '').toLowerCase() === cleanTag.toLowerCase())
  );

  // Top scoring posts for this hashtag group
  const topScoredPosts = useMemo(() => {
    return getTopScoringPostsForGroup(cleanTag, allPosts, 30);
  }, [cleanTag, allPosts]);

  // Sorted feed posts based on feedSortMode
  const sortedFeedPosts = useMemo(() => {
    if (feedSortMode === 'chronological') {
      return [...groupPosts].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }
    return [...groupPosts].sort((a, b) => {
      const scoreA = calculatePostScore(a).totalScore;
      const scoreB = calculatePostScore(b).totalScore;
      return scoreB - scoreA;
    });
  }, [groupPosts, feedSortMode]);

  // Group members: all users whose ID is in group.memberIds or who have this tag in their joinedGroupTags
  const groupMembers = allUsers.filter(
    (u) =>
      group.memberIds.includes(u.id) ||
      (u.joinedGroupTags || []).some((t) => t.toLowerCase() === cleanTag.toLowerCase()) ||
      (u.id === currentUser.id && isJoined)
  );

  const filteredMembers = groupMembers.filter((m) => {
    if (!memberSearchQuery.trim()) return true;
    const q = memberSearchQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.handle.toLowerCase().includes(q) || m.bio.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950/90 backdrop-blur-2xl text-slate-100 overflow-hidden animate-in fade-in duration-200">
      
      {/* Top Fullscreen Control Bar */}
      <div className="bg-black/75 backdrop-blur-xl border-b border-pink-500/30 px-4 sm:px-8 py-3 flex items-center justify-between gap-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-slate-200 hover:text-white border border-pink-500/40 transition-all cursor-pointer shadow-sm text-xs font-semibold"
            title="Exit Stream Fullscreen (Esc)"
          >
            <ArrowLeft className="w-4 h-4 text-pink-400" />
            <span className="hidden sm:inline">Exit Stream</span>
          </button>

          <div className="h-4 w-px bg-pink-500/30 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-1.5">
              <span className="text-pink-400 font-mono">#</span>
              <span>{cleanTag}</span>
            </span>
            <span className="text-[10px] text-pink-300 bg-pink-950/80 border border-pink-500/40 px-2 py-0.5 rounded-md font-mono hidden md:inline">
              {group.category}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Stream Points Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-950/80 to-pink-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>{userGroupPoints} pts in #{cleanTag}</span>
          </div>

          {onOpenEstimator && (
            <button
              onClick={() => onOpenEstimator(cleanTag)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 text-white text-xs font-bold transition-all shadow-[0_0_10px_rgba(236,72,153,0.4)] cursor-pointer"
              title="Estimate reading time for any link and earn points"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Estimate Link</span>
            </button>
          )}

          {onWarpToMainFeed && (
            <button
              onClick={() => onWarpToMainFeed(cleanTag)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-950/80 hover:bg-pink-900 border border-pink-400/50 text-pink-200 text-xs font-bold transition-all cursor-pointer shadow-[0_0_8px_rgba(236,72,153,0.25)]"
              title={`Warp global feed to #${cleanTag}`}
            >
              <Zap className="w-3.5 h-3.5 text-pink-400 fill-pink-400/30" />
              <span className="hidden sm:inline">Warp Feed</span>
            </button>
          )}

          <button
            onClick={() => onToggleJoinGroup(cleanTag)}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              isJoined
                ? 'bg-neutral-900 hover:bg-neutral-800 text-pink-300 border border-pink-500/60'
                : 'bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)]'
            }`}
          >
            {isJoined ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Joined</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-3.5 h-3.5 text-white" />
                <span>Join</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-slate-300 hover:text-white border border-pink-500/30 transition-all cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Fullscreen Scrollable Area */}
      <div className="flex-1 overflow-y-auto w-full">
        
        {/* Fullscreen Hero Banner */}
        <div className={`relative px-4 sm:px-8 py-8 sm:py-10 bg-gradient-to-br ${group.bannerGradient || 'from-pink-950/90 via-neutral-950 to-black'} border-b border-pink-500/30 overflow-hidden`}>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-950/80 text-pink-300 border border-pink-400/40 shadow-[0_0_10px_rgba(236,72,153,0.2)]">
                  <Hash className="w-3.5 h-3.5 text-pink-400" />
                  <span>Hashtag Stream</span>
                </span>
                <span className="text-xs text-slate-300 bg-neutral-900/80 px-2.5 py-0.5 rounded-full border border-pink-500/20 font-mono">
                  {group.category}
                </span>
                {group.city && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onCityClick) {
                        onCityClick(group.city!);
                        onClose();
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-pink-950/80 hover:bg-pink-900 border border-pink-500/40 hover:border-pink-400 text-pink-300 hover:text-white transition-all cursor-pointer active:scale-95 group/loctag"
                    title={`Filter feed by location tag: ${group.city}`}
                  >
                    <MapPin className="w-3 h-3 text-pink-400 group-hover/loctag:text-pink-300 transition-colors shrink-0" />
                    <span>{group.city}{group.country ? `, ${group.country}` : ''}</span>
                  </button>
                )}
                {group.isHot && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <Flame className="w-3 h-3 text-rose-400" /> Active Stream
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight flex flex-wrap items-center gap-3">
                <span className="bg-gradient-to-r from-white via-pink-100 to-pink-300 bg-clip-text text-transparent">
                  #{cleanTag}
                </span>
                <span className="text-pink-400 font-light text-2xl sm:text-3xl">Stream</span>
                {group.city && (
                  <span className="text-pink-300 font-mono text-2xl sm:text-3xl font-normal">
                    ({group.city})
                  </span>
                )}
              </h1>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-light">
                {group.description}
              </p>

              {group.vibeStatement && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-pink-300/90 italic font-mono pt-1">
                  <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>"{group.vibeStatement}"</span>
                </div>
              )}
            </div>

            {/* User Standing & Group Stats Card */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              {/* User Intellectual Points Standing In Group */}
              <div className="p-3.5 rounded-2xl bg-black/75 border border-amber-500/40 backdrop-blur-md min-w-[200px] shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">Your Standing</span>
                  <span className="text-amber-300 font-bold flex items-center gap-1 font-mono">
                    {userRankInfo.badge} Level {userRankInfo.level}
                  </span>
                </div>
                <div className="text-xl font-black text-white font-mono flex items-center justify-between">
                  <span>{userGroupPoints}</span>
                  <span className="text-xs text-amber-400 font-normal">pts in #{cleanTag}</span>
                </div>
                <div className="w-full bg-neutral-900 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-pink-500"
                    style={{ width: `${userRankInfo.level >= 100 || userRankInfo.isMaxRank ? 100 : Math.max(8, userRankInfo.progress)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>Level {userRankInfo.level}</span>
                  <span>
                    {userRankInfo.level >= 100 || userRankInfo.isMaxRank
                      ? 'Level 100 (Max Level)'
                      : `${userGroupPoints} / ${userRankInfo.nextThreshold} pts (${userRankInfo.progress}%)`}
                  </span>
                </div>
              </div>

              {/* Group counts */}
              <div className="flex items-center gap-2">
                <div className="text-center px-3.5 py-2 rounded-xl bg-black/70 border border-pink-500/30 flex-1">
                  <span className="block text-lg font-bold font-mono text-pink-300">
                    {groupMembers.length}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Members</span>
                </div>
                <div className="text-center px-3.5 py-2 rounded-xl bg-black/70 border border-pink-500/30 flex-1">
                  <span className="block text-lg font-bold font-mono text-pink-300">
                    {groupPosts.length}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Posts</span>
                </div>
                <div className="text-center px-3.5 py-2 rounded-xl bg-black/70 border border-pink-500/30 flex-1">
                  <span className="block text-lg font-bold font-mono text-pink-300">
                    {groupReadings.length}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Readings</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Sub-Navigation Tabs Bar */}
        <div className="sticky top-0 z-10 bg-neutral-950/90 backdrop-blur-xl border-b border-pink-500/20 px-4 sm:px-8">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveSubTab('feed')}
                className={`py-4 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'feed'
                    ? 'border-pink-500 text-pink-300 shadow-[0_2px_10px_rgba(236,72,153,0.3)]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Stream Feed ({groupPosts.length})</span>
              </button>

              <button
                onClick={() => setActiveSubTab('top_scoring')}
                className={`py-4 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'top_scoring'
                    ? 'border-amber-400 text-amber-300 shadow-[0_2px_10px_rgba(245,158,11,0.3)]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Top Scoring Posts ({topScoredPosts.length})</span>
              </button>

              <button
                onClick={() => setActiveSubTab('readings')}
                className={`py-4 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'readings'
                    ? 'border-pink-500 text-pink-300 shadow-[0_2px_10px_rgba(236,72,153,0.3)]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Readings & Points ({groupReadings.length})</span>
              </button>

              <button
                onClick={() => setActiveSubTab('members')}
                className={`py-4 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'members'
                    ? 'border-pink-500 text-pink-300 shadow-[0_2px_10px_rgba(236,72,153,0.3)]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Members & Depth Score ({groupMembers.length})</span>
              </button>

              <button
                onClick={() => setActiveSubTab('about')}
                className={`py-4 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'about'
                    ? 'border-pink-500 text-pink-300 shadow-[0_2px_10px_rgba(236,72,153,0.3)]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Info className="w-4 h-4" />
                <span>About & Guidelines</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
          
          {/* TAB 1: STREAM FEED */}
          {activeSubTab === 'feed' && (
            <div className="space-y-6">
              {/* Feed Sort Options & Champion Spotlight */}
              {groupPosts.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-neutral-900/80 border border-pink-500/25 backdrop-blur-md">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-slate-400 font-medium">Order:</span>
                    <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-pink-500/20">
                      <button
                        type="button"
                        onClick={() => setFeedSortMode('top_scoring')}
                        className={`px-3 py-1 text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          feedSortMode === 'top_scoring'
                            ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Top Scoring</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedSortMode('chronological')}
                        className={`px-3 py-1 text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          feedSortMode === 'chronological'
                            ? 'bg-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Recent</span>
                      </button>
                    </div>
                  </div>

                  {topScoredPosts[0] && (
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('top_scoring')}
                      className="text-xs text-amber-300 hover:text-white flex items-center gap-2 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer group"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold">
                        Stream Champion: {topScoredPosts[0].scoreBreakdown.totalScore} pts
                      </span>
                      <span className="text-[11px] text-amber-400/80 font-mono">
                        (@{topScoredPosts[0].post.authorHandle})
                      </span>
                    </button>
                  )}
                </div>
              )}

              {groupPosts.length > 0 ? (
                <div className="space-y-6">
                  {sortedFeedPosts.map((post, idx) => {
                    const authorUser = allUsers.find((u) => u.id === post.authorId);
                    const authorComp = calculateCompatibility(
                      currentUser,
                      authorUser || currentUser,
                      allPosts
                    );
                    const scoredItem = topScoredPosts.find((sp) => sp.post.id === post.id);

                    return (
                      <div key={post.id} className="space-y-2">
                        {feedSortMode === 'top_scoring' && scoredItem && (
                          <div className="flex items-center justify-between px-3 py-1 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs">
                            <span className="flex items-center gap-1.5 font-mono font-bold text-amber-300">
                              <span>{scoredItem.medalEmoji}</span>
                              <span>Rank #{scoredItem.rank} in #{cleanTag}</span>
                            </span>
                            <span className="font-mono text-amber-400 font-bold">
                              {scoredItem.scoreBreakdown.totalScore} points
                            </span>
                          </div>
                        )}
                        <PostCard
                          post={post}
                          currentUser={currentUser}
                          customGroups={[group]}
                          onLike={onLikePost}
                          onDislike={onDislikePost}
                          onAddComment={onAddComment}
                          onHashtagClick={(tag) => {
                            if (onHashtagWarp) {
                              onHashtagWarp(tag);
                            }
                          }}
                          onOpenHashtagGroup={(tag) => {
                            if (onHashtagWarp) {
                              onHashtagWarp(tag);
                            }
                          }}
                          onOpenPdf={onOpenPdf}
                          onShareToChat={onShareToChat}
                          onSharePost={onSharePost}
                          onToggleBookmark={onToggleBookmarkPost}
                          onMuteUser={onMuteUser}
                          authorCompatibilityPercent={authorComp.matchPercentage}
                          onInspectCompatibility={onInspectCompatibility}
                          onCityClick={(cityName) => {
                            if (onCityClick) {
                              onCityClick(cityName);
                              onClose();
                            }
                          }}
                          onOpenReadingLink={onOpenReadingLink}
                          onClaimReadingPoints={onClaimReadingPoints}
                          onToggleSaveSong={onToggleSaveSong}
                          onAddWaveformComment={onAddWaveformComment}
                          onRequestCreateQuoteCard={onRequestCreateQuoteCard}
                          onMoodClick={onMoodClick}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-neutral-900/60 border border-pink-500/20 rounded-3xl p-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-pink-950/80 border border-pink-500/40 flex items-center justify-center text-pink-400 mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">No Posts in #{cleanTag} Yet</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      Be the first to share stanzas, encrypted thoughts, or reading links in this stream.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: TOP SCORING POSTS */}
          {activeSubTab === 'top_scoring' && (
            <div className="space-y-6">
              {/* Header & Scoring Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/50 via-neutral-900 to-pink-950/50 border border-amber-500/40 space-y-4 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-950 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <span>#{cleanTag} Top Scoring Leaderboard</span>
                      </span>
                      <span className="text-xs text-amber-200/90 font-semibold font-mono">
                        {topScoredPosts.length} ranked posts
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Highest-Scoring Posts in #{cleanTag}
                    </h2>
                    <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                      Ranking is determined by reader engagement (likes, comments, shares), viral contagion reach, power-up multipliers, and rich media bonuses.
                    </p>
                  </div>

                  {/* Quick scoring rules pill */}
                  <div className="bg-black/60 border border-amber-500/30 rounded-2xl p-3 text-xs space-y-1.5 shrink-0 max-w-xs">
                    <div className="font-bold text-amber-300 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Scoring Formula
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-300 font-mono">
                      <span>• Likes: +10 pts</span>
                      <span>• Comments: +6 pts</span>
                      <span>• Shares: +8 pts</span>
                      <span>• Dislikes: -3 pts</span>
                      <span>• Multipliers: +Bonus</span>
                      <span>• Media/PDF: +Bonus</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Podium Section for Top 3 */}
              {topScoredPosts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topScoredPosts.slice(0, 3).map((item) => {
                    const isFirst = item.rank === 1;
                    const isSecond = item.rank === 2;
                    const isThird = item.rank === 3;
                    const isDetailOpen = expandedDetailScorers[item.post.id] || false;

                    const borderColor = isFirst
                      ? 'border-amber-400/80 bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                      : isSecond
                      ? 'border-slate-300/60 bg-slate-900/40'
                      : 'border-amber-700/60 bg-amber-950/15';

                    return (
                      <div
                        key={item.post.id}
                        className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3 transition-all ${borderColor}`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl">{item.medalEmoji}</span>
                            <span className="font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-full bg-black/60 border border-amber-500/30 text-amber-300">
                              {item.scoreBreakdown.totalScore} pts
                            </span>
                          </div>

                          <div>
                            <h4 className="font-bold text-sm text-white truncate">
                              {item.post.authorName}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-mono">
                              @{item.post.authorHandle}
                            </p>
                          </div>

                          <p className="text-xs text-slate-300 italic line-clamp-3 font-serif leading-relaxed">
                            "{item.post.content}"
                          </p>
                        </div>

                        <div className="pt-2 border-t border-white/10 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>❤️ {item.post.likesCount}</span>
                            <span>💬 {item.post.commentsCount}</span>
                            <span>🔁 {item.post.sharesCount}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedDetailScorers((prev) => ({
                                ...prev,
                                [item.post.id]: !prev[item.post.id],
                              }))
                            }
                            className="w-full py-1 text-center text-[10px] font-bold text-amber-300 hover:text-white bg-black/40 hover:bg-black/60 border border-amber-500/30 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span>{isDetailOpen ? 'Hide Breakdown' : 'View Point Math'}</span>
                            {isDetailOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          {isDetailOpen && (
                            <div className="p-2 rounded-lg bg-black/70 border border-amber-500/20 text-[10px] text-slate-300 space-y-1 font-mono">
                              <div className="flex justify-between">
                                <span>Likes (+10):</span>
                                <span className="text-amber-300">+{item.scoreBreakdown.likesScore}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Comments (+6):</span>
                                <span className="text-amber-300">+{item.scoreBreakdown.commentsScore}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Shares (+8):</span>
                                <span className="text-amber-300">+{item.scoreBreakdown.sharesScore}</span>
                              </div>
                              {item.scoreBreakdown.dislikesScore !== 0 && (
                                <div className="flex justify-between">
                                  <span>Dislikes (-3):</span>
                                  <span className="text-rose-400">{item.scoreBreakdown.dislikesScore}</span>
                                </div>
                              )}
                              {item.scoreBreakdown.powerUpBonus > 0 && (
                                <div className="flex justify-between">
                                  <span>Power-Up Boost:</span>
                                  <span className="text-pink-300">+{item.scoreBreakdown.powerUpBonus}</span>
                                </div>
                              )}
                              {item.scoreBreakdown.mediaBonus > 0 && (
                                <div className="flex justify-between">
                                  <span>Rich Media Bonus:</span>
                                  <span className="text-sky-300">+{item.scoreBreakdown.mediaBonus}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* All Ranked Posts List with full PostCards */}
              {topScoredPosts.length > 0 ? (
                <div className="space-y-6 pt-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Complete #{cleanTag} Post Leaderboard</span>
                  </h3>

                  <div className="space-y-6">
                    {topScoredPosts.map((item) => {
                      const isDetailOpen = expandedDetailScorers[item.post.id] || false;
                      const authorUser = allUsers.find((u) => u.id === item.post.authorId);
                      const authorComp = calculateCompatibility(
                        currentUser,
                        authorUser || currentUser,
                        allPosts
                      );

                      return (
                        <div
                          key={item.post.id}
                          className="rounded-3xl border border-amber-500/30 bg-neutral-950/60 p-4 space-y-3 shadow-lg relative overflow-hidden"
                        >
                          {/* Rank Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{item.medalEmoji}</span>
                              <span className="font-mono font-bold text-sm text-white">
                                Rank #{item.rank}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">
                                • {item.post.authorName} (@{item.post.authorHandle})
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-xl bg-amber-950/70 border border-amber-500/50 text-amber-300 font-mono font-bold text-xs shadow-sm">
                                {item.scoreBreakdown.totalScore} points
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedDetailScorers((prev) => ({
                                    ...prev,
                                    [item.post.id]: !prev[item.post.id],
                                  }))
                                }
                                className="px-2.5 py-1 rounded-xl bg-black/60 hover:bg-black/80 border border-pink-500/30 text-pink-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span>{isDetailOpen ? 'Hide Math' : 'Breakdown'}</span>
                                {isDetailOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>

                          {/* Score Breakdown Drawer */}
                          {isDetailOpen && (
                            <div className="p-3.5 rounded-2xl bg-black/75 border border-amber-500/30 space-y-2 animate-in fade-in duration-200">
                              <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                                Engagement & Depth Breakdown
                              </h5>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                                <div className="p-2 rounded-xl bg-neutral-900 border border-white/10">
                                  <span className="text-slate-400 block text-[10px]">Likes (+10)</span>
                                  <span className="text-amber-300 font-bold">+{item.scoreBreakdown.likesScore}</span>
                                </div>
                                <div className="p-2 rounded-xl bg-neutral-900 border border-white/10">
                                  <span className="text-slate-400 block text-[10px]">Comments (+6)</span>
                                  <span className="text-amber-300 font-bold">+{item.scoreBreakdown.commentsScore}</span>
                                </div>
                                <div className="p-2 rounded-xl bg-neutral-900 border border-white/10">
                                  <span className="text-slate-400 block text-[10px]">Shares (+8)</span>
                                  <span className="text-amber-300 font-bold">+{item.scoreBreakdown.sharesScore}</span>
                                </div>
                                <div className="p-2 rounded-xl bg-neutral-900 border border-white/10">
                                  <span className="text-slate-400 block text-[10px]">Power-Up / Media</span>
                                  <span className="text-pink-300 font-bold">
                                    +{item.scoreBreakdown.powerUpBonus + item.scoreBreakdown.mediaBonus}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Embed actual interactive PostCard */}
                          <PostCard
                            post={item.post}
                            currentUser={currentUser}
                            customGroups={[group]}
                            onLike={onLikePost}
                            onDislike={onDislikePost}
                            onAddComment={onAddComment}
                            onHashtagClick={(tag) => {
                              if (onHashtagWarp) {
                                onHashtagWarp(tag);
                              }
                            }}
                            onOpenHashtagGroup={(tag) => {
                              if (onHashtagWarp) {
                                onHashtagWarp(tag);
                              }
                            }}
                            onOpenPdf={onOpenPdf}
                            onShareToChat={onShareToChat}
                            onSharePost={onSharePost}
                            onToggleBookmark={onToggleBookmarkPost}
                            onMuteUser={onMuteUser}
                            authorCompatibilityPercent={authorComp.matchPercentage}
                            onInspectCompatibility={onInspectCompatibility}
                            onCityClick={(cityName) => {
                              if (onCityClick) {
                                onCityClick(cityName);
                                onClose();
                              }
                            }}
                            onOpenReadingLink={onOpenReadingLink}
                            onClaimReadingPoints={onClaimReadingPoints}
                            onToggleSaveSong={onToggleSaveSong}
                            onAddWaveformComment={onAddWaveformComment}
                            onRequestCreateQuoteCard={onRequestCreateQuoteCard}
                            onMoodClick={onMoodClick}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-900/60 border border-amber-500/20 rounded-3xl p-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">No Scored Posts in #{cleanTag} Yet</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      Posts tagged with #{cleanTag} will appear here and rank automatically based on reader engagement.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: READINGS & POINTS */}
          {activeSubTab === 'readings' && (
            <div className="space-y-6">
              
              {/* Reading Intellectual Points & Link Engine Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-pink-950/60 via-neutral-900 to-purple-950/60 border border-pink-500/40 space-y-4 shadow-[0_0_30px_rgba(236,72,153,0.15)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-pink-950 border border-pink-400/40 text-pink-300 font-bold text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-pink-400" />
                        <span>Reading Stream & Points</span>
                      </span>
                      <span className="text-xs text-amber-300 font-semibold font-mono">
                        Earn intellectual points
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      Read & Earn Points in #{cleanTag}
                    </h3>
                    <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                      Paste any article, essay, or research link below to calculate duration and award points into your #{cleanTag} stream balance.
                    </p>
                  </div>
                </div>

                {/* Link Paste & Preview Bar */}
                <div className="bg-black/70 p-3 rounded-2xl border border-pink-500/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
                      <input
                        type="url"
                        value={quickLinkInput}
                        onChange={(e) => {
                          setQuickLinkInput(e.target.value);
                          setQuickAddedSuccess(false);
                        }}
                        placeholder={`Paste any article link for #${cleanTag}...`}
                        className="w-full pl-10 pr-10 py-2.5 bg-neutral-950/90 border border-pink-500/30 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all font-mono"
                      />
                      {isQuickEstimating && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />
                        </div>
                      )}
                      {quickLinkInput && !isQuickEstimating && (
                        <button
                          onClick={() => {
                            setQuickLinkInput('');
                            setQuickEstimatedReading(null);
                          }}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Auto-Estimated Link Preview Card */}
                  {quickEstimatedReading && (
                    <div className="p-3 bg-neutral-900/90 border border-pink-500/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-pink-950 border border-pink-400/40 text-pink-300">
                            ⏱ {quickEstimatedReading.readTimeFormatted || `${quickEstimatedReading.estimatedMinutes} min read`}
                          </span>
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300">
                            +{quickEstimatedReading.readingPoints} points
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ~{quickEstimatedReading.wordCount} words
                          </span>
                        </div>
                        <p className="font-semibold text-xs text-slate-200 line-clamp-1">{quickEstimatedReading.title}</p>
                      </div>

                      <button
                        onClick={() => {
                          if (onAddReadingToStream) {
                            onAddReadingToStream(quickEstimatedReading);
                          }
                          setQuickAddedSuccess(true);
                          setQuickLinkInput('');
                          setTimeout(() => {
                            setQuickEstimatedReading(null);
                            setQuickAddedSuccess(false);
                          }, 2500);
                        }}
                        disabled={quickAddedSuccess}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                          quickAddedSuccess
                            ? 'bg-sky-600 text-white shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                            : 'bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)] hover:scale-105'
                        }`}
                      >
                        {quickAddedSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added to Stream!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Publish to #{cleanTag}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Filters for Reading Links */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 bg-neutral-900/90 p-1 rounded-xl border border-pink-500/30 text-xs">
                  <button
                    onClick={() => setReadingLengthFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      readingLengthFilter === 'all' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Readings ({groupReadings.length})
                  </button>
                  <button
                    onClick={() => setReadingLengthFilter('quick')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      readingLengthFilter === 'quick' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ⚡ Quick (&le; 4m)
                  </button>
                  <button
                    onClick={() => setReadingLengthFilter('medium')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      readingLengthFilter === 'medium' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    📖 Moderate (5–9m)
                  </button>
                  <button
                    onClick={() => setReadingLengthFilter('long')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      readingLengthFilter === 'long' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🌟 Longform (10m+)
                  </button>
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  Points Formula: 10 base + (minutes × 10) + Depth Bonus
                </div>
              </div>

              {/* Reading Links Grid */}
              <div className="grid grid-cols-1 gap-4">
                {filteredReadings.map((reading) => {
                  const isCompleted = (currentUser.completedReadings || []).some(
                    (cr) => cr.linkId === reading.id || cr.url === reading.url
                  );

                  return (
                    <ReadingLinkCard
                      key={reading.id}
                      readingLink={reading}
                      isCompleted={isCompleted}
                      onReadLink={(link) => {
                        if (onOpenReadingLink) {
                          onOpenReadingLink(link);
                        }
                      }}
                    />
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 3: MEMBERS & DEPTH SCORE */}
          {activeSubTab === 'members' && (
            <div className="space-y-6">
              
              {/* Search members */}
              <div className="relative">
                <Search className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search stream members..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full bg-neutral-900 border border-pink-500/30 focus:border-pink-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-500 shadow-inner"
                />
              </div>

              {filteredMembers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredMembers.map((member) => {
                    const comp = calculateCompatibility(currentUser, member, allPosts);
                    const isSelf = member.id === currentUser.id;
                    const isFriend = currentUser.friends.includes(member.id);
                    const memberPts = member.groupPoints?.[cleanTag] || (isSelf ? userGroupPoints : 45 + Math.floor(Math.random() * 120));

                    return (
                      <div
                        key={member.id}
                        className="p-4 rounded-2xl bg-neutral-900/80 border border-pink-500/30 hover:border-pink-500/60 transition-all flex items-center justify-between gap-3 shadow-md"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-11 h-11 rounded-xl object-cover ring-2 ring-pink-500/40 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-white truncate">
                                {member.name}
                              </span>
                              {isSelf && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-950 border border-pink-500/40 text-pink-300 font-mono">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 truncate block">
                              {member.handle}
                            </span>
                            <span className="text-[10px] text-amber-400 font-mono mt-0.5 block font-semibold">
                              ⭐ {memberPts} pts in #{cleanTag}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        {!isSelf && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {onInspectCompatibility && (
                              <button
                                onClick={() => onInspectCompatibility(member.id)}
                                className="p-2 rounded-xl bg-pink-950/80 hover:bg-pink-900 text-pink-300 border border-pink-500/40 text-xs transition-all"
                                title="Inspect Compatibility Breakdown"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onStartChat && (
                              <button
                                onClick={() => onStartChat(member)}
                                className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-slate-200 border border-pink-500/20 text-xs transition-all"
                                title="Encrypted Direct Message"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onAddFriend && !isFriend && (
                              <button
                                onClick={() => onAddFriend(member.id, member.name)}
                                className="p-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs transition-all shadow-[0_0_8px_rgba(236,72,153,0.4)]"
                                title="Add Friend"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-neutral-900/60 border border-pink-500/20 rounded-2xl p-8 text-center text-slate-400 text-xs">
                  No members matched "{memberSearchQuery}".
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ABOUT & GUIDELINES */}
          {activeSubTab === 'about' && (
            <div className="space-y-6">
              
              {/* Manifest / Purpose */}
              <div className="bg-neutral-900/80 border border-pink-500/30 p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-pink-300 flex items-center gap-2">
                  <Info className="w-4 h-4 text-pink-400" />
                  <span>Stream Purpose & Architecture</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                  {group.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-black/60 p-3.5 rounded-xl border border-pink-500/20">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Category</span>
                    <span className="text-xs font-semibold text-pink-300">{group.category}</span>
                  </div>
                  <div className="bg-black/60 p-3.5 rounded-xl border border-pink-500/20">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Regional Anchor</span>
                    {group.city ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onCityClick) {
                            onCityClick(group.city!);
                            onClose();
                          }
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-pink-300 hover:text-white hover:underline cursor-pointer transition-colors"
                        title={`Filter feed by location tag: ${group.city}`}
                      >
                        <MapPin className="w-3 h-3 text-pink-400 shrink-0" />
                        <span>{group.city}</span>
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-pink-300">Global Distributed</span>
                    )}
                  </div>
                  <div className="bg-black/60 p-3.5 rounded-xl border border-pink-500/20">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Stream Founded</span>
                    <span className="text-xs font-semibold text-pink-300">{group.createdAt || '2025'}</span>
                  </div>
                </div>
              </div>

              {/* Stream Guidelines / Rules */}
              <div className="bg-neutral-900/80 border border-pink-500/30 p-6 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-pink-300 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-pink-400" />
                  <span>Stream Guidelines</span>
                </h3>
                <ul className="space-y-2">
                  {(group.rules || [
                    'Publish thoughtful content relevant to #' + cleanTag + '.',
                    'Respect creator authenticity, encryption keys, and constructive feedback.',
                    'Celebrate long-form stanzas, essays, and PDF publications.',
                  ]).map((rule, idx) => (
                    <li key={idx} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-pink-400 font-bold">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
