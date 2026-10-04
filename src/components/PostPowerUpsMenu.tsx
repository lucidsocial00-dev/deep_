import React, { useState } from 'react';
import {
  Flame,
  Rocket,
  Sparkles,
  Layers,
  Activity,
  X,
  Check,
  Zap,
  Users,
  ShieldAlert,
  Info,
  Tag,
} from 'lucide-react';
import { User } from '../types';
import { getGroupReadingRank } from '../utils/readingEstimator';

export interface PowerUpsDraftState {
  boost: {
    active: boolean;
    score: number;
    cost: number;
  };
  glow: {
    active: boolean;
    style: 'flame' | 'neon' | 'amber';
    cost: number;
  };
  multiplier: {
    active: boolean;
    factor: number;
    cycles: number;
    cost: number;
  };
  viral: {
    active: boolean;
    cost: number;
  };
}

interface PostPowerUpsMenuProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  draft: PowerUpsDraftState;
  onChangeDraft: (updater: (prev: PowerUpsDraftState) => PowerUpsDraftState) => void;
  selectedGroupTag?: string;
  onSelectGroupTag?: (tag: string) => void;
  onClaimGroupPoints?: (groupTag?: string) => void;
  onClaimFreeSparks?: (groupTag?: string) => void;
}

export const PostPowerUpsMenu: React.FC<PostPowerUpsMenuProps> = ({
  currentUser,
  isOpen,
  onClose,
  draft,
  onChangeDraft,
  selectedGroupTag = 'Poetry',
  onSelectGroupTag,
  onClaimGroupPoints,
  onClaimFreeSparks,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'boost' | 'glow' | 'multiplier' | 'viral'>('all');

  if (!isOpen) return null;

  const userGroupPoints = currentUser.groupPoints || {};
  const activeGroupTag = selectedGroupTag.replace(/^#+/, '') || 'Poetry';
  const activeGroupPoints = userGroupPoints[activeGroupTag] || 0;
  const rankInfo = getGroupReadingRank(activeGroupPoints);

  // Collect all known hashtag groups and sort by points descending
  const allKnownTags = Array.from(
    new Set([
      activeGroupTag,
      ...Object.keys(userGroupPoints),
      ...(currentUser.joinedGroupTags || []),
      'Poetry',
      'Encrypted',
      'deep_',
      'Mates',
      'Verse',
      'Philosophy',
    ])
  ).filter(Boolean);

  const sortedGroups = allKnownTags
    .map((tag) => ({
      tag,
      points: userGroupPoints[tag] || 0,
    }))
    .sort((a, b) => b.points - a.points);

  const activeCount = [
    draft.boost.active,
    draft.glow.active,
    draft.multiplier.active,
    draft.viral.active,
  ].filter(Boolean).length;

  const totalCost =
    (draft.boost.active ? draft.boost.cost : 0) +
    (draft.glow.active ? draft.glow.cost : 0) +
    (draft.multiplier.active ? draft.multiplier.cost : 0) +
    (draft.viral.active ? draft.viral.cost : 0);

  const hasInsufficientPoints = activeGroupPoints < totalCost;

  const handleTopUpPoints = () => {
    if (onClaimGroupPoints) {
      onClaimGroupPoints(activeGroupTag);
    } else if (onClaimFreeSparks) {
      onClaimFreeSparks(activeGroupTag);
    }
  };

  const handleToggleBoost = () => {
    onChangeDraft((prev) => ({
      ...prev,
      boost: {
        ...prev.boost,
        active: !prev.boost.active,
      },
    }));
  };

  const handleSelectBoostTier = (score: number, cost: number) => {
    onChangeDraft((prev) => ({
      ...prev,
      boost: {
        active: true,
        score,
        cost,
      },
    }));
  };

  const handleToggleGlow = () => {
    onChangeDraft((prev) => ({
      ...prev,
      glow: {
        ...prev.glow,
        active: !prev.glow.active,
      },
    }));
  };

  const handleSelectGlowStyle = (style: 'flame' | 'neon' | 'amber') => {
    onChangeDraft((prev) => ({
      ...prev,
      glow: {
        ...prev.glow,
        active: true,
        style,
      },
    }));
  };

  const handleToggleMultiplier = () => {
    onChangeDraft((prev) => ({
      ...prev,
      multiplier: {
        ...prev.multiplier,
        active: !prev.multiplier.active,
      },
    }));
  };

  const handleSelectMultiplierTier = (factor: number, cycles: number, cost: number) => {
    onChangeDraft((prev) => ({
      ...prev,
      multiplier: {
        active: true,
        factor,
        cycles,
        cost,
      },
    }));
  };

  const handleToggleViral = () => {
    onChangeDraft((prev) => ({
      ...prev,
      viral: {
        ...prev.viral,
        active: !prev.viral.active,
      },
    }));
  };

  const handleArmAll = () => {
    onChangeDraft((prev) => ({
      boost: { active: true, score: 100, cost: 50 },
      glow: { active: true, style: 'flame', cost: 40 },
      multiplier: { active: true, factor: 3, cycles: 3, cost: 60 },
      viral: { active: true, cost: 75 },
    }));
  };

  const handleClearAll = () => {
    onChangeDraft((prev) => ({
      boost: { active: false, score: 100, cost: 50 },
      glow: { active: false, style: 'flame', cost: 40 },
      multiplier: { active: false, factor: 3, cycles: 3, cost: 60 },
      viral: { active: false, cost: 75 },
    }));
  };

  return (
    <div className="relative rounded-2xl bg-neutral-950/95 border border-orange-500/60 p-4 sm:p-5 shadow-[0_0_35px_rgba(249,115,22,0.25),0_15px_30px_rgba(0,0,0,0.85)] text-slate-200 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-orange-500/25">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600/40 to-amber-500/40 border border-orange-500/60 flex items-center justify-center text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.4)]">
            <Flame className="w-4 h-4 fill-orange-400/50 text-orange-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-bold text-sm text-orange-200">
              <span>Post Creator Power-Ups</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  activeCount > 0
                    ? 'bg-orange-950 border-orange-400 text-orange-300 font-bold shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                    : 'bg-neutral-900 border-neutral-700 text-slate-400'
                }`}
              >
                {activeCount > 0 ? `${activeCount} Armed` : 'None Armed'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Fuel your post with points earned from your hashtag groups
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
          title="Close Power-Ups menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Hashtag Groups Fuel Station & Active Balance Card */}
      <div className="my-3 p-3.5 rounded-xl bg-gradient-to-br from-orange-950/60 via-amber-950/40 to-neutral-950 border border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.15)] space-y-3">
        {/* Active Selected Hashtag Group Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs pb-2.5 border-b border-orange-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-400/50 flex items-center justify-center text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.3)]">
              <Tag className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-slate-300 font-medium">Funding Group:</span>
                <span className="font-mono font-bold text-orange-200 text-sm bg-orange-950/80 px-2 py-0.5 rounded border border-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.25)]">
                  #{activeGroupTag}
                </span>
                <span className="text-[10px] font-mono text-amber-400/90 font-semibold">
                  Level {rankInfo.level}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Balance: <strong className="text-amber-300 font-bold">{activeGroupPoints} pts</strong>
                {totalCost > 0 && (
                  <span>
                    {' '}• Cost: <span className="text-orange-300 font-bold">{totalCost} pts</span>
                    {' '}• Remaining: <span className="text-emerald-300 font-bold">{Math.max(0, activeGroupPoints - totalCost)} pts</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTopUpPoints}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/50 text-amber-200 text-xs font-semibold transition-all cursor-pointer shadow-[0_0_8px_rgba(245,158,11,0.25)] flex items-center gap-1"
              title={`Add +100 points to #${activeGroupTag} group`}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>+100 to #{activeGroupTag}</span>
            </button>

            {activeCount < 4 ? (
              <button
                type="button"
                onClick={handleArmAll}
                className="px-2.5 py-1 rounded-lg bg-orange-600/30 hover:bg-orange-600/45 border border-orange-400/60 text-orange-200 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
              >
                <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                <span>Arm All</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Group Selector Chips */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
            <span>Select which hashtag group points to spend:</span>
            <span className="text-amber-300/80 font-mono text-[10px]">
              Earn points by reading in each stream
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {sortedGroups.map(({ tag, points }) => {
              const isSelected = activeGroupTag.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSelectGroupTag && onSelectGroupTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-orange-950 border-orange-400 text-orange-200 font-bold shadow-[0_0_12px_rgba(249,115,22,0.4)] ring-1 ring-orange-400/50'
                      : 'bg-neutral-900/90 border-neutral-800 text-slate-400 hover:text-slate-200 hover:border-neutral-700'
                  }`}
                  title={`Use points from #${tag} group (${points} pts available)`}
                >
                  <span>#{tag}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-orange-500/30 text-amber-300 border border-orange-400/40'
                        : points > 0
                        ? 'bg-neutral-800 text-slate-300'
                        : 'bg-neutral-800/40 text-slate-500'
                    }`}
                  >
                    {points} pts
                  </span>
                  {isSelected && <Check className="w-3 h-3 text-orange-400 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Insufficient points warning */}
      {hasInsufficientPoints && (
        <div className="mb-3 p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-xs text-amber-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              You need <strong className="font-mono text-white">{totalCost - activeGroupPoints}</strong> more points in{' '}
              <strong className="font-mono text-orange-300">#{activeGroupTag}</strong> to arm all selected power-ups. Switch to a group with more points above, or top up!
            </span>
          </div>
          <button
            type="button"
            onClick={handleTopUpPoints}
            className="px-2 py-0.5 rounded bg-amber-500 text-black font-bold text-[11px] hover:bg-amber-400 transition-colors cursor-pointer shrink-0"
          >
            +100 to #{activeGroupTag}
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 pb-3 mb-3 border-b border-white/10 overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
            filterTab === 'all'
              ? 'bg-orange-500 text-black font-bold shadow-[0_0_10px_rgba(249,115,22,0.4)]'
              : 'bg-neutral-900 text-slate-400 hover:text-white border border-neutral-800'
          }`}
        >
          All Power-Ups (4)
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('boost')}
          className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
            filterTab === 'boost'
              ? 'bg-amber-500 text-black font-bold'
              : 'bg-neutral-900 text-amber-300 hover:text-white border border-neutral-800'
          }`}
        >
          <Rocket className="w-3 h-3" />
          <span>1. Post Boost</span>
          {draft.boost.active && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping ml-0.5" />}
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('glow')}
          className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
            filterTab === 'glow'
              ? 'bg-orange-500 text-black font-bold'
              : 'bg-neutral-900 text-orange-300 hover:text-white border border-neutral-800'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>2. Post Glow</span>
          {draft.glow.active && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping ml-0.5" />}
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('multiplier')}
          className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
            filterTab === 'multiplier'
              ? 'bg-purple-500 text-black font-bold'
              : 'bg-neutral-900 text-purple-300 hover:text-white border border-neutral-800'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>3. Multiplier</span>
          {draft.multiplier.active && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping ml-0.5" />}
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('viral')}
          className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
            filterTab === 'viral'
              ? 'bg-rose-500 text-black font-bold'
              : 'bg-neutral-900 text-rose-300 hover:text-white border border-neutral-800'
          }`}
        >
          <Activity className="w-3 h-3" />
          <span>4. Viral Outbreak</span>
          {draft.viral.active && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping ml-0.5" />}
        </button>
      </div>

      {/* Power-Ups List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {/* 1. POST BOOST */}
        {(filterTab === 'all' || filterTab === 'boost') && (
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              draft.boost.active
                ? 'bg-amber-950/40 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40'
                : 'bg-neutral-900/60 hover:bg-neutral-900/90 border-neutral-800'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                  <Rocket className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-amber-200 flex items-center gap-2">
                    <span>1. Post Boost (Top of Feed)</span>
                    {draft.boost.active && (
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-900/80 border border-amber-400 text-amber-300">
                        ⚡ +{draft.boost.score} Priority Score
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Spends points from #{activeGroupTag} to place your post at the very top of the feed and streams
                  </div>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-amber-300">
                {draft.boost.cost} pts from #{activeGroupTag}
              </span>
            </div>

            {/* Tier selection buttons */}
            <div className="flex items-center gap-2 my-2.5">
              <button
                type="button"
                onClick={() => handleSelectBoostTier(100, 50)}
                className={`flex-1 text-[11px] font-mono py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                  draft.boost.score === 100
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                    : 'bg-neutral-800/60 border-neutral-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                +100 Priority (50 pts)
              </button>
              <button
                type="button"
                onClick={() => handleSelectBoostTier(250, 100)}
                className={`flex-1 text-[11px] font-mono py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                  draft.boost.score === 250
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                    : 'bg-neutral-800/60 border-neutral-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                +250 Mega (100 pts)
              </button>
              <button
                type="button"
                onClick={() => handleSelectBoostTier(500, 180)}
                className={`flex-1 text-[11px] font-mono py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                  draft.boost.score === 500
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                    : 'bg-neutral-800/60 border-neutral-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                +500 Orbit (180 pts)
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                {draft.boost.active
                  ? `✨ Armed: Rises to position #1 in feed (deducts from #${activeGroupTag})`
                  : `Click Arm to activate priority boost using #${activeGroupTag} points`}
              </span>

              <button
                type="button"
                onClick={handleToggleBoost}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  draft.boost.active
                    ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] font-bold'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/40'
                }`}
              >
                {draft.boost.active ? <Check className="w-3.5 h-3.5" /> : <Rocket className="w-3.5 h-3.5" />}
                <span>{draft.boost.active ? 'Armed' : 'Arm Boost'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. POST GLOW */}
        {(filterTab === 'all' || filterTab === 'glow') && (
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              draft.glow.active
                ? 'bg-orange-950/40 border-orange-400/80 shadow-[0_0_15px_rgba(249,115,22,0.25)] ring-1 ring-orange-400/40'
                : 'bg-neutral-900/60 hover:bg-neutral-900/90 border-neutral-800'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-300 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-orange-200 flex items-center gap-2">
                    <span>2. Post Glow (Radiant Aura)</span>
                    {draft.glow.active && (
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-orange-900/80 border border-orange-400 text-orange-300 animate-pulse">
                        🔥 {draft.glow.style.toUpperCase()} Glow
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Wraps your post in a glowing, pulsating halo with ambient particles
                  </div>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-orange-300">
                {draft.glow.cost} pts from #{activeGroupTag}
              </span>
            </div>

            {/* Glow style selector */}
            <div className="flex items-center gap-2 my-2.5">
              <button
                type="button"
                onClick={() => handleSelectGlowStyle('flame')}
                className={`flex-1 text-[11px] py-1.5 px-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  draft.glow.style === 'flame'
                    ? 'bg-orange-500/30 border-orange-400 text-orange-200 font-bold shadow-[0_0_8px_rgba(249,115,22,0.3)]'
                    : 'bg-neutral-800/60 border-neutral-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🔥 Flame Inferno</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectGlowStyle('neon')}
                className={`flex-1 text-[11px] py-1.5 px-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  draft.glow.style === 'neon'
                    ? 'bg-sky-500/30 border-sky-400 text-sky-200 font-bold shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                    : 'bg-neutral-800/60 border-neutral-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>⚡ Cyber Neon</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectGlowStyle('amber')}
                className={`flex-1 text-[11px] py-1.5 px-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  draft.glow.style === 'amber'
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                    : 'bg-neutral-800/60 border-neutral-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>✨ Amber Luminescence</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                {draft.glow.active
                  ? `✨ Armed: Aura will ignite as soon as published (fuels with #${activeGroupTag})`
                  : `Click Arm to wrap in radiant glowing aura using #${activeGroupTag}`}
              </span>

              <button
                type="button"
                onClick={handleToggleGlow}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  draft.glow.active
                    ? 'bg-orange-500 text-black shadow-[0_0_12px_rgba(249,115,22,0.5)] font-bold'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-orange-300 border border-orange-500/40'
                }`}
              >
                {draft.glow.active ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{draft.glow.active ? 'Armed' : 'Arm Glow'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. POST MULTIPLIER */}
        {(filterTab === 'all' || filterTab === 'multiplier') && (
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              draft.multiplier.active
                ? 'bg-purple-950/40 border-purple-400/80 shadow-[0_0_15px_rgba(168,85,247,0.25)] ring-1 ring-purple-400/40'
                : 'bg-neutral-900/60 hover:bg-neutral-900/90 border-neutral-800'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-purple-200 flex items-center gap-2">
                    <span>3. Post Multiplier (Extended Cycles)</span>
                    {draft.multiplier.active && (
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-purple-900/80 border border-purple-400 text-purple-300">
                        ⚡ {draft.multiplier.factor}x Multiplier ({draft.multiplier.cycles} Cycles)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Multiplies active feed cycles and boosts reader rewards in #{activeGroupTag}
                  </div>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-purple-300">
                {draft.multiplier.cost} pts from #{activeGroupTag}
              </span>
            </div>

            {/* Multiplier options */}
            <div className="flex items-center gap-2 my-2.5">
              <button
                type="button"
                onClick={() => handleSelectMultiplierTier(3, 3, 60)}
                className={`flex-1 text-[11px] font-mono py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                  draft.multiplier.factor === 3
                    ? 'bg-purple-500/30 border-purple-400 text-purple-200 font-bold shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                    : 'bg-neutral-800/60 border-neutral-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                3x Feed Cycles (60 pts)
              </button>
              <button
                type="button"
                onClick={() => handleSelectMultiplierTier(5, 5, 95)}
                className={`flex-1 text-[11px] font-mono py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                  draft.multiplier.factor === 5
                    ? 'bg-purple-500/30 border-purple-400 text-purple-200 font-bold shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                    : 'bg-neutral-800/60 border-neutral-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                5x Feed Cycles (95 pts)
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                {draft.multiplier.active
                  ? `✨ Armed: Multiplied lifespan across ${draft.multiplier.cycles} cycles`
                  : `Click Arm to multiply feed cycles and rewards using #${activeGroupTag}`}
              </span>

              <button
                type="button"
                onClick={handleToggleMultiplier}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  draft.multiplier.active
                    ? 'bg-purple-500 text-black shadow-[0_0_12px_rgba(168,85,247,0.5)] font-bold'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-purple-300 border border-purple-500/40'
                }`}
              >
                {draft.multiplier.active ? <Check className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
                <span>{draft.multiplier.active ? 'Armed' : 'Arm Multiplier'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. VIRAL OUTBREAK */}
        {(filterTab === 'all' || filterTab === 'viral') && (
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              draft.viral.active
                ? 'bg-rose-950/40 border-rose-400/80 shadow-[0_0_15px_rgba(244,63,94,0.25)] ring-1 ring-rose-400/40'
                : 'bg-neutral-900/60 hover:bg-neutral-900/90 border-neutral-800'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-rose-200 flex items-center gap-2">
                    <span>4. Viral Contagion (Social Infection Network)</span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300">
                      +25 pts/infection to #{activeGroupTag}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Infects readers who interact with this post, spreading contagion through peer feeds
                  </div>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-rose-300">
                {draft.viral.cost} pts from #{activeGroupTag}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-black/60 border border-rose-500/25 my-2 text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-300 font-semibold">
                <Users className="w-3.5 h-3.5 text-rose-400" />
                <span>Viral Outbreak Rules:</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                • Readers who view your post catch the contagion and pass it on to friends.
                <br />
                • Awards you <strong className="text-amber-300 font-mono">+25 points directly to #{activeGroupTag} Group</strong> per infected profile.
                <br />
                • Generates real-time live contagion graph logs and infection timeline badges.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                {draft.viral.active
                  ? `☣️ Armed: Post will ignite viral contagion (fueled by #${activeGroupTag})`
                  : `Click Arm to launch viral social spread using #${activeGroupTag} points`}
              </span>

              <button
                type="button"
                onClick={handleToggleViral}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  draft.viral.active
                    ? 'bg-rose-500 text-black shadow-[0_0_12px_rgba(244,63,94,0.5)] font-bold'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-rose-300 border border-rose-500/40'
                }`}
              >
                {draft.viral.active ? <Check className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                <span>{draft.viral.active ? 'Armed' : 'Arm Viral'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer & Apply Confirmation */}
      <div className="mt-4 pt-3 border-t border-orange-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span className="text-slate-300">
            {activeCount === 0 ? (
              <span>Select power-ups to enhance your post when you click "Post" (fueled by <strong className="text-orange-300 font-mono">#{activeGroupTag}</strong>).</span>
            ) : (
              <span>
                <strong className="text-orange-300 font-bold">{activeCount} power-up{activeCount > 1 ? 's' : ''}</strong> armed ({totalCost} pts from <strong className="text-orange-300 font-mono">#{activeGroupTag}</strong> upon posting).
              </span>
            )}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-[0_0_12px_rgba(249,115,22,0.4)] transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Done</span>
        </button>
      </div>
    </div>
  );
};
