import React, { useState } from 'react';
import { motion, type Variants } from 'motion/react';
import {
  Flame,
  Rocket,
  Sparkles,
  Layers,
  Activity,
  X,
  Check,
  Zap,
  RotateCcw,
  Users,
  Maximize2,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import { Post, User } from '../types';
import { getGroupReadingRank } from '../utils/readingEstimator';
import { ViralSpreadGraph } from './ViralSpreadGraph';

// Motion-framer variants for menu entrance and exit
export const postFireMenuVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.88,
    y: 12,
    filter: 'blur(8px)',
    transformOrigin: 'bottom left',
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

const triggerActionBtnVariants: Variants = {
  idle: { scale: 1 },
  hover: {
    scale: 1.04,
    transition: { type: 'spring', stiffness: 500, damping: 15 },
  },
  tap: {
    scale: 0.93,
    transition: { type: 'spring', stiffness: 600, damping: 20 },
  },
};

interface PostFireMenuProps {
  post: Post;
  currentUser: User;
  allUsers?: User[];
  isOpen: boolean;
  onClose: () => void;
  onApplyPowerUp: (
    powerUpType: 'boost' | 'glow' | 'multiplier' | 'viral',
    cost: number,
    params?: {
      boostScore?: number;
      multiplierFactor?: number;
      totalCycles?: number;
    },
    groupTag?: string
  ) => void;
  onPreviewFireBurst?: (type?: 'boost' | 'glow' | 'multiplier' | 'viral') => void;
  onOpenViralGraph?: () => void;
  onSimulateInfectNextProfile?: (postId: string) => void;
  onAdvanceFeedCycle?: () => void;
  onClaimFreeSparks?: (groupTag?: string) => void;
  onClaimGroupPoints?: (groupTag?: string) => void;
}

export const PostFireMenu: React.FC<PostFireMenuProps> = ({
  post,
  currentUser,
  allUsers = [],
  isOpen,
  onClose,
  onApplyPowerUp,
  onPreviewFireBurst,
  onOpenViralGraph,
  onSimulateInfectNextProfile,
  onAdvanceFeedCycle,
  onClaimFreeSparks,
  onClaimGroupPoints,
}) => {
  const [selectedBoostTier, setSelectedBoostTier] = useState<{ cost: number; score: number }>({ cost: 50, score: 100 });
  const [selectedMultiplier, setSelectedMultiplier] = useState<{ cost: number; factor: number; cycles: number }>({
    cost: 60,
    factor: 3,
    cycles: 3,
  });
  const [showInlineViralGraph, setShowInlineViralGraph] = useState(false);

  // Determine initial hashtag group for funding
  const defaultPostGroup =
    post.firePowerUps?.sourceGroupTag ||
    (post.hashtags && post.hashtags[0]?.replace(/^#+/, '')) ||
    'Poetry';

  const [selectedGroupTag, setSelectedGroupTag] = useState<string>(defaultPostGroup);

  if (!isOpen) return null;

  const userGroupPoints = currentUser.groupPoints || {};
  const activeGroup = selectedGroupTag.replace(/^#+/, '') || 'Poetry';
  const groupPoints = userGroupPoints[activeGroup] || 0;
  const rankInfo = getGroupReadingRank(groupPoints);

  // Collect all known hashtag groups with points
  const allKnownTags = Array.from(
    new Set([
      activeGroup,
      defaultPostGroup,
      ...Object.keys(userGroupPoints),
      ...(currentUser.joinedGroupTags || []),
      'Poetry',
      'Encrypted',
      'deep_',
      'Mates',
      'Verse',
    ])
  ).filter(Boolean);

  const sortedGroups = allKnownTags
    .map((tag) => ({
      tag,
      points: userGroupPoints[tag] || 0,
    }))
    .sort((a, b) => b.points - a.points);

  const fireState = post.firePowerUps || {};

  const isBoostActive = Boolean(fireState.boost?.active);
  const isGlowActive = Boolean(fireState.glow?.active);
  const isMultiplierActive = Boolean(fireState.multiplier?.active);
  const isViralActive = Boolean(fireState.viral?.active && !fireState.viral?.fadedAway);

  const activeCount = [isBoostActive, isGlowActive, isMultiplierActive, isViralActive].filter(Boolean).length;

  const handleTopUp = () => {
    if (onClaimGroupPoints) {
      onClaimGroupPoints(activeGroup);
    } else if (onClaimFreeSparks) {
      onClaimFreeSparks(activeGroup);
    }
  };

  return (
    <motion.div
      id={`fire-menu-${post.id}`}
      variants={postFireMenuVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute left-0 bottom-full mb-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-neutral-950/95 backdrop-blur-2xl border border-orange-500/50 rounded-2xl p-4 shadow-[0_0_35px_rgba(249,115,22,0.3),0_20px_45px_rgba(0,0,0,0.85)] z-50 text-slate-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-orange-500/25">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600/30 to-amber-500/30 border border-orange-500/50 flex items-center justify-center text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.4)]">
            <Flame className="w-4 h-4 fill-orange-400/50 text-orange-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-sm text-orange-200">
              <span>Go Viral! Power-Ups</span>
              {activeCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-orange-950 border border-orange-400/60 text-orange-300">
                  {activeCount} Active
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              Fuel power-ups with karma points from your hashtag groups
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer"
          title="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Hashtag Group Points Balance & Funding Station */}
      <div className="my-3 p-3 rounded-xl bg-gradient-to-br from-orange-950/50 via-amber-950/30 to-neutral-950 border border-orange-500/35 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-orange-400" />
            <span className="text-slate-300 font-medium">Paying with:</span>
            <span className="font-mono font-bold text-orange-200 text-sm bg-orange-950 px-2 py-0.5 rounded border border-orange-500/40">
              #{activeGroup}
            </span>
            <span className="font-mono font-bold text-amber-300 text-sm">{groupPoints} pts</span>
          </div>

          <div className="flex items-center gap-1.5">
            {onPreviewFireBurst && (
              <button
                type="button"
                onClick={() => onPreviewFireBurst('glow')}
                className="px-2 py-0.5 rounded-md bg-orange-600/30 hover:bg-orange-600/45 border border-orange-400/60 text-orange-200 text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                title="Preview particle burst on this post"
              >
                <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                <span>Test</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleTopUp}
              className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1"
              title={`Top up +100 points in #${activeGroup}`}
            >
              <Zap className="w-2.5 h-2.5 text-amber-400" />
              <span>+100 pts</span>
            </button>
          </div>
        </div>

        {/* Group Selector Chips */}
        <div>
          <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
            <span>Switch funding hashtag group:</span>
            <span className="text-amber-300/80 font-mono">Level {rankInfo.level}</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
            {sortedGroups.map(({ tag, points }) => {
              const isSelected = activeGroup.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedGroupTag(tag)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-mono whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 border ${
                    isSelected
                      ? 'bg-orange-950 border-orange-400 text-orange-200 font-bold shadow-[0_0_8px_rgba(249,115,22,0.3)]'
                      : 'bg-neutral-900 border-neutral-800 text-slate-400 hover:text-slate-200 hover:border-neutral-700'
                  }`}
                  title={`Use points from #${tag} group (${points} pts)`}
                >
                  <span>#{tag}</span>
                  <span
                    className={`text-[9.5px] font-bold px-1 rounded ${
                      isSelected
                        ? 'bg-orange-500/30 text-amber-300'
                        : points > 0
                        ? 'bg-neutral-800 text-slate-300'
                        : 'bg-neutral-800/40 text-slate-500'
                    }`}
                  >
                    {points}
                  </span>
                  {isSelected && <Check className="w-2.5 h-2.5 text-orange-400" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4 Power-Up Options */}
      <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
        {/* OPTION 1: Post Boost */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            isBoostActive
              ? 'bg-amber-950/40 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/30'
              : 'bg-neutral-900/60 hover:bg-neutral-900/90 border-neutral-800 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                <Rocket className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-xs text-amber-200 flex items-center gap-1.5">
                  <span>1. Post Boost</span>
                  {isBoostActive && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-900/70 border border-amber-400 text-amber-300">
                      ⚡ +{fireState.boost?.boostScore || 100} Priority
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span className="text-[11px] font-mono text-amber-300/90 font-semibold">
              {selectedBoostTier.cost} pts from #{activeGroup}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
            Spend #{activeGroup} points to lift this post higher in feed order.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedBoostTier({ cost: 50, score: 100 })}
              className={`flex-1 text-[10px] font-mono py-1 rounded-md border transition-all cursor-pointer ${
                selectedBoostTier.score === 100
                  ? 'bg-amber-500/30 border-amber-400 text-amber-200 font-bold'
                  : 'bg-neutral-800/60 border-neutral-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              +100 Priority (50 pts)
            </button>
            <button
              type="button"
              onClick={() => setSelectedBoostTier({ cost: 100, score: 250 })}
              className={`flex-1 text-[10px] font-mono py-1 rounded-md border transition-all cursor-pointer ${
                selectedBoostTier.score === 250
                  ? 'bg-amber-500/30 border-amber-400 text-amber-200 font-bold'
                  : 'bg-neutral-800/60 border-neutral-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              +250 Mega (100 pts)
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              {groupPoints < selectedBoostTier.cost
                ? `Need ${selectedBoostTier.cost - groupPoints} more pts in #${activeGroup}`
                : isBoostActive ? 'Already boosted in feed' : 'Rises directly to top'}
            </span>
            <motion.button
              type="button"
              variants={triggerActionBtnVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              onClick={() =>
                onApplyPowerUp(
                  'boost',
                  selectedBoostTier.cost,
                  { boostScore: selectedBoostTier.score },
                  activeGroup
                )
              }
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center gap-1"
            >
              <Rocket className="w-3 h-3" />
              <span>{isBoostActive ? 'Boost Higher' : 'Boost Post'}</span>
            </motion.button>
          </div>
        </div>

        {/* OPTION 2: Post Glow */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            isGlowActive
              ? 'bg-orange-950/40 border-orange-400/60 shadow-[0_0_15px_rgba(249,115,22,0.25)] ring-1 ring-orange-400/30'
              : 'bg-neutral-900/60 hover:bg-neutral-900/90 border-neutral-800 hover:border-orange-500/40'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-300 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-xs text-orange-200 flex items-center gap-1.5">
                  <span>2. Post Glow</span>
                  {isGlowActive && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-orange-900/70 border border-orange-400 text-orange-300 animate-pulse">
                      🔥 Glowing
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span className="text-[11px] font-mono text-orange-300/90 font-semibold">
              40 pts from #{activeGroup}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
            Spend #{activeGroup} points to wrap this post in a vibrant ambient glow.
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-ping" />
              <span className="text-[10px] text-slate-400">Radiant fiery neon aura</span>
            </div>

            <motion.button
              type="button"
              variants={triggerActionBtnVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              onClick={() => onApplyPowerUp('glow', 40, undefined, activeGroup)}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)] transition-all cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>{isGlowActive ? 'Refresh Glow' : 'Ignite Glow'}</span>
            </motion.button>
          </div>
        </div>

        {/* OPTION 3: Post Multiplier */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            isMultiplierActive
              ? 'bg-purple-950/40 border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.25)] ring-1 ring-purple-400/30'
              : 'bg-neutral-900/60 hover:bg-neutral-900/90 border-neutral-800 hover:border-purple-500/40'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-xs text-purple-200 flex items-center gap-1.5">
                  <span>3. Post Multiplier</span>
                  {isMultiplierActive && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-900/70 border border-purple-400 text-purple-300">
                      ⚡ {fireState.multiplier?.multiplierFactor}x Cycles ({fireState.multiplier?.cyclesRemaining} left)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span className="text-[11px] font-mono text-purple-300/90 font-semibold">
              {selectedMultiplier.cost} pts from #{activeGroup}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
            Multiply how many feed cycles the post stays active for.
          </p>

          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setSelectedMultiplier({ cost: 60, factor: 3, cycles: 3 })}
              className={`flex-1 text-[10px] font-mono py-1 rounded-md border transition-all cursor-pointer ${
                selectedMultiplier.factor === 3
                  ? 'bg-purple-500/30 border-purple-400 text-purple-200 font-bold'
                  : 'bg-neutral-800/60 border-neutral-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              3x Feed Cycles (60 pts)
            </button>
            <button
              type="button"
              onClick={() => setSelectedMultiplier({ cost: 95, factor: 5, cycles: 5 })}
              className={`flex-1 text-[10px] font-mono py-1 rounded-md border transition-all cursor-pointer ${
                selectedMultiplier.factor === 5
                  ? 'bg-purple-500/30 border-purple-400 text-purple-200 font-bold'
                  : 'bg-neutral-800/60 border-neutral-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              5x Feed Cycles (95 pts)
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            {onAdvanceFeedCycle && isMultiplierActive ? (
              <button
                type="button"
                onClick={onAdvanceFeedCycle}
                className="text-[10px] text-purple-300 hover:text-purple-200 flex items-center gap-1 font-mono transition-colors cursor-pointer"
                title="Simulate 1 feed cycle progression"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Advance Cycle</span>
              </button>
            ) : (
              <span className="text-[10px] text-slate-400">Protects post from feed decay</span>
            )}

            <motion.button
              type="button"
              variants={triggerActionBtnVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              onClick={() =>
                onApplyPowerUp(
                  'multiplier',
                  selectedMultiplier.cost,
                  {
                    multiplierFactor: selectedMultiplier.factor,
                    totalCycles: selectedMultiplier.cycles,
                  },
                  activeGroup
                )
              }
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all cursor-pointer flex items-center gap-1"
            >
              <Layers className="w-3 h-3" />
              <span>{isMultiplierActive ? 'Extend Lifespan' : 'Multiply Cycles'}</span>
            </motion.button>
          </div>
        </div>

        {/* OPTION 4: Viral Posts */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            isViralActive
              ? 'bg-rose-950/40 border-rose-400/60 shadow-[0_0_15px_rgba(244,63,94,0.25)] ring-1 ring-rose-400/30'
              : 'bg-neutral-900/60 hover:bg-neutral-900/90 border-neutral-800 hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 shrink-0">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-xs text-rose-200 flex items-center gap-1.5">
                  <span>4. Viral Posts</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    +25 pts/infection to #{activeGroup}
                  </span>
                  {isViralActive && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-900/70 border border-rose-400 text-rose-300 animate-pulse">
                      ☣️ {fireState.viral?.totalInfections || 0} Infected
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span className="text-[11px] font-mono text-rose-300/90 font-semibold">
              75 pts from #{activeGroup}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
            Make posts infect every profile that sees them until they fade away. <span className="text-amber-300 font-semibold">Earn +25 points for #{activeGroup} for every profile infected!</span>
          </p>

          {isViralActive && (
            <div className="mb-2.5 p-2 rounded-lg bg-black/50 border border-rose-500/30 text-[10px] space-y-2">
              <div className="flex items-center justify-between text-slate-300 font-mono">
                <span>Infected Profiles:</span>
                <span className="text-rose-300 font-bold">{fireState.viral?.totalInfections || 0} hosts</span>
              </div>
              <div className="flex items-center justify-between font-mono bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/30">
                <span className="text-emerald-300 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>Bounty to #{activeGroup}:</span>
                </span>
                <span className="text-amber-300 font-bold">
                  +{(fireState.viral?.totalInfections || 0) * 25} pts (+25/host)
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300 font-mono">
                <span>Fade-Away Lifespan:</span>
                <span className="text-amber-300 font-bold">
                  {fireState.viral?.fadeAwayRemainingViews || 0} profile views remaining
                </span>
              </div>
              {fireState.viral?.infectedProfileNames && fireState.viral.infectedProfileNames.length > 0 && (
                <div className="text-[9px] text-slate-400 truncate">
                  Contagion host: {fireState.viral.infectedProfileNames.join(', ')}
                </div>
              )}

              {/* D3 Viral Spread Graph Trigger */}
              <div className="pt-1.5 border-t border-rose-500/20 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenViralGraph) {
                      onOpenViralGraph();
                    } else {
                      setShowInlineViralGraph((prev) => !prev);
                    }
                  }}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 text-[10.5px] font-semibold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(244,63,94,0.3)] cursor-pointer"
                  title="Visualize infection spread in D3 connection graph"
                >
                  <Activity className="w-3.5 h-3.5 text-rose-400" />
                  <span>{onOpenViralGraph ? 'Open D3 Spread Graph' : (showInlineViralGraph ? 'Hide Graph' : 'View D3 Spread Graph')}</span>
                </button>

                {onOpenViralGraph && (
                  <button
                    type="button"
                    onClick={() => setShowInlineViralGraph((prev) => !prev)}
                    className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-rose-500/30 text-rose-300 transition-colors cursor-pointer"
                    title={showInlineViralGraph ? 'Collapse inline graph' : 'Preview inline graph'}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Inline D3 Preview */}
              {showInlineViralGraph && (
                <div className="mt-2 rounded-xl overflow-hidden border border-rose-500/40">
                  <ViralSpreadGraph
                    post={post}
                    allUsers={allUsers}
                    onSimulateInfectNextProfile={onSimulateInfectNextProfile}
                    height={340}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            {isViralActive && onSimulateInfectNextProfile ? (
              <button
                type="button"
                onClick={() => onSimulateInfectNextProfile(post.id)}
                className="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900/90 border border-rose-500/40 text-rose-200 text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                title={`Spread infection to next profile (+25 points to #${activeGroup})`}
              >
                <Users className="w-3 h-3 text-rose-400" />
                <span>Infect (+25 pts to #{activeGroup})</span>
              </button>
            ) : (
              <span className="text-[10px] text-slate-400">Earn +25 pts per infected profile</span>
            )}

            <motion.button
              type="button"
              variants={triggerActionBtnVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              onClick={() => onApplyPowerUp('viral', 75, undefined, activeGroup)}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)] transition-all cursor-pointer flex items-center gap-1"
            >
              <Activity className="w-3 h-3" />
              <span>{isViralActive ? 'Boost Contagion' : 'Unleash Viral'}</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
