import React, { useState, useEffect } from 'react';
import {
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Sparkles,
  Disc,
  Bookmark,
  Plus,
  Radio,
  Sliders,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Post, PostSong, User } from '../types';
import { musicAudioEngine } from '../utils/musicAudioEngine';

interface MusicFeedBannerProps {
  currentUser: User;
  musicPosts: Post[];
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  onExitMusicView: () => void;
  onOpenMusicVault: () => void;
  onBulkSaveAllSongs?: () => void;
  onFocusPostMusic?: () => void;
}

export const MusicFeedBanner: React.FC<MusicFeedBannerProps> = ({
  currentUser,
  musicPosts,
  selectedGenre,
  onSelectGenre,
  onExitMusicView,
  onOpenMusicVault,
  onBulkSaveAllSongs,
  onFocusPostMusic,
}) => {
  // Extract all songs from music posts
  const songs = musicPosts.map((p) => p.song).filter(Boolean) as PostSong[];
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visualizerBars, setVisualizerBars] = useState<number[]>([12, 22, 16, 35, 24, 18, 28, 14]);

  const activeSong = songs[currentTrackIndex] || songs[0] || null;

  // Visualizer tick animation
  useEffect(() => {
    let animId: number;
    if (isPlaying) {
      const updateVisualizer = () => {
        setVisualizerBars(musicAudioEngine.getVisualizerData());
        animId = requestAnimationFrame(updateVisualizer);
      };
      animId = requestAnimationFrame(updateVisualizer);
    } else {
      setVisualizerBars([10, 15, 8, 20, 12, 18, 14, 9]);
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  // Handle Play/Pause
  const handleTogglePlay = () => {
    if (!activeSong) return;
    if (isPlaying) {
      musicAudioEngine.stop();
      setIsPlaying(false);
    } else {
      musicAudioEngine.playPreset(activeSong.synthPreset || 'ambient_calm');
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (songs.length === 0) return;
    const nextIdx = (currentTrackIndex + 1) % songs.length;
    setCurrentTrackIndex(nextIdx);
    const nextSong = songs[nextIdx];
    if (nextSong) {
      musicAudioEngine.playPreset(nextSong.synthPreset || 'ambient_calm');
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (songs.length === 0) return;
    const prevIdx = (currentTrackIndex - 1 + songs.length) % songs.length;
    setCurrentTrackIndex(prevIdx);
    const prevSong = songs[prevIdx];
    if (prevSong) {
      musicAudioEngine.playPreset(prevSong.synthPreset || 'ambient_calm');
      setIsPlaying(true);
    }
  };

  // Derive unique genres
  const genres = Array.from(
    new Set(songs.map((s) => s.genre).filter(Boolean) as string[])
  );

  // Count saved in library
  const savedSongIds = new Set(currentUser.savedSongIds || []);
  const savedCount = songs.filter((s) => savedSongIds.has(s.id)).length;
  const unsavedCount = songs.length - savedCount;

  return (
    <div className="bg-neutral-950/95 border border-pink-500/40 rounded-2xl p-4 sm:p-5 shadow-[0_0_25px_rgba(236,72,153,0.2)] relative overflow-hidden group space-y-4">
      {/* Background Ambient Glow */}
      <div className="absolute -right-16 -top-16 w-56 h-56 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_8px_rgba(236,72,153,0.25)]">
              <Music className="w-3.5 h-3.5 text-pink-400" />
              <span>Music & Soundtracks Channel</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {musicPosts.length} posts with audio scores
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <span>Acoustic & Generative Music Feed</span>
            <Disc className={`w-5 h-5 text-pink-400 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            Curated feed of stream posts carrying original musical scores, generative ambient synthesizers, and lo-fi tapes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenMusicVault}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-pink-300 border border-pink-500/30 hover:border-pink-400 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Open Your Saved Music Vault"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Music Vault</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-pink-950 border border-pink-400/40 text-pink-200 font-mono">
              {currentUser.savedSongIds?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={onExitMusicView}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 transition-all cursor-pointer"
            title="Exit Music Stream"
          >
            ✕ Global Feed
          </button>
        </div>
      </div>

      {/* Integrated Feed Radio Station Bar */}
      {activeSong && (
        <div className="bg-black/80 border border-pink-500/30 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 relative z-10">
          {/* Active Radio Track Info */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-pink-500/40 shadow-sm">
              <img
                src={activeSong.coverArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'}
                alt={activeSong.title}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleTogglePlay}
                className={`absolute inset-0 flex items-center justify-center transition-all cursor-pointer ${
                  isPlaying ? 'bg-black/50 text-pink-400' : 'bg-black/30 text-white hover:bg-black/50'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Station Radio
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentTrackIndex + 1} of {songs.length}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-100 truncate mt-0.5">{activeSong.title}</h4>
              <p className="text-[11px] text-slate-400 truncate">{activeSong.artist} • {activeSong.genre}</p>
            </div>
          </div>

          {/* Controls & Waveform */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Visualizer Waveform */}
            <div className="flex items-end gap-1 h-5 px-2.5 py-0.5 rounded bg-black/50 border border-pink-500/20">
              {visualizerBars.map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-pink-400 rounded-full transition-all duration-100"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            {/* Prev / Play / Next */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Previous Track"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                  isPlaying
                    ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                    : 'bg-pink-600 hover:bg-pink-500 text-white'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlaying ? 'Pause' : 'Play Radio'}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Next Track"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Bulk Save Button if unsaved tracks exist */}
            {unsavedCount > 0 && onBulkSaveAllSongs && (
              <button
                type="button"
                onClick={onBulkSaveAllSongs}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-pink-950/80 hover:bg-pink-900 border border-pink-500/40 text-pink-200 transition-all cursor-pointer"
                title="Save all music feed songs to your library"
              >
                <Sparkles className="w-3 h-3 text-pink-400" />
                <span>Save All ({unsavedCount})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Genre Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-1 border-t border-pink-500/20">
        <span className="text-[10px] uppercase font-mono text-slate-400 font-bold shrink-0 mr-1">
          Genre:
        </span>
        <button
          type="button"
          onClick={() => onSelectGenre('all')}
          className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedGenre === 'all'
              ? 'bg-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]'
              : 'bg-black/50 text-slate-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
          }`}
        >
          All Tracks ({musicPosts.length})
        </button>

        {genres.map((g) => {
          const isSelected = selectedGenre.toLowerCase() === g.toLowerCase();
          const genreCount = musicPosts.filter(
            (p) => p.song?.genre?.toLowerCase() === g.toLowerCase()
          ).length;
          return (
            <button
              key={g}
              type="button"
              onClick={() => onSelectGenre(isSelected ? 'all' : g)}
              className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-pink-600 text-white border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                  : 'bg-black/50 text-slate-300 hover:text-white hover:bg-neutral-800 border-neutral-800'
              }`}
            >
              <span>{g}</span>
              <span className="text-[10px] font-mono opacity-75 ml-1">({genreCount})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
