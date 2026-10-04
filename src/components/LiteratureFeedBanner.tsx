import React from 'react';
import { BookOpen, FileText, X, PlusCircle, BookmarkCheck } from 'lucide-react';

interface LiteratureFeedBannerProps {
  postCount: number;
  onExitLiteratureMode: () => void;
  onComposeLiterature?: () => void;
}

export const LiteratureFeedBanner: React.FC<LiteratureFeedBannerProps> = ({
  postCount,
  onExitLiteratureMode,
  onComposeLiterature,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-400/50 bg-gradient-to-r from-amber-950/90 via-stone-950/80 to-neutral-950/95 p-4 sm:p-5 shadow-[0_0_25px_rgba(245,158,11,0.25)] text-slate-100 my-4 backdrop-blur-xl">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/25 border border-amber-400/60 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] shrink-0 mt-0.5">
            <BookOpen className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Literature Mode Active</span>
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/25 text-amber-200 border border-amber-400/50 shadow-sm">
                <FileText className="w-3 h-3 text-amber-300" />
                <span>{postCount} {postCount === 1 ? 'Work' : 'Works'}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-200/80 mt-1 leading-relaxed max-w-xl">
              Showing exclusive PDF documents, manuscripts, book excerpts, reading links, and deep scholarly articles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          {onComposeLiterature && (
            <button
              type="button"
              onClick={onComposeLiterature}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.4)] border border-amber-400/40 cursor-pointer hover:scale-105"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Attach PDF / Link</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExitLiteratureMode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-slate-300 hover:text-white text-xs font-semibold border border-neutral-700 hover:border-amber-500/40 transition-all cursor-pointer"
            title="Exit Literature Mode and view all posts"
          >
            <span>Exit Mode</span>
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
