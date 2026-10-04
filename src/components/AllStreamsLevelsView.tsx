import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpDown,
  Award,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  ExternalLink,
  Flame,
  Hash,
  Layers,
  MapPin,
  Plus,
  Radio,
  Search,
  Sliders,
  Sparkles,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { HashtagGroup, HashtagTrend, Post, User } from '../types';
import { getGroupReadingRank } from '../utils/readingEstimator';
import { normalizeTag } from '../utils/hashtagGroups';

interface AllStreamsLevelsViewProps {
  currentUser: User;
  allStreams: HashtagGroup[];
  allPosts?: Post[];
  allTrends?: HashtagTrend[];
  allUsers?: User[];
  onBackToProfile: () => void;
  onOpenGroupDetail?: (group: HashtagGroup) => void;
  onHashtagClick?: (tag: string) => void;
  onToggleJoinGroup?: (tag: string) => void;
  onCityClick?: (cityName: string) => void;
}

export const AllStreamsLevelsView: React.FC<AllStreamsLevelsViewProps> = ({
  currentUser,
  allStreams,
  allPosts = [],
  allTrends = [],
  allUsers = [],
  onBackToProfile,
  onOpenGroupDetail,
  onHashtagClick,
  onToggleJoinGroup,
  onCityClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<
    'all' | 'leveled' | 'lvl100' | 'lvl75_99' | 'lvl50_74' | 'lvl25_49' | 'lvl10_24' | 'lvl2_9' | 'lvl1' | 'lvl2' | 'lvl3' | 'lvl4_5'
  >('all');
  const [joinedFilter, setJoinedFilter] = useState<'all' | 'joined' | 'unjoined'>('all');
  const [sortBy, setSortBy] = useState<'level_desc' | 'name_asc' | 'points_desc' | 'members_desc'>('level_desc');
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');

  // Helper to get user's points in a specific stream
  const getStreamPoints = (tag: string): number => {
    if (!currentUser.groupPoints) return 0;
    const clean = normalizeTag(tag).toLowerCase();
    for (const [key, val] of Object.entries(currentUser.groupPoints)) {
      if (normalizeTag(key).toLowerCase() === clean) {
        return typeof val === 'number' ? val : Number(val) || 0;
      }
    }
    return 0;
  };

  // Helper to check if user has joined this stream
  const isStreamJoined = (tag: string): boolean => {
    const clean = normalizeTag(tag).toLowerCase();
    return (currentUser.joinedGroupTags || []).some(
      (t) => normalizeTag(t).toLowerCase() === clean
    );
  };

  // Helper to count posts in a stream
  const getStreamPostCount = (tag: string): number => {
    const clean = normalizeTag(tag).toLowerCase();
    return allPosts.filter((p) =>
      (p.hashtags || []).some((h) => normalizeTag(h).toLowerCase() === clean)
    ).length;
  };

  // Extract all categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    allStreams.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set).sort();
  }, [allStreams]);

  // Enriched stream items with calculated levels and metrics
  const enrichedStreams = useMemo(() => {
    return allStreams.map((stream) => {
      const points = getStreamPoints(stream.tag);
      const rankInfo = getGroupReadingRank(points);
      const joined = isStreamJoined(stream.tag);
      const postCount = getStreamPostCount(stream.tag);
      const memberCount = stream.memberIds?.length || 0;

      return {
        ...stream,
        points,
        rankInfo,
        joined,
        postCount,
        memberCount,
      };
    });
  }, [allStreams, currentUser.groupPoints, currentUser.joinedGroupTags, allPosts]);

  // Overall User Stats for Streams
  const stats = useMemo(() => {
    const totalStreams = enrichedStreams.length;
    const joinedStreams = enrichedStreams.filter((s) => s.joined).length;
    const leveledStreams = enrichedStreams.filter((s) => s.rankInfo.level > 1).length;
    const totalPoints = enrichedStreams.reduce((sum, s) => sum + s.points, 0);
    const highestLevel = enrichedStreams.reduce((max, s) => Math.max(max, s.rankInfo.level), 1);
    const topStream = [...enrichedStreams].sort((a, b) => b.points - a.points)[0];

    return {
      totalStreams,
      joinedStreams,
      leveledStreams,
      totalPoints,
      highestLevel,
      topStreamTag: topStream && topStream.points > 0 ? topStream.tag : null,
      topStreamPoints: topStream ? topStream.points : 0,
    };
  }, [enrichedStreams]);

  // Filtered and Sorted streams
  const filteredStreams = useMemo(() => {
    return enrichedStreams
      .filter((stream) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const cleanQ = q.replace(/^#+/, '');
          const matchesName = stream.name.toLowerCase().includes(q);
          const matchesTag = stream.tag.toLowerCase().includes(cleanQ);
          const matchesCategory = stream.category.toLowerCase().includes(q);
          const matchesCity = (stream.city || '').toLowerCase().includes(q);
          const matchesRank = stream.rankInfo.rankTitle.toLowerCase().includes(q);
          const matchesLevel = `level ${stream.rankInfo.level}`.includes(q) || `lvl ${stream.rankInfo.level}`.includes(q);
          if (!matchesName && !matchesTag && !matchesCategory && !matchesCity && !matchesRank && !matchesLevel) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'all' && stream.category !== selectedCategory) {
          return false;
        }

        // Level filter
        if (levelFilter === 'leveled' && stream.rankInfo.level <= 1) return false;
        if (levelFilter === 'lvl100' && stream.rankInfo.level < 100) return false;
        if (levelFilter === 'lvl75_99' && (stream.rankInfo.level < 75 || stream.rankInfo.level >= 100)) return false;
        if (levelFilter === 'lvl50_74' && (stream.rankInfo.level < 50 || stream.rankInfo.level >= 75)) return false;
        if (levelFilter === 'lvl25_49' && (stream.rankInfo.level < 25 || stream.rankInfo.level >= 50)) return false;
        if (levelFilter === 'lvl10_24' && (stream.rankInfo.level < 10 || stream.rankInfo.level >= 25)) return false;
        if (levelFilter === 'lvl2_9' && (stream.rankInfo.level < 2 || stream.rankInfo.level >= 10)) return false;
        if (levelFilter === 'lvl1' && stream.rankInfo.level !== 1) return false;
        // Legacy filter options
        if (levelFilter === 'lvl2' && stream.rankInfo.level !== 2) return false;
        if (levelFilter === 'lvl3' && stream.rankInfo.level !== 3) return false;
        if (levelFilter === 'lvl4_5' && stream.rankInfo.level < 4) return false;

        // Joined filter
        if (joinedFilter === 'joined' && !stream.joined) return false;
        if (joinedFilter === 'unjoined' && stream.joined) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'level_desc') {
          // Highest level first, then highest points, then name
          if (b.rankInfo.level !== a.rankInfo.level) {
            return b.rankInfo.level - a.rankInfo.level;
          }
          if (b.points !== a.points) {
            return b.points - a.points;
          }
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'points_desc') {
          if (b.points !== a.points) return b.points - a.points;
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'members_desc') {
          return b.memberCount - a.memberCount;
        }
        if (sortBy === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [enrichedStreams, searchQuery, selectedCategory, levelFilter, joinedFilter, sortBy]);

  // Color scheme based on Level (1 to 100)
  const getLevelBadgeStyles = (level: number) => {
    if (level === 100) {
      return {
        pill: 'bg-amber-950/90 text-amber-200 border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.6)] ring-1 ring-amber-400/50 font-black',
        glow: 'from-amber-500/30 to-yellow-400/20',
        border: 'border-amber-400/80',
      };
    }
    if (level >= 80) {
      return {
        pill: 'bg-amber-950/80 text-amber-300 border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
        glow: 'from-amber-500/20 to-yellow-500/10',
        border: 'border-amber-500/40',
      };
    }
    if (level >= 60) {
      return {
        pill: 'bg-rose-950/80 text-rose-300 border-rose-400/80 shadow-[0_0_12px_rgba(244,63,94,0.4)]',
        glow: 'from-rose-500/20 to-pink-500/10',
        border: 'border-rose-500/40',
      };
    }
    if (level >= 40) {
      return {
        pill: 'bg-purple-950/80 text-fuchsia-300 border-fuchsia-400/80 shadow-[0_0_12px_rgba(217,70,239,0.4)]',
        glow: 'from-fuchsia-500/20 to-pink-500/10',
        border: 'border-fuchsia-500/40',
      };
    }
    if (level >= 25) {
      return {
        pill: 'bg-cyan-950/80 text-cyan-300 border-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.4)]',
        glow: 'from-cyan-500/20 to-blue-500/10',
        border: 'border-cyan-500/40',
      };
    }
    if (level >= 10) {
      return {
        pill: 'bg-emerald-950/80 text-emerald-300 border-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.35)]',
        glow: 'from-emerald-500/20 to-teal-500/10',
        border: 'border-emerald-500/40',
      };
    }
    if (level >= 5) {
      return {
        pill: 'bg-sky-950/80 text-sky-300 border-sky-400/80 shadow-[0_0_10px_rgba(56,189,248,0.35)]',
        glow: 'from-sky-500/20 to-teal-500/10',
        border: 'border-sky-500/40',
      };
    }
    if (level >= 2) {
      return {
        pill: 'bg-blue-950/80 text-blue-300 border-blue-400/70 shadow-[0_0_8px_rgba(59,130,246,0.3)]',
        glow: 'from-blue-500/20 to-indigo-500/10',
        border: 'border-blue-500/40',
      };
    }
    return {
      pill: 'bg-neutral-900/90 text-slate-300 border-neutral-700/80',
      glow: 'from-neutral-900 to-neutral-950',
      border: 'border-neutral-800',
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pink-500/20 pb-4">
        <button
          type="button"
          onClick={onBackToProfile}
          className="inline-flex items-center gap-2 text-xs font-semibold text-pink-400 hover:text-pink-300 bg-neutral-900/90 hover:bg-neutral-800 border border-pink-500/30 hover:border-pink-500/60 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Profile Timeline</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>Profile</span>
          <span>/</span>
          <span className="text-pink-300 font-bold">All Streams & Levels Directory</span>
        </div>
      </div>

      {/* Main Page Header Hero */}
      <div className="relative group">
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-pink-500/20 via-fuchsia-500/20 to-cyan-500/20 blur-md opacity-70 pointer-events-none" />
        <div className="relative bg-black/85 backdrop-blur-md border border-pink-500/40 p-5 sm:p-6 rounded-2xl shadow-[0_0_25px_rgba(244,114,182,0.15)] space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/20 via-fuchsia-500/20 to-cyan-500/20 border border-pink-400/40 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                <Compass className="w-6 h-6 text-pink-400 animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-100 font-space-mono tracking-tight">
                    All Streams & Levels Directory
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-pink-950/80 border border-pink-500/40 text-pink-300 font-mono text-xs font-bold shadow-[0_0_8px_rgba(236,72,153,0.3)]">
                    {allStreams.length} Platform Streams
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Explore all sovereign hashtag channels across the network with your reader level listed next to every stream name. Read stanzas and companion PDFs to elevate your rank up to Level 100.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <div className="flex items-center bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Card View"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('compact')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'compact'
                      ? 'bg-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Compact List View"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Compact</span>
                </button>
              </div>
            </div>
          </div>

          {/* User Reader Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-pink-500/30">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                <Radio className="w-3.5 h-3.5 text-pink-400" />
                <span>Total Streams</span>
              </div>
              <div className="text-base sm:text-lg font-bold font-mono text-pink-300">
                {stats.totalStreams}{' '}
                <span className="text-xs font-normal text-slate-400">
                  ({stats.joinedStreams} joined)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900/80 border border-pink-500/30">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                <span>Leveled Streams</span>
              </div>
              <div className="text-base sm:text-lg font-bold font-mono text-cyan-300">
                {stats.leveledStreams}{' '}
                <span className="text-xs font-normal text-slate-400">
                  Level 2+
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900/80 border border-pink-500/30">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Highest Stream Level</span>
              </div>
              <div className="text-base sm:text-lg font-bold font-mono text-amber-300 flex items-center gap-1.5">
                <span>Level {stats.highestLevel}</span>
                {stats.topStreamTag && (
                  <span className="text-xs text-amber-400/80 font-normal">
                    (#{stats.topStreamTag})
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900/80 border border-pink-500/30">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                <Trophy className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Total Stream Points</span>
              </div>
              <div className="text-base sm:text-lg font-bold font-mono text-fuchsia-300">
                {stats.totalPoints}{' '}
                <span className="text-xs font-normal text-fuchsia-400/80">pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls Toolbar */}
      <div className="bg-black/80 backdrop-blur-md border border-neutral-800 p-4 rounded-2xl space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search streams by name, tag (e.g. #Poetry), city, level, or rank title..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-neutral-900/90 border border-neutral-700/80 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort & Quick Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-neutral-900/90 px-3 py-1.5 rounded-xl border border-neutral-800 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              <span className="text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-pink-200 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="level_desc" className="bg-neutral-950 text-slate-200">
                  ⭐ Your Level (High to Low)
                </option>
                <option value="points_desc" className="bg-neutral-950 text-slate-200">
                  🏆 Points Earned (High to Low)
                </option>
                <option value="name_asc" className="bg-neutral-950 text-slate-200">
                  🔤 Stream Name (A-Z)
                </option>
                <option value="members_desc" className="bg-neutral-950 text-slate-200">
                  👥 Most Members
                </option>
              </select>
            </div>

            {/* Level Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-neutral-900/90 px-3 py-1.5 rounded-xl border border-neutral-800 text-xs">
              <Award className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-slate-400">Level:</span>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as any)}
                className="bg-transparent text-cyan-200 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-neutral-950 text-slate-200">
                  All Levels (1 to 100)
                </option>
                <option value="leveled" className="bg-neutral-950 text-slate-200">
                  Level 2+
                </option>
                <option value="lvl100" className="bg-neutral-950 text-slate-200">
                  Level 100
                </option>
                <option value="lvl75_99" className="bg-neutral-950 text-slate-200">
                  Levels 75–99
                </option>
                <option value="lvl50_74" className="bg-neutral-950 text-slate-200">
                  Levels 50–74
                </option>
                <option value="lvl25_49" className="bg-neutral-950 text-slate-200">
                  Levels 25–49
                </option>
                <option value="lvl10_24" className="bg-neutral-950 text-slate-200">
                  Levels 10–24
                </option>
                <option value="lvl2_9" className="bg-neutral-950 text-slate-200">
                  Levels 2–9
                </option>
                <option value="lvl1" className="bg-neutral-950 text-slate-200">
                  Level 1
                </option>
              </select>
            </div>

            {/* Joined Filter Toggle */}
            <div className="flex items-center bg-neutral-900/90 p-1 rounded-xl border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setJoinedFilter('all')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  joinedFilter === 'all'
                    ? 'bg-pink-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setJoinedFilter('joined')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  joinedFilter === 'joined'
                    ? 'bg-pink-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Joined
              </button>
              <button
                type="button"
                onClick={() => setJoinedFilter('unjoined')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  joinedFilter === 'unjoined'
                    ? 'bg-pink-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Unjoined
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-neutral-800/80 text-xs">
          <span className="text-[11px] text-slate-400 font-medium mr-1">Categories:</span>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/50 shadow-[0_0_8px_rgba(236,72,153,0.3)]'
                : 'bg-neutral-900 border border-neutral-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Categories ({allStreams.length})
          </button>
          {categories.map((cat) => {
            const count = allStreams.filter((s) => s.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/50 shadow-[0_0_8px_rgba(236,72,153,0.3)]'
                    : 'bg-neutral-900 border border-neutral-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
        <span>
          Showing <strong className="text-pink-300">{filteredStreams.length}</strong> of{' '}
          {allStreams.length} streams
        </span>
        {(searchQuery || selectedCategory !== 'all' || levelFilter !== 'all' || joinedFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setLevelFilter('all');
              setJoinedFilter('all');
            }}
            className="text-pink-400 hover:text-pink-300 underline cursor-pointer"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Streams Listing */}
      {filteredStreams.length > 0 ? (
        viewMode === 'cards' ? (
          /* Cards Grid Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStreams.map((stream) => {
              const styles = getLevelBadgeStyles(stream.rankInfo.level);

              return (
                <div
                  key={stream.tag}
                  className={`relative group rounded-2xl bg-black/80 backdrop-blur-md border p-5 space-y-3.5 transition-all hover:border-pink-500/60 shadow-[0_4px_20px_rgba(0,0,0,0.4)] ${styles.border}`}
                >
                  {/* Top Bar: STREAM NAME + LEVEL NEXT TO STREAM NAME */}
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Stream Name */}
                        <button
                          type="button"
                          onClick={() => onOpenGroupDetail && onOpenGroupDetail(stream)}
                          className="font-bold text-base text-slate-100 font-space-mono hover:text-pink-300 transition-colors text-left group-hover:text-pink-300 cursor-pointer"
                          title="Open Stream Hub"
                        >
                          {stream.name}
                        </button>

                        {/* LEVEL LISTED NEXT TO THE STREAM NAME */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl font-mono text-xs font-bold border transition-all ${styles.pill}`}
                          title={`Level ${stream.rankInfo.level} • ${stream.points} reading points`}
                        >
                          <span>{stream.rankInfo.badge}</span>
                          <span>Level {stream.rankInfo.level}</span>
                        </span>

                        {/* Points Badge */}
                        {stream.points > 0 ? (
                          <span className="text-[10px] font-mono font-bold text-pink-300 bg-pink-950/80 border border-pink-500/40 px-2 py-0.5 rounded-md shadow-[0_0_8px_rgba(236,72,153,0.25)]">
                            {stream.points} pts
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded-md">
                            0 pts
                          </span>
                        )}
                      </div>

                      {/* Joined / Subscribe Button */}
                      {onToggleJoinGroup && (
                        <button
                          type="button"
                          onClick={() => onToggleJoinGroup(stream.tag)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            stream.joined
                              ? 'bg-pink-950/70 border border-pink-500/40 text-pink-300 hover:bg-pink-900'
                              : 'bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.35)]'
                          }`}
                        >
                          {stream.joined ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-pink-400" />
                              <span>Joined</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Join Stream</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Progress to Next Level Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>
                          Level {stream.rankInfo.level} Progress
                        </span>
                        <span>
                          {stream.rankInfo.level >= 100 || stream.rankInfo.isMaxRank
                            ? 'Level 100 (Max Level)'
                            : `${stream.points} / ${stream.rankInfo.nextThreshold} pts (${stream.rankInfo.progress}%)`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            stream.rankInfo.level >= 90
                              ? 'bg-gradient-to-r from-amber-400 via-pink-400 to-cyan-300 shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                              : stream.rankInfo.level >= 75
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-300 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                              : stream.rankInfo.level >= 50
                              ? 'bg-gradient-to-r from-rose-500 to-orange-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                              : stream.rankInfo.level >= 25
                              ? 'bg-gradient-to-r from-purple-500 to-pink-400 shadow-[0_0_8px_rgba(217,70,239,0.6)]'
                              : stream.rankInfo.level >= 10
                              ? 'bg-gradient-to-r from-cyan-500 to-teal-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                              : stream.rankInfo.level >= 2
                              ? 'bg-gradient-to-r from-sky-500 to-blue-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]'
                              : 'bg-slate-600'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(stream.points > 0 ? 8 : 0, stream.rankInfo.progress))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description & Vibe */}
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {stream.description}
                  </p>
                  {stream.vibeStatement && (
                    <p className="text-[11px] text-pink-300/90 italic font-mono line-clamp-1 border-l-2 border-pink-500/50 pl-2">
                      "{stream.vibeStatement}"
                    </p>
                  )}

                  {/* Stream Meta: City, Category, Members */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-800/80 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-slate-400">
                      {stream.category}
                    </span>

                    {stream.city && (
                      <button
                        type="button"
                        onClick={() => onCityClick && onCityClick(stream.city)}
                        className="inline-flex items-center gap-1 text-pink-400 hover:text-pink-300 transition-colors cursor-pointer"
                        title={`Explore ${stream.city} city stream`}
                      >
                        <MapPin className="w-3 h-3" />
                        <span>{stream.city}</span>
                      </button>
                    )}

                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>{stream.memberCount} members</span>
                    </span>

                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      <span>{stream.postCount} posts</span>
                    </span>

                    {stream.isHot && (
                      <span className="inline-flex items-center gap-0.5 text-amber-400 font-mono font-bold text-[10px]">
                        <Flame className="w-3 h-3" />
                        <span>HOT</span>
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => onHashtagClick && onHashtagClick(stream.tag)}
                      className="text-xs font-semibold text-slate-400 hover:text-pink-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Hash className="w-3.5 h-3.5 text-pink-400" />
                      <span>View Feed Stanzas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenGroupDetail && onOpenGroupDetail(stream)}
                      className="text-xs font-semibold text-pink-400 hover:text-pink-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Open Stream Hub</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Compact Table / Row Layout */
          <div className="rounded-2xl bg-black/80 backdrop-blur-md border border-neutral-800 overflow-hidden divide-y divide-neutral-800">
            {filteredStreams.map((stream) => {
              const styles = getLevelBadgeStyles(stream.rankInfo.level);

              return (
                <div
                  key={stream.tag}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-900/50 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                    {/* Stream Name */}
                    <button
                      type="button"
                      onClick={() => onOpenGroupDetail && onOpenGroupDetail(stream)}
                      className="font-bold text-sm text-slate-100 font-space-mono hover:text-pink-300 transition-colors text-left cursor-pointer"
                    >
                      {stream.name}
                    </button>

                    {/* LEVEL LISTED NEXT TO THE STREAM NAME */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg font-mono text-xs font-bold border transition-all ${styles.pill}`}
                      title={`Level ${stream.rankInfo.level} • ${stream.points} reading points`}
                    >
                      <span>{stream.rankInfo.badge}</span>
                      <span>Level {stream.rankInfo.level}</span>
                    </span>

                    {/* Points Indicator */}
                    <span className="text-[11px] font-mono font-semibold text-pink-300 bg-pink-950/70 border border-pink-500/30 px-2 py-0.5 rounded-md">
                      {stream.points} pts
                    </span>

                    {/* Category & City */}
                    <span className="text-[11px] text-slate-400 hidden lg:inline">
                      • {stream.category} {stream.city ? `(${stream.city})` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => onHashtagClick && onHashtagClick(stream.tag)}
                      className="text-xs text-slate-400 hover:text-pink-300 px-2.5 py-1 rounded-lg border border-neutral-800 hover:border-pink-500/40 transition-colors cursor-pointer"
                      title="Filter feed by stream tag"
                    >
                      Feed
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenGroupDetail && onOpenGroupDetail(stream)}
                      className="text-xs text-pink-400 hover:text-pink-300 px-2.5 py-1 rounded-lg border border-pink-500/30 hover:border-pink-500/60 transition-colors cursor-pointer flex items-center gap-1"
                      title="Open full Stream Hub modal"
                    >
                      <span>Hub</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>

                    {onToggleJoinGroup && (
                      <button
                        type="button"
                        onClick={() => onToggleJoinGroup(stream.tag)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                          stream.joined
                            ? 'bg-pink-950/70 border border-pink-500/40 text-pink-300'
                            : 'bg-pink-600 hover:bg-pink-500 text-white'
                        }`}
                      >
                        {stream.joined ? 'Joined' : 'Join'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="rounded-2xl bg-black/80 backdrop-blur-md border border-neutral-800 p-12 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
            <Radio className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-100 font-space-mono">
              No Streams Match Your Filters
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              We couldn't find any stream matching "{searchQuery}" with the current filters.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setLevelFilter('all');
              setJoinedFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold font-space-mono shadow-[0_0_12px_rgba(236,72,153,0.4)] transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
