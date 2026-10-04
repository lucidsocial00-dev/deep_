import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  Zap,
  UserPlus,
  UserCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { User, Post } from '../types';
import { CITY_REGIONS } from '../utils/cityRegions';
import { getCityLeaderboard, normalizeCityName, CityLeaderboardEntry } from '../utils/cityLeaderboard';

interface CityLeaderboardWidgetProps {
  currentUser: User;
  allUsers: User[];
  posts: Post[];
  onAddFriend: (userId: string, userName: string) => void;
  onInspectCompatibility?: (userId: string) => void;
  onCityClick?: (cityName: string) => void;
}

export const CityLeaderboardWidget: React.FC<CityLeaderboardWidgetProps> = ({
  currentUser,
  allUsers,
  posts,
  onAddFriend,
  onInspectCompatibility,
  onCityClick,
}) => {
  const userHomeCity = currentUser.city || 'Kyoto';
  const [selectedCity, setSelectedCity] = useState<string>(userHomeCity);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Derive city leaderboard data
  const leaderboard = useMemo(() => {
    return getCityLeaderboard(selectedCity, currentUser, allUsers, posts);
  }, [selectedCity, currentUser, allUsers, posts]);

  const { cityRegion, currentUserRank, currentUserEntry, entries, pointsToNextRank, nextRankUser, isCurrentUserLeader } = leaderboard;

  const isHomeCitySelected = normalizeCityName(selectedCity) === normalizeCityName(userHomeCity);
  const displayedEntries = isExpanded ? entries : entries.slice(0, 4);

  return (
    <div className="relative group" id="city-leaderboard-sidebar-widget">
      {/* Ambient background glow */}
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-pink-400/15 to-amber-500/10 blur-md opacity-40 group-hover:opacity-60 transition-all duration-300 pointer-events-none" />

      <div className="relative bg-black/80 backdrop-blur-md border border-pink-500/40 rounded-2xl p-4 space-y-3 card-pink-glow">
        
        {/* Header Row: Title & City Selector */}
        <div className="flex items-center justify-between border-b border-pink-500/20 pb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-100 tracking-tight">City Leaderboard</span>
                <span className="text-[10px] text-amber-300">🔥</span>
              </div>
            </div>
          </div>

          {/* City Switcher Pill */}
          <div className="relative shrink-0">
            <button
              type="button"
              id="city-leaderboard-selector-btn"
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-950/70 hover:bg-pink-900/80 border border-pink-500/40 text-[11px] font-medium text-pink-200 transition-all cursor-pointer"
              title="Switch city to view other regional rankings"
            >
              <span className="text-xs">{cityRegion.flagEmoji}</span>
              <span className="truncate max-w-[80px] font-semibold">{cityRegion.name}</span>
              <ChevronDown className={`w-3 h-3 text-pink-400 transition-transform duration-200 ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* City Selection Dropdown */}
            <AnimatePresence>
              {isCityDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1.5 w-48 max-h-56 overflow-y-auto z-40 rounded-xl bg-neutral-950/95 border border-pink-500/50 shadow-[0_10px_30px_rgba(0,0,0,0.85)] p-1.5 space-y-0.5 custom-scrollbar"
                >
                  <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-slate-400 border-b border-white/10 mb-1">
                    Select City Node
                  </div>
                  {CITY_REGIONS.map((region) => {
                    const isSelected = normalizeCityName(region.id) === normalizeCityName(selectedCity);
                    const isUserHome = normalizeCityName(region.id) === normalizeCityName(userHomeCity);

                    return (
                      <button
                        key={region.id}
                        type="button"
                        onClick={() => {
                          setSelectedCity(region.name);
                          setIsCityDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-pink-600/30 text-pink-200 font-bold border border-pink-500/40'
                            : 'text-slate-300 hover:bg-neutral-900 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span>{region.flagEmoji}</span>
                          <span className="truncate">{region.name}</span>
                        </span>
                        {isUserHome && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-pink-950 text-pink-300 border border-pink-500/30 font-mono">
                            Home
                          </span>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Current User City Standing Card */}
        {currentUserEntry && (
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-950/40 via-neutral-900/80 to-pink-950/30 border border-amber-500/30 shadow-inner">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-amber-400/60 shrink-0"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[9px] font-black rounded-full px-1 py-0.2 border border-black shadow">
                    #{currentUserRank}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-amber-200 truncate">
                      {isCurrentUserLeader ? '👑 City Champion' : `Rank #${currentUserRank} in ${cityRegion.name}`}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-pink-950/80 text-pink-300 border border-pink-500/30 font-semibold">
                      You
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 truncate">
                    {currentUserEntry.rankTier}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 justify-end font-mono font-bold text-xs text-amber-300">
                  <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                  <span>{currentUserEntry.totalScore.toLocaleString()}</span>
                </div>
                <span className="text-[9px] text-slate-400">Total City Pts</span>
              </div>
            </div>

            {/* Motivational Gap to next rank or lead status */}
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
              {isCurrentUserLeader ? (
                <div className="flex items-center gap-1 text-amber-300/90 font-medium">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Defending the #1 spot in {cityRegion.name}!</span>
                </div>
              ) : nextRankUser ? (
                <div className="flex items-center gap-1 text-slate-300">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>
                    <strong className="text-emerald-300">+{pointsToNextRank} pts</strong> to pass #{currentUserRank - 1} {nextRankUser.user.name}
                  </span>
                </div>
              ) : (
                <span className="text-slate-400">Ranked across {entries.length} local creators</span>
              )}

              {onCityClick && (
                <button
                  type="button"
                  onClick={() => onCityClick(cityRegion.name)}
                  className="text-pink-400 hover:text-pink-300 flex items-center gap-0.5 text-[10px] font-semibold transition-colors cursor-pointer"
                  title={`View dedicated ${cityRegion.name} streams page`}
                >
                  <span>Explore</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* If user is viewing a city they aren't resident in */}
        {!currentUserEntry && (
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-white/10 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              <span className="text-[11px] text-slate-300">
                Viewing <strong>{cityRegion.name}</strong> regional board
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCity(userHomeCity)}
              className="text-[10px] text-pink-400 hover:text-pink-300 underline font-medium cursor-pointer"
            >
              My City ({userHomeCity})
            </button>
          </div>
        )}

        {/* Leaderboard Table List */}
        <div className="space-y-1.5" id="city-leaderboard-rows">
          {displayedEntries.map((entry) => {
            const isSelf = entry.isCurrentUser;
            const isAlreadyFriend = currentUser.friends.includes(entry.user.id);

            // Rank Styling
            let rankBadgeStyle = 'bg-neutral-800 text-slate-300 border-neutral-700';
            let rankLabel: React.ReactNode = `#${entry.rank}`;

            if (entry.rank === 1) {
              rankBadgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.25)]';
              rankLabel = (
                <span className="flex items-center gap-0.5 font-bold">
                  <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  <span>1</span>
                </span>
              );
            } else if (entry.rank === 2) {
              rankBadgeStyle = 'bg-slate-300/20 text-slate-200 border-slate-400/40';
              rankLabel = (
                <span className="flex items-center gap-0.5 font-bold">
                  <Medal className="w-2.5 h-2.5 text-slate-300" />
                  <span>2</span>
                </span>
              );
            } else if (entry.rank === 3) {
              rankBadgeStyle = 'bg-amber-900/30 text-amber-400 border-amber-700/50';
              rankLabel = (
                <span className="flex items-center gap-0.5 font-bold">
                  <Medal className="w-2.5 h-2.5 text-amber-500" />
                  <span>3</span>
                </span>
              );
            }

            return (
              <div
                key={entry.user.id}
                className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                  isSelf
                    ? 'bg-amber-950/30 border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.15)] ring-1 ring-amber-400/20'
                    : 'bg-neutral-900/70 border-white/5 hover:border-pink-500/30 hover:bg-neutral-900/90'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Rank Badge */}
                  <div
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center text-[10px] font-mono shrink-0 ${rankBadgeStyle}`}
                  >
                    {rankLabel}
                  </div>

                  {/* Avatar & User Details */}
                  <img
                    src={entry.user.avatar}
                    alt={entry.user.name}
                    className={`w-7 h-7 rounded-lg object-cover shrink-0 ${
                      isSelf ? 'ring-1 ring-amber-400' : 'ring-1 ring-pink-500/20'
                    }`}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`font-semibold text-xs truncate ${isSelf ? 'text-amber-200 font-bold' : 'text-slate-200'}`}>
                        {entry.user.name}
                      </p>
                      {isSelf && (
                        <span className="text-[8px] font-mono px-1 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] text-slate-400 truncate font-mono">
                        {entry.user.handle}
                      </p>
                      <span className="text-[9px] text-amber-300/70 truncate hidden sm:inline">
                        • {entry.rankTier}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Score & Action */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-0.5 justify-end font-mono font-bold text-xs text-slate-200">
                      <Flame className="w-2.5 h-2.5 text-orange-400 fill-orange-400" />
                      <span>{entry.totalScore.toLocaleString()}</span>
                    </div>
                    <span className="text-[8px] text-slate-400 font-mono">
                      {entry.readingPoints} rd / {entry.activityPoints} act
                    </span>
                  </div>

                  {/* Action button: Add Friend if not current user */}
                  {!isSelf && (
                    <div>
                      {isAlreadyFriend ? (
                        <span
                          title="Friend"
                          className="p-1 rounded-md bg-pink-950/60 border border-pink-500/30 text-pink-300 inline-flex items-center"
                        >
                          <UserCheck className="w-3 h-3 text-pink-400" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAddFriend(entry.user.id, entry.user.name)}
                          title={`Add ${entry.user.name} as friend`}
                          className="p-1 rounded-md bg-pink-600/40 hover:bg-pink-600 border border-pink-500/40 text-pink-200 hover:text-white transition-all cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Expand / Collapse or Explore City Footer */}
        <div className="pt-1 flex items-center justify-between text-[11px] border-t border-white/5">
          {entries.length > 4 && (
            <button
              type="button"
              id="city-leaderboard-toggle-expand"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-pink-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{isExpanded ? 'Show Top 4' : `View All ${entries.length} Citizens`}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          {!isHomeCitySelected && (
            <button
              type="button"
              onClick={() => setSelectedCity(userHomeCity)}
              className="ml-auto text-pink-400 hover:text-pink-300 font-semibold cursor-pointer"
            >
              Back to My City ({userHomeCity}) →
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
