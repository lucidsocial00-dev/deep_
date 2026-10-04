import React from 'react';
import {
  Globe,
  Hash,
  Sparkles,
  Lock,
  FileText,
  PlusCircle,
  UserCheck,
  Bookmark,
  Music,
  Users,
  Wand2,
  Layers,
} from 'lucide-react';
import { User } from '../types';
import { AvatarReaderProgress } from './AvatarReaderProgress';
import { getUserCumulativeReadingPoints, getCumulativeReaderRank } from '../utils/readingEstimator';

interface HeaderProps {
  activeTab: 'feed' | 'hashtags' | 'meme_creator' | 'meme_collector' | 'memories_library' | 'saved' | 'library' | 'vault' | 'music_library' | 'find_friends';
  setActiveTab: (tab: 'feed' | 'hashtags' | 'meme_creator' | 'meme_collector' | 'memories_library' | 'saved' | 'library' | 'vault' | 'music_library' | 'find_friends') => void;
  currentUser: User;
  onOpenNewPost?: () => void;
  onOpenUploadAvatarModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenNewPost,
  onOpenUploadAvatarModal,
}) => {
  const cumulativePoints = getUserCumulativeReadingPoints(currentUser);
  const rankInfo = getCumulativeReaderRank(cumulativePoints);
  const savedSongsCount = currentUser.savedSongIds?.length || currentUser.savedSongs?.length || 0;

  return (
    <header className="sticky top-0 z-40 bg-black/70 backdrop-blur-md border-b border-pink-500/40 text-slate-100 shadow-[0_4px_20px_rgba(236,72,153,0.2)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-13 sm:h-14 gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('feed')}>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-space-mono text-3xl sm:text-4xl font-normal tracking-tight text-white pink-glow-text">
                  deep_
                </span>
              </div>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-0.5 bg-neutral-900/90 p-0.5 rounded-xl border border-pink-500/30">
            {/* 1. Feed */}
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'feed'
                  ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.6)]'
                  : 'text-slate-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Feed</span>
            </button>

            {/* 2. Find Friends (Moved to Second) */}
            <button
              onClick={() => setActiveTab('find_friends')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'find_friends'
                  ? 'bg-gradient-to-r from-pink-600 to-cyan-600 text-white shadow-[0_0_14px_rgba(236,72,153,0.6)]'
                  : 'text-slate-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-white" />
              <span>Find Friends</span>
            </button>

            {/* 3. Streams */}
            <button
              onClick={() => setActiveTab('hashtags')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'hashtags'
                  ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.6)]'
                  : 'text-slate-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Streams</span>
              {(currentUser.joinedGroupTags?.length || 0) > 0 && (
                <span className="text-[10px] font-mono bg-pink-950/80 border border-pink-400/40 text-pink-300 px-1.5 py-0.2 rounded-full">
                  {currentUser.joinedGroupTags?.length}
                </span>
              )}
            </button>

            {/* 4. Meme Creator */}
            <button
              onClick={() => setActiveTab('meme_creator')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'meme_creator'
                  ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white shadow-[0_0_14px_rgba(236,72,153,0.6)]'
                  : 'text-slate-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-pink-300" />
              <span>Meme Creator</span>
            </button>

            {/* 5. Meme Collector */}
            <button
              onClick={() => setActiveTab('meme_collector')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'meme_collector'
                  ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.6)]'
                  : 'text-slate-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-pink-300" />
              <span>Meme Collector</span>
              {((currentUser.savedPostIds?.length || 0) + (currentUser.savedDocIds?.length || 0)) > 0 && (
                <span className="text-[10px] font-mono bg-pink-950/80 border border-pink-400/40 text-pink-300 px-1.5 py-0.2 rounded-full">
                  {(currentUser.savedPostIds?.length || 0) + (currentUser.savedDocIds?.length || 0)}
                </span>
              )}
            </button>

            {/* 6. Music Library */}
            <button
              onClick={() => setActiveTab('music_library')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'music_library'
                  ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.6)]'
                  : 'text-pink-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Music className={`w-3.5 h-3.5 ${activeTab === 'music_library' ? 'text-white' : 'text-pink-400'}`} />
              <span>Music Library</span>
              {savedSongsCount > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    activeTab === 'music_library'
                      ? 'bg-pink-900/90 text-white border border-pink-300/40'
                      : 'bg-pink-950/80 border border-pink-400/40 text-pink-300'
                  }`}
                >
                  {savedSongsCount}
                </span>
              )}
            </button>

            {/* 7. Encrypted Profile */}
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'vault'
                  ? 'bg-pink-500/20 text-white border border-pink-400/60 shadow-[0_0_14px_rgba(244,114,182,0.4)]'
                  : 'text-white/90 hover:text-white hover:bg-pink-950/40 border border-transparent'
              }`}
            >
              <Lock className={`w-3.5 h-3.5 ${activeTab === 'vault' ? 'text-pink-400' : 'text-white'}`} />
              <span className="text-white font-semibold">Encrypted Profile</span>
            </button>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* User Profile Button with Reader Rank Progress Ring & Avatar Upload */}
            <div
              onClick={() => setActiveTab('vault')}
              className="flex items-center gap-2 py-0.5 pl-1 pr-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-pink-500/30 hover:border-pink-500/60 transition-all duration-300 ease-out transform-gpu hover:scale-[1.03] shadow-[0_0_12px_rgba(236,72,153,0.18)] hover:shadow-[0_0_24px_rgba(236,72,153,0.35)] group cursor-pointer"
            >
              <AvatarReaderProgress
                user={currentUser}
                size={34}
                onAvatarClick={() => {
                  if (onOpenUploadAvatarModal) {
                    onOpenUploadAvatarModal();
                  } else {
                    setActiveTab('vault');
                  }
                }}
              />

              <div
                className="hidden sm:block text-left select-none"
              >
                <div className="flex items-center gap-1.5 leading-none">
                  <p className="text-xs font-semibold text-slate-100 group-hover:text-pink-300 transition-colors">
                    {currentUser.name}
                  </p>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${rankInfo.color}`}
                    title={`Reader Level: Level ${rankInfo.level}`}
                  >
                    {rankInfo.badge} Lv.{rankInfo.level}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-medium mt-0.5 leading-none">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    AES Vault
                  </span>
                  <span className="text-slate-400 font-mono text-[9px]">
                    • {cumulativePoints} pts
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden flex items-center justify-around py-1 border-t border-pink-500/20 overflow-x-auto text-[11px]">
          {/* 1. Feed */}
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
              activeTab === 'feed' ? 'text-pink-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Feed</span>
          </button>

          {/* 2. Find Friends (Moved to Second) */}
          <button
            onClick={() => setActiveTab('find_friends')}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-0.5 rounded-md transition-colors ${
              activeTab === 'find_friends' ? 'text-pink-400 font-semibold' : 'text-slate-400 hover:text-pink-300'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-white" />
            <span className="whitespace-nowrap">Find Friends</span>
          </button>

          {/* 3. Streams */}
          <button
            onClick={() => setActiveTab('hashtags')}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
              activeTab === 'hashtags' ? 'text-pink-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Streams</span>
          </button>

          {/* 4. Meme Creator */}
          <button
            onClick={() => setActiveTab('meme_creator')}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
              activeTab === 'meme_creator'
                ? 'text-pink-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-pink-400" />
            <span className="whitespace-nowrap">Meme Creator</span>
          </button>

          {/* 5. Meme Collector */}
          <button
            onClick={() => setActiveTab('meme_collector')}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
              activeTab === 'meme_collector'
                ? 'text-pink-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-pink-400" />
            <span className="whitespace-nowrap">Meme Collector</span>
          </button>

          {/* 6. Music Library */}
          <button
            onClick={() => setActiveTab('music_library')}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-0.5 rounded-md transition-colors ${
              activeTab === 'music_library' ? 'text-pink-400 font-semibold' : 'text-slate-400 hover:text-pink-300'
            }`}
          >
            <Music className={`w-3.5 h-3.5 ${activeTab === 'music_library' ? 'text-pink-400' : ''}`} />
            <span className="whitespace-nowrap">Music Library</span>
          </button>

          {/* 7. Encrypted Profile */}
          <button
            onClick={() => setActiveTab('vault')}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-0.5 rounded-md transition-colors ${
              activeTab === 'vault' ? 'text-pink-400 font-semibold' : 'text-white/80 hover:text-white'
            }`}
          >
            <Lock className={`w-3.5 h-3.5 ${activeTab === 'vault' ? 'text-pink-400' : 'text-white'}`} />
            <span className="text-white whitespace-nowrap">Encrypted Profile</span>
          </button>
        </div>

      </div>
    </header>
  );
};
