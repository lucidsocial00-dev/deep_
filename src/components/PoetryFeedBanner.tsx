import React from 'react';
import { Feather, Sparkles, X, PlusCircle, Bookmark } from 'lucide-react';

interface PoetryFeedBannerProps {
  postCount: number;
  onExitPoetryMode: () => void;
  onComposePoem?: () => void;
}

export const PoetryFeedBanner: React.FC<PoetryFeedBannerProps> = ({
  postCount,
  onExitPoetryMode,
  onComposePoem,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-pink-400/50 bg-gradient-to-r from-pink-950/90 via-purple-950/70 to-neutral-950/95 p-4 sm:p-5 shadow-[0_0_25px_rgba(236,72,153,0.25)] text-slate-100 my-4 backdrop-blur-xl">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-pink-500/25 border border-pink-400/60 flex items-center justify-center text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.5)] shrink-0 mt-0.5">
            <Feather className="w-5 h-5 text-pink-300 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Poetry Mode Active</span>
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-pink-500/25 text-pink-200 border border-pink-400/50 shadow-sm">
                <Sparkles className="w-3 h-3 text-pink-300" />
                <span>{postCount} {postCount === 1 ? 'Poem' : 'Poems'}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-pink-200/80 mt-1 leading-relaxed max-w-xl">
              Showing exclusive verse, rhyming stanzas, haikus, and lyrical spoken word across the stream.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          {onComposePoem && (
            <button
              type="button"
              onClick={onComposePoem}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 active:bg-pink-700 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(236,72,153,0.4)] border border-pink-400/40 cursor-pointer hover:scale-105"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Compose Poem</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExitPoetryMode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-slate-300 hover:text-white text-xs font-semibold border border-neutral-700 hover:border-pink-500/40 transition-all cursor-pointer"
            title="Exit Poetry Mode and view all posts"
          >
            <span>Exit Mode</span>
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
