import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Sparkles,
  ArrowRight,
  X,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Heart,
  UserCheck,
} from 'lucide-react';
import { Post, User } from '../types';

interface PollCompatibilityAnimationProps {
  post: Post;
  currentUser: User;
  authorCompatibilityPercent?: number;
  delta: number;
  oldScore: number;
  newScore: number;
  votedOptionText: string;
  peerVoterNames?: string[];
  isAgreementWithAuthor?: boolean;
  isFriend?: boolean;
  onInspectCompatibility?: (userId: string) => void;
  onDismiss?: () => void;
  autoDismissMs?: number;
}

function getFriendshipTier(score: number): { title: string; color: string; bg: string } {
  if (score >= 92) return { title: 'Harmonic Soul Depth', color: 'text-amber-300', bg: 'bg-amber-950/80 border-amber-400/50' };
  if (score >= 84) return { title: 'Poetic & Aesthetic Twins', color: 'text-pink-300', bg: 'bg-pink-950/80 border-pink-400/50' };
  if (score >= 75) return { title: 'Aligned Cipher Companions', color: 'text-cyan-300', bg: 'bg-cyan-950/80 border-cyan-400/50' };
  if (score >= 65) return { title: 'Complementary Thinkers', color: 'text-purple-300', bg: 'bg-purple-950/80 border-purple-400/50' };
  return { title: 'Curious Depth Seekers', color: 'text-slate-300', bg: 'bg-neutral-900 border-slate-700' };
}

export const PollCompatibilityAnimation: React.FC<PollCompatibilityAnimationProps> = ({
  post,
  currentUser,
  delta,
  oldScore,
  newScore,
  votedOptionText,
  peerVoterNames = [],
  isFriend = false,
  onInspectCompatibility,
  onDismiss,
  autoDismissMs = 11000,
}) => {
  const [displayScore, setDisplayScore] = useState(oldScore);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setIsDismissed(false);
    setIsExpanded(true);
  }, [delta, oldScore, newScore]);

  const handleClose = (e?: React.MouseEvent | React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  const oldTier = getFriendshipTier(oldScore);
  const newTier = getFriendshipTier(newScore);
  const isTierUpgraded = oldTier.title !== newTier.title && newScore > oldScore;

  // Number ticker animation for friendship score count-up
  useEffect(() => {
    let start = oldScore;
    const end = newScore;
    if (start === end) {
      setDisplayScore(end);
      return;
    }

    const duration = 1400; // ms
    const startTime = performance.now();

    const animateNumber = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // ease-out cubic for realistic deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(start + (end - start) * eased);
      setDisplayScore(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animateNumber);
      }
    };

    const animFrame = requestAnimationFrame(animateNumber);
    return () => cancelAnimationFrame(animFrame);
  }, [oldScore, newScore]);

  // Auto-collapse after autoDismissMs
  useEffect(() => {
    if (autoDismissMs <= 0) return;
    const timer = setTimeout(() => {
      setIsExpanded(false);
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs]);

  const isPositive = delta >= 0;

  if (isDismissed) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.92, filter: 'blur(4px)' }}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      className="relative z-20 my-3 rounded-2xl overflow-hidden border-2 border-pink-400/80 bg-neutral-950/95 shadow-[0_0_35px_rgba(244,114,182,0.35),0_12px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl"
    >
      {/* Moving iridescent light sweep */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ duration: 1.8, ease: 'easeInOut', repeat: 1, repeatDelay: 3 }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-400/15 to-transparent skew-x-12 pointer-events-none"
      />

      {/* Atmospheric ambient glow */}
      <div className="absolute -top-12 -left-12 w-36 h-36 bg-pink-500/25 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header: Friendship Resonance Surge */}
      <div className="relative px-4 py-3 flex items-center justify-between gap-3 border-b border-pink-500/25 bg-gradient-to-r from-pink-950/70 via-purple-950/50 to-cyan-950/60">
        <div 
          onClick={handleClose}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer group/title hover:opacity-90 transition-opacity"
          title="Click to close Friendship Resonance animation"
        >
          <motion.div
            animate={{
              scale: [1, 1.25, 0.95, 1.15, 1],
              rotate: [0, -8, 8, -4, 0],
            }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className="w-8 h-8 rounded-xl bg-pink-500/30 border border-pink-400 flex items-center justify-center text-pink-300 shadow-[0_0_14px_rgba(244,114,182,0.7)] shrink-0"
          >
            <Heart className="w-4 h-4 fill-pink-400 text-pink-300 animate-pulse" />
          </motion.div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-pink-200 tracking-wide uppercase group-hover/title:text-white transition-colors">
                Friendship Resonance Surge
              </span>
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.22, 1], opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-pink-500/30 border border-pink-400 text-pink-200 shadow-[0_0_10px_rgba(244,114,182,0.5)]"
              >
                <Sparkles className="w-2.5 h-2.5 text-pink-300" />
                {isPositive ? `+${delta}%` : `${delta}%`} Affinity
              </motion.span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              {post.authorId !== currentUser.id ? (
                <>
                  {isFriend ? 'Friendship reinforced with ' : 'Friendship connection sparked with '}
                  <span className="text-pink-300 font-semibold">{post.authorName}</span>
                </>
              ) : (
                <>Community Deep Poll Alignment</>
              )}
            </p>
          </div>
        </div>

        {/* Score Ticker & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Animated Score Progression Indicator */}
          <div 
            onClick={handleClose}
            className="flex items-center gap-1.5 font-mono bg-black/70 px-2.5 py-1 rounded-xl border border-pink-500/40 shadow-inner cursor-pointer hover:border-pink-400/80 transition-colors"
            title="Click to close Friendship Resonance animation"
          >
            <span className="text-xs text-slate-400 line-through">
              {oldScore}%
            </span>
            <span className="text-xs text-slate-500">➔</span>
            <motion.span
              key={displayScore}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.3 }}
              className="text-sm font-extrabold text-white drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]"
            >
              {displayScore}%
            </motion.span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1.5 rounded-xl hover:bg-neutral-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse breakdown' : 'Expand breakdown'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-900/90 hover:bg-pink-800 active:bg-pink-950 border border-pink-400/80 hover:border-pink-300 text-pink-100 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(236,72,153,0.4)] hover:scale-105 active:scale-95 z-30"
            title="Close Friendship Resonance animation"
            aria-label="Close Friendship Resonance animation"
          >
            <span>Close</span>
            <X className="w-3.5 h-3.5 text-pink-200" />
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="px-4 py-3 space-y-3 relative text-xs"
          >
            {/* Visual Dual Avatar Friendship Resonance Bridge */}
            {post.authorId !== currentUser.id && (
              <div className="p-3 rounded-2xl bg-black/60 border border-pink-500/30 flex items-center justify-between relative overflow-hidden shadow-inner">
                {/* User Avatar */}
                <div className="flex flex-col items-center z-10 shrink-0">
                  <div className="relative">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-11 h-11 rounded-2xl object-cover ring-2 ring-pink-500/80 shadow-[0_0_12px_rgba(244,114,182,0.6)]"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-pink-500 border border-white flex items-center justify-center text-[9px] text-white font-bold"
                    >
                      ⚡
                    </motion.div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-200 mt-1.5">{currentUser.name.split(' ')[0]}</span>
                  <span className="text-[9px] font-mono text-pink-300">You</span>
                </div>

                {/* Animated Connection Beam */}
                <div className="flex-1 px-3 flex flex-col items-center justify-center relative z-10">
                  <div className="relative w-full flex items-center justify-center h-8">
                    {/* Beam Track */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-pink-500/50 via-purple-500/60 to-cyan-500/50 rounded-full" />

                    {/* Photon Light Pulse */}
                    <motion.div
                      animate={{ x: ['-45%', '45%', '-45%'] }}
                      transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                      className="absolute w-8 h-1 bg-gradient-to-r from-transparent via-white to-transparent rounded-full shadow-[0_0_10px_#ffffff]"
                    />

                    {/* Central Resonance Badge */}
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1.8 }}
                      onClick={handleClose}
                      className="relative z-10 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-950 via-neutral-900 to-cyan-950 border border-pink-400 text-[10px] font-mono font-bold text-pink-200 shadow-[0_0_12px_rgba(244,114,182,0.7)] flex items-center gap-1 cursor-pointer hover:border-pink-300 hover:scale-105 transition-all"
                      title="Click to close resonance animation"
                    >
                      <Zap className="w-2.5 h-2.5 text-pink-400 fill-pink-400" />
                      <span>+{delta}% Resonance</span>
                    </motion.div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    {isFriend ? (
                      <span className="text-pink-300 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-pink-400" />
                        <span>Inner Circle Friends</span>
                      </span>
                    ) : (
                      <span className="text-cyan-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>Emerging Friendship Synergy</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Author Avatar */}
                <div className="flex flex-col items-center z-10 shrink-0">
                  <div className="relative">
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      className="w-11 h-11 rounded-2xl object-cover ring-2 ring-cyan-500/80 shadow-[0_0_12px_rgba(34,211,238,0.6)]"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 border border-white flex items-center justify-center text-[9px] text-white font-bold"
                    >
                      🤝
                    </motion.div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-200 mt-1.5">{post.authorName.split(' ')[0]}</span>
                  <span className="text-[9px] font-mono text-cyan-300">
                    {isFriend ? 'Friend' : 'Peer'}
                  </span>
                </div>
              </div>
            )}

            {/* Friendship Tier Evolution Banner */}
            <div 
              onClick={handleClose}
              className="flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-cyan-950/40 border border-pink-500/20 text-[11px] font-mono cursor-pointer hover:border-pink-500/40 transition-colors"
              title="Click to close compatibility animation"
            >
              <span className="text-slate-400">Friendship Vibe Tier:</span>
              <div className="flex items-center gap-1.5">
                {isTierUpgraded ? (
                  <>
                    <span className="line-through text-slate-500">{oldTier.title}</span>
                    <span className="text-slate-400">➔</span>
                    <motion.span
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: 3, duration: 0.4 }}
                      className={`font-bold ${newTier.color}`}
                    >
                      {newTier.title} 🎉
                    </motion.span>
                  </>
                ) : (
                  <span className={`font-semibold ${newTier.color}`}>{newTier.title}</span>
                )}
              </div>
            </div>

            {/* Animated Dual Progress Bar */}
            <div 
              onClick={handleClose}
              className="space-y-1.5 cursor-pointer p-1.5 -mx-1.5 rounded-xl hover:bg-pink-950/20 transition-colors group/depth-bar"
              title="Click to close compatibility depth animation"
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Baseline Friendship Depth ({oldScore}%)</span>
                <span className="text-pink-300 font-bold flex items-center gap-1 group-hover/depth-bar:text-white transition-colors">
                  <span>Updated Depth ({newScore}%)</span>
                  <span className="text-emerald-400 font-extrabold">+{delta}%</span>
                </span>
              </div>

              {/* Progress Track */}
              <div className="relative h-3 w-full bg-neutral-900 rounded-full overflow-hidden p-0.5 border border-pink-500/30">
                {/* Old Baseline Bar */}
                <div
                  className="absolute inset-y-0.5 left-0.5 rounded-full bg-gradient-to-r from-pink-800 to-purple-800 opacity-60 transition-all duration-300"
                  style={{ width: `${Math.min(100, oldScore)}%` }}
                />

                {/* Animated Growing Bar (Old to New) */}
                <motion.div
                  initial={{ width: `${Math.min(100, oldScore)}%` }}
                  animate={{ width: `${Math.min(100, newScore)}%` }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-y-0.5 left-0.5 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-400 to-cyan-400 shadow-[0_0_14px_rgba(244,114,182,0.9)]"
                >
                  {/* Glowing Pulse Cursor at Head */}
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="absolute right-0 top-0 bottom-0 w-2 rounded-r-full bg-white shadow-[0_0_8px_#ffffff]"
                  />
                </motion.div>
              </div>
            </div>

            {/* Friendship Alignment Explanation Card */}
            <div className="p-2.5 rounded-xl bg-black/50 border border-pink-500/25 space-y-1.5">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 shrink-0 mt-0.5" />
                <p className="text-slate-200 text-[11px] leading-relaxed">
                  You voted for <span className="text-pink-300 font-semibold italic">"{votedOptionText}"</span>. 
                  {post.authorId !== currentUser.id ? (
                    <> Participating in <span className="font-semibold text-slate-100">{post.authorName}</span>'s deep inquiry registered authentic intellectual alignment, deepening your friendship synergy by <span className="font-bold text-emerald-300">+{delta}%</span>.</>
                  ) : (
                    <> Community members exploring your deep poll strengthen shared friendship depth across the stream.</>
                  )}
                </p>
              </div>

              {/* Circle Friends Alignment Highlight */}
              {peerVoterNames.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
                  <Users className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>
                    Inner Circle Consensus: <span className="font-semibold">{peerVoterNames.join(', ')}</span> also voted for this option, generating mutual circle harmony!
                  </span>
                </div>
              )}
            </div>

            {/* Action Row */}
            <div className="flex items-center justify-between pt-1 border-t border-pink-500/20">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-1.5 text-[11px] text-pink-300/80 hover:text-white font-mono font-medium hover:underline cursor-pointer transition-colors"
                title="Dismiss animation"
              >
                <X className="w-3.5 h-3.5 text-pink-400" />
                <span>Dismiss animation</span>
              </button>

              {post.authorId !== currentUser.id && onInspectCompatibility && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInspectCompatibility(post.authorId);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-pink-600/30 hover:bg-pink-600/50 border border-pink-400/60 hover:border-pink-300 text-pink-200 hover:text-white font-mono text-[11px] font-bold transition-all shadow-[0_0_10px_rgba(244,114,182,0.3)] cursor-pointer"
                >
                  <span>View Friendship Breakdown</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
