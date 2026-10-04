import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Trophy,
  Sparkles,
  Lock,
  Unlock,
  Search,
  Filter,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Feather,
  Zap,
  Star,
  ExternalLink,
  ChevronRight,
  X,
} from 'lucide-react';
import { User, MilestoneBadge, Post } from '../types';
import { calculateUserBadges } from '../utils/badgeMilestones';
import { BadgeVisualIcon } from './BadgeVisualIcon';
import { getUserCumulativeReadingPoints } from '../utils/readingEstimator';
import { triggerReadingRankBadgeVibration } from '../utils/haptics';

interface BadgesVaultSectionProps {
  currentUser: User;
  allUsers?: User[];
  allPosts?: Post[];
  onUpdateUser?: (updated: User) => void;
  onOpenStreamModal?: (tag?: string) => void;
}

export const BadgesVaultSection: React.FC<BadgesVaultSectionProps> = ({
  currentUser,
  allUsers = [],
  allPosts = [],
  onUpdateUser,
  onOpenStreamModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'unlocked' | 'locked' | 'milestones' | 'streams' | 'poetry' | 'vault'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBadge, setSelectedBadge] = useState<MilestoneBadge | null>(null);
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);

  // Compute live badges
  const badges = useMemo(() => {
    return calculateUserBadges(currentUser, allUsers, allPosts);
  }, [currentUser, allUsers, allPosts]);

  const cumulativePoints = getUserCumulativeReadingPoints(currentUser);
  const unlockedBadges = badges.filter((b) => b.isUnlocked);
  const lockedBadges = badges.filter((b) => !b.isUnlocked);
  const completionPercentage = Math.round((unlockedBadges.length / badges.length) * 100);

  // Trigger celebratory haptic feedback when new badges are unlocked
  const prevUnlockedCountRef = useRef(unlockedBadges.length);
  useEffect(() => {
    if (unlockedBadges.length > prevUnlockedCountRef.current) {
      triggerReadingRankBadgeVibration();
    }
    prevUnlockedCountRef.current = unlockedBadges.length;
  }, [unlockedBadges.length]);

  // Filtered badges
  const filteredBadges = useMemo(() => {
    return badges.filter((badge) => {
      // Category / Status Filter
      if (selectedCategory === 'unlocked' && !badge.isUnlocked) return false;
      if (selectedCategory === 'locked' && badge.isUnlocked) return false;
      if (
        selectedCategory !== 'all' &&
        selectedCategory !== 'unlocked' &&
        selectedCategory !== 'locked' &&
        badge.category !== selectedCategory
      ) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = badge.title.toLowerCase().includes(query);
        const matchesDesc = badge.description.toLowerCase().includes(query);
        const matchesReq = badge.requirementText.toLowerCase().includes(query);
        const matchesRarity = badge.rarity.toLowerCase().includes(query);
        return matchesTitle || matchesDesc || matchesReq || matchesRarity;
      }

      return true;
    });
  }, [badges, selectedCategory, searchQuery]);

  // Handle equipping a badge as the user's featured profile honorific
  const handleToggleEquipBadge = (badge: MilestoneBadge) => {
    if (!badge.isUnlocked || !onUpdateUser) return;

    const newFeatured = currentUser.featuredBadgeId === badge.id ? undefined : badge.id;
    const updated: User = {
      ...currentUser,
      featuredBadgeId: newFeatured,
    };

    onUpdateUser(updated);

    if (newFeatured) {
      setCelebrationMsg(`Equipped "${badge.title}" as your featured profile honorific!`);
    } else {
      setCelebrationMsg(`Unequipped badge.`);
    }

    setTimeout(() => {
      setCelebrationMsg(null);
    }, 4000);
  };

  // Test simulation helper to test hitting 1000 points or adding points dynamically
  const handleSimulatePoints = (additionalPts: number) => {
    if (!onUpdateUser) return;
    const newTotal = Math.max(0, (currentUser.totalReadingPoints || 0) + additionalPts);
    const newPoetry = ((currentUser.groupPoints?.Poetry || 0) + Math.round(additionalPts * 0.4));
    
    const updated: User = {
      ...currentUser,
      totalReadingPoints: newTotal,
      groupPoints: {
        ...(currentUser.groupPoints || {}),
        Poetry: newPoetry,
      },
    };

    onUpdateUser(updated);
    setCelebrationMsg(`Added +${additionalPts} reading points! Total is now ${newTotal} pts.`);
    setTimeout(() => setCelebrationMsg(null), 3500);
  };

  const handleJumpTo1000Pts = () => {
    if (!onUpdateUser) return;
    const updated: User = {
      ...currentUser,
      totalReadingPoints: 1050,
      groupPoints: {
        ...(currentUser.groupPoints || {}),
        Poetry: Math.max(currentUser.groupPoints?.Poetry || 0, 160),
      },
    };
    onUpdateUser(updated);
    setCelebrationMsg(`Milestone Reached! Jumped to 1,050 Reading Points to unlock the "1000 Total Reading Points" badge! 🎉`);
    setTimeout(() => setCelebrationMsg(null), 4500);
  };

  const handleResetPoints = () => {
    if (!onUpdateUser) return;
    const updated: User = {
      ...currentUser,
      totalReadingPoints: 580,
      groupPoints: {
        ...(currentUser.groupPoints || {}),
        Poetry: 140,
        Encrypted: 180,
      },
      featuredBadgeId: undefined,
    };
    onUpdateUser(updated);
    setCelebrationMsg(`Reset reading points to baseline (580 pts).`);
    setTimeout(() => setCelebrationMsg(null), 3000);
  };

  // Featured badge object if equipped
  const featuredBadge = badges.find((b) => b.id === currentUser.featuredBadgeId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Celebration Message */}
      {celebrationMsg && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/90 via-purple-950/90 to-cyan-950/90 border border-pink-400/50 text-xs text-pink-200 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(236,72,153,0.3)] animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span className="font-semibold">{celebrationMsg}</span>
          </div>
          <button
            onClick={() => setCelebrationMsg(null)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Hero Header Card */}
      <div className="relative group">
        <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-cyan-500/20 blur-lg opacity-70 pointer-events-none" />
        <div className="relative bg-black/80 backdrop-blur-xl border border-amber-500/40 rounded-3xl p-5 sm:p-7 space-y-5 shadow-[0_0_25px_rgba(245,158,11,0.18),0_10px_30px_rgba(0,0,0,0.7)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-amber-500/20 pb-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-pink-500/15 to-purple-500/20 border border-amber-400/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0">
                <Trophy className="w-7 h-7 text-amber-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-100 font-space-mono tracking-tight">
                    Reader Badges & Vault Milestones
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-400/50 text-amber-300 font-mono text-xs font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                    {unlockedBadges.length} / {badges.length} Unlocked
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Earn prestigious visual emblems by conquering reading thresholds, climbing hashtag stream leaderboards, and maintaining <span className="text-white font-semibold">encrypted profile</span> security.
                </p>
              </div>
            </div>

            {/* Quick Stats Column */}
            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
              <div className="bg-neutral-950/80 border border-amber-500/30 rounded-2xl p-3 text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Cumulative Score</span>
                <span className="text-lg font-bold text-amber-300 font-mono">
                  {cumulativePoints} <span className="text-xs font-normal text-slate-400">pts</span>
                </span>
              </div>
              <div className="bg-neutral-950/80 border border-pink-500/30 rounded-2xl p-3 text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Vault Completion</span>
                <span className="text-lg font-bold text-pink-300 font-mono">{completionPercentage}%</span>
              </div>
            </div>
          </div>

          {/* Key Highlight Banners (Top 10 in #Poetry & 1000 Points) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Spotlight 1: Top 10 Reader in #Poetry */}
            {(() => {
              const poetryBadge = badges.find((b) => b.id === 'badge_top10_poetry');
              if (!poetryBadge) return null;
              return (
                <div
                  onClick={() => setSelectedBadge(poetryBadge)}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                    poetryBadge.isUnlocked
                      ? 'bg-gradient-to-r from-amber-950/60 via-black/80 to-yellow-950/40 border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:border-amber-300 hover:scale-[1.01]'
                      : 'bg-neutral-950/70 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <BadgeVisualIcon badge={poetryBadge} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase font-bold text-amber-400 flex items-center gap-1">
                          <Feather className="w-3 h-3" /> Stream Leaderboard
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-900/60 text-amber-200 border border-amber-400/40">
                          {poetryBadge.isUnlocked ? '✓ UNLOCKED' : 'LOCKED'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate mt-0.5">{poetryBadge.title}</h4>
                      <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                        {poetryBadge.unlockedReason || poetryBadge.requirementText}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-amber-300/90 font-mono">
                        <span>Status: Rank #2 in #Poetry</span>
                        <span className="flex items-center gap-1 text-pink-300 hover:underline">
                          View details <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Spotlight 2: 1000 Total Reading Points */}
            {(() => {
              const pts1000Badge = badges.find((b) => b.id === 'badge_1000_pts');
              if (!pts1000Badge) return null;
              return (
                <div
                  onClick={() => setSelectedBadge(pts1000Badge)}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                    pts1000Badge.isUnlocked
                      ? 'bg-gradient-to-r from-pink-950/60 via-black/80 to-fuchsia-950/40 border-pink-400/60 shadow-[0_0_20px_rgba(236,72,153,0.25)] hover:border-pink-300 hover:scale-[1.01]'
                      : 'bg-neutral-950/70 border-pink-500/30 hover:border-pink-500/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <BadgeVisualIcon badge={pts1000Badge} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase font-bold text-pink-400 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Reading Milestone
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                            pts1000Badge.isUnlocked
                              ? 'bg-pink-900/60 text-pink-200 border border-pink-400/40'
                              : 'bg-neutral-900 text-slate-400 border border-neutral-700'
                          }`}
                        >
                          {pts1000Badge.isUnlocked ? '✓ UNLOCKED' : `${cumulativePoints} / 1000 pts`}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate mt-0.5">{pts1000Badge.title}</h4>
                      
                      {/* Live progress bar */}
                      <div className="mt-2 space-y-1">
                        <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-neutral-800">
                          <div
                            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-pink-500 to-purple-500 shadow-[0_0_8px_rgba(236,72,153,0.7)]"
                            style={{ width: `${pts1000Badge.progressPercent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>
                            {pts1000Badge.isUnlocked
                              ? 'Target achieved!'
                              : `${Math.max(0, 1000 - cumulativePoints)} pts needed`}
                          </span>
                          <span className="text-pink-300 font-bold">{pts1000Badge.progressPercent}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Quick Point Simulator / Milestone Tester Bar */}
          <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-amber-500/25 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-300">
                <span className="text-white font-semibold">Test Milestone Unlocks:</span> Test real-time unlocking of special visual icons by adding reading points:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleSimulatePoints(100)}
                className="px-2.5 py-1 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-400/40 text-amber-200 text-xs font-mono font-semibold transition-all hover:scale-[1.02] cursor-pointer shadow-sm"
              >
                +100 Points
              </button>
              <button
                type="button"
                onClick={handleJumpTo1000Pts}
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-mono font-bold transition-all hover:scale-[1.02] cursor-pointer shadow-[0_0_12px_rgba(236,72,153,0.4)] border border-pink-300/40"
              >
                ⚡ Jump to 1,000 Pts
              </button>
              {cumulativePoints !== 580 && (
                <button
                  type="button"
                  onClick={handleResetPoints}
                  className="px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
                >
                  Reset (580 pts)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Badge Spotlight (if user has equipped one) */}
      {featuredBadge && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-neutral-950 via-purple-950/30 to-neutral-950 border border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.15)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BadgeVisualIcon badge={featuredBadge} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-bold text-pink-400">Featured Profile Honorific</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-950 border border-pink-400/40 text-pink-300">Active</span>
              </div>
              <p className="text-sm font-bold text-white">{featuredBadge.title}</p>
              <p className="text-xs text-slate-400">{featuredBadge.description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggleEquipBadge(featuredBadge)}
            className="text-xs px-3 py-1.5 rounded-xl border border-pink-500/40 text-pink-300 hover:bg-pink-950/60 transition-colors shrink-0"
          >
            Unequip
          </button>
        </div>
      )}

      {/* Filter and Search Navigation Bar */}
      <div className="bg-black/75 backdrop-blur-md border border-pink-500/30 rounded-2xl p-4 space-y-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-pink-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search badges, milestones, or requirements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950/90 border border-pink-500/40 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-500 font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Counts */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono shrink-0">
            <span>Showing <strong className="text-white">{filteredBadges.length}</strong> of {badges.length}</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-pink-500/20">
          {[
            { id: 'all', label: 'All Badges', count: badges.length },
            { id: 'unlocked', label: `Unlocked (${unlockedBadges.length})`, count: unlockedBadges.length },
            { id: 'locked', label: `In Progress (${lockedBadges.length})`, count: lockedBadges.length },
            { id: 'milestones', label: 'Point Milestones' },
            { id: 'streams', label: 'Stream Leaderboards' },
            { id: 'poetry', label: 'Poetry & Verse' },
            { id: 'vault', label: 'Vault Security' },
          ].map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.4)] border border-pink-400/50'
                    : 'bg-neutral-900/90 hover:bg-neutral-800 text-slate-300 hover:text-white border border-neutral-800'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Badges Grid */}
      {filteredBadges.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map((badge) => {
            const isEquipped = currentUser.featuredBadgeId === badge.id;

            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`group relative rounded-2xl p-4 border transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden ${
                  badge.isUnlocked
                    ? 'bg-neutral-950/85 hover:bg-neutral-900/90 border-neutral-700/80 hover:border-pink-500/60 shadow-[0_4px_15px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] hover:-translate-y-0.5'
                    : 'bg-neutral-950/50 border-neutral-900/90 hover:border-neutral-800 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Top Glowing Ambient Tint */}
                {badge.isUnlocked && (
                  <div
                    className="absolute top-0 right-0 w-32 h-32 blur-2xl opacity-20 pointer-events-none rounded-full"
                    style={{ backgroundColor: badge.gradientFrom }}
                  />
                )}

                <div>
                  {/* Card Header: Icon + Rarity Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <BadgeVisualIcon badge={badge} size="md" />

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border shadow-sm ${
                          badge.rarity === 'mythic'
                            ? 'bg-rose-950/80 border-rose-400/60 text-rose-300'
                            : badge.rarity === 'legendary'
                            ? 'bg-amber-950/80 border-amber-400/60 text-amber-300'
                            : badge.rarity === 'epic'
                            ? 'bg-fuchsia-950/80 border-fuchsia-400/60 text-fuchsia-300'
                            : badge.rarity === 'rare'
                            ? 'bg-emerald-950/80 border-emerald-400/60 text-emerald-300'
                            : 'bg-cyan-950/80 border-cyan-400/60 text-cyan-300'
                        }`}
                      >
                        {badge.rarity}
                      </span>

                      {badge.isUnlocked && (
                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Unlocked
                        </span>
                      )}
                      {!badge.isUnlocked && (
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1 mb-3">
                    <h3 className="font-bold text-sm text-slate-100 group-hover:text-pink-300 transition-colors">
                      {badge.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>

                  {/* Special Visual Effect note if unlocked */}
                  {badge.isUnlocked && badge.specialEffect && (
                    <div className="mb-3 p-2 rounded-xl bg-neutral-900/70 border border-neutral-800 text-[10px] text-pink-300/90 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{badge.specialEffect}</span>
                    </div>
                  )}
                </div>

                {/* Progress / Status Bottom Section */}
                <div className="pt-3 border-t border-neutral-900 space-y-2 mt-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400 truncate max-w-[180px]">
                      {badge.requirementText}
                    </span>
                    <span className={`font-bold ${badge.isUnlocked ? 'text-emerald-300' : 'text-slate-400'}`}>
                      {badge.isUnlocked ? '100%' : `${badge.progressPercent}%`}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden border border-neutral-800/80">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        badge.isUnlocked
                          ? 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                          : 'bg-gradient-to-r from-pink-500 to-purple-500'
                      }`}
                      style={{ width: `${badge.progressPercent}%` }}
                    />
                  </div>

                  {/* Action row */}
                  <div className="flex items-center justify-between pt-1">
                    {badge.isUnlocked ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleEquipBadge(badge);
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-mono transition-all cursor-pointer flex items-center gap-1 ${
                          isEquipped
                            ? 'bg-pink-600 text-white border-pink-400 font-bold'
                            : 'bg-neutral-900 hover:bg-neutral-800 text-slate-300 border-neutral-700 hover:text-white'
                        }`}
                      >
                        <Star className="w-2.5 h-2.5" />
                        <span>{isEquipped ? 'Equipped' : 'Equip on Profile'}</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {badge.currentProgress} / {badge.maxProgress} completed
                      </span>
                    )}

                    <span className="text-[10px] text-pink-400/80 group-hover:text-pink-300 font-medium flex items-center gap-0.5">
                      Inspect <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-3">
          <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-300">No Badges Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No badges match your current filter or search criteria. Try selecting "All Badges".
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs text-pink-300 border border-pink-500/30"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Badge Detail Inspection Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-lg bg-neutral-950 border border-pink-500/50 rounded-3xl p-6 sm:p-7 space-y-5 shadow-[0_0_40px_rgba(236,72,153,0.3),0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Ambient Glow */}
            <div
              className="absolute -top-20 -right-20 w-60 h-60 blur-3xl opacity-30 pointer-events-none rounded-full"
              style={{ backgroundColor: selectedBadge.gradientFrom }}
            />

            {/* Close Button */}
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-neutral-900 text-slate-400 hover:text-white border border-neutral-800 hover:border-neutral-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Badge Hero Visual Presentation */}
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <BadgeVisualIcon badge={selectedBadge} size="xl" />

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span
                    className={`text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                      selectedBadge.rarity === 'mythic'
                        ? 'bg-rose-950/80 border-rose-400/60 text-rose-300'
                        : selectedBadge.rarity === 'legendary'
                        ? 'bg-amber-950/80 border-amber-400/60 text-amber-300'
                        : selectedBadge.rarity === 'epic'
                        ? 'bg-fuchsia-950/80 border-fuchsia-400/60 text-fuchsia-300'
                        : selectedBadge.rarity === 'rare'
                        ? 'bg-emerald-950/80 border-emerald-400/60 text-emerald-300'
                        : 'bg-cyan-950/80 border-cyan-400/60 text-cyan-300'
                    }`}
                  >
                    {selectedBadge.rarity} Badge
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">
                    • {selectedBadge.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white font-space-mono">
                  {selectedBadge.title}
                </h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  {selectedBadge.description}
                </p>
              </div>
            </div>

            {/* Unlocked / Locked Status Callout */}
            <div
              className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                selectedBadge.isUnlocked
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-neutral-900/60 border-neutral-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5">
                  {selectedBadge.isUnlocked ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Unlocked & Authenticated</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>Locked Milestone</span>
                    </>
                  )}
                </span>
                <span className="font-mono text-[11px]">
                  {selectedBadge.currentProgress} / {selectedBadge.maxProgress}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {selectedBadge.unlockedReason || selectedBadge.requirementText}
              </p>
            </div>

            {/* Special Visual FX Lore */}
            {selectedBadge.specialEffect && (
              <div className="p-3 rounded-2xl bg-black/60 border border-neutral-800 text-xs space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Special Visual Icon FX</span>
                <p className="text-xs text-pink-300 flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  {selectedBadge.specialEffect}
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              {selectedBadge.isUnlocked ? (
                <button
                  type="button"
                  onClick={() => {
                    handleToggleEquipBadge(selectedBadge);
                    setSelectedBadge(null);
                  }}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(236,72,153,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>
                    {currentUser.featuredBadgeId === selectedBadge.id
                      ? 'Unequip from Profile'
                      : 'Equip as Profile Honorific'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBadge(null);
                    if (onOpenStreamModal) onOpenStreamModal();
                  }}
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-pink-300 border border-pink-500/40 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Explore Streams & Readings</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-slate-300 text-xs transition-colors border border-neutral-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
