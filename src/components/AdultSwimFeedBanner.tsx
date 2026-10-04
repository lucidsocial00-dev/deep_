import React from 'react';
import { ShieldAlert, Moon, Lock, Sparkles, X, PlusCircle, AlertCircle, Wine } from 'lucide-react';
import { motion } from 'motion/react';

interface AdultSwimFeedBannerProps {
  postCount: number;
  userAge?: number | null;
  onExitAdultSwim: () => void;
  onLockAgeGate: () => void;
  onComposePost?: () => void;
}

export const AdultSwimFeedBanner: React.FC<AdultSwimFeedBannerProps> = ({
  postCount,
  userAge,
  onExitAdultSwim,
  onLockAgeGate,
  onComposePost,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="relative overflow-hidden rounded-3xl bg-neutral-950 border-2 border-rose-600/40 p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_30px_rgba(225,29,72,0.2)] text-white mb-6"
    >
      {/* Late night aesthetic backlights */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* CRT Scanline Micro Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px]" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left branding and description */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xl sm:text-2xl font-black tracking-tighter text-white bg-black px-2.5 py-0.5 border border-neutral-700 rounded-lg shadow-inner">
              [adult swim]
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-950/90 text-rose-300 border border-rose-500/70 flex items-center gap-1 shadow-[0_0_10px_rgba(225,29,72,0.3)]">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              18+ Verified {userAge ? `(${userAge} yo)` : ''}
            </span>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-neutral-900 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Moon className="w-3 h-3 text-amber-400" />
              Midnight Stream
            </span>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-neutral-900 text-slate-300 border border-neutral-800">
              {postCount} late-night posts
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <span>After-Hours Uncensored Broadcast</span>
            <Wine className="w-4 h-4 text-rose-400" />
          </h3>

          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Raw, unfiltered confessions, nocturnal poetry, midnight stanzas, and unedited audio tapes. Viewer discretion is advised; you are verified to view mature audience streams.
          </p>
        </div>

        {/* Right action buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {onComposePost && (
            <button
              type="button"
              onClick={onComposePost}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)] flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Post to Adult Swim</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLockAgeGate}
            className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-slate-300 hover:text-white text-xs font-medium border border-neutral-800 hover:border-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Lock feed & require re-verification next time"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Lock Feed</span>
          </button>

          <button
            type="button"
            onClick={onExitAdultSwim}
            className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-slate-400 hover:text-slate-200 text-xs font-medium border border-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Return to standard global feed"
          >
            <X className="w-3.5 h-3.5" />
            <span>Exit Stream</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
