import React, { useEffect } from 'react';
import {
  Sparkles,
  Heart,
  ThumbsDown,
  X,
  UserPlus,
  UserCheck,
  MessageSquare,
  Hash,
  BookOpen,
  Share2,
  ShieldCheck,
  Zap,
  Radio,
  BarChart2,
} from 'lucide-react';
import { CompatibilityResult, PDFDocument, Post, User } from '../types';

interface CompatibilityModalProps {
  isOpen?: boolean;
  onClose: () => void;
  result?: CompatibilityResult | null;
  compatibility?: CompatibilityResult | null;
  targetUser?: User | null;
  currentUser?: User;
  isFriend?: boolean;
  onAddFriend?: (userId: string, userName: string) => void;
  onOpenPdf?: (doc: PDFDocument) => void;
  onStartChat?: (user: User) => void;
  onShareToChat?: (item: Post | PDFDocument) => void;
}

export const CompatibilityModal: React.FC<CompatibilityModalProps> = ({
  isOpen = true,
  onClose,
  result,
  compatibility,
  targetUser: propTargetUser,
  currentUser: propCurrentUser,
  isFriend: propIsFriend,
  onAddFriend,
  onOpenPdf,
  onStartChat,
}) => {
  // Listen for Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const activeResult = result || compatibility;
  if (!isOpen || !activeResult) return null;

  const targetUser = propTargetUser || activeResult.userB;
  const currentUser = propCurrentUser || activeResult.userA;
  const isAlreadyFriend =
    propIsFriend !== undefined
      ? propIsFriend
      : currentUser?.friends?.includes(targetUser.id) ?? false;

  const { matchPercentage, mutualLikedPosts = [], mutualDislikedPosts = [], synergyHighlights, aiVibeTitle } = activeResult;

  // Circumference for radial progress ring (radius 42)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (matchPercentage / 100) * circumference;

  // Percentage color gradient selection
  const isHighMatch = matchPercentage >= 85;
  const isMediumMatch = matchPercentage >= 70;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-neutral-950/95 backdrop-blur-2xl border-2 border-pink-400/80 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(244,114,182,0.35),0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden text-slate-100 max-h-[90vh] flex flex-col cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Subtle decorative background glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-pink-500/30 relative z-10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-400/50 flex items-center justify-center text-pink-300 shadow-[0_0_10px_rgba(244,114,182,0.4)]">
              <Zap className="w-4 h-4 text-pink-400 fill-pink-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-1.5">
                <span>Friend Compatibility</span>
              </h3>
              <p className="text-[11px] text-slate-400">Zero-knowledge depth score & reaction affinity</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-pink-500/30 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 relative z-10 pr-1">
          
          {/* Main Hero: User Avatars & Radial Progress Gauge */}
          <div className="bg-black/40 border border-pink-500/30 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(236,72,153,0.15)]">
            
            <div className="flex items-center justify-between w-full max-w-sm px-2 mb-4">
              {/* Current User */}
              <div className="flex flex-col items-center text-center space-y-1">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-pink-500/60 shadow-md"
                />
                <span className="font-bold text-xs text-slate-200 mt-1">{currentUser.name}</span>
                <span className="text-[10px] text-pink-300 font-mono">You</span>
              </div>

              {/* Radial Percentage Gauge in Center */}
              <div className="relative flex flex-col items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="7"
                    className="text-neutral-900"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    stroke="url(#pinkCyanGradient)"
                    strokeWidth="7"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="pinkCyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-extrabold text-2xl font-mono text-white tracking-tight drop-shadow-[0_0_10px_rgba(244,114,182,0.7)]">
                    {matchPercentage}%
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-pink-300 font-bold">Match</span>
                </div>
              </div>

              {/* Target User */}
              <div className="flex flex-col items-center text-center space-y-1">
                <img
                  src={targetUser.avatar}
                  alt={targetUser.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-cyan-500/60 shadow-md"
                />
                <span className="font-bold text-xs text-slate-200 mt-1">{targetUser.name}</span>
                <span className="text-[10px] text-cyan-300 font-mono">{targetUser.handle}</span>
              </div>
            </div>

            {/* Vibe Title Pill */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-950/80 via-neutral-900 to-cyan-950/80 border border-pink-400/60 text-xs font-bold text-pink-200 shadow-[0_0_12px_rgba(244,114,182,0.3)]">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>{aiVibeTitle || (isHighMatch ? 'Harmonic Soul Depth' : isMediumMatch ? 'Aligned Companion' : 'Emerging Depth Score')}</span>
            </div>

          </div>

          {/* Synergy Highlights Checklist */}
          {synergyHighlights && synergyHighlights.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>Why You Are Compatible</span>
              </h4>
              <div className="bg-black/50 border border-pink-500/30 rounded-2xl p-3.5 space-y-2">
                {synergyHighlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 shrink-0 shadow-[0_0_6px_rgba(244,114,182,0.8)]" />
                    <span className="leading-relaxed">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subscribed Streams & Channel Depth Score */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-pink-400" />
                <span>Profile Streams & Channel Depth Score</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {(targetUser.joinedGroupTags || []).length} Channels Subscribed
              </span>
            </h4>
            
            <div className="bg-black/60 border border-pink-500/30 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {(targetUser.joinedGroupTags || ['poetry', 'encrypted', 'kyoto']).map((tag, idx) => {
                  const isMutual = (currentUser.joinedGroupTags || ['poetry', 'encrypted', 'kyoto', 'mates']).some(
                    (myTag) => myTag.toLowerCase() === tag.toLowerCase()
                  );
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border ${
                        isMutual
                          ? 'bg-pink-950/80 border-pink-400 text-pink-200 shadow-[0_0_8px_rgba(244,114,182,0.3)]'
                          : 'bg-neutral-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      <Hash className="w-3 h-3 text-pink-400" />
                      <span>{tag}</span>
                      {isMutual && (
                        <span className="text-[9px] bg-pink-500/30 text-pink-300 px-1 py-0.2 rounded font-sans font-bold">
                          Mutual
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400">
                Shared hashtag streams allow both profiles to synchronize encrypted feeds and poetic circles.
              </p>
            </div>
          </div>

          {/* Metric Breakdown Cards: Likes vs Dislikes Affinity vs Poll Consensus */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-neutral-950/90 border border-pink-500/30 rounded-2xl p-3 space-y-1 text-center">
              <div className="flex items-center justify-center gap-1 text-pink-400">
                <Heart className="w-4 h-4 fill-pink-400" />
                <span className="font-bold text-base font-mono">{mutualLikedPosts.length}</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-300">Mutual Likes</p>
              <p className="text-[10px] text-slate-400">Poetry & essays</p>
            </div>

            <div className="bg-neutral-950/90 border border-cyan-500/30 rounded-2xl p-3 space-y-1 text-center">
              <div className="flex items-center justify-center gap-1 text-cyan-400">
                <ThumbsDown className="w-4 h-4 fill-cyan-400" />
                <span className="font-bold text-base font-mono">{mutualDislikedPosts.length}</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-300">Mutual Dislikes</p>
              <p className="text-[10px] text-slate-400">Filtered noise</p>
            </div>

            <div className="bg-neutral-950/90 border border-emerald-500/30 rounded-2xl p-3 space-y-1 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-400">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-base font-mono">
                  {result.pollAgreementsCount || (result.pollAlignments || []).length}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-300">Poll Consensus</p>
              <p className="text-[10px] text-emerald-400 font-mono">
                +{result.pollBonusPercentage || 0}% match
              </p>
            </div>
          </div>

          {/* Community Poll Consensus & Dialectics Breakdown */}
          {result.pollAlignments && result.pollAlignments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Community Poll Consensus ({result.pollAlignments.length})</span>
                </span>
                <span className="text-[10px] text-emerald-300 font-mono bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  +{result.pollBonusPercentage || 0}% Match Bonus
                </span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {result.pollAlignments.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border text-xs space-y-1.5 transition-all ${
                      item.isAgreement
                        ? 'bg-emerald-950/30 border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.12)]'
                        : 'bg-neutral-900/60 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-200 line-clamp-1">"{item.question}"</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                          item.isAgreement
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {item.isAgreement ? `Consensus (+${item.scoreImpact}%)` : 'Debate'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-mono">You chose:</span>
                        <span className="text-pink-300 font-medium">{item.userAChoice}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-mono">{targetUser.name}:</span>
                        <span className={item.isAgreement ? 'text-emerald-300 font-medium' : 'text-slate-300'}>
                          {item.userBChoice}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mutual Liked Sample Excerpts */}
          {mutualLikedPosts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Shared Favorites ({mutualLikedPosts.length})</span>
                <span className="text-[10px] text-pink-400 font-mono">Both Reacted ❤️</span>
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {mutualLikedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-2.5 rounded-xl bg-neutral-900/80 border border-pink-500/20 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-300">{post.authorName}</span>
                      <span>{post.timestamp}</span>
                    </div>
                    <p className="text-slate-200 line-clamp-2 italic font-serif">"{post.content}"</p>
                    {post.document && onOpenPdf && (
                      <button
                        onClick={() => onOpenPdf(post.document!)}
                        className="text-[10px] text-cyan-300 hover:text-white underline flex items-center gap-1 mt-1"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>View Attached PDF: {post.document.title}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mutual Dislikes (Bonding over shared filtered noise) */}
          {mutualDislikedPosts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Shared Disliked Topics ({mutualDislikedPosts.length})</span>
                <span className="text-[10px] text-cyan-400 font-mono">Both Filtered 👎</span>
              </h4>
              <div className="p-3 rounded-xl bg-neutral-900/70 border border-cyan-500/20 text-xs text-slate-300 space-y-1">
                <p className="text-[11px] leading-relaxed">
                  You both rejected superficial algorithmic posts, creating a stronger authentic bond.
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {mutualDislikedPosts.flatMap((p) => p.hashtags).slice(0, 4).map((tag, i) => (
                    <span key={i} className="text-[9px] bg-black/60 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-pink-500/30 flex items-center justify-between gap-3 relative z-10 shrink-0">
          <div className="flex items-center gap-2">
            {!isAlreadyFriend && onAddFriend ? (
              <button
                onClick={() => {
                  onAddFriend(targetUser.id, targetUser.name);
                }}
                className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-[0_0_12px_rgba(236,72,153,0.4)] flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Friend</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-pink-300 bg-pink-950/70 border border-pink-500/40 px-3 py-1.5 rounded-xl font-medium">
                <UserCheck className="w-3.5 h-3.5 text-pink-400" />
                <span>Connected Friends</span>
              </span>
            )}

            {onStartChat && (
              <button
                onClick={() => {
                  onStartChat(targetUser);
                  onClose();
                }}
                className="bg-neutral-900 hover:bg-neutral-800 text-cyan-300 hover:text-white border border-cyan-500/40 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Send Encrypted DM</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
