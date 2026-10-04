import React, { useState, useMemo } from 'react';
import {
  Hash,
  Flame,
  Sparkles,
  RefreshCw,
  Users,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  Search,
  MapPin,
  Globe,
  Zap,
  Star,
  Calendar,
  TrendingUp,
  Radio,
  Quote,
  X,
  Trophy,
  Crown,
  ChevronDown,
  ChevronUp,
  Heart,
  MessageSquare,
} from 'lucide-react';
import { HashtagGroup, HashtagTrend, Post, User } from '../types';
import { TrendingHashtagsD3Chart } from './TrendingHashtagsD3Chart';
import { StreamActivityHeatmap } from './StreamActivityHeatmap';
import { CITY_REGIONS } from '../utils/cityRegions';
import { HashtagGroupTopScoringDisplay } from './HashtagGroupTopScoringDisplay';
import { getTopScoringPostsForGroup } from '../utils/hashtagScoring';

export type StreamSortOption = 'most_active' | 'recently_joined' | 'regional_popularity';

interface HashtagTrendsViewProps {
  hashtags: HashtagTrend[];
  groups: HashtagGroup[];
  allPosts: Post[];
  currentUser: User;
  selectedHashtag: string | null;
  onSelectHashtag: (tag: string) => void;
  onOpenGroupDetail: (group: HashtagGroup) => void;
  onToggleJoinGroup: (tag: string) => void;
  onCityClick?: (city: string) => void;
  onSimulateVelocitySpike?: (tag?: string) => void;
}

export const HashtagTrendsView: React.FC<HashtagTrendsViewProps> = ({
  hashtags,
  groups,
  allPosts,
  currentUser,
  selectedHashtag,
  onSelectHashtag,
  onOpenGroupDetail,
  onToggleJoinGroup,
  onCityClick,
  onSimulateVelocitySpike,
}) => {
  const [activeAiSummaryTag, setActiveAiSummaryTag] = useState<string | null>(null);
  const [loadingAiTag, setLoadingAiTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'directory' | 'top_scoring'>('directory');
  const [topScoringSelectedTag, setTopScoringSelectedTag] = useState<string | null>(null);
  const [expandedCardTopScorers, setExpandedCardTopScorers] = useState<Record<string, boolean>>({});
  const [aiSummaries, setAiSummaries] = useState<
    Record<string, { summary: string; keyTakeaways: string[]; vibeSentiment?: string }>
  >({});

  const myJoinedTags = (currentUser.joinedGroupTags || []).map((t) => t.toLowerCase().replace(/^#+/, ''));

  // Formatted date for daily rotation display
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Daily Rotating Featured Stream highlighting high-activity communities
  const featuredStream = useMemo(() => {
    if (!groups || groups.length === 0) return null;

    // Score groups based on community activity metrics
    const scored = groups.map((g) => {
      const clean = g.tag.replace(/^#+/, '').toLowerCase();
      const taggedPosts = allPosts.filter((p) =>
        p.hashtags.some((h) => h.replace(/^#+/, '').toLowerCase() === clean)
      );
      const trend = hashtags.find((h) => h.tag.replace(/^#+/, '').toLowerCase() === clean);
      const score =
        (g.memberIds?.length || 0) * 10 +
        taggedPosts.length * 20 +
        (g.isHot ? 60 : 0) +
        (trend ? Math.min(trend.postCount, 200) : 0);

      return {
        group: g,
        cleanTag: clean,
        score,
        taggedPosts,
        trend,
      };
    });

    // Rank by descending activity score
    scored.sort((a, b) => b.score - a.score);

    // Deterministic daily index based on UTC date
    const now = new Date();
    const daySeed = Math.floor(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / (1000 * 60 * 60 * 24)
    );

    // Select from top high-activity candidates (up to 5 top communities)
    const candidatePool = scored.slice(0, Math.min(scored.length, 5));
    const selected = candidatePool.length > 0 ? candidatePool[daySeed % candidatePool.length] : scored[0];

    return selected;
  }, [groups, allPosts, hashtags]);

  const handleGenerateAiSummary = async (tag: string) => {
    setLoadingAiTag(tag);
    setActiveAiSummaryTag(tag);

    try {
      const clean = tag.replace(/^#+/, '').toLowerCase();
      const postsForTag = allPosts.filter((p) =>
        p.hashtags.some((h) => h.replace(/^#+/, '').toLowerCase().includes(clean))
      );
      const excerpts = postsForTag.map((p) => ({ author: p.authorName, text: p.content.slice(0, 200) }));

      const res = await fetch('/api/gemini/trending-hashtag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashtag: tag, postsExcerpts: excerpts }),
      });

      const data = await res.json();
      setAiSummaries((prev) => ({ ...prev, [tag]: data }));
    } catch (err) {
      console.error('Failed to generate hashtag summary:', err);
    } finally {
      setLoadingAiTag(null);
    }
  };

  // Filter & sort groups by trending velocity
  const displayedGroups = useMemo(() => {
    const filtered = groups.filter((g) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          g.name.toLowerCase().includes(q) ||
          g.tag.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q) ||
          (g.city && g.city.toLowerCase().includes(q))
        );
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      const cleanA = a.tag.replace(/^#+/, '').toLowerCase();
      const cleanB = b.tag.replace(/^#+/, '').toLowerCase();

      const postsA = allPosts.filter((p) =>
        p.hashtags.some((h) => h.replace(/^#+/, '').toLowerCase() === cleanA)
      ).length;
      const postsB = allPosts.filter((p) =>
        p.hashtags.some((h) => h.replace(/^#+/, '').toLowerCase() === cleanB)
      ).length;

      const membersA = a.memberIds?.length || 0;
      const membersB = b.memberIds?.length || 0;

      const trendA = hashtags.find((h) => h.tag.replace(/^#+/, '').toLowerCase() === cleanA);
      const trendB = hashtags.find((h) => h.tag.replace(/^#+/, '').toLowerCase() === cleanB);

      // Rank by trending velocity & community momentum
      const scoreA = postsA * 25 + membersA * 10 + (a.isHot ? 60 : 0) + (trendA ? trendA.postCount * 2 : 0);
      const scoreB = postsB * 25 + membersB * 10 + (b.isHot ? 60 : 0) + (trendB ? trendB.postCount * 2 : 0);
      return scoreB - scoreA;
    });
  }, [groups, searchQuery, allPosts, hashtags]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner with Integrated Search Bar */}
      <div className="bg-black/70 backdrop-blur-md border border-pink-500/50 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_15px_rgba(244,114,182,0.12),0_8px_25px_rgba(0,0,0,0.6)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_6px_rgba(236,72,153,0.2)]">
                <Hash className="w-3.5 h-3.5 text-pink-400" /> Hashtag Streams
              </span>
              <span className="text-xs text-slate-400 bg-neutral-900 px-2.5 py-0.5 rounded-full border border-pink-500/30 font-mono">
                {groups.length} Streams Active
              </span>
              <span className="text-xs text-pink-300 bg-neutral-900 px-2.5 py-0.5 rounded-full border border-pink-500/30 font-mono hidden sm:inline-block">
                {myJoinedTags.length} Joined
              </span>
              {onSimulateVelocitySpike && (
                <button
                  type="button"
                  onClick={() => onSimulateVelocitySpike()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all shadow-[0_0_10px_rgba(251,191,36,0.25)] cursor-pointer"
                  title="Simulate sudden high-velocity surge on a joined stream and trigger Discovery Notification"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Test Discovery Alert</span>
                </button>
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Hashtag Streams & Topics</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Every hashtag forms a dedicated sovereign stream. Join any hashtag stream to connect with fellow creators and integrate its entire stream directly into your feed.
            </p>
          </div>

          {/* Search Bar in Header */}
          <div className="w-full md:w-80 lg:w-96 shrink-0 space-y-1.5">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search streams, hashtags, or cities..."
                className="w-full bg-neutral-950/90 border border-pink-500/40 focus:border-pink-400 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500/50 shadow-inner transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between px-1 text-[11px] text-slate-400 font-mono">
              <span>{searchQuery ? `${displayedGroups.length} matching results` : `${displayedGroups.length} streams`}</span>
              <span className="text-pink-300">
                {myJoinedTags.length} in Your Feed
              </span>
            </div>

            {/* Active Search / Location Tag Filter */}
            {searchQuery.trim() && (
              <div className="flex items-center gap-2 px-1 text-[11px] font-mono flex-wrap pt-0.5 animate-in fade-in duration-150">
                <span className="text-slate-400">Filtering streams by:</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-950/80 border border-pink-500/40 text-pink-300">
                  <MapPin className="w-2.5 h-2.5 text-pink-400 shrink-0" />
                  <span>{searchQuery}</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="hover:text-white ml-0.5 cursor-pointer text-xs"
                    title="Clear filter"
                  >
                    ×
                  </button>
                </span>
                {onCityClick && (
                  <button
                    type="button"
                    onClick={() => onCityClick(searchQuery)}
                    className="text-pink-400 hover:text-pink-300 hover:underline cursor-pointer flex items-center gap-1 text-[11px]"
                    title={`Showcase Top 10 Streams in ${searchQuery}`}
                  >
                    <span>Showcase Top 10 Streams in {searchQuery}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Regional City Streams Hub Quick-Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-pink-400" />
          <span>Top 10 Cities:</span>
        </span>
        {CITY_REGIONS.map((city) => (
          <button
            key={city.id}
            type="button"
            onClick={() => onCityClick?.(city.name)}
            className="text-[11px] font-mono text-pink-300 bg-neutral-900/80 hover:bg-pink-950/80 border border-pink-500/25 hover:border-pink-400 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer shrink-0 active:scale-95"
            title={`Showcase top 10 streams in ${city.name}`}
          >
            <span>{city.name}</span>
            <span className="text-[9px] text-pink-400/90 font-bold">Top 10</span>
          </button>
        ))}
      </div>

      {/* VIEW: D3.js Growth Trajectory Line Chart */}
      <TrendingHashtagsD3Chart
        hashtags={hashtags}
        onSelectHashtag={onSelectHashtag}
        selectedHashtag={selectedHashtag}
      />

      {/* VIEW MODE SWITCHER: All Streams Directory vs Top Scoring Posts by Group */}
      <div className="flex items-center justify-between gap-3 border-b border-pink-500/30 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('directory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'directory'
                ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                : 'bg-neutral-900/80 text-slate-300 hover:text-white border border-pink-500/30'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>All Streams Directory</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-pink-200 font-mono">
              {displayedGroups.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTopScoringSelectedTag(null);
              setViewMode('top_scoring');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'top_scoring'
                ? 'bg-gradient-to-r from-amber-500 to-pink-600 text-white shadow-[0_0_16px_rgba(245,158,11,0.4)]'
                : 'bg-neutral-900/80 text-slate-300 hover:text-amber-300 border border-pink-500/30'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Top Scoring Posts by Group</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-amber-300 font-mono">
              Leaderboards
            </span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          {viewMode === 'top_scoring' ? 'Ranked by Engagement & Depth Points' : 'Live Community Streams'}
        </span>
      </div>

      {/* VIEW MODE 1: TOP SCORING POSTS BY HASHTAG GROUP */}
      {viewMode === 'top_scoring' && (
        <HashtagGroupTopScoringDisplay
          groups={displayedGroups}
          allPosts={allPosts}
          currentUser={currentUser}
          onOpenGroupDetail={onOpenGroupDetail}
          onSelectHashtag={onSelectHashtag}
          onToggleJoinGroup={onToggleJoinGroup}
          initialSelectedTag={topScoringSelectedTag}
        />
      )}

      {/* VIEW MODE 2: DIRECTORY */}
      {viewMode === 'directory' && (
        <>
          {/* FEATURED STREAM OF THE DAY (Rotates Daily to Highlight High-Activity Communities) */}
          {featuredStream && !searchQuery.trim() && (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/40 via-purple-600/30 to-pink-500/40 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
          <div className="relative bg-black/85 backdrop-blur-xl border border-pink-400/80 rounded-3xl p-6 shadow-[0_0_30px_rgba(236,72,153,0.25)] space-y-5">
            
            {/* Top Feature Tag & Rotation Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-pink-500/30">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.6)] uppercase tracking-wider">
                  <Star className="w-3.5 h-3.5 fill-white text-white" />
                  <span>Featured Stream</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs text-pink-200 bg-pink-950/80 border border-pink-500/40 px-3 py-1 rounded-full font-medium">
                  <Calendar className="w-3.5 h-3.5 text-pink-400" />
                  <span>Rotates Daily • {todayFormatted}</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-full">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/40" />
                  <span>High Activity Community</span>
                </span>
                {myJoinedTags.includes(featuredStream.cleanTag) && (
                  <span className="flex items-center gap-1 text-xs font-bold text-sky-300 bg-sky-950/80 border border-sky-500/40 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Joined in Feed</span>
                  </span>
                )}
              </div>
            </div>

            {/* Featured Community Body Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Community Profile & Core Info */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-600 to-purple-800 text-white flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(236,72,153,0.5)] shrink-0 border border-pink-300/40">
                    <Hash className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        onClick={() => onOpenGroupDetail(featuredStream.group)}
                        className="text-xl sm:text-2xl font-bold text-white hover:text-pink-300 transition-colors cursor-pointer tracking-tight flex flex-wrap items-center gap-1.5"
                      >
                        <span>#{featuredStream.cleanTag}</span>
                        <span className="text-pink-400 font-light text-lg sm:text-xl">Stream</span>
                        {featuredStream.group.city && (
                          <span className="text-pink-300/90 font-mono text-base sm:text-lg font-normal">
                            ({featuredStream.group.city})
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-pink-300 bg-pink-950/70 border border-pink-500/40 px-2.5 py-0.5 rounded-lg font-medium">
                        {featuredStream.group.category}
                      </span>
                      {featuredStream.group.city && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onCityClick) {
                              onCityClick(featuredStream.group.city!);
                            } else {
                              setSearchQuery(featuredStream.group.city!);
                            }
                          }}
                          className="text-xs font-mono text-pink-200 bg-neutral-900 hover:bg-pink-950/80 border border-pink-500/40 hover:border-pink-400 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all cursor-pointer active:scale-95 group/loctag"
                          title={`Showcase Top 10 Streams in ${featuredStream.group.city}`}
                        >
                          <MapPin className="w-3 h-3 text-pink-400 group-hover/loctag:text-pink-300 transition-colors shrink-0" />
                          <span>{featuredStream.group.city}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-light">
                  {featuredStream.group.description}
                </p>

                {featuredStream.group.vibeStatement && (
                  <div className="text-xs text-pink-200/90 italic font-mono bg-pink-950/40 border border-pink-500/30 p-3 rounded-2xl flex items-start gap-2">
                    <Quote className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                    <span>"{featuredStream.group.vibeStatement}"</span>
                  </div>
                )}

                {/* Real-time Activity Heat Map & Waveform Banner */}
                <div className="p-3 rounded-2xl bg-black/70 border border-pink-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                      <span>Real-Time Activity Heat:</span>
                    </span>
                    <StreamActivityHeatmap
                      tag={featuredStream.cleanTag}
                      allPosts={allPosts}
                      group={featuredStream.group}
                      trend={hashtags.find((h) => h.tag.replace(/^#+/, '').toLowerCase() === featuredStream.cleanTag.toLowerCase())}
                      size="md"
                    />
                  </div>
                  <span className="text-[11px] text-pink-300/80 font-mono flex items-center gap-1">
                    <span>⚡ Live Stanza Momentum</span>
                  </span>
                </div>

                {/* Key Activity Metrics Pill Bar */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-neutral-900/90 border border-pink-500/30 rounded-xl p-2.5 text-center">
                    <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
                      <Users className="w-3 h-3 text-pink-400" />
                      <span>Members</span>
                    </div>
                    <div className="text-base font-bold text-pink-200 mt-0.5">
                      {featuredStream.group.memberIds.length}
                    </div>
                  </div>
                  <div className="bg-neutral-900/90 border border-pink-500/30 rounded-xl p-2.5 text-center">
                    <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
                      <Radio className="w-3 h-3 text-purple-400" />
                      <span>Active Posts</span>
                    </div>
                    <div className="text-base font-bold text-purple-200 mt-0.5">
                      {featuredStream.taggedPosts.length}
                    </div>
                  </div>
                  <div className="bg-neutral-900/90 border border-pink-500/30 rounded-xl p-2.5 text-center">
                    <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3 text-sky-400" />
                      <span>Activity Score</span>
                    </div>
                    <div className="text-base font-bold text-sky-300 mt-0.5 font-mono">
                      {featuredStream.score} pts
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <button
                    onClick={() => onSelectHashtag ? onSelectHashtag(featuredStream.cleanTag) : onOpenGroupDetail(featuredStream.group)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_16px_rgba(236,72,153,0.5)] hover:scale-[1.02]"
                  >
                    <Zap className="w-4 h-4 text-white fill-white" />
                    <span>Enter Stream ⚡</span>
                  </button>

                  <button
                    onClick={() => onToggleJoinGroup(featuredStream.cleanTag)}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                      myJoinedTags.includes(featuredStream.cleanTag)
                        ? 'bg-pink-950/90 hover:bg-pink-900 text-pink-200 border border-pink-400/60'
                        : 'bg-neutral-900 hover:bg-neutral-800 text-pink-300 border border-pink-500/50'
                    }`}
                  >
                    {myJoinedTags.includes(featuredStream.cleanTag) ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-sky-400" />
                        <span>Joined</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4 text-pink-400" />
                        <span>Join Stream</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleGenerateAiSummary(featuredStream.cleanTag)}
                    disabled={loadingAiTag === featuredStream.cleanTag}
                    className="py-2.5 px-3 rounded-xl bg-pink-950/60 hover:bg-pink-900/80 text-pink-300 border border-pink-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Generate AI Community Synergy Analysis"
                  >
                    {loadingAiTag === featuredStream.cleanTag ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-pink-400" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-pink-400" />
                    )}
                    <span className="hidden sm:inline">AI Analysis</span>
                  </button>
                </div>

              </div>

              {/* Right Column: Live Stream Previews / Latest Stanzas */}
              <div className="lg:col-span-5 bg-neutral-950/70 border border-pink-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-pink-300">
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-pink-400" />
                    <span>Stream Highlights & Activity</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {featuredStream.taggedPosts.length} posts published
                  </span>
                </div>

                {featuredStream.taggedPosts.length > 0 ? (
                  <div className="space-y-2.5">
                    {featuredStream.taggedPosts.slice(0, 2).map((post) => (
                      <div
                        key={post.id}
                        onClick={() => onSelectHashtag ? onSelectHashtag(featuredStream.cleanTag) : onOpenGroupDetail(featuredStream.group)}
                        className="bg-black/60 hover:bg-pink-950/30 border border-pink-500/20 hover:border-pink-500/50 p-3 rounded-xl cursor-pointer transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={post.authorAvatar}
                              alt={post.authorName}
                              className="w-5 h-5 rounded-full object-cover ring-1 ring-pink-500/40"
                            />
                            <span className="text-xs font-bold text-slate-200 truncate">{post.authorName}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{post.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2 italic font-serif">
                          "{post.content}"
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-pink-400 pt-0.5">
                          <span>❤️ {post.likesCount} appreciations</span>
                          <span>💬 {post.commentsCount} comments</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2">
                    <Sparkles className="w-6 h-6 text-pink-400 mx-auto opacity-70" />
                    <p className="text-xs text-slate-400">
                      Be among the first creators to share thoughts and poetry with #{featuredStream.cleanTag}!
                    </p>
                  </div>
                )}

                {/* AI Story Summary Drawer if generated for featured stream */}
                {aiSummaries[featuredStream.cleanTag] && (
                  <div className="mt-2 bg-neutral-900/90 border border-pink-500/40 rounded-xl p-3 space-y-2 shadow-[0_0_10px_rgba(236,72,153,0.2)]">
                    <div className="flex items-center justify-between text-xs font-semibold text-pink-300">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-pink-400" /> AI Community Synergy
                      </span>
                      {aiSummaries[featuredStream.cleanTag].vibeSentiment && (
                        <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/30">
                          {aiSummaries[featuredStream.cleanTag].vibeSentiment}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed italic">{aiSummaries[featuredStream.cleanTag].summary}</p>
                    <ul className="space-y-1 pt-1">
                      {aiSummaries[featuredStream.cleanTag].keyTakeaways?.slice(0, 2).map((point, i) => (
                        <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                          <span className="text-pink-400 font-bold">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* VIEW: HASHTAG GROUPS DIRECTORY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedGroups.map((group) => {
          const clean = group.tag.replace(/^#+/, '');
          const isSelected = selectedHashtag?.toLowerCase().replace(/^#+/, '') === clean.toLowerCase();
          const isJoined = myJoinedTags.includes(clean.toLowerCase());
          const aiSummary = aiSummaries[clean] || aiSummaries[group.tag];
          const isLoadingThis = loadingAiTag === clean || loadingAiTag === group.tag;
          
          // Post count for this hashtag
          const taggedPostsCount = allPosts.filter((p) =>
            p.hashtags.some((h) => h.replace(/^#+/, '').toLowerCase() === clean.toLowerCase())
          ).length;

          const groupTopPosts = getTopScoringPostsForGroup(clean, allPosts, 3);
          const topPost = groupTopPosts[0];
          const isTopExpanded = expandedCardTopScorers[clean] || false;

          return (
            <div key={group.tag} className="relative group">
              <div
                className={`absolute -inset-0.5 rounded-2xl blur-md opacity-30 group-hover:opacity-50 transition-all duration-300 pointer-events-none ${
                  isJoined
                    ? 'bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-pink-500/30 opacity-60'
                    : 'bg-gradient-to-r from-pink-400/10 via-pink-300/15 to-pink-500/10'
                }`}
              />
              <div
                className={`relative bg-black/75 backdrop-blur-md border rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between h-full ${
                  isJoined
                    ? 'border-pink-400/80 ring-1 ring-pink-400/40 card-pink-glow'
                    : 'border-pink-500/40 hover:border-pink-400 card-pink-glow'
                }`}
              >
                <div>
                  
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-pink-950/70 text-pink-400 border border-pink-500/40 flex items-center justify-center font-bold text-sm shadow-[0_0_8px_rgba(236,72,153,0.3)]">
                        <Hash className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3
                            onClick={() => onOpenGroupDetail(group)}
                            className="font-bold text-slate-100 text-base cursor-pointer hover:text-pink-300 transition-colors flex items-center gap-1"
                          >
                            <span>#{clean}</span>
                            <span className="text-xs text-pink-400 font-light">Stream</span>
                            {group.city && (
                              <span className="text-[11px] text-pink-300 font-mono font-normal">
                                ({group.city})
                              </span>
                            )}
                          </h3>
                          {isJoined && (
                            <span className="text-[10px] bg-sky-950/80 border border-sky-500/40 text-sky-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5 text-sky-400" />
                              <span>Joined</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-400">{group.category}</span>
                          {group.city && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onCityClick) {
                                  onCityClick(group.city!);
                                } else {
                                  setSearchQuery(group.city!);
                                }
                              }}
                              className="text-[10px] font-mono text-pink-300 bg-pink-950/60 hover:bg-pink-900/80 border border-pink-500/30 hover:border-pink-400 hover:text-white px-2 py-0.5 rounded-full flex items-center gap-1 transition-all cursor-pointer active:scale-95 group/loctag"
                              title={`Showcase Top 10 Streams in ${group.city}`}
                            >
                              <MapPin className="w-2.5 h-2.5 text-pink-400 group-hover/loctag:text-pink-300 transition-colors shrink-0" />
                              <span>{group.city}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {group.isHot && (
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
                          <Flame className="w-3 h-3 text-pink-400" /> Hot
                        </span>
                      )}
                      <span className="text-xs font-semibold text-pink-300 bg-neutral-900 px-2.5 py-1 rounded-lg border border-pink-500/30 flex items-center gap-1">
                        <Users className="w-3 h-3 text-pink-400" />
                        <span>{group.memberIds.length} members</span>
                      </span>
                    </div>
                  </div>

                  {/* Real-Time Activity Sparkline & Heat Map Indicator */}
                  <div className="mb-3 p-2 rounded-xl bg-black/60 border border-pink-500/25 flex items-center justify-between gap-2 shadow-inner">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] text-slate-400 font-medium shrink-0 uppercase tracking-wider">
                        Live Activity:
                      </span>
                      <StreamActivityHeatmap
                        tag={clean}
                        allPosts={allPosts}
                        group={group}
                        trend={hashtags.find((h) => h.tag.replace(/^#+/, '').toLowerCase() === clean.toLowerCase())}
                        size="sm"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 hidden sm:inline">
                      {taggedPostsCount} posts
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-3 leading-relaxed">{group.description}</p>

                  {/* Vibe / Rule Quote */}
                  {group.vibeStatement && (
                    <div className="mb-3 text-[11px] text-pink-300/80 italic font-mono bg-pink-950/30 border border-pink-500/20 px-3 py-1.5 rounded-xl">
                      "{group.vibeStatement}"
                    </div>
                  )}

                  {/* Top Scoring Post Spotlight for this Hashtag Group */}
                  {topPost && (
                    <div className="mb-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-black/60 to-neutral-900 border border-amber-500/30 p-2.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-amber-400 font-bold text-xs flex items-center gap-1 shrink-0">
                            <Crown className="w-3 h-3 text-amber-400" />
                            <span>Top Post:</span>
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-300 shrink-0">
                            {topPost.scoreBreakdown.totalScore} pts
                          </span>
                          <span className="text-[11px] text-slate-300 truncate">
                            by {topPost.post.authorName}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCardTopScorers((prev) => ({
                              ...prev,
                              [clean]: !prev[clean],
                            }))
                          }
                          className="text-[10px] text-amber-300 hover:text-white flex items-center gap-0.5 font-mono cursor-pointer shrink-0 transition-colors"
                        >
                          <span>{isTopExpanded ? 'Hide' : 'Top 3'}</span>
                          {isTopExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {/* Expandable Top 3 Posts Drawer */}
                      {isTopExpanded && (
                        <div className="pt-2 border-t border-amber-500/20 space-y-1.5 animate-in fade-in duration-150">
                          {groupTopPosts.map((item) => (
                            <div
                              key={item.post.id}
                              className="p-2 rounded-lg bg-black/50 border border-amber-500/20 flex items-center justify-between gap-2 text-[11px]"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-mono text-xs shrink-0">{item.medalEmoji}</span>
                                <span className="font-bold text-slate-200 truncate shrink-0">
                                  {item.post.authorName}:
                                </span>
                                <span className="text-slate-400 truncate italic font-serif">
                                  "{item.post.content.slice(0, 35)}..."
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-pink-400 hidden sm:inline">
                                  ❤️ {item.post.likesCount}
                                </span>
                                <span className="font-mono font-bold text-amber-300">
                                  {item.scoreBreakdown.totalScore} pts
                                </span>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setTopScoringSelectedTag(clean);
                              setViewMode('top_scoring');
                            }}
                            className="w-full py-1 text-center text-[10px] font-bold text-amber-300 hover:text-white transition-colors cursor-pointer block"
                          >
                            View Full Leaderboard for #{clean} →
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Story Summary Drawer if generated */}
                  {aiSummary && (
                    <div className="mb-3 bg-neutral-900/90 border border-pink-500/40 rounded-xl p-3.5 space-y-2 shadow-[0_0_10px_rgba(236,72,153,0.2)]">
                      <div className="flex items-center justify-between text-xs font-semibold text-pink-300">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-pink-400" /> AI Stream Synergy Breakdown
                        </span>
                        {aiSummary.vibeSentiment && (
                          <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/30">
                            {aiSummary.vibeSentiment}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed italic">{aiSummary.summary}</p>
                      <ul className="space-y-1 pt-1">
                        {aiSummary.keyTakeaways?.map((point, i) => (
                          <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                            <span className="text-pink-400 font-bold">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-pink-500/20 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{taggedPostsCount} posts published in this stream</span>
                    <span className="text-pink-300 font-mono">
                      {isJoined ? 'Added to your feed' : 'Join to add to feed'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Enter Stream with Warp Button */}
                    <button
                      onClick={() => onSelectHashtag ? onSelectHashtag(clean) : onOpenGroupDetail(group)}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-slate-200 hover:text-pink-300 border border-pink-500/30 hover:border-pink-500/60 flex items-center justify-center gap-1.5 transition-all cursor-pointer group/warpbtn"
                      title={`Feed Warp into #${clean} Stream`}
                    >
                      <Zap className="w-3.5 h-3.5 text-pink-400 group-hover/warpbtn:scale-110 fill-pink-400/30 transition-transform" />
                      <span>Enter Stream ⚡</span>
                    </button>

                    {/* Top Scoring Leaderboard Button for this Group */}
                    <button
                      type="button"
                      onClick={() => {
                        setTopScoringSelectedTag(clean);
                        setViewMode('top_scoring');
                      }}
                      className="p-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-sm"
                      title={`View Top Scoring Posts for #${clean}`}
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    </button>

                    {/* Join / Leave Stream Toggle */}
                    <button
                      onClick={() => onToggleJoinGroup(clean)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                        isJoined
                          ? 'bg-pink-950/80 hover:bg-pink-900 text-pink-200 border border-pink-400/50'
                          : 'bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                      }`}
                    >
                      {isJoined ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                          <span>Joined</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Join Stream</span>
                        </>
                      )}
                    </button>

                    {/* AI Summary Button */}
                    <button
                      onClick={() => handleGenerateAiSummary(clean)}
                      disabled={isLoadingThis}
                      className="p-2 rounded-xl bg-pink-950/50 hover:bg-pink-900/60 text-pink-300 border border-pink-500/40 text-xs font-semibold transition-all shrink-0 cursor-pointer"
                      title="AI Stream Breakdown"
                    >
                      {isLoadingThis ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-400" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {displayedGroups.length === 0 && (
        <div className="bg-neutral-900/70 border border-pink-500/30 rounded-2xl p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-pink-400 mx-auto opacity-80" />
          <h3 className="text-lg font-bold text-slate-200">
            No hashtag streams found
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try searching with a different keyword or create a new post to seed a new hashtag stream!
          </p>
        </div>
      )}
    </>
  )}

    </div>
  );
};
