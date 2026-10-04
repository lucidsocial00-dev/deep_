import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Award,
  Flame,
  Zap,
  MessageSquare,
  Heart,
  FileText,
  Music,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Share2,
  Info,
  Layers,
  Crown,
} from 'lucide-react';
import { HashtagGroup, Post, User } from '../types';
import {
  getAllGroupsTopScoringData,
  getTopScoringPostsForGroup,
  GroupScoredPost,
  HashtagGroupTopScoreData,
  PostScoreBreakdown,
} from '../utils/hashtagScoring';

interface HashtagGroupTopScoringDisplayProps {
  groups: HashtagGroup[];
  allPosts: Post[];
  currentUser: User;
  onOpenGroupDetail: (group: HashtagGroup) => void;
  onSelectHashtag?: (tag: string) => void;
  onToggleJoinGroup?: (tag: string) => void;
  initialSelectedTag?: string | null;
  compactMode?: boolean;
}

export const HashtagGroupTopScoringDisplay: React.FC<HashtagGroupTopScoringDisplayProps> = ({
  groups,
  allPosts,
  currentUser,
  onOpenGroupDetail,
  onSelectHashtag,
  onToggleJoinGroup,
  initialSelectedTag = null,
  compactMode = false,
}) => {
  const [selectedTag, setSelectedTag] = useState<string | 'all'>(
    initialSelectedTag ? initialSelectedTag.replace(/^#+/, '').toLowerCase() : 'all'
  );
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Record<string, boolean>>({});
  const [showRubricInfo, setShowRubricInfo] = useState(false);

  const myJoinedTags = (currentUser.joinedGroupTags || []).map((t) =>
    t.toLowerCase().replace(/^#+/, '')
  );

  // Compute scoring data for all groups
  const allGroupsData = useMemo(() => {
    return getAllGroupsTopScoringData(groups, allPosts, 5);
  }, [groups, allPosts]);

  // Filter groups based on search query
  const filteredGroupsData = useMemo(() => {
    if (!searchFilter.trim()) return allGroupsData;
    const query = searchFilter.toLowerCase().trim();
    return allGroupsData.filter(
      (data) =>
        data.cleanTag.toLowerCase().includes(query) ||
        data.group.name.toLowerCase().includes(query) ||
        data.group.city?.toLowerCase().includes(query) ||
        data.group.category.toLowerCase().includes(query)
    );
  }, [allGroupsData, searchFilter]);

  // Current active group data if a specific group tag is selected
  const activeSingleGroupData = useMemo(() => {
    if (selectedTag === 'all') return null;
    return allGroupsData.find(
      (g) => g.cleanTag.toLowerCase() === selectedTag.toLowerCase()
    );
  }, [allGroupsData, selectedTag]);

  const toggleBreakdown = (postId: string) => {
    setExpandedBreakdowns((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  return (
    <div id="hashtag-top-scoring-display" className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="bg-black/75 backdrop-blur-xl border border-pink-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_0_24px_rgba(236,72,153,0.15)] relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-pink-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Stream Leaderboards</span>
              </span>
              <button
                type="button"
                onClick={() => setShowRubricInfo(!showRubricInfo)}
                className="inline-flex items-center gap-1 text-[11px] text-pink-300 hover:text-white bg-pink-950/60 hover:bg-pink-900/60 border border-pink-500/30 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                title="View Score Calculation Rubric"
              >
                <Info className="w-3 h-3 text-pink-400" />
                <span>Scoring Formula</span>
              </button>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Top Scoring Posts by Hashtag Group</span>
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Real-time depth score computation for every stream. Evaluates peer appreciations, thoughtful responses, viral expansion, and multimedia chapbooks.
            </p>
          </div>

          {/* Search within groups */}
          <div className="w-full md:w-72 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-pink-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search hashtag streams..."
                className="w-full bg-neutral-900/90 border border-pink-500/30 focus:border-pink-400 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Collapsible Rubric Info */}
        {showRubricInfo && (
          <div className="mt-4 pt-4 border-t border-pink-500/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs animate-in fade-in duration-200">
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-pink-500/20 space-y-1">
              <span className="font-bold text-pink-300 flex items-center gap-1">
                <Heart className="w-3 h-3 text-pink-400" /> +10 pts
              </span>
              <p className="text-[11px] text-slate-300">Per genuine peer appreciation / like</p>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-pink-500/20 space-y-1">
              <span className="font-bold text-pink-300 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-pink-400" /> +6 pts
              </span>
              <p className="text-[11px] text-slate-300">Per comment & dialogue engagement</p>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-pink-500/20 space-y-1">
              <span className="font-bold text-amber-300 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Multiplier
              </span>
              <p className="text-[11px] text-slate-300">Up to 5x base score boost with active PowerUp</p>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-pink-500/20 space-y-1">
              <span className="font-bold text-sky-300 flex items-center gap-1">
                <FileText className="w-3 h-3 text-sky-400" /> +15 pts
              </span>
              <p className="text-[11px] text-slate-300">Per PDF chapbook or original audio score</p>
            </div>
          </div>
        )}

        {/* Hashtag Stream Filter Pills Bar */}
        <div className="mt-4 pt-3 border-t border-pink-500/20 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              selectedTag === 'all'
                ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                : 'bg-neutral-900/80 text-slate-300 hover:text-white border border-pink-500/20 hover:border-pink-500/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Groups ({filteredGroupsData.length})</span>
          </button>

          {filteredGroupsData.map((data) => {
            const isCurrent = selectedTag.toLowerCase() === data.cleanTag.toLowerCase();
            return (
              <button
                key={data.cleanTag}
                type="button"
                onClick={() => setSelectedTag(data.cleanTag.toLowerCase())}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)] font-bold'
                    : 'bg-neutral-900/80 text-slate-300 hover:text-pink-300 border border-pink-500/20 hover:border-pink-500/40'
                }`}
              >
                <span className="font-mono text-pink-400">#</span>
                <span>{data.cleanTag}</span>
                {data.topScore > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/40 text-amber-300 font-mono">
                    {data.topScore} pts
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SINGLE GROUP EXPANDED VIEW (When user clicks a specific group pill) */}
      {activeSingleGroupData && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <GroupTopScoreCard
            data={activeSingleGroupData}
            isJoined={myJoinedTags.includes(activeSingleGroupData.cleanTag.toLowerCase())}
            onOpenGroupDetail={onOpenGroupDetail}
            onSelectHashtag={onSelectHashtag}
            onToggleJoinGroup={onToggleJoinGroup}
            expandedBreakdowns={expandedBreakdowns}
            onToggleBreakdown={toggleBreakdown}
            detailedView
          />
        </div>
      )}

      {/* ALL GROUPS GRID VIEW (When 'All Groups' is selected) */}
      {selectedTag === 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredGroupsData.map((data) => {
            const isJoined = myJoinedTags.includes(data.cleanTag.toLowerCase());
            return (
              <GroupTopScoreCard
                key={data.cleanTag}
                data={data}
                isJoined={isJoined}
                onOpenGroupDetail={onOpenGroupDetail}
                onSelectHashtag={onSelectHashtag}
                onToggleJoinGroup={onToggleJoinGroup}
                expandedBreakdowns={expandedBreakdowns}
                onToggleBreakdown={toggleBreakdown}
                detailedView={false}
              />
            );
          })}
        </div>
      )}

      {filteredGroupsData.length === 0 && (
        <div className="p-12 text-center bg-neutral-950/60 border border-pink-500/20 rounded-3xl space-y-3">
          <Trophy className="w-10 h-10 text-pink-400 mx-auto opacity-50" />
          <h4 className="text-base font-bold text-white">No Hashtag Groups Match "{searchFilter}"</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or clear the filter to view top scoring posts across all streams.
          </p>
          <button
            type="button"
            onClick={() => setSearchFilter('')}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      )}
    </div>
  );
};

// Sub-Component: Group Top Score Card displaying top scored posts for one specific hashtag group
interface GroupTopScoreCardProps {
  data: HashtagGroupTopScoreData;
  isJoined: boolean;
  onOpenGroupDetail: (group: HashtagGroup) => void;
  onSelectHashtag?: (tag: string) => void;
  onToggleJoinGroup?: (tag: string) => void;
  expandedBreakdowns: Record<string, boolean>;
  onToggleBreakdown: (postId: string) => void;
  detailedView?: boolean;
}

const GroupTopScoreCard: React.FC<GroupTopScoreCardProps> = ({
  data,
  isJoined,
  onOpenGroupDetail,
  onSelectHashtag,
  onToggleJoinGroup,
  expandedBreakdowns,
  onToggleBreakdown,
  detailedView = false,
}) => {
  const topPost = data.topScoredPosts[0];
  const runnersUp = data.topScoredPosts.slice(1);

  return (
    <div className="bg-black/80 backdrop-blur-xl border border-pink-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_20px_rgba(236,72,153,0.12)] flex flex-col justify-between space-y-5 hover:border-pink-400 transition-all group">
      
      {/* Group Header Info */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-900/70 to-neutral-900 border border-pink-500/40 flex items-center justify-center font-bold text-base text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.3)]">
              <span className="font-mono">#</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4
                  onClick={() => onOpenGroupDetail(data.group)}
                  className="font-bold text-white text-lg hover:text-pink-300 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>#{data.cleanTag}</span>
                  {data.group.city && (
                    <span className="text-xs text-pink-300 font-mono font-normal">
                      ({data.group.city})
                    </span>
                  )}
                </h4>
                {isJoined && (
                  <span className="text-[10px] bg-sky-950/80 border border-sky-500/40 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-sky-400" />
                    <span>In Your Feed</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>{data.group.category}</span>
                <span>•</span>
                <span>{data.totalPosts} published post{data.totalPosts === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>

          {/* Top Score Badge */}
          <div className="text-right shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-500/40 text-amber-300 font-bold font-mono text-xs shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Top: {data.topScore} pts</span>
            </div>
            <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">
              Avg: {data.averageScore} pts
            </span>
          </div>
        </div>

        {/* 🥇 1ST PLACE PODIUM CHAMPION POST */}
        {topPost ? (
          <div className="relative rounded-2xl p-4 bg-gradient-to-b from-amber-950/30 via-black/80 to-neutral-950 border border-amber-500/50 shadow-[0_0_16px_rgba(245,158,11,0.2)] space-y-3">
            
            {/* 1st Place Header Bar */}
            <div className="flex items-center justify-between gap-2 border-b border-amber-500/25 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <span>🥇 #1 Ranked Post</span>
                </span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {topPost.scoreBreakdown.totalScore} Points
                </span>
              </div>

              <button
                type="button"
                onClick={() => onToggleBreakdown(topPost.post.id)}
                className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 font-mono transition-colors cursor-pointer"
                title="View Score Breakdown"
              >
                <span>Breakdown</span>
                {expandedBreakdowns[topPost.post.id] ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Author & Timestamp */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={topPost.post.authorAvatar}
                  alt={topPost.post.authorName}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400/60"
                />
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-white truncate">
                    {topPost.post.authorName}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-mono truncate">
                    {topPost.post.authorHandle}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                {topPost.post.timestamp}
              </span>
            </div>

            {/* Post Excerpt */}
            <p className="text-xs text-slate-200 line-clamp-3 italic font-serif leading-relaxed pl-2 border-l-2 border-amber-500/40">
              "{topPost.post.content}"
            </p>

            {/* Attached Media Badges */}
            {topPost.scoreBreakdown.mediaTypes.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {topPost.scoreBreakdown.mediaTypes.map((type, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-medium"
                  >
                    {type.includes('PDF') && <FileText className="w-2.5 h-2.5" />}
                    {type.includes('Audio') && <Music className="w-2.5 h-2.5" />}
                    {type.includes('Reading') && <BookOpen className="w-2.5 h-2.5" />}
                    <span>{type}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Engagement Counts & Multipliers */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-500/20 text-xs">
              <div className="flex items-center gap-3 text-slate-300 text-[11px]">
                <span className="flex items-center gap-1 text-pink-300 font-semibold">
                  <Heart className="w-3 h-3 text-pink-400 fill-pink-400/40" />
                  <span>{topPost.post.likesCount}</span>
                </span>
                <span className="flex items-center gap-1 text-slate-300 font-semibold">
                  <MessageSquare className="w-3 h-3 text-slate-400" />
                  <span>{topPost.post.commentsCount}</span>
                </span>
                {topPost.post.firePowerUps?.multiplier?.active && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/40">
                    <Zap className="w-2.5 h-2.5" />
                    <span>{topPost.post.firePowerUps.multiplier.multiplierFactor}x Multiplier</span>
                  </span>
                )}
                {topPost.post.firePowerUps?.viral?.active && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-lime-500/20 text-lime-300 font-mono text-[10px] font-bold border border-lime-500/40">
                    <Flame className="w-2.5 h-2.5" />
                    <span>Viral Outbreak</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onOpenGroupDetail(data.group)}
                className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors cursor-pointer group/link"
              >
                <span>View in Stream</span>
                <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Expanded Detailed Score Breakdown */}
            {expandedBreakdowns[topPost.post.id] && (
              <ScoreBreakdownBox breakdown={topPost.scoreBreakdown} />
            )}

          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-pink-500/20 text-center space-y-2">
            <Sparkles className="w-6 h-6 text-pink-400 mx-auto opacity-60" />
            <p className="text-xs text-slate-400">
              No scored posts in #{data.cleanTag} yet. Share a post or reading to inaugurate the leaderboard!
            </p>
          </div>
        )}

        {/* 🥈 🥉 RUNNERS UP LEADERBOARD */}
        {runnersUp.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-[11px] uppercase tracking-wider font-mono font-bold text-slate-400 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-pink-400" />
              <span>Runner-Up Scored Posts</span>
            </span>

            <div className="space-y-1.5">
              {runnersUp.map((item) => (
                <div
                  key={item.post.id}
                  className="p-3 rounded-xl bg-black/60 hover:bg-neutral-900/80 border border-pink-500/20 hover:border-pink-500/50 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-pink-300 shrink-0">
                        {item.medalEmoji}
                      </span>
                      <img
                        src={item.post.authorAvatar}
                        alt={item.post.authorName}
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-pink-500/30 shrink-0"
                      />
                      <span className="text-xs font-bold text-slate-200 truncate">
                        {item.post.authorName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold text-amber-300">
                        {item.scoreBreakdown.totalScore} pts
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleBreakdown(item.post.id)}
                        className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Toggle Score Breakdown"
                      >
                        {expandedBreakdowns[item.post.id] ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 line-clamp-2 italic font-serif pl-1.5 border-l border-pink-500/30">
                    "{item.post.content}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <div className="flex items-center gap-3">
                      <span>❤️ {item.post.likesCount}</span>
                      <span>💬 {item.post.commentsCount}</span>
                    </div>
                    <span className="font-mono">{item.post.timestamp}</span>
                  </div>

                  {expandedBreakdowns[item.post.id] && (
                    <ScoreBreakdownBox breakdown={item.scoreBreakdown} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-pink-500/20 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpenGroupDetail(data.group)}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-slate-200 hover:text-white border border-pink-500/30 hover:border-pink-500/60 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Zap className="w-3.5 h-3.5 text-pink-400 fill-pink-400/30" />
          <span>Enter #{data.cleanTag} Stream</span>
        </button>

        {onToggleJoinGroup && (
          <button
            type="button"
            onClick={() => onToggleJoinGroup(data.cleanTag)}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              isJoined
                ? 'bg-pink-950/80 hover:bg-pink-900 text-pink-200 border border-pink-400/50'
                : 'bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]'
            }`}
          >
            {isJoined ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Joined</span>
              </>
            ) : (
              <span>Join Stream</span>
            )}
          </button>
        )}
      </div>

    </div>
  );
};

// Sub-Component: Visual Score Breakdown Box
const ScoreBreakdownBox: React.FC<{ breakdown: PostScoreBreakdown }> = ({ breakdown }) => {
  return (
    <div className="p-3 rounded-xl bg-neutral-950 border border-amber-500/30 text-xs space-y-2 animate-in fade-in duration-150">
      <div className="flex items-center justify-between text-amber-300 font-mono font-bold text-[11px] pb-1.5 border-b border-amber-500/20">
        <span>Score Calculation Breakdown</span>
        <span>Total: {breakdown.totalScore} Points</span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
        <div className="flex items-center justify-between text-slate-300 p-1 rounded bg-black/40">
          <span>Likes ({breakdown.likesPoints / 10}):</span>
          <span className="text-emerald-400 font-bold">+{breakdown.likesPoints}</span>
        </div>

        <div className="flex items-center justify-between text-slate-300 p-1 rounded bg-black/40">
          <span>Comments ({breakdown.commentsPoints / 6}):</span>
          <span className="text-emerald-400 font-bold">+{breakdown.commentsPoints}</span>
        </div>

        {breakdown.dislikesPenalty > 0 && (
          <div className="flex items-center justify-between text-slate-300 p-1 rounded bg-black/40">
            <span>Dislikes Penalty:</span>
            <span className="text-rose-400 font-bold">-{breakdown.dislikesPenalty}</span>
          </div>
        )}

        {breakdown.multiplierBonus > 0 && (
          <div className="flex items-center justify-between text-amber-300 p-1 rounded bg-amber-950/40">
            <span>Multiplier ({breakdown.multiplierFactor}x):</span>
            <span className="text-amber-400 font-bold">+{breakdown.multiplierBonus}</span>
          </div>
        )}

        {breakdown.viralBonus > 0 && (
          <div className="flex items-center justify-between text-lime-300 p-1 rounded bg-lime-950/40">
            <span>Viral Reach Bonus:</span>
            <span className="text-lime-400 font-bold">+{breakdown.viralBonus}</span>
          </div>
        )}

        {breakdown.boostBonus > 0 && (
          <div className="flex items-center justify-between text-amber-300 p-1 rounded bg-amber-950/40">
            <span>Boost Priority:</span>
            <span className="text-amber-400 font-bold">+{breakdown.boostBonus}</span>
          </div>
        )}

        {breakdown.mediaBonus > 0 && (
          <div className="flex items-center justify-between text-sky-300 p-1 rounded bg-sky-950/40 col-span-2">
            <span>Multimedia Attached ({breakdown.mediaTypes.join(', ')}):</span>
            <span className="text-sky-400 font-bold">+{breakdown.mediaBonus}</span>
          </div>
        )}
      </div>
    </div>
  );
};
