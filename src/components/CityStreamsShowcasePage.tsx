import React, { useState, useMemo } from 'react';
import {
  MapPin,
  ArrowLeft,
  Flame,
  Users,
  Compass,
  Sparkles,
  Search,
  ExternalLink,
  Radio,
  Clock,
  Globe,
  Share2,
  Check,
  ChevronRight,
  Quote,
  Layers,
  Award,
  BookOpen,
  ArrowUpRight,
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';
import { HashtagGroup, Post, User, PDFDocument, ReadingLink, PostMood } from '../types';
import { CITY_REGIONS, getCityLocalTime } from '../utils/cityRegions';
import { getTop10StreamsForCity, TopStreamItem } from '../utils/cityTopStreams';
import { PostCard } from './PostCard';
import { calculateCompatibility } from '../utils/compatibility';

interface CityStreamsShowcasePageProps {
  cityName: string;
  allPosts: Post[];
  allUsers: User[];
  allGroups: HashtagGroup[];
  currentUser: User;
  onClose: () => void;
  onSelectCity: (cityName: string) => void;
  onOpenStreamDetail: (group: HashtagGroup) => void;
  onWarpToStreamFeed: (tag: string) => void;
  onToggleJoinGroup: (tag: string) => void;
  onLikePost?: (postId: string) => void;
  onDislikePost?: (postId: string) => void;
  onAddComment?: (postId: string, commentText: string) => void;
  onOpenPdf?: (doc: PDFDocument) => void;
  onShareToChat?: (post: Post) => void;
  onSharePost?: (post: Post) => void;
  onToggleBookmarkPost?: (postId: string) => void;
  onInspectCompatibility?: (user: User) => void;
  onCityClick?: (city: string) => void;
  onOpenReadingLink?: (link: ReadingLink) => void;
  onClaimReadingPoints?: (postId: string, points: number) => void;
  onVotePoll?: (postId: string, optionIndex: number) => void;
  onMoodClick?: (mood: PostMood) => void;
}

export const CityStreamsShowcasePage: React.FC<CityStreamsShowcasePageProps> = ({
  cityName,
  allPosts,
  allUsers,
  allGroups,
  currentUser,
  onClose,
  onSelectCity,
  onOpenStreamDetail,
  onWarpToStreamFeed,
  onToggleJoinGroup,
  onLikePost,
  onDislikePost,
  onAddComment,
  onOpenPdf,
  onShareToChat,
  onSharePost,
  onToggleBookmarkPost,
  onInspectCompatibility,
  onCityClick,
  onOpenReadingLink,
  onClaimReadingPoints,
  onVotePoll,
  onMoodClick,
}) => {
  const [activeTab, setActiveTab] = useState<'top_10' | 'city_posts'>('top_10');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewStyle, setViewStyle] = useState<'cards' | 'table'>('cards');
  const [copiedLink, setCopiedLink] = useState(false);

  // Find Region metadata
  const cityRegion = useMemo(() => {
    const clean = cityName.toLowerCase().trim();
    return (
      CITY_REGIONS.find((r) => r.name.toLowerCase() === clean || r.id === clean) ||
      CITY_REGIONS[0]
    );
  }, [cityName]);

  // Compute Top 10 Streams for this City
  const top10Streams = useMemo(() => {
    return getTop10StreamsForCity(allGroups, cityRegion.name, allPosts, allUsers);
  }, [allGroups, cityRegion.name, allPosts, allUsers]);

  // Filtered Top 10 Streams by in-page search
  const filteredStreams = useMemo(() => {
    if (!searchQuery.trim()) return top10Streams;
    const q = searchQuery.toLowerCase();
    return top10Streams.filter(
      (s) =>
        s.tag.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [top10Streams, searchQuery]);

  // Posts associated with this city
  const cityPosts = useMemo(() => {
    const target = cityRegion.name.toLowerCase();
    return allPosts.filter((post) => {
      if (post.city && post.city.toLowerCase() === target) return true;
      return post.hashtags.some((h) => {
        const cleanH = h.replace(/^#+/, '').toLowerCase();
        return (
          top10Streams.some((s) => s.tag.toLowerCase() === cleanH) ||
          cleanH === target
        );
      });
    });
  }, [allPosts, cityRegion.name, top10Streams]);

  // Handle Share link copy
  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const localTime = getCityLocalTime(cityRegion.name);
  const myJoinedTags = (currentUser.joinedGroupTags || []).map((t) =>
    t.toLowerCase().replace(/^#+/, '')
  );

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-200">
      {/* Top Header / Breadcrumb */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-pink-500/20 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-pink-500/30 text-xs font-mono text-pink-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span className="text-slate-500">Regional Nodes</span>
              <span className="text-slate-600">/</span>
              <span className="text-pink-300 font-semibold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-pink-400" />
                <span>{cityRegion.name}, {cityRegion.country}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-pink-500/40 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Copy link to this city stream showcase"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400 font-mono">Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline font-mono">Share Node</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onWarpToStreamFeed(cityRegion.highlightTag || cityRegion.name);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-[0_0_12px_rgba(236,72,153,0.4)] transition-all cursor-pointer active:scale-95"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Explore in Feed</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* City Hero Showcase Card */}
        <div className="relative rounded-3xl overflow-hidden border border-pink-500/30 bg-neutral-950 p-6 sm:p-8 shadow-2xl">
          {/* Subtle Ambient Background Gradient */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${cityRegion.gradient} opacity-20 pointer-events-none`}
          />
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6">
            {/* Top row: Tags & Coordinates */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-950/80 border border-pink-500/40 text-pink-300 font-bold">
                  <Globe className="w-3 h-3 text-pink-400" />
                  <span>Sovereign City Node</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 border border-neutral-800 text-slate-300">
                  <MapPin className="w-3 h-3 text-pink-400" />
                  <span>
                    {cityRegion.coordinates.lat.toFixed(2)}° N,{' '}
                    {cityRegion.coordinates.lng.toFixed(2)}° E
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 border border-neutral-800 text-slate-300">
                  <Clock className="w-3 h-3 text-pink-400" />
                  <span>Local Time: {localTime}</span>
                </span>
              </div>

              <div className="text-pink-300/80 text-xs font-medium px-3 py-1 rounded-xl bg-pink-950/50 border border-pink-500/30">
                {cityRegion.atmosphere}
              </div>
            </div>

            {/* City Title & Description */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-4xl sm:text-5xl">{cityRegion.flagEmoji}</span>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                  {cityRegion.name}
                </h1>
                <span className="text-xl sm:text-2xl text-pink-400 font-light">
                  {cityRegion.country}
                </span>
              </div>

              <p className="text-slate-300 text-sm sm:text-base max-w-3xl font-light leading-relaxed">
                {cityRegion.description}
              </p>

              {cityRegion.vibeQuote && (
                <div className="inline-flex items-start gap-2 bg-pink-950/40 border border-pink-500/30 px-3.5 py-2 rounded-2xl text-xs text-pink-200/90 font-mono italic">
                  <Quote className="w-3.5 h-3.5 text-pink-400 shrink-0 mt-0.5" />
                  <span>&ldquo;{cityRegion.vibeQuote}&rdquo;</span>
                </div>
              )}
            </div>

            {/* Key Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-pink-500/20">
              <div className="bg-black/60 border border-pink-500/20 rounded-2xl p-3.5">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">
                  Curated Streams
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-white font-mono">10</span>
                  <span className="text-xs text-pink-400 font-mono">Top Ranked</span>
                </div>
              </div>

              <div className="bg-black/60 border border-pink-500/20 rounded-2xl p-3.5">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">
                  City Stanzas & Posts
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-white font-mono">{cityPosts.length}</span>
                  <span className="text-xs text-pink-400 font-mono">Active</span>
                </div>
              </div>

              <div className="bg-black/60 border border-pink-500/20 rounded-2xl p-3.5">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">
                  Regional Creators
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-white font-mono">
                    {Math.max(6, new Set(cityPosts.map((p) => p.authorId)).size)}
                  </span>
                  <span className="text-xs text-pink-400 font-mono">Nodes</span>
                </div>
              </div>

              <div className="bg-black/60 border border-pink-500/20 rounded-2xl p-3.5">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">
                  Depth Avg
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-pink-400 font-mono">94.8</span>
                  <span className="text-xs text-slate-400 font-mono">pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* City Node Switcher Strip */}
        <div className="space-y-2">
          <span className="text-xs uppercase font-mono text-slate-400 tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-pink-400" />
            <span>Switch Sovereign City Node:</span>
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CITY_REGIONS.map((city) => {
              const isActive = city.id === cityRegion.id;
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => onSelectCity(city.name)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-mono transition-all cursor-pointer shrink-0 border ${
                    isActive
                      ? 'bg-pink-950 border-pink-400 text-white font-bold shadow-[0_0_15px_rgba(244,114,182,0.3)] scale-[1.02]'
                      : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800 text-slate-300 hover:text-white hover:border-pink-500/30'
                  }`}
                >
                  <span className="text-sm">{city.flagEmoji}</span>
                  <span>{city.name}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* View Tabs & Search Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-pink-500/20 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('top_10')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === 'top_10'
                  ? 'bg-pink-600 text-white border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                  : 'bg-neutral-900 text-slate-400 border-neutral-800 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Top 10 Streams in {cityRegion.name}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('city_posts')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === 'city_posts'
                  ? 'bg-pink-600 text-white border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                  : 'bg-neutral-900 text-slate-400 border-neutral-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>City Posts & Stanzas ({cityPosts.length})</span>
            </button>
          </div>

          {activeTab === 'top_10' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search top streams...`}
                  className="w-full bg-neutral-900/90 border border-pink-500/20 focus:border-pink-400 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-all font-mono"
                />
              </div>

              <div className="flex items-center rounded-xl bg-neutral-900 border border-neutral-800 p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewStyle('cards')}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    viewStyle === 'cards'
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Card View"
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewStyle('table')}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    viewStyle === 'table'
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ranking Leaderboard Table"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TAB 1: TOP 10 STREAMS SHOWCASE */}
        {activeTab === 'top_10' && (
          <div className="space-y-6">
            {/* Section Subtitle */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-pink-400" />
                  <span>Leaderboard: Top 10 Sovereign Streams in {cityRegion.name}</span>
                </h2>
                <p className="text-xs text-slate-400 font-light mt-0.5">
                  Ranked by creator velocity, stanza volume, and regional depth score in the {cityRegion.name} node.
                </p>
              </div>
            </div>

            {/* TOP 3 PODIUM SPOTLIGHT (When cards view & no search) */}
            {viewStyle === 'cards' && !searchQuery.trim() && filteredStreams.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* #1 GOLD PODIUM CARD */}
                {filteredStreams[0] && (
                  <PodiumCard
                    stream={filteredStreams[0]}
                    rank={1}
                    isSubscribed={myJoinedTags.includes(filteredStreams[0].tag.toLowerCase())}
                    onOpenDetail={() => onOpenStreamDetail(filteredStreams[0])}
                    onToggleJoin={() => onToggleJoinGroup(filteredStreams[0].tag)}
                    onWarpFeed={() => {
                      onClose();
                      onWarpToStreamFeed(filteredStreams[0].tag);
                    }}
                  />
                )}

                {/* #2 SILVER PODIUM CARD */}
                {filteredStreams[1] && (
                  <PodiumCard
                    stream={filteredStreams[1]}
                    rank={2}
                    isSubscribed={myJoinedTags.includes(filteredStreams[1].tag.toLowerCase())}
                    onOpenDetail={() => onOpenStreamDetail(filteredStreams[1])}
                    onToggleJoin={() => onToggleJoinGroup(filteredStreams[1].tag)}
                    onWarpFeed={() => {
                      onClose();
                      onWarpToStreamFeed(filteredStreams[1].tag);
                    }}
                  />
                )}

                {/* #3 BRONZE PODIUM CARD */}
                {filteredStreams[2] && (
                  <PodiumCard
                    stream={filteredStreams[2]}
                    rank={3}
                    isSubscribed={myJoinedTags.includes(filteredStreams[2].tag.toLowerCase())}
                    onOpenDetail={() => onOpenStreamDetail(filteredStreams[2])}
                    onToggleJoin={() => onToggleJoinGroup(filteredStreams[2].tag)}
                    onWarpFeed={() => {
                      onClose();
                      onWarpToStreamFeed(filteredStreams[2].tag);
                    }}
                  />
                )}
              </div>
            )}

            {/* CARD VIEW: ALL TOP 10 ITEMS */}
            {viewStyle === 'cards' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
                  <span>Showing {filteredStreams.length} of 10 Streams</span>
                  <span>Ranked by Regional Velocity</span>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {filteredStreams.map((stream) => {
                    const isSubscribed = myJoinedTags.includes(stream.tag.toLowerCase());
                    return (
                      <StreamRankCard
                        key={stream.tag}
                        stream={stream}
                        isSubscribed={isSubscribed}
                        onOpenDetail={() => onOpenStreamDetail(stream)}
                        onToggleJoin={() => onToggleJoinGroup(stream.tag)}
                        onWarpFeed={() => {
                          onClose();
                          onWarpToStreamFeed(stream.tag);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* TABLE VIEW: COMPACT LEADERBOARD */}
            {viewStyle === 'table' && (
              <div className="bg-neutral-950 border border-pink-500/20 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-black/60 border-b border-pink-500/20 text-slate-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                        <th className="py-3.5 px-4">Stream / Hashtag</th>
                        <th className="py-3.5 px-4 hidden sm:table-cell">Category</th>
                        <th className="py-3.5 px-4 text-center">Depth</th>
                        <th className="py-3.5 px-4 text-center hidden md:table-cell">Posts</th>
                        <th className="py-3.5 px-4 text-center hidden md:table-cell">Members</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900">
                      {filteredStreams.map((stream) => {
                        const isSubscribed = myJoinedTags.includes(stream.tag.toLowerCase());
                        return (
                          <tr
                            key={stream.tag}
                            className="hover:bg-pink-950/20 transition-colors group cursor-pointer"
                            onClick={() => onOpenStreamDetail(stream)}
                          >
                            <td className="py-3 px-4 text-center">
                              <RankBadge rank={stream.rank} size="sm" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-pink-300 group-hover:text-pink-200">
                                  #{stream.tag}
                                </span>
                                {stream.isHot && (
                                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-400 font-bold border border-pink-500/30">
                                    Hot
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 line-clamp-1 font-sans">
                                {stream.description}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400 hidden sm:table-cell">
                              <span className="px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px]">
                                {stream.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-pink-400">
                              <span className="text-sm">{stream.activityScore}</span>
                              <span className="text-[10px] text-slate-500 ml-0.5">pts</span>
                            </td>
                            <td className="py-3 px-4 text-center text-slate-300 hidden md:table-cell">
                              {stream.postCount}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-300 hidden md:table-cell">
                              {stream.memberIds?.length || 0}
                            </td>
                            <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onToggleJoinGroup(stream.tag)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                                    isSubscribed
                                      ? 'bg-pink-950 border-pink-500/50 text-pink-300 hover:border-pink-400'
                                      : 'bg-neutral-900 border-neutral-800 text-slate-300 hover:text-white hover:border-pink-500/40'
                                  }`}
                                >
                                  {isSubscribed ? 'Joined' : '+ Join'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onWarpToStreamFeed(stream.tag);
                                  }}
                                  className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-slate-400 hover:text-pink-300 transition-colors cursor-pointer"
                                  title="Warp to main feed"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CITY POSTS & STANZAS */}
        {activeTab === 'city_posts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-pink-400" />
                  <span>Stanzas & Works from {cityRegion.name}</span>
                </h2>
                <p className="text-xs text-slate-400 font-light mt-0.5">
                  Creative writing, PDF chapbooks, and encrypted reflections anchored in the {cityRegion.name} node.
                </p>
              </div>

              <span className="text-xs font-mono text-pink-300 bg-pink-950/60 border border-pink-500/30 px-3 py-1 rounded-full">
                {cityPosts.length} posts
              </span>
            </div>

            {cityPosts.length > 0 ? (
              <div className="space-y-4">
                {cityPosts.map((post) => {
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
                    allPosts
                  );

                  return (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      customGroups={allGroups}
                      onLike={onLikePost || (() => {})}
                      onDislike={onDislikePost || (() => {})}
                      onAddComment={onAddComment || (() => {})}
                      onHashtagClick={(tag) => {
                        onClose();
                        onWarpToStreamFeed(tag);
                      }}
                      onOpenHashtagGroup={(tag) => {
                        onClose();
                        onWarpToStreamFeed(tag);
                      }}
                      onOpenPdf={onOpenPdf}
                      onShareToChat={onShareToChat}
                      onSharePost={onSharePost}
                      onToggleBookmark={onToggleBookmarkPost}
                      isBookmarked={(currentUser.savedPostIds || []).includes(post.id)}
                      authorCompatibilityPercent={authorComp.matchPercentage}
                      onInspectCompatibility={onInspectCompatibility}
                      onCityClick={onCityClick}
                      onOpenReadingLink={onOpenReadingLink}
                      onClaimReadingPoints={onClaimReadingPoints}
                      onVotePoll={onVotePoll}
                      onMoodClick={onMoodClick}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="bg-neutral-950 border border-pink-500/20 rounded-3xl p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-950/80 border border-pink-500/40 flex items-center justify-center mx-auto text-pink-400">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">
                    No posts directly recorded in {cityRegion.name} yet
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Be the first creator to anchor a stanza, document chapbook, or encrypted note in the {cityRegion.name} regional node.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-lg transition-all cursor-pointer"
                >
                  Return to Feed & Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// PODIUM CARD COMPONENT (#1, #2, #3 Highlights)
interface PodiumCardProps {
  stream: TopStreamItem;
  rank: 1 | 2 | 3;
  isSubscribed: boolean;
  onOpenDetail: () => void;
  onToggleJoin: () => void;
  onWarpFeed: () => void;
}

const PodiumCard: React.FC<PodiumCardProps> = ({
  stream,
  rank,
  isSubscribed,
  onOpenDetail,
  onToggleJoin,
  onWarpFeed,
}) => {
  const rankStyles = {
    1: {
      border: 'border-amber-400/60 hover:border-amber-300',
      bg: 'bg-gradient-to-b from-amber-950/30 via-neutral-950 to-black',
      glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]',
      badgeBg: 'bg-amber-500 text-black',
      tagColor: 'text-amber-300',
      rankLabel: '1st Ranked Stream',
    },
    2: {
      border: 'border-cyan-400/50 hover:border-cyan-300',
      bg: 'bg-gradient-to-b from-cyan-950/25 via-neutral-950 to-black',
      glow: 'shadow-[0_0_20px_rgba(34,211,238,0.12)]',
      badgeBg: 'bg-cyan-400 text-black',
      tagColor: 'text-cyan-300',
      rankLabel: '2nd Ranked Stream',
    },
    3: {
      border: 'border-pink-400/50 hover:border-pink-300',
      bg: 'bg-gradient-to-b from-pink-950/25 via-neutral-950 to-black',
      glow: 'shadow-[0_0_20px_rgba(244,114,182,0.12)]',
      badgeBg: 'bg-pink-400 text-black',
      tagColor: 'text-pink-300',
      rankLabel: '3rd Ranked Stream',
    },
  }[rank];

  return (
    <div
      onClick={onOpenDetail}
      className={`relative rounded-3xl p-5 border ${rankStyles.border} ${rankStyles.bg} ${rankStyles.glow} flex flex-col justify-between gap-4 transition-all duration-300 hover:scale-[1.01] cursor-pointer group`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs font-mono ${rankStyles.badgeBg} shadow-md`}
            >
              #{rank}
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              {rankStyles.rankLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-pink-400 font-bold">{stream.activityScore}</span>
            <span className="text-slate-500 text-[10px]">pts</span>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-1.5">
            <span className={rankStyles.tagColor}>#{stream.tag}</span>
            <span className="text-xs text-slate-400 font-normal">Stream</span>
          </h3>
          <p className="text-xs text-slate-300 font-light line-clamp-2 leading-relaxed">
            {stream.description}
          </p>
        </div>

        {stream.sampleExcerpt && (
          <div className="bg-black/50 border border-neutral-800 p-2.5 rounded-xl text-[11px] font-mono text-slate-300 italic line-clamp-2">
            &ldquo;{stream.sampleExcerpt}&rdquo;
          </div>
        )}
      </div>

      <div className="space-y-3 pt-2 border-t border-neutral-800">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-pink-400" />
            <span>{stream.memberIds?.length || 0} members</span>
          </span>
          <span className="text-green-400">{stream.growthRate}</span>
        </div>

        <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onToggleJoin}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isSubscribed
                ? 'bg-pink-950 border-pink-500/60 text-pink-300 hover:border-pink-400'
                : 'bg-neutral-900 border-neutral-700 text-slate-200 hover:text-white hover:border-pink-500/50'
            }`}
          >
            {isSubscribed ? 'Joined' : '+ Join'}
          </button>

          <button
            type="button"
            onClick={onWarpFeed}
            className="py-1.5 px-3 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
          >
            <span>Warp</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// STREAM RANK CARD COMPONENT (Detailed card for all items)
interface StreamRankCardProps {
  stream: TopStreamItem;
  isSubscribed: boolean;
  onOpenDetail: () => void;
  onToggleJoin: () => void;
  onWarpFeed: () => void;
}

const StreamRankCard: React.FC<StreamRankCardProps> = ({
  stream,
  isSubscribed,
  onOpenDetail,
  onToggleJoin,
  onWarpFeed,
}) => {
  return (
    <div
      onClick={onOpenDetail}
      className="bg-neutral-950 hover:bg-neutral-900/90 border border-pink-500/20 hover:border-pink-500/40 rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer group"
    >
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        {/* Rank Number Badge */}
        <RankBadge rank={stream.rank} size="md" />

        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-white group-hover:text-pink-200 transition-colors flex items-center gap-1.5">
              <span className="text-pink-400">#{stream.tag}</span>
              <span className="text-xs text-slate-400 font-light hidden sm:inline">({stream.city}) Stream</span>
            </h3>

            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-slate-400">
              {stream.category}
            </span>

            {stream.isHot && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
                <Flame className="w-2.5 h-2.5 text-pink-400" /> Hot
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 font-light line-clamp-2 sm:line-clamp-1 leading-relaxed">
            {stream.description}
          </p>

          {stream.sampleExcerpt && (
            <p className="text-[11px] text-pink-200/80 font-mono italic line-clamp-1">
              &ldquo;{stream.sampleExcerpt}&rdquo;
            </p>
          )}

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400 pt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-pink-400" />
              <span>{stream.memberIds?.length || 0} creators</span>
            </span>
            <span>•</span>
            <span>{stream.postCount} stanzas</span>
            <span>•</span>
            <span className="text-pink-400 font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{stream.activityScore} depth</span>
            </span>
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onToggleJoin}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            isSubscribed
              ? 'bg-pink-950 border-pink-500/60 text-pink-300 hover:border-pink-400'
              : 'bg-neutral-900 border-neutral-800 text-slate-300 hover:text-white hover:border-pink-500/40'
          }`}
        >
          {isSubscribed ? 'Joined' : '+ Join Stream'}
        </button>

        <button
          type="button"
          onClick={onOpenDetail}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          Explore
        </button>

        <button
          type="button"
          onClick={onWarpFeed}
          className="p-1.5 rounded-xl text-xs bg-pink-600 hover:bg-pink-500 text-white transition-all cursor-pointer shadow-sm"
          title="Warp feed to this stream"
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// RANK BADGE HELPER
const RankBadge: React.FC<{ rank: number; size?: 'sm' | 'md' }> = ({ rank, size = 'md' }) => {
  if (rank === 1) {
    return (
      <div
        className={`${
          size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
        } rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-black font-extrabold flex items-center justify-center font-mono shadow-[0_0_10px_rgba(251,191,36,0.5)] shrink-0`}
      >
        #1
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div
        className={`${
          size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
        } rounded-xl bg-gradient-to-br from-cyan-300 to-cyan-500 text-black font-extrabold flex items-center justify-center font-mono shadow-[0_0_10px_rgba(34,211,238,0.4)] shrink-0`}
      >
        #2
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div
        className={`${
          size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
        } rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 text-white font-extrabold flex items-center justify-center font-mono shadow-[0_0_10px_rgba(244,114,182,0.4)] shrink-0`}
      >
        #3
      </div>
    );
  }

  return (
    <div
      className={`${
        size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'
      } rounded-xl bg-neutral-900 border border-neutral-800 text-slate-400 font-bold flex items-center justify-center font-mono shrink-0`}
    >
      #{rank}
    </div>
  );
};
