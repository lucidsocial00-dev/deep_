import React, { useState } from 'react';
import { Sparkles, Activity, Info } from 'lucide-react';
import { analyzePostVibe, VibeAnalysisResult } from '../utils/sentiment';

interface VibeScoreBadgeProps {
  content: string;
  hashtags?: string[];
  mood?: { label?: string; emoji?: string };
  isViral?: boolean;
  onVibeClick?: (vibeCategory: string) => void;
  className?: string;
}

export const VibeScoreBadge: React.FC<VibeScoreBadgeProps> = ({
  content,
  hashtags = [],
  mood,
  isViral = false,
  onVibeClick,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Analyze emotional sentiment of post content in real time
  const vibe: VibeAnalysisResult = analyzePostVibe(content, hashtags, mood);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip((prev) => !prev);
          if (onVibeClick) {
            onVibeClick(vibe.category);
          }
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border transition-all cursor-pointer hover:scale-105 active:scale-95 group/vibebadge ${
          vibe.bgClass
        } ${vibe.borderClass} ${vibe.textClass} ${vibe.pulseGlowClass} ${
          isViral ? 'ring-1 ring-lime-400/50' : ''
        }`}
        title={`Vibe Score: ${vibe.label} (${vibe.confidencePercent}% emotional intensity). Click to view sentiment breakdown.`}
      >
        {/* Subtle breathing pulse dot / icon */}
        <span className="relative flex h-2 w-2 items-center justify-center">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${vibe.textClass} bg-current`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${vibe.textClass} bg-current`} />
        </span>

        <span className="text-xs group-hover/vibebadge:scale-110 transition-transform">{vibe.emoji}</span>
        <span className="font-semibold text-white tracking-tight">{vibe.label}</span>
        <span className={`text-[10px] opacity-80 ${vibe.textClass}`}>{vibe.confidencePercent}%</span>
      </button>

      {/* Floating Real-Time Sentiment Breakdown Tooltip */}
      {showTooltip && (
        <div
          className="absolute left-0 bottom-full mb-2 z-50 w-64 p-3 rounded-2xl bg-black/95 backdrop-blur-xl border border-pink-500/40 shadow-[0_0_25px_rgba(244,114,182,0.35),0_10px_30px_rgba(0,0,0,0.8)] text-slate-100 space-y-2 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-pink-500/20 pb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold font-space-mono text-pink-300">
              <Activity className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
              <span>Real-Time Sentiment Analysis</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Keyword AI</span>
          </div>

          <p className="text-[11px] text-slate-300 leading-snug">
            {vibe.description}
          </p>

          <div className="space-y-1.5 pt-1">
            {/* Primary Vibe Bar */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                <span className="text-white flex items-center gap-1">
                  <span>{vibe.emoji}</span>
                  <span>{vibe.label} (Primary)</span>
                </span>
                <span className={vibe.textClass}>{vibe.confidencePercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${vibe.gradientText}`}
                  style={{ width: `${vibe.confidencePercent}%` }}
                />
              </div>
            </div>

            {/* Secondary Vibe Bar (if present) */}
            {vibe.secondaryVibe && (
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <span>{vibe.secondaryVibe.emoji}</span>
                    <span>{vibe.secondaryVibe.label} (Sub-tone)</span>
                  </span>
                  <span className="text-slate-400">{vibe.secondaryVibe.score}%</span>
                </div>
                <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="h-full rounded-full bg-slate-500"
                    style={{ width: `${vibe.secondaryVibe.score}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 text-[9px] font-mono text-slate-500 border-t border-neutral-800/80">
            <span className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-pink-400" />
              <span>Real-time sentiment score</span>
            </span>
            <span>Live Feed Vibe</span>
          </div>
        </div>
      )}
    </div>
  );
};
