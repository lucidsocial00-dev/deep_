import React, { useState } from 'react';
import { Camera, Sparkles, BookOpen, Award } from 'lucide-react';
import { User } from '../types';
import {
  getUserCumulativeReadingPoints,
  getCumulativeReaderRank,
  CumulativeReaderRankInfo,
} from '../utils/readingEstimator';

interface AvatarReaderProgressProps {
  user: User;
  onAvatarClick?: () => void;
  size?: number; // default 38
  showRankBadge?: boolean;
  showTooltip?: boolean;
}

export const AvatarReaderProgress: React.FC<AvatarReaderProgressProps> = ({
  user,
  onAvatarClick,
  size = 38,
  showRankBadge = true,
  showTooltip = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Cumulative points & rank progression calculations
  const cumulativePoints = getUserCumulativeReadingPoints(user);
  const rankInfo: CumulativeReaderRankInfo = getCumulativeReaderRank(cumulativePoints);

  // Circle SVG dimensions
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Clamped progress (0 to 100)
  const clampedProgress = Math.min(100, Math.max(0, rankInfo.progress));
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  // Unique gradient ID to avoid collisions
  const gradientId = `reader-rank-grad-${user.id || 'current'}`;

  const tooltipTitle = `${user.name} • ${rankInfo.badge} Level ${rankInfo.level}
${cumulativePoints} Cumulative Reading Points
${rankInfo.isMaxRank ? 'Maximum level achieved!' : `${rankInfo.pointsInLevel} / ${rankInfo.pointsNeededInLevel} pts to next level (${rankInfo.progress}%)`}
Click to change profile photo`;

  return (
    <div
      className="relative flex items-center justify-center group/avatar"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={tooltipTitle}
    >
      {/* Clickable Avatar Container with SVG Circular Progress Ring */}
      <div
        onClick={onAvatarClick}
        className="relative cursor-pointer transition-transform duration-200 active:scale-95"
        style={{ width: size, height: size }}
      >
        {/* SVG Circular Progress Ring */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0 pointer-events-none transform -rotate-90 overflow-visible"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={rankInfo.gradientFrom} />
              <stop offset="100%" stopColor={rankInfo.gradientTo} />
            </linearGradient>
          </defs>

          {/* Background Track Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth={strokeWidth}
          />

          {/* Glowing Animated Progress Stroke */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{
              filter: `drop-shadow(0 0 3.5px ${rankInfo.strokeColor}99)`,
            }}
          />
        </svg>

        {/* User Avatar Image */}
        <div className="absolute inset-0 m-auto w-7 h-7 rounded-full overflow-hidden ring-1 ring-black/40">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-full h-full object-cover rounded-full group-hover/avatar:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Camera Overlay on Hover */}
        <div className="absolute inset-0 m-auto w-7 h-7 rounded-full bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Camera className="w-3.5 h-3.5 text-pink-300 animate-pulse" />
        </div>

        {/* Reader Rank Badge Pip */}
        {showRankBadge && (
          <div
            className="absolute -bottom-1 -right-1 z-10 w-4 h-4 rounded-full bg-neutral-950 border border-neutral-700/90 flex items-center justify-center text-[9px] shadow-[0_0_8px_rgba(0,0,0,0.8)]"
            title={`Reader Level: Level ${rankInfo.level}`}
          >
            <span className="leading-none select-none">{rankInfo.badge}</span>
          </div>
        )}
      </div>

      {/* Floating Reader Rank Progression Tooltip on Hover */}
      {showTooltip && isHovered && (
        <div className="absolute top-full right-0 mt-3 w-64 p-3.5 rounded-2xl bg-neutral-950/95 backdrop-blur-xl border border-neutral-800 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(236,72,153,0.15)] z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          {/* Header with Rank title and Level */}
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-neutral-800/80">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-base">{rankInfo.badge}</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-100 truncate">Level {rankInfo.level}</p>
                <p className="text-[10px] text-slate-400">Reader Level Progression</p>
              </div>
            </div>
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shadow-sm shrink-0"
              style={{
                color: rankInfo.strokeColor,
                borderColor: `${rankInfo.strokeColor}60`,
                backgroundColor: `${rankInfo.strokeColor}15`,
              }}
            >
              Lv. {rankInfo.level}
            </span>
          </div>

          {/* Cumulative Reading Points */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-pink-400" /> Cumulative Points:
            </span>
            <span className="font-mono font-bold text-slate-100">{cumulativePoints} pts</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-neutral-800 mb-1.5">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${clampedProgress}%`,
                background: `linear-gradient(90deg, ${rankInfo.gradientFrom}, ${rankInfo.gradientTo})`,
                boxShadow: `0 0 8px ${rankInfo.strokeColor}80`,
              }}
            />
          </div>

          {/* Progress Stats */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
            <span>
              {rankInfo.isMaxRank
                ? 'Maximum tier reached'
                : `${rankInfo.pointsInLevel} / ${rankInfo.pointsNeededInLevel} to Lv.${rankInfo.level + 1}`}
            </span>
            <span className="font-mono font-bold text-pink-300">{clampedProgress}%</span>
          </div>

          {/* Bottom helper footnote */}
          <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[9px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Read stanzas & links to rank up
            </span>
            <span className="text-pink-400/80">Click to upload</span>
          </div>
        </div>
      )}
    </div>
  );
};
