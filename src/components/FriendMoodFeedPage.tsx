import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Smile,
  Sparkles,
  Users,
  Heart,
  Share2,
  Calendar,
  Compass,
  MessageCircle,
  SlidersHorizontal,
  Flame,
  Check,
} from 'lucide-react';
import { HashtagGroup, PDFDocument, Post, PostFirePowerUps, PostMood, ReadingLink, User } from '../types';
import { PostCard } from './PostCard';
import { calculateCompatibility } from '../utils/compatibility';

interface FriendMoodFeedPageProps {
  mood: { emoji: string; label: string };
  allPosts: Post[];
  allUsers: User[];
  currentUser: User;
  customGroups?: HashtagGroup[];
  onClose: () => void;
  onSelectMood: (newMood: { emoji: string; label: string }) => void;
  onLikePost?: (postId: string) => void;
  onDislikePost?: (postId: string) => void;
  onAddComment?: (postId: string, commentText: string) => void;
  onHashtagClick?: (tag: string) => void;
  onOpenPdf?: (doc: PDFDocument) => void;
  onShareToChat?: (post: Post) => void;
  onSharePost?: (post: Post, method?: 'feed' | 'chat' | 'copy') => void;
  onToggleBookmarkPost?: (postId: string, folderId?: string) => void;
  onCreateBookmarkFolder?: (name: string, icon?: string) => void;
  onMuteUser?: (authorId: string) => void;
  onInspectCompatibility?: (user: User) => void;
  onCityClick?: (city: string) => void;
  onOpenReadingLink?: (link: ReadingLink) => void;
  onClaimReadingPoints?: (postId: string, points: number) => void;
  onVotePoll?: (postId: string, optionIndex: number) => void;
  onToggleSaveSong?: (song: any, postId: string) => void;
  onAddWaveformComment?: (songId: string, text: string, timestampSeconds: number) => void;
  onApplyFirePowerUp?: (postId: string, type: keyof PostFirePowerUps) => void;
  onSimulateInfectNextProfile?: (postId: string) => void;
  onViralPostViewed?: (postId: string, viewerUser?: User) => void;
  onAdvanceFeedCycle?: () => void;
  onClaimFreeSparks?: (points: number) => void;
  onRequestComposeWithMood?: (mood: { emoji: string; label: string }) => void;
}

export const FriendMoodFeedPage: React.FC<FriendMoodFeedPageProps> = ({
  mood,
  allPosts,
  allUsers,
  currentUser,
  customGroups,
  onClose,
  onSelectMood,
  onLikePost,
  onDislikePost,
  onAddComment,
  onHashtagClick,
  onOpenPdf,
  onShareToChat,
  onSharePost,
  onToggleBookmarkPost,
  onCreateBookmarkFolder,
  onMuteUser,
  onInspectCompatibility,
  onCityClick,
  onOpenReadingLink,
  onClaimReadingPoints,
  onVotePoll,
  onToggleSaveSong,
  onAddWaveformComment,
  onApplyFirePowerUp,
  onSimulateInfectNextProfile,
  onViralPostViewed,
  onAdvanceFeedCycle,
  onClaimFreeSparks,
  onRequestComposeWithMood,
}) => {
  const [selectedFriendIdFilter, setSelectedFriendIdFilter] = useState<string | null>(null);

  // Normalize current mood labels
  const currentMoodLabel = mood.label.toLowerCase().trim();
  const currentMoodEmoji = mood.emoji.trim();

  // Find all friends of currentUser
  const friendUsers = useMemo(() => {
    return allUsers.filter((u) => currentUser.friends.includes(u.id));
  }, [allUsers, currentUser.friends]);

  // Compute all friend posts that have the same mood
  const friendPostsInMood = useMemo(() => {
    return allPosts.filter((post) => {
      // Must be authored by a friend
      if (!currentUser.friends.includes(post.authorId)) return false;
      if (!post.mood) return false;

      const pLabel = post.mood.label.toLowerCase().trim();
      const pEmoji = post.mood.emoji.trim();

      // Check if matches label or emoji
      const matches = pLabel === currentMoodLabel || pEmoji === currentMoodEmoji;
      if (!matches) return false;

      // Filter by specific friend if selected
      if (selectedFriendIdFilter && post.authorId !== selectedFriendIdFilter) {
        return false;
      }

      return true;
    });
  }, [allPosts, currentUser.friends, currentMoodLabel, currentMoodEmoji, selectedFriendIdFilter]);

  // Distinct friends who have posted in THIS specific mood
  const friendsFeelingThisMood = useMemo(() => {
    const friendMap = new Map<string, { user: User; postCount: number }>();
    allPosts.forEach((post) => {
      if (!currentUser.friends.includes(post.authorId)) return;
      if (!post.mood) return;

      const pLabel = post.mood.label.toLowerCase().trim();
      const pEmoji = post.mood.emoji.trim();
      if (pLabel === currentMoodLabel || pEmoji === currentMoodEmoji) {
        const friend = friendUsers.find((f) => f.id === post.authorId);
        if (friend) {
          const existing = friendMap.get(friend.id);
          if (existing) {
            existing.postCount += 1;
          } else {
            friendMap.set(friend.id, { user: friend, postCount: 1 });
          }
        }
      }
    });
    return Array.from(friendMap.values());
  }, [allPosts, currentUser.friends, currentMoodLabel, currentMoodEmoji, friendUsers]);

  // All distinct moods active among friends across all posts
  const allFriendMoods = useMemo(() => {
    const moodMap = new Map<string, { emoji: string; label: string; count: number; friendsCount: number; friendIds: Set<string> }>();

    allPosts.forEach((post) => {
      if (!currentUser.friends.includes(post.authorId)) return;
      if (!post.mood) return;

      const key = post.mood.label.toLowerCase().trim();
      const existing = moodMap.get(key);
      if (existing) {
        existing.count += 1;
        existing.friendIds.add(post.authorId);
      } else {
        moodMap.set(key, {
          emoji: post.mood.emoji,
          label: post.mood.label,
          count: 1,
          friendsCount: 1,
          friendIds: new Set([post.authorId]),
        });
      }
    });

    return Array.from(moodMap.values())
      .map((item) => ({
        emoji: item.emoji,
        label: item.label,
        count: item.count,
        friendsCount: item.friendIds.size,
      }))
      .sort((a, b) => b.count - a.count);
  }, [allPosts, currentUser.friends]);

  // Average compatibility score with friends in this mood
  const avgCompatibility = useMemo(() => {
    if (friendsFeelingThisMood.length === 0) return null;
    const total = friendsFeelingThisMood.reduce((acc, curr) => {
      const comp = calculateCompatibility(currentUser, curr.user, allPosts);
      return acc + comp.matchPercentage;
    }, 0);
    return Math.round(total / friendsFeelingThisMood.length);
  }, [friendsFeelingThisMood, currentUser, allPosts]);

  return (
    <div className="min-h-screen pb-24 animate-in fade-in duration-200 space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-900/90 hover:bg-neutral-800 text-slate-200 hover:text-white border border-pink-500/30 hover:border-pink-400 transition-all cursor-pointer shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 text-pink-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Feed</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-pink-950/70 border border-pink-500/40 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.2)]">
            <Users className="w-3.5 h-3.5 text-pink-400" />
            <span>Friends Only Stream</span>
          </span>
          <span className="text-slate-500 text-xs">•</span>
          <span className="text-xs text-slate-400 font-mono">
            {currentUser.friends.length} Connected Mates
          </span>
        </div>
      </div>

      {/* Hero Mood Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-950 via-pink-950/20 to-neutral-950 border border-pink-500/40 p-6 sm:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.85),0_0_30px_rgba(236,72,153,0.18)]">
        {/* Ambient Glow Aura */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Glowing Mood Emoji Emblem */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-900/90 border-2 border-pink-400/60 shadow-[0_0_25px_rgba(236,72,153,0.45)] flex items-center justify-center shrink-0 text-3xl sm:text-4xl animate-bounce-short">
              <span className="select-none">{mood.emoji}</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase font-mono tracking-wider font-semibold text-pink-400 bg-pink-950/80 px-2.5 py-0.5 rounded-full border border-pink-500/30">
                  Friends Mood Frequency
                </span>
                {avgCompatibility !== null && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>{avgCompatibility}% Avg Compatibility</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Friends Feeling <span className="text-pink-300">{mood.label}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Filtered strictly to posts shared by your personal friends who are vibrating at the same emotional frequency.
              </p>
            </div>
          </div>

          {/* Quick Metrics & Post Action */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-pink-500/20">
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xl sm:text-2xl font-mono font-bold text-white leading-none">
                  {friendPostsInMood.length}
                </p>
                <p className="text-[11px] text-pink-300/80 font-mono uppercase">
                  {friendPostsInMood.length === 1 ? 'Friend Post' : 'Friend Posts'}
                </p>
              </div>
              <span className="text-slate-600 select-none">|</span>
              <div className="text-right">
                <p className="text-xl sm:text-2xl font-mono font-bold text-pink-400 leading-none">
                  {friendsFeelingThisMood.length}
                </p>
                <p className="text-[11px] text-pink-300/80 font-mono uppercase">
                  {friendsFeelingThisMood.length === 1 ? 'Friend' : 'Friends'}
                </p>
              </div>
            </div>

            {onRequestComposeWithMood && (
              <button
                type="button"
                onClick={() => onRequestComposeWithMood(mood)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-pink-600 to-rose-600 text-white border border-pink-400/80 hover:brightness-110 transition-all cursor-pointer shadow-[0_0_15px_rgba(236,72,153,0.4)] active:scale-95"
              >
                <span>Share {mood.emoji} Post</span>
              </button>
            )}
          </div>
        </div>

        {/* Friend Presence Strip: Avatars of Friends Feeling This Mood */}
        {friendsFeelingThisMood.length > 0 && (
          <div className="mt-6 pt-5 border-t border-pink-500/20 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wide">
                Friends in this mood:
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Reset Friend Filter Pill */}
                <button
                  type="button"
                  onClick={() => setSelectedFriendIdFilter(null)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer border ${
                    selectedFriendIdFilter === null
                      ? 'bg-pink-600 text-white border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                      : 'bg-neutral-900/80 text-slate-300 hover:text-white border-neutral-800'
                  }`}
                >
                  All Friends ({friendsFeelingThisMood.length})
                </button>

                {friendsFeelingThisMood.map(({ user, postCount }) => {
                  const isSelected = selectedFriendIdFilter === user.id;
                  const comp = calculateCompatibility(currentUser, user, allPosts);

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() =>
                        setSelectedFriendIdFilter(isSelected ? null : user.id)
                      }
                      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-gradient-to-r from-pink-700 to-rose-700 text-white border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                          : 'bg-neutral-900/90 text-slate-200 hover:text-white border-pink-500/30 hover:border-pink-400 hover:bg-neutral-800'
                      }`}
                      title={`Filter to only ${user.name}'s posts in ${mood.label} (${comp.matchPercentage}% match)`}
                    >
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-pink-400/50"
                      />
                      <span className="font-semibold">{user.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 text-white">
                        {postCount}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {comp.matchPercentage}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedFriendIdFilter && (
              <button
                type="button"
                onClick={() => setSelectedFriendIdFilter(null)}
                className="text-xs text-pink-400 hover:text-pink-300 underline cursor-pointer"
              >
                Clear Friend Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Horizontal Mood Switcher: Other Moods Active Among Friends */}
      {allFriendMoods.length > 0 && (
        <div className="bg-neutral-950/80 backdrop-blur-md border border-neutral-800 rounded-2xl p-3.5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-[11px] px-1">
            <span className="font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-pink-400" />
              <span>Explore Other Moods Friends Are Feeling:</span>
            </span>
            <span className="text-slate-500 font-mono text-[10px]">
              {allFriendMoods.length} Active Vibe{allFriendMoods.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
            {allFriendMoods.map((m) => {
              const isCurrent =
                m.label.toLowerCase() === currentMoodLabel ||
                m.emoji === currentMoodEmoji;

              return (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => {
                    setSelectedFriendIdFilter(null);
                    onSelectMood({ emoji: m.emoji, label: m.label });
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                    isCurrent
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.4)] ring-1 ring-pink-400/50'
                      : 'bg-neutral-900/90 text-slate-300 hover:text-white border-neutral-800 hover:border-pink-500/40 hover:bg-neutral-800'
                  }`}
                >
                  <span className="text-sm leading-none">{m.emoji}</span>
                  <span>{m.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                      isCurrent
                        ? 'bg-white/25 text-white border-white/40'
                        : 'bg-neutral-800 text-pink-300 border-pink-500/20'
                    }`}
                  >
                    {m.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Stream of Friend Posts */}
      <div className="space-y-6 max-w-4xl mx-auto">
        {friendPostsInMood.length > 0 ? (
          friendPostsInMood.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              allUsers={allUsers}
              customGroups={customGroups}
              onLike={(id) => onLikePost?.(id)}
              onDislike={(id) => onDislikePost?.(id)}
              onAddComment={(id, text) => onAddComment?.(id, text)}
              onHashtagClick={(tag) => onHashtagClick?.(tag)}
              onOpenPdf={(doc) => onOpenPdf?.(doc)}
              onShareToChat={(p) => onShareToChat?.(p)}
              onSharePost={(p, m) => onSharePost?.(p, m)}
              onToggleBookmark={(id, folder) => onToggleBookmarkPost?.(id, folder)}
              onCreateBookmarkFolder={onCreateBookmarkFolder}
              onMuteUser={onMuteUser}
              onInspectCompatibility={(u) => onInspectCompatibility?.(u)}
              onCityClick={onCityClick}
              onOpenReadingLink={onOpenReadingLink}
              onClaimReadingPoints={onClaimReadingPoints}
              onVotePoll={onVotePoll}
              onToggleSaveSong={onToggleSaveSong}
              onAddWaveformComment={onAddWaveformComment}
              onApplyFirePowerUp={onApplyFirePowerUp}
              onSimulateInfectNextProfile={onSimulateInfectNextProfile}
              onViralPostViewed={onViralPostViewed}
              onAdvanceFeedCycle={onAdvanceFeedCycle}
              onClaimFreeSparks={onClaimFreeSparks}
              onMoodClick={(clickedMood) => {
                setSelectedFriendIdFilter(null);
                onSelectMood({ emoji: clickedMood.emoji, label: clickedMood.label });
              }}
            />
          ))
        ) : (
          /* Empty State if No Friend Posts for this Mood */
          <div className="bg-neutral-950/80 backdrop-blur-md border border-pink-500/30 rounded-3xl p-10 sm:p-14 text-center space-y-4 shadow-[0_0_30px_rgba(236,72,153,0.12)]">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-pink-500/40 text-4xl flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(236,72,153,0.25)]">
              <span>{mood.emoji}</span>
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-xl font-bold text-white">
                No Friend Posts Feeling "{mood.label}" Yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                None of your {currentUser.friends.length} connected friends have posted with the {mood.emoji} {mood.label} mood. Be the first to start the frequency!
              </p>
            </div>

            {/* Quick Actions */}
            <div className="pt-3 flex items-center justify-center gap-3 flex-wrap">
              {onRequestComposeWithMood && (
                <button
                  type="button"
                  onClick={() => onRequestComposeWithMood(mood)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-pink-600 to-rose-600 text-white border border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.4)] hover:brightness-110 cursor-pointer transition-all"
                >
                  Post in {mood.emoji} {mood.label}
                </button>
              )}

              {allFriendMoods.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const firstOther = allFriendMoods.find(
                      (m) =>
                        m.label.toLowerCase() !== currentMoodLabel &&
                        m.emoji !== currentMoodEmoji
                    );
                    if (firstOther) {
                      onSelectMood({ emoji: firstOther.emoji, label: firstOther.label });
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-pink-300 hover:text-white border border-pink-500/30 hover:border-pink-400 cursor-pointer transition-all"
                >
                  View Friends' {allFriendMoods[0]?.emoji} {allFriendMoods[0]?.label} Stream ({allFriendMoods[0]?.count})
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
