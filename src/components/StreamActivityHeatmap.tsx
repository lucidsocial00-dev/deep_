import React, { useMemo, useState } from 'react';
import { Flame, Zap, Activity, TrendingUp, Radio } from 'lucide-react';
import { HashtagGroup, HashtagTrend, Post } from '../types';

export type ActivityLevel = 'surge' | 'high' | 'moderate' | 'calm';

export interface StreamActivityStats {
  heatScore: number; // 0 - 100
  level: ActivityLevel;
  levelLabel: string;
  levelColor: string;
  postsCount: number;
  recentPostsCount: number;
  totalReactions: number;
  sparkline: number[]; // 8 data points representing normalized 24h activity
  hourlyDistribution: number[]; // 6 bucket heat blocks (0 to 4 intensity)
  velocityLabel: string;
}

interface StreamActivityHeatmapProps {
  tag: string;
  allPosts?: Post[];
  group?: HashtagGroup;
  trend?: HashtagTrend;
  size?: 'sm' | 'md' | 'lg' | 'compact' | 'badge';
  showSparkline?: boolean;
  showPulse?: boolean;
  showScore?: boolean;
  className?: string;
}

/**
 * Calculates a deterministically reactive activity score and distribution
 * for a hashtag stream based on existing stanzas, recency, member volume, and engagement.
 */
export function calculateStreamActivityStats(
  tag: string,
  allPosts: Post[] = [],
  group?: HashtagGroup,
  trend?: HashtagTrend
): StreamActivityStats {
  const clean = tag.replace(/^#+/, '').toLowerCase();

  // 1. Filter posts belonging to this stream
  const streamPosts = allPosts.filter((p) =>
    p.hashtags.some((h) => h.replace(/^#+/, '').toLowerCase() === clean)
  );

  const postsCount = streamPosts.length;
  const membersCount = group?.memberIds?.length || (trend ? Math.round(trend.postCount / 1.5) : 3);
  const isHot = Boolean(group?.isHot || trend?.isHot);

  // 2. Sum reactions
  const totalReactions = streamPosts.reduce(
    (acc, p) => acc + (p.likesCount || 0) + (p.commentsCount || 0) + (p.dislikesCount || 0),
    0
  );

  // 3. Count recent posts (synthetic / realistic time weighting)
  const recentPostsCount = streamPosts.filter((p) => {
    const t = p.timestamp?.toLowerCase() || '';
    return (
      t.includes('m ago') ||
      t.includes('h ago') ||
      t.includes('just now') ||
      t.includes('today') ||
      t.includes('1d ago')
    );
  }).length;

  // 4. Calculate comprehensive heat score (0 - 100)
  // Seed with deterministic tag character values to provide smooth baseline variation
  let charSeed = 0;
  for (let i = 0; i < clean.length; i++) {
    charSeed += clean.charCodeAt(i) * (i + 1);
  }
  const baselineOffset = (charSeed % 28) + 12; // 12 - 40 baseline

  let rawScore =
    baselineOffset +
    postsCount * 12 +
    recentPostsCount * 15 +
    membersCount * 2.5 +
    Math.min(totalReactions * 1.8, 25) +
    (isHot ? 22 : 0);

  const heatScore = Math.min(Math.max(Math.round(rawScore), 18), 99);

  // 5. Determine level & theme
  let level: ActivityLevel = 'calm';
  let levelLabel = 'Steady Flow';
  let levelColor = 'text-sky-400';
  let velocityLabel = 'Ambient rhythm';

  if (heatScore >= 80) {
    level = 'surge';
    levelLabel = 'Surging Heat';
    levelColor = 'text-pink-400';
    velocityLabel = `High Traffic • +${Math.max(recentPostsCount, 3)} active verses`;
  } else if (heatScore >= 60) {
    level = 'high';
    levelLabel = 'High Activity';
    levelColor = 'text-fuchsia-400';
    velocityLabel = `Vibrant • +${Math.max(recentPostsCount, 2)} active verses`;
  } else if (heatScore >= 38) {
    level = 'moderate';
    levelLabel = 'Active Flow';
    levelColor = 'text-cyan-400';
    velocityLabel = `Moderate • +${Math.max(recentPostsCount, 1)} active verses`;
  } else {
    level = 'calm';
    levelLabel = 'Ambient Haven';
    levelColor = 'text-sky-300';
    velocityLabel = 'Quiet & serene stream';
  }

  // 6. Generate 8-point 24h activity curve
  const sparkline: number[] = [];
  const count = 8;
  for (let i = 0; i < count; i++) {
    const wave = Math.sin((i / count) * Math.PI + (charSeed % 5)) * 0.4 + 0.6;
    const jitter = ((charSeed * (i + 7)) % 25) / 100;
    const progressFactor = 0.4 + (i / count) * 0.6; // upward trend toward present
    const val = Math.round(
      Math.min(
        Math.max((heatScore * 0.65 * wave + jitter * 40) * progressFactor + (i === count - 1 ? 15 : 0), 10),
        100
      )
    );
    sparkline.push(val);
  }

  // 7. Generate 6 mini heatmap matrix buckets (0 = low, 1 = med-low, 2 = med, 3 = high, 4 = surge)
  const hourlyDistribution: number[] = sparkline.slice(2).map((val) => {
    if (val > 80) return 4;
    if (val > 60) return 3;
    if (val > 40) return 2;
    if (val > 20) return 1;
    return 0;
  });

  return {
    heatScore,
    level,
    levelLabel,
    levelColor,
    postsCount,
    recentPostsCount,
    totalReactions,
    sparkline,
    hourlyDistribution,
    velocityLabel,
  };
}

export const StreamActivityHeatmap: React.FC<StreamActivityHeatmapProps> = ({
  tag,
  allPosts = [],
  group,
  trend,
  size = 'md',
  showSparkline = true,
  showPulse = true,
  showScore = true,
  className = '',
}) => {
  const [showDetailsTooltip, setShowDetailsTooltip] = useState(false);

  const stats = useMemo(
    () => calculateStreamActivityStats(tag, allPosts, group, trend),
    [tag, allPosts, group, trend]
  );

  // SVG Sparkline dimensions based on size
  const svgWidth = size === 'sm' || size === 'compact' ? 52 : size === 'lg' ? 84 : 64;
  const svgHeight = size === 'sm' || size === 'compact' ? 18 : size === 'lg' ? 26 : 22;

  // Build SVG polyline points
  const points = useMemo(() => {
    const minVal = 0;
    const maxVal = 100;
    const step = svgWidth / (stats.sparkline.length - 1);

    return stats.sparkline
      .map((val, idx) => {
        const x = idx * step;
        const normalizedY = ((val - minVal) / (maxVal - minVal)) * (svgHeight - 4);
        const y = svgHeight - normalizedY - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [stats.sparkline, svgWidth, svgHeight]);

  // Polygon for gradient area underneath sparkline
  const areaPoints = useMemo(() => {
    const minVal = 0;
    const maxVal = 100;
    const step = svgWidth / (stats.sparkline.length - 1);

    const mainPts = stats.sparkline.map((val, idx) => {
      const x = idx * step;
      const normalizedY = ((val - minVal) / (maxVal - minVal)) * (svgHeight - 4);
      const y = svgHeight - normalizedY - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `0,${svgHeight} ${mainPts.join(' ')} ${svgWidth},${svgHeight}`;
  }, [stats.sparkline, svgWidth, svgHeight]);

  // Badge size display
  if (size === 'badge') {
    return (
      <div
        className={`relative inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-mono font-semibold transition-all ${
          stats.level === 'surge'
            ? 'bg-pink-950/80 border-pink-500/60 text-pink-300 shadow-[0_0_10px_rgba(244,114,182,0.35)]'
            : stats.level === 'high'
            ? 'bg-fuchsia-950/70 border-fuchsia-500/50 text-fuchsia-300'
            : stats.level === 'moderate'
            ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
            : 'bg-neutral-900 border-slate-700 text-slate-300'
        } ${className}`}
        title={`Live Activity Heat: ${stats.heatScore}% • ${stats.levelLabel}`}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              stats.level === 'surge'
                ? 'bg-pink-400'
                : stats.level === 'high'
                ? 'bg-fuchsia-400'
                : stats.level === 'moderate'
                ? 'bg-cyan-400'
                : 'bg-sky-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              stats.level === 'surge'
                ? 'bg-pink-500'
                : stats.level === 'high'
                ? 'bg-fuchsia-500'
                : stats.level === 'moderate'
                ? 'bg-cyan-500'
                : 'bg-sky-500'
            }`}
          />
        </span>
        <span>{stats.heatScore}% Heat</span>
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center gap-2 group/heatmap ${className}`}
      onMouseEnter={() => setShowDetailsTooltip(true)}
      onMouseLeave={() => setShowDetailsTooltip(false)}
    >
      {/* Pulsing Beacon */}
      {showPulse && (
        <div className="relative flex items-center justify-center shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-80 duration-1000 ${
                stats.level === 'surge'
                  ? 'bg-pink-400 shadow-[0_0_8px_#f472b6]'
                  : stats.level === 'high'
                  ? 'bg-fuchsia-400 shadow-[0_0_8px_#e879f9]'
                  : stats.level === 'moderate'
                  ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]'
                  : 'bg-sky-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 border border-black/40 ${
                stats.level === 'surge'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500'
                  : stats.level === 'high'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500'
                  : stats.level === 'moderate'
                  ? 'bg-cyan-500'
                  : 'bg-sky-500'
              }`}
            />
          </span>
        </div>
      )}

      {/* Sparkline Waveform or Mini Heatmap Matrix */}
      {showSparkline && (
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={`p-0.5 rounded-lg border bg-black/70 backdrop-blur-sm transition-all flex items-center ${
              stats.level === 'surge'
                ? 'border-pink-500/50 shadow-[0_0_10px_rgba(244,114,182,0.25)]'
                : stats.level === 'high'
                ? 'border-fuchsia-500/40 shadow-[0_0_8px_rgba(232,121,249,0.2)]'
                : stats.level === 'moderate'
                ? 'border-cyan-500/30'
                : 'border-slate-800'
            }`}
          >
            <svg width={svgWidth} height={svgHeight} className="overflow-visible">
              <defs>
                <linearGradient id={`sparkGrad-${tag}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={
                      stats.level === 'surge'
                        ? '#f472b6'
                        : stats.level === 'high'
                        ? '#e879f9'
                        : stats.level === 'moderate'
                        ? '#22d3ee'
                        : '#38bdf8'
                    }
                    stopOpacity="0.45"
                  />
                  <stop
                    offset="100%"
                    stopColor={
                      stats.level === 'surge'
                        ? '#db2777'
                        : stats.level === 'high'
                        ? '#c026d3'
                        : stats.level === 'moderate'
                        ? '#0891b2'
                        : '#0284c7'
                    }
                    stopOpacity="0.0"
                  />
                </linearGradient>
                <linearGradient id={`lineGrad-${tag}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop
                    offset="100%"
                    stopColor={
                      stats.level === 'surge'
                        ? '#f43f5e'
                        : stats.level === 'high'
                        ? '#ec4899'
                        : stats.level === 'moderate'
                        ? '#06b6d4'
                        : '#38bdf8'
                    }
                  />
                </linearGradient>
              </defs>

              {/* Area */}
              <polygon points={areaPoints} fill={`url(#sparkGrad-${tag})`} />

              {/* Line */}
              <polyline
                fill="none"
                stroke={`url(#lineGrad-${tag})`}
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />

              {/* Live End Dot */}
              {stats.sparkline.length > 0 && (
                <circle
                  cx={svgWidth}
                  cy={
                    svgHeight -
                    ((stats.sparkline[stats.sparkline.length - 1] / 100) * (svgHeight - 4) + 2)
                  }
                  r="2.2"
                  className={
                    stats.level === 'surge'
                      ? 'fill-pink-400 animate-pulse'
                      : stats.level === 'high'
                      ? 'fill-fuchsia-400'
                      : 'fill-cyan-400'
                  }
                />
              )}
            </svg>
          </div>

          {/* 6-Block Temporal Heat Matrix */}
          <div className="flex items-end gap-0.5 h-4 px-1 py-0.5 rounded bg-black/50 border border-pink-500/20" title="Recent activity heat intensity">
            {stats.hourlyDistribution.map((intensity, idx) => (
              <span
                key={idx}
                className={`w-1 rounded-xs transition-all ${
                  intensity === 4
                    ? 'h-3 bg-pink-500 shadow-[0_0_4px_#ec4899]'
                    : intensity === 3
                    ? 'h-2.5 bg-fuchsia-400'
                    : intensity === 2
                    ? 'h-2 bg-cyan-400/80'
                    : intensity === 1
                    ? 'h-1.5 bg-slate-500'
                    : 'h-1 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Heat Score / Text Indicator */}
      {showScore && (
        <div className="flex items-center gap-1">
          <span
            className={`font-mono text-xs font-bold tracking-tight ${
              stats.level === 'surge'
                ? 'text-pink-300'
                : stats.level === 'high'
                ? 'text-fuchsia-300'
                : stats.level === 'moderate'
                ? 'text-cyan-300'
                : 'text-slate-300'
            }`}
          >
            {stats.heatScore}%
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">Heat</span>
        </div>
      )}

      {/* Popover Hover Tooltip */}
      {showDetailsTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 p-2.5 rounded-xl bg-neutral-950/95 border border-pink-500/50 shadow-[0_0_20px_rgba(244,114,182,0.3)] backdrop-blur-md pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-pink-500/30 pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
              <span className="font-mono text-xs font-bold text-slate-100">#{tag} Real-Time Heat</span>
            </div>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                stats.level === 'surge'
                  ? 'bg-pink-500/30 text-pink-300 border border-pink-500/50'
                  : stats.level === 'high'
                  ? 'bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/50'
                  : stats.level === 'moderate'
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {stats.levelLabel}
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-300 font-sans">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Activity Index:</span>
              <span className="font-mono font-bold text-pink-300">{stats.heatScore} / 100</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Published Stanzas:</span>
              <span className="font-mono font-bold text-slate-200">{stats.postsCount} posts</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Recent Velocity:</span>
              <span className="font-mono text-cyan-300">{stats.velocityLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Community Engagement:</span>
              <span className="font-mono text-fuchsia-300">{stats.totalReactions} reactions</span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-pink-500/20 text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>24h Heat Waveform</span>
            <span className="text-pink-400">Live Pulse ●</span>
          </div>
        </div>
      )}
    </div>
  );
};
