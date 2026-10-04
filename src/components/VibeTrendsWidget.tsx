import React, { useMemo } from 'react';
import { Activity, Sparkles, Flame, SlidersHorizontal, Check, RefreshCw, Layers } from 'lucide-react';
import { Post } from '../types';
import { analyzePostVibe, VIBE_THEMES, VibeCategory, VibeAnalysisResult } from '../utils/sentiment';

interface VibeTrendsWidgetProps {
  posts: Post[];
  activeVibeFilter?: string | null;
  onSelectVibeFilter?: (vibeCategory: string | null) => void;
  className?: string;
}

export const VibeTrendsWidget: React.FC<VibeTrendsWidgetProps> = ({
  posts = [],
  activeVibeFilter = null,
  onSelectVibeFilter,
  className = '',
}) => {
  // Aggregate Vibe Scores across recent posts in real time
  const vibeAggregates = useMemo(() => {
    const categoryCounts: Record<VibeCategory, number> = {
      Ethereal: 0,
      Melancholic: 0,
      Energetic: 0,
      Contemplative: 0,
      Euphoric: 0,
      Nostalgic: 0,
      Cosmic: 0,
      Serene: 0,
    };

    let totalAnalyzed = 0;

    posts.forEach((post) => {
      const result: VibeAnalysisResult = analyzePostVibe(post.content, post.hashtags, post.mood);
      categoryCounts[result.category] += 1;
      totalAnalyzed += 1;
    });

    const safeTotal = totalAnalyzed || 1;

    // Rank categories by volume
    const sortedCategories = (Object.keys(categoryCounts) as VibeCategory[]).sort(
      (a, b) => categoryCounts[b] - categoryCounts[a]
    );

    const dominantCategory = sortedCategories[0];
    const dominantTheme = VIBE_THEMES[dominantCategory];
    const dominantCount = categoryCounts[dominantCategory];
    const dominantPercent = Math.round((dominantCount / safeTotal) * 100);

    const rankings = sortedCategories.map((cat) => {
      const theme = VIBE_THEMES[cat];
      const count = categoryCounts[cat];
      const percent = Math.round((count / safeTotal) * 100);
      return {
        category: cat,
        theme,
        count,
        percent,
      };
    });

    return {
      totalAnalyzed,
      dominantCategory,
      dominantTheme,
      dominantCount,
      dominantPercent,
      rankings,
    };
  }, [posts]);

  return (
    <div className={`relative group ${className}`} id="vibe-trends-sidebar-widget">
      {/* Ambient background glow */}
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-fuchsia-500/20 via-pink-400/20 to-purple-500/20 blur-md opacity-40 group-hover:opacity-65 transition-all duration-300 pointer-events-none" />

      <div className="relative bg-black/80 backdrop-blur-md border border-pink-500/40 rounded-2xl p-4 space-y-3 shadow.card-pink-glow">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-500/20 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold font-space-mono text-slate-100">
            <Activity className="w-4 h-4 text-pink-400 animate-pulse" />
            <span>Vibe Trends</span>
            <span className="px-1.5 py-0.2 rounded bg-pink-950 border border-pink-500/30 text-pink-300 text-[9px] font-mono">
              Live Feed
            </span>
          </div>

          {activeVibeFilter && (
            <button
              type="button"
              onClick={() => onSelectVibeFilter?.(null)}
              className="text-[10px] text-pink-300 hover:text-white bg-pink-950/80 border border-pink-500/40 px-2 py-0.5 rounded-full font-mono font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1"
              title="Clear Vibe Filter"
            >
              <span>✕</span>
              <span>Clear Filter</span>
            </button>
          )}
        </div>

        {/* Dominant Emotional Energy Hero Banner */}
        <div className={`p-3 rounded-xl border transition-all ${vibeAggregates.dominantTheme.bgClass} ${vibeAggregates.dominantTheme.borderClass} ${vibeAggregates.dominantTheme.glowClass}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl animate-bounce">{vibeAggregates.dominantTheme.emoji}</span>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 block">
                  Dominant Feed Energy
                </span>
                <h4 className="text-sm font-bold text-white font-space-mono flex items-center gap-1.5">
                  <span>{vibeAggregates.dominantTheme.label}</span>
                  <span className={`text-xs px-1.5 py-0.2 rounded-full bg-black/60 border border-white/20 ${vibeAggregates.dominantTheme.textClass}`}>
                    {vibeAggregates.dominantPercent}%
                  </span>
                </h4>
              </div>
            </div>
            <Sparkles className={`w-4 h-4 ${vibeAggregates.dominantTheme.textClass} shrink-0`} />
          </div>

          <p className="text-[11px] text-slate-300/90 leading-tight mt-1.5 font-light">
            {vibeAggregates.dominantTheme.description}
          </p>
        </div>

        {/* Active Filter Banner Hint */}
        {activeVibeFilter && (
          <div className="bg-pink-950/60 border border-pink-500/60 p-2 rounded-xl flex items-center justify-between text-xs shadow-sm">
            <span className="text-pink-200 text-[11px] font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-pink-400" />
              <span>Filtering feed by <strong>{activeVibeFilter}</strong></span>
            </span>
            <button
              type="button"
              onClick={() => onSelectVibeFilter?.(null)}
              className="text-[10px] text-pink-300 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Feed Vibes Distribution List */}
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-0.5">
            <span>Emotional Spectrum ({vibeAggregates.totalAnalyzed} posts)</span>
            <span>Feed Share</span>
          </div>

          {vibeAggregates.rankings.slice(0, 5).map((item) => {
            const isSelected = activeVibeFilter === item.category;

            return (
              <button
                key={item.category}
                type="button"
                onClick={() => {
                  if (onSelectVibeFilter) {
                    onSelectVibeFilter(isSelected ? null : item.category);
                  }
                }}
                className={`w-full text-left p-2 rounded-xl border transition-all cursor-pointer group/vibeitem ${
                  isSelected
                    ? `${item.theme.bgClass} ${item.theme.borderClass} ring-2 ring-pink-400/80 shadow-[0_0_12px_rgba(244,114,182,0.4)]`
                    : 'bg-neutral-900/80 hover:bg-neutral-900 border-pink-500/20 hover:border-pink-500/50'
                }`}
                title={`Click to filter feed by ${item.category} vibe posts (${item.count} posts)`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="text-sm group-hover/vibeitem:scale-110 transition-transform">{item.theme.emoji}</span>
                    <span className={`font-semibold ${isSelected ? 'text-white font-bold' : 'text-slate-200 group-hover/vibeitem:text-pink-300'}`}>
                      {item.theme.label}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-pink-500 text-black text-[9px] font-bold">
                        <Check className="w-2.5 h-2.5 mr-0.5" /> Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className="text-slate-400">{item.count} posts</span>
                    <span className={`font-bold ${item.theme.textClass}`}>{item.percent}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${item.theme.gradientText}`}
                    style={{ width: `${Math.max(item.percent, 3)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-pink-500/10">
          <span className="flex items-center gap-1">
            <RefreshCw className="w-2.5 h-2.5 text-pink-400" />
            <span>Updated real-time</span>
          </span>
          <span>Keyword Sentiment AI</span>
        </div>
      </div>
    </div>
  );
};
