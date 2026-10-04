import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  Sparkles,
  Zap,
  Heart,
  ThumbsDown,
  MessageSquare,
  Search,
  ArrowUpDown,
  Filter,
  Check,
  Compass,
  MapPin,
  HelpCircle,
  Hash,
  ShieldCheck,
  Flame,
  Info,
} from 'lucide-react';
import { User, Post, CompatibilityQuestion } from '../types';
import { calculateCompatibility } from '../utils/compatibility';
import { COMPATIBILITY_QUESTIONS } from '../utils/compatibilityQuestions';
import { CompatibilityQuestionModal } from './CompatibilityQuestionModal';

interface FindFriendsViewProps {
  currentUser: User;
  allUsers: User[];
  allPosts: Post[];
  onAddFriend: (userId: string, userName: string) => void;
  onRemoveFriend?: (userId: string, userName?: string) => void;
  onInspectCompatibility: (userId: string) => void;
  onStartChat?: (user: User) => void;
  onHashtagClick?: (hashtag: string) => void;
  onNavigateToFeed?: () => void;
  onSendMessage?: (
    chatId: string,
    content: string,
    attachedDoc?: any,
    compatibilityQuestion?: CompatibilityQuestion
  ) => void;
}

export const FindFriendsView: React.FC<FindFriendsViewProps> = ({
  currentUser,
  allUsers,
  allPosts,
  onAddFriend,
  onRemoveFriend,
  onInspectCompatibility,
  onStartChat,
  onHashtagClick,
  onNavigateToFeed,
  onSendMessage,
}) => {
  // Filters and state
  const [selectedInterest, setSelectedInterest] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [connectionFilter, setConnectionFilter] = useState<'all' | 'suggestions' | 'connected'>('suggestions');
  const [sortBy, setSortBy] = useState<'compatibility' | 'shared_interests' | 'dislikes' | 'name'>('compatibility');
  
  // Interactive Question Modal State
  const [activeQuestionTarget, setActiveQuestionTarget] = useState<User | null>(null);
  const [questionSentToast, setQuestionSentToast] = useState<{ targetName: string; questionText: string } | null>(null);

  // Extract all distinct interests for currentUser
  const currentUserInterests = useMemo(() => {
    const set = new Set<string>();
    (currentUser.interests || []).forEach((item) => set.add(item));
    (currentUser.joinedGroupTags || []).forEach((item) => set.add(item));
    (currentUser.decryptedData?.secretInterests || []).forEach((item) => set.add(item));
    if (set.size === 0) {
      // Default baseline interests if none set
      ['Poetry', 'Encrypted', 'Mates', 'deep_'].forEach((item) => set.add(item));
    }
    return Array.from(set);
  }, [currentUser]);

  // Compute rich synergy metadata for all peer candidates
  const peerSynergies = useMemo(() => {
    const candidates = allUsers.filter((u) => u.id !== currentUser.id);

    return candidates.map((peer) => {
      const comp = calculateCompatibility(currentUser, peer, allPosts);
      const isConnected = currentUser.friends.includes(peer.id);

      // Collect peer's interest tags
      const peerInterestsSet = new Set<string>();
      (peer.interests || []).forEach((i) => peerInterestsSet.add(i));
      (peer.joinedGroupTags || []).forEach((i) => peerInterestsSet.add(i));

      // Calculate shared interests
      const shared: string[] = [];
      const notShared: string[] = [];

      peerInterestsSet.forEach((tag) => {
        const matchesUser = currentUserInterests.some(
          (ui) => ui.toLowerCase() === tag.toLowerCase()
        );
        if (matchesUser) {
          shared.push(tag);
        } else {
          notShared.push(tag);
        }
      });

      return {
        user: peer,
        comp,
        isConnected,
        sharedInterests: shared,
        otherInterests: notShared,
        allInterests: Array.from(peerInterestsSet),
      };
    });
  }, [allUsers, currentUser, allPosts, currentUserInterests]);

  // Collect all available interest tags across network with counts
  const interestTagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    peerSynergies.forEach((item) => {
      item.allInterests.forEach((tag) => {
        const clean = tag.replace(/^#+/, '');
        counts[clean] = (counts[clean] || 0) + 1;
      });
    });
    return counts;
  }, [peerSynergies]);

  // Filter and sort the peers
  const filteredPeers = useMemo(() => {
    return peerSynergies.filter((item) => {
      // Connection filter
      if (connectionFilter === 'suggestions' && item.isConnected) return false;
      if (connectionFilter === 'connected' && !item.isConnected) return false;

      // Interest filter
      if (selectedInterest !== 'all') {
        const hasInterest = item.allInterests.some(
          (t) => t.toLowerCase() === selectedInterest.toLowerCase()
        );
        if (!hasInterest) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.user.name.toLowerCase().includes(q);
        const matchesHandle = item.user.handle.toLowerCase().includes(q);
        const matchesBio = item.user.bio.toLowerCase().includes(q);
        const matchesLocation = (item.user.location || '').toLowerCase().includes(q);
        const matchesInterest = item.allInterests.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesHandle && !matchesBio && !matchesLocation && !matchesInterest) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'compatibility') {
        return b.comp.matchPercentage - a.comp.matchPercentage;
      }
      if (sortBy === 'shared_interests') {
        return b.sharedInterests.length - a.sharedInterests.length;
      }
      if (sortBy === 'dislikes') {
        return b.comp.mutualDislikesCount - a.comp.mutualDislikesCount;
      }
      if (sortBy === 'name') {
        return a.user.name.localeCompare(b.user.name);
      }
      return 0;
    });
  }, [peerSynergies, connectionFilter, selectedInterest, searchQuery, sortBy]);

  // Top recommendation spotlight (highest match among unconnected users)
  const spotlightMatch = useMemo(() => {
    const unconnected = peerSynergies.filter((p) => !p.isConnected);
    if (unconnected.length === 0) return peerSynergies[0] || null;
    return [...unconnected].sort((a, b) => b.comp.matchPercentage - a.comp.matchPercentage)[0];
  }, [peerSynergies]);

  // Network stats
  const stats = useMemo(() => {
    const totalDiscovered = peerSynergies.length;
    const connectedCount = peerSynergies.filter((p) => p.isConnected).length;
    const avgScore = totalDiscovered > 0
      ? Math.round(peerSynergies.reduce((acc, p) => acc + p.comp.matchPercentage, 0) / totalDiscovered)
      : 85;
    return { totalDiscovered, connectedCount, avgScore };
  }, [peerSynergies]);

  // Send Compatibility Question Handler
  const handleSendQuestion = (q: CompatibilityQuestion) => {
    if (!activeQuestionTarget) return;

    const chatId = 'chat_' + activeQuestionTarget.id;
    if (onSendMessage) {
      onSendMessage(
        chatId,
        `⚡ Interactive Compatibility Vibe Question: "${q.question}"`,
        undefined,
        q
      );
    }
    setQuestionSentToast({
      targetName: activeQuestionTarget.name,
      questionText: q.question,
    });
    setActiveQuestionTarget(null);

    // Auto-dismiss toast
    setTimeout(() => {
      setQuestionSentToast(null);
    }, 5000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast feedback for sending vibe question */}
      {questionSentToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-neutral-950/95 border border-pink-400 text-slate-100 p-4 rounded-2xl shadow-[0_0_25px_rgba(236,72,153,0.4)] animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-pink-500/20 border border-pink-400 text-pink-300">
              <Zap className="w-5 h-5 fill-pink-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="font-bold text-sm text-pink-200">Vibe Question Sent!</h5>
              <p className="text-xs text-slate-300 mt-0.5">
                Sent to <strong className="text-white">{questionSentToast.targetName}</strong>:
              </p>
              <p className="text-xs italic text-pink-300/80 mt-1 line-clamp-1">
                "{questionSentToast.questionText}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-black border border-pink-500/40 p-6 sm:p-8 shadow-[0_0_30px_rgba(236,72,153,0.15)]">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-950/70 border border-pink-500/40 text-pink-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Aesthetic Affinity & Discernment Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Users className="w-7 h-7 text-white shrink-0" />
              <span>Find Friends</span>
              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-2.5 py-1 rounded-lg">
                Vector Match
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Discover kindred thinkers based on mutual likes, shared discernment over digital noise, poetic depth score, and common streams.
            </p>

            {/* Current User Interests Preview */}
            <div className="pt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-400">Your Current Interests:</span>
              {currentUserInterests.slice(0, 6).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedInterest(selectedInterest === tag ? 'all' : tag)}
                  className={`text-xs px-2.5 py-0.5 rounded-full border transition-all ${
                    selectedInterest.toLowerCase() === tag.toLowerCase()
                      ? 'bg-pink-600 text-white border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                      : 'bg-neutral-900/80 text-pink-300 border-pink-500/30 hover:border-pink-400'
                  }`}
                >
                  #{tag.replace(/^#+/, '')}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 shrink-0 bg-neutral-900/80 backdrop-blur-md border border-pink-500/30 rounded-2xl p-4">
            <div className="text-center px-2">
              <p className="text-[11px] text-slate-400 font-medium">Avg Synergy</p>
              <p className="text-xl font-bold font-mono text-pink-300 mt-0.5">{stats.avgScore}%</p>
            </div>
            <div className="text-center px-2 border-x border-pink-500/20">
              <p className="text-[11px] text-slate-400 font-medium">Connected</p>
              <p className="text-xl font-bold font-mono text-cyan-300 mt-0.5">{stats.connectedCount}</p>
            </div>
            <div className="text-center px-2">
              <p className="text-[11px] text-slate-400 font-medium">Candidates</p>
              <p className="text-xl font-bold font-mono text-white mt-0.5">{stats.totalDiscovered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Spotlight: #1 Synergy Match of the Network */}
      {spotlightMatch && (
        <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-r from-pink-950/40 via-neutral-950 to-cyan-950/40 border border-pink-500/50 p-6 shadow-[0_0_25px_rgba(236,72,153,0.2)]">
          <div className="absolute top-0 right-0 p-3">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-pink-600 to-amber-500 text-white text-[11px] font-bold shadow-[0_0_12px_rgba(236,72,153,0.6)]">
              <Flame className="w-3.5 h-3.5 fill-white" />
              <span>Highest Compatibility Spotlight</span>
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-2">
            <div className="flex items-start gap-4 min-w-0">
              <img
                src={spotlightMatch.user.avatar}
                alt={spotlightMatch.user.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-pink-500/70 shrink-0 shadow-[0_0_16px_rgba(236,72,153,0.4)]"
              />
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-white truncate">{spotlightMatch.user.name}</h3>
                  <span className="text-xs text-pink-300/90 font-mono">{spotlightMatch.user.handle}</span>
                  {spotlightMatch.user.verified && (
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" title="Verified Creator" />
                  )}
                  {spotlightMatch.user.location && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-pink-400" />
                      <span>{spotlightMatch.user.location}</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 max-w-xl">
                  {spotlightMatch.user.bio}
                </p>

                {/* Shared Interests Highlights */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-pink-300 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-pink-400" /> Shared Interests:
                  </span>
                  {spotlightMatch.sharedInterests.map((interest) => (
                    <span
                      key={interest}
                      className="text-[11px] px-2 py-0.5 rounded-lg bg-pink-500/20 border border-pink-400/50 text-pink-200 font-medium"
                    >
                      #{interest.replace(/^#+/, '')}
                    </span>
                  ))}
                  {spotlightMatch.sharedInterests.length === 0 && (
                    <span className="text-[11px] text-slate-400 italic">Exploring new aesthetic ground</span>
                  )}
                </div>
              </div>
            </div>

            {/* Score & Actions */}
            <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 w-full md:w-auto shrink-0">
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-950 via-neutral-900 to-cyan-950 border border-pink-400 text-pink-200 font-bold font-mono text-base shadow-[0_0_16px_rgba(236,72,153,0.35)]">
                <Zap className="w-5 h-5 text-pink-400 fill-pink-400" />
                <span className="text-lg">{spotlightMatch.comp.matchPercentage}%</span>
                <span className="text-xs font-sans font-normal text-slate-300 ml-1">
                  • {spotlightMatch.comp.aiVibeTitle}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {spotlightMatch.isConnected ? (
                  <button
                    onClick={() => onRemoveFriend && onRemoveFriend(spotlightMatch.user.id, spotlightMatch.user.name)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-neutral-900 hover:bg-rose-950/60 border border-emerald-500/40 hover:border-rose-500/40 text-emerald-300 hover:text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Connected</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onAddFriend(spotlightMatch.user.id, spotlightMatch.user.name)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Connect & Add Friend</span>
                  </button>
                )}

                <button
                  onClick={() => onInspectCompatibility(spotlightMatch.user.id)}
                  className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-pink-500/40 text-pink-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  title="Inspect detailed mathematical breakdown"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Breakdown</span>
                </button>

                <button
                  onClick={() => setActiveQuestionTarget(spotlightMatch.user)}
                  className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  title="Send compatibility test question"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Test Synergy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Controls & Filters Bar */}
      <div className="bg-black/70 backdrop-blur-md border border-pink-500/30 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, @handle, city, or interest keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900/90 border border-pink-500/30 focus:border-pink-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-500/50 transition-all"
            />
          </div>

          {/* Connection Filter Tabs */}
          <div className="flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-pink-500/30 shrink-0">
            <button
              onClick={() => setConnectionFilter('suggestions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                connectionFilter === 'suggestions'
                  ? 'bg-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Suggestions ({peerSynergies.filter((p) => !p.isConnected).length})
            </button>
            <button
              onClick={() => setConnectionFilter('connected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                connectionFilter === 'connected'
                  ? 'bg-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Connected ({peerSynergies.filter((p) => p.isConnected).length})
            </button>
            <button
              onClick={() => setConnectionFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                connectionFilter === 'all'
                  ? 'bg-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Network ({peerSynergies.length})
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-pink-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-neutral-900 border border-pink-500/30 focus:border-pink-500 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500/50"
            >
              <option value="compatibility">Highest Compatibility</option>
              <option value="shared_interests">Most Shared Interests</option>
              <option value="dislikes">Strongest Mutual Dislikes</option>
              <option value="name">Alphabetical (A-Z)</option>
            </select>
          </div>

        </div>

        {/* Interests Filter Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-1 border-t border-pink-500/10">
          <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1 pl-1">
            <Filter className="w-3 h-3 text-pink-400" /> Filter Interest:
          </span>
          <button
            onClick={() => setSelectedInterest('all')}
            className={`px-3 py-1 rounded-xl font-medium shrink-0 border transition-all ${
              selectedInterest === 'all'
                ? 'bg-pink-600 text-white border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                : 'bg-neutral-900/80 text-slate-300 border-pink-500/20 hover:border-pink-400/40'
            }`}
          >
            All ({peerSynergies.length})
          </button>
          {Object.entries(interestTagCounts).map(([tag, count]) => {
            const isUserInterest = currentUserInterests.some(
              (ui) => ui.toLowerCase() === tag.toLowerCase()
            );
            return (
              <button
                key={tag}
                onClick={() => setSelectedInterest(selectedInterest.toLowerCase() === tag.toLowerCase() ? 'all' : tag)}
                className={`px-3 py-1 rounded-xl font-medium shrink-0 border flex items-center gap-1.5 transition-all ${
                  selectedInterest.toLowerCase() === tag.toLowerCase()
                    ? 'bg-pink-600 text-white border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                    : isUserInterest
                    ? 'bg-neutral-900 text-pink-300 border-pink-500/40 hover:border-pink-400'
                    : 'bg-neutral-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {isUserInterest && <Sparkles className="w-2.5 h-2.5 text-pink-400" />}
                <span>#{tag}</span>
                <span className="text-[10px] font-mono opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Peer Cards Grid */}
      {filteredPeers.length === 0 ? (
        <div className="bg-neutral-950/80 border border-pink-500/30 rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center mx-auto">
            <Users className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No Matching Peers Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No connections matched the current filter combination. Try resetting the interest filter or broadening your search criteria.
          </p>
          <button
            onClick={() => {
              setSelectedInterest('all');
              setSearchQuery('');
              setConnectionFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all shadow-[0_0_10px_rgba(236,72,153,0.4)]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPeers.map(({ user: peer, comp, isConnected, sharedInterests, otherInterests }) => (
            <div
              key={peer.id}
              className="relative group rounded-2xl bg-gradient-to-b from-neutral-950 via-neutral-900 to-black border border-pink-500/30 hover:border-pink-500/70 p-5 space-y-4 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.6)] hover:shadow-[0_0_22px_rgba(236,72,153,0.25)] flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Header: Avatar, Name, Handle, Compatibility Pill */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={peer.avatar}
                      alt={peer.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-pink-500/40 shrink-0 group-hover:ring-pink-400 transition-all"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-100 text-sm truncate">{peer.name}</h4>
                        {peer.verified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-pink-300/80 font-mono">{peer.handle}</p>
                      {peer.location && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-pink-400/80" />
                          <span className="truncate">{peer.location}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Compatibility Score Badge */}
                  <div className="flex flex-col items-end shrink-0">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-pink-950 via-neutral-900 to-cyan-950 border border-pink-400/60 text-pink-200 font-bold font-mono text-xs shadow-[0_0_10px_rgba(236,72,153,0.25)]">
                      <Zap className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
                      <span>{comp.matchPercentage}%</span>
                    </div>
                    <span className="text-[10px] text-pink-300/80 font-medium mt-0.5 text-right line-clamp-1 max-w-[110px]">
                      {comp.aiVibeTitle}
                    </span>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {peer.bio}
                </p>

                {/* Shared & Distinct Interests Tags */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-pink-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-pink-400" />
                      <span>Mutual Interests ({sharedInterests.length})</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {sharedInterests.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedInterest(tag)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-pink-500/20 border border-pink-400/50 text-pink-200 font-medium hover:bg-pink-500/30 transition-all flex items-center gap-1"
                        title={`Filtered by #${tag}`}
                      >
                        <Check className="w-2.5 h-2.5 text-pink-400" />
                        <span>#{tag.replace(/^#+/, '')}</span>
                      </button>
                    ))}
                    {otherInterests.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-900 text-slate-400 border border-slate-800"
                      >
                        #{tag.replace(/^#+/, '')}
                      </span>
                    ))}
                    {otherInterests.length > 2 && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        +{otherInterests.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Synergy Metrics Chips */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-pink-500/20 text-xs">
                  <div className="flex items-center gap-1.5 bg-neutral-900/80 px-2.5 py-1.5 rounded-lg border border-pink-500/20 text-slate-300">
                    <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
                    <span className="text-[11px]"><strong className="text-pink-300">{comp.mutualLikesCount}</strong> Shared Likes</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-neutral-900/80 px-2.5 py-1.5 rounded-lg border border-purple-500/20 text-slate-300">
                    <ThumbsDown className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[11px]"><strong className="text-purple-300">{comp.mutualDislikesCount}</strong> Mutual Dislikes</span>
                  </div>
                </div>

                {/* Synergy Highlight Note */}
                {comp.synergyHighlights.length > 0 && (
                  <p className="text-[11px] text-slate-400 italic bg-black/40 p-2 rounded-lg border border-slate-800/80 line-clamp-1">
                    "{comp.synergyHighlights[0]}"
                  </p>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-3 border-t border-pink-500/20 flex items-center gap-2">
                {isConnected ? (
                  <button
                    onClick={() => onRemoveFriend && onRemoveFriend(peer.id, peer.name)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-neutral-900 hover:bg-rose-950/60 border border-emerald-500/40 hover:border-rose-500/40 text-emerald-300 hover:text-rose-300 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Connected</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onAddFriend(peer.id, peer.name)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-[0_0_12px_rgba(236,72,153,0.3)] transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Friend</span>
                  </button>
                )}

                <button
                  onClick={() => onInspectCompatibility(peer.id)}
                  className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-pink-500/40 text-pink-300 hover:text-white transition-all text-xs"
                  title="View full synergy breakdown & reaction vectors"
                >
                  <Zap className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setActiveQuestionTarget(peer)}
                  className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/40 text-cyan-300 hover:text-white transition-all text-xs"
                  title="Test vibe synergy with an interactive compatibility question"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>

                {onStartChat && (
                  <button
                    onClick={() => onStartChat(peer)}
                    className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-slate-700 text-slate-300 hover:text-white transition-all text-xs"
                    title={`Send direct message to ${peer.name}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Philosophical Philosophy Info Callout on Shared Dislikes */}
      <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-black border border-pink-500/25 rounded-2xl p-6 text-xs text-slate-300 space-y-2.5">
        <div className="flex items-center gap-2 text-pink-300 font-bold text-sm">
          <Info className="w-4 h-4 text-pink-400" />
          <span>The deep_ Compatibility Formula: Why Mutual Dislikes Matter</span>
        </div>
        <p className="leading-relaxed text-slate-400">
          In algorithmic feeds, you are often connected merely by shared likes or consumption habits. In <strong className="text-white">deep_</strong>, shared discernment plays an equal role: when two people filter out the same superficial noise or clickbait, their mutual dislike is weighted at <span className="text-pink-300 font-mono font-bold">+1.25 points</span>. True friendships form when you both appreciate the quiet and protect your attention from the same digital noise.
        </p>
      </div>

      {/* Compatibility Question Modal for Peer */}
      {activeQuestionTarget && (
        <CompatibilityQuestionModal
          isOpen={true}
          onClose={() => setActiveQuestionTarget(null)}
          participant={activeQuestionTarget}
          onSendQuestion={handleSendQuestion}
        />
      )}
    </div>
  );
};
