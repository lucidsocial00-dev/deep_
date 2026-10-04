import React from 'react';
import {
  BookOpen,
  Clock,
  ExternalLink,
  Sparkles,
  Award,
  CheckCircle2,
  TrendingUp,
  Globe,
  Share2,
} from 'lucide-react';
import { ReadingLink } from '../types';
import { getPointsBreakdown } from '../utils/readingEstimator';

interface ReadingLinkCardProps {
  readingLink: ReadingLink;
  onReadLink: (link: ReadingLink) => void;
  isCompleted?: boolean;
  compact?: boolean;
  onHashtagClick?: (tag: string) => void;
  isInfected?: boolean;
}

export const ReadingLinkCard: React.FC<ReadingLinkCardProps> = ({
  readingLink,
  onReadLink,
  isCompleted = false,
  compact = false,
  onHashtagClick,
  isInfected = false,
}) => {
  const cleanTag = readingLink.hashtag.replace(/^#+/, '');
  const breakdown = getPointsBreakdown(readingLink.estimatedMinutes);

  // Difficulty badge colors
  const difficultyBadge = () => {
    switch (readingLink.difficulty) {
      case 'Longform Scholarly':
        return isInfected ? 'bg-lime-950/90 text-lime-200 border-lime-400/50' : 'bg-purple-950/80 text-purple-300 border-purple-500/40';
      case 'Deep Dive':
        return isInfected ? 'bg-lime-950/80 text-lime-300 border-lime-500/40' : 'bg-pink-950/80 text-pink-300 border-pink-500/40';
      case 'Moderate Read':
        return isInfected ? 'bg-lime-950/70 text-lime-400 border-lime-500/30' : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700/50';
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center justify-between gap-3 p-2.5 rounded-xl bg-neutral-900/90 border transition-all text-xs ${
        isInfected ? 'border-lime-400/40 hover:border-lime-400/80' : 'border-pink-500/30 hover:border-pink-500/60'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
            isInfected ? 'bg-lime-950/70 border-lime-400/50 text-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.3)]' : 'bg-pink-950/70 border-pink-500/40 text-pink-400'
          }`}>
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-slate-100 truncate">{readingLink.title}</h4>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
              <span className={`font-mono ${isInfected ? 'text-lime-400 font-bold' : 'text-pink-400'}`}>⏱️ {readingLink.readTimeFormatted || `${readingLink.estimatedMinutes}m read`}</span>
              <span>•</span>
              <span className={isInfected ? 'text-lime-300 font-semibold' : 'text-amber-300 font-semibold'}>+{readingLink.readingPoints} #{cleanTag} pts</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onReadLink(readingLink)}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            isCompleted
              ? 'bg-sky-950/80 border border-sky-500/50 text-sky-300'
              : isInfected
              ? 'bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-black font-bold shadow-[0_0_12px_rgba(163,230,53,0.4)]'
              : 'bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]'
          }`}
        >
          {isCompleted ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Read</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Read & Earn</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-neutral-900/95 border transition-all p-4 relative overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.4)] ${
      isInfected ? 'border-lime-400/60 hover:border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.2)]' : 'border-pink-500/35 hover:border-pink-500/60'
    }`}>
      {/* Subtle background glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-all ${
        isInfected ? 'bg-lime-500/10 group-hover:bg-lime-500/20' : 'bg-pink-500/5 group-hover:bg-pink-500/10'
      }`} />

      {/* Top Metadata Row */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Domain Favicon pill */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-950 border border-slate-800 text-[11px] text-slate-300 font-mono">
            <Globe className={`w-3 h-3 ${isInfected ? 'text-lime-400' : 'text-pink-400'}`} />
            {readingLink.domain}
          </span>

          {/* Reading Time Pill */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
            isInfected ? 'bg-lime-950/80 border border-lime-400/60 text-lime-300 shadow-[0_0_8px_rgba(163,230,53,0.2)]' : 'bg-pink-950/80 border border-pink-500/40 text-pink-300'
          }`}>
            <Clock className={`w-3 h-3 ${isInfected ? 'text-lime-400' : 'text-pink-400'}`} />
            {readingLink.readTimeFormatted || `${readingLink.estimatedMinutes} min read`}
          </span>

          {/* Difficulty Tag */}
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-medium ${difficultyBadge()}`}>
            {readingLink.difficulty}
          </span>
        </div>

        {/* Target Hashtag Group Points Bounty Pill */}
        <button
          onClick={() => onHashtagClick?.(cleanTag)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            isInfected
              ? 'bg-gradient-to-r from-lime-950/90 to-emerald-950/90 border border-lime-400/60 text-lime-300 hover:text-lime-200 shadow-[0_0_10px_rgba(163,230,53,0.3)]'
              : 'bg-gradient-to-r from-amber-950/70 to-pink-950/70 border border-amber-500/40 text-amber-300 hover:text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
          }`}
          title={`Earns points in #${cleanTag} stream`}
        >
          <Award className={`w-3.5 h-3.5 ${isInfected ? 'text-lime-400' : 'text-amber-400'}`} />
          <span>+{readingLink.readingPoints} pts in #{cleanTag}</span>
        </button>
      </div>

      {/* Title */}
      <h3 className={`text-sm sm:text-base font-bold text-slate-100 transition-colors line-clamp-2 mb-1.5 leading-snug ${
        isInfected ? 'group-hover:text-lime-200' : 'group-hover:text-pink-200'
      }`}>
        {readingLink.title}
      </h3>

      {/* Excerpt */}
      {readingLink.excerpt && (
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
          {readingLink.excerpt}
        </p>
      )}

      {/* Bottom Action Footer */}
      <div className={`pt-2.5 border-t flex items-center justify-between gap-3 text-xs ${
        isInfected ? 'border-lime-500/30' : 'border-pink-500/20'
      }`}>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>~{readingLink.wordCount.toLocaleString()} words</span>
          {readingLink.author && (
            <>
              <span>•</span>
              <span className="text-slate-300">By {readingLink.author}</span>
            </>
          )}
          <span>•</span>
          <span className={`font-mono ${isInfected ? 'text-lime-400/90 font-semibold' : 'text-pink-400/90'}`}>
            {breakdown.minutePoints}m pts {breakdown.depthBonus > 0 ? `+ ${breakdown.depthBonus} bonus` : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={readingLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
            title="Open external link in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => onReadLink(readingLink)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer text-xs ${
              isCompleted
                ? 'bg-sky-950/80 border border-sky-500/50 text-sky-300 hover:bg-sky-900/80'
                : isInfected
                ? 'bg-gradient-to-r from-lime-500 via-lime-400 to-emerald-500 text-black font-bold shadow-[0_0_15px_rgba(163,230,53,0.5)] hover:brightness-110'
                : 'bg-gradient-to-r from-pink-600 via-fuchsia-600 to-pink-600 hover:from-pink-500 hover:to-fuchsia-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)] hover:shadow-[0_0_16px_rgba(236,72,153,0.6)]'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Completed (+{readingLink.readingPoints})</span>
              </>
            ) : (
              <>
                <BookOpen className="w-3.5 h-3.5" />
                <span>Read (+{readingLink.readingPoints} pts)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
