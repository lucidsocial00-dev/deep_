import React, { useState, useEffect, useMemo } from 'react';
import {
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Share2,
  Trash2,
  Plus,
  Radio,
  Disc,
  Headphones,
  Clock,
  Heart,
  Search,
  ExternalLink,
  Sliders,
  Check,
  RotateCcw,
  AudioWaveform as WaveformIcon,
} from 'lucide-react';
import { Post, PostSong, User, WaveformComment } from '../types';
import { musicAudioEngine } from '../utils/musicAudioEngine';
import { TrackWaveform } from './TrackWaveform';

interface MusicLibraryViewProps {
  currentUser: User;
  allPosts: Post[];
  onToggleSaveSong: (song: PostSong, postId?: string) => void;
  onAddWaveformComment?: (songId: string, comment: WaveformComment, postId?: string) => void;
  onShareToChat?: (item: any) => void;
  onSharePost?: (post: Post, method: 'feed' | 'chat' | 'copy' | 'sms') => void;
  onNavigateToFeed?: () => void;
  onHashtagClick?: (tag: string) => void;
}

export const MusicLibraryView: React.FC<MusicLibraryViewProps> = ({
  currentUser,
  allPosts,
  onToggleSaveSong,
  onAddWaveformComment,
  onShareToChat,
  onSharePost,
  onNavigateToFeed,
  onHashtagClick,
}) => {
  // Extract all songs explicitly saved in user's library
  // Also collect songs from posts bookmarked in the 'music' folder
  const savedSongs = useMemo(() => {
    const directSaved = currentUser.savedSongs || [];
    const directSavedIds = new Set(currentUser.savedSongIds || directSaved.map((s) => s.id));
    
    // Also scan all posts that are in the user's 'music' folder
    const musicFolderPostIds = Object.entries(currentUser.savedPostFolders || {})
      .filter(([_, folders]) => Array.isArray(folders) && folders.includes('music'))
      .map(([postId]) => postId);

    const folderSongs: PostSong[] = [];
    musicFolderPostIds.forEach((postId) => {
      const post = allPosts.find((p) => p.id === postId);
      if (post && post.song && !directSavedIds.has(post.song.id)) {
        folderSongs.push({
          ...post.song,
          savedFromPostId: post.id,
          savedFromAuthorName: post.authorName,
          savedFromAuthorHandle: post.authorHandle,
          savedAt: 'Saved from post',
        });
      }
    });

    return [...directSaved, ...folderSongs];
  }, [currentUser.savedSongs, currentUser.savedSongIds, currentUser.savedPostFolders, allPosts]);

  // Audio Playback State
  const [activeSong, setActiveSong] = useState<PostSong | null>(savedSongs[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [visualizerBars, setVisualizerBars] = useState<number[]>([15, 25, 18, 40, 28, 20, 32, 14]);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'artist' | 'duration'>('recent');

  // Custom song composer modal state
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState(currentUser.name);
  const [newSongGenre, setNewSongGenre] = useState('Ambient Acoustic');
  const [newSongPreset, setNewSongPreset] = useState<'ambient_calm' | 'lofi_tape' | 'acoustic_strings' | 'night_jazz' | 'deep_drone'>('ambient_calm');

  // Visualizer Animation Loop
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
  const handleTogglePlay = (song: PostSong) => {
    if (activeSong?.id === song.id && isPlaying) {
      musicAudioEngine.stop();
      setIsPlaying(false);
    } else {
      setActiveSong(song);
      musicAudioEngine.playPreset(song.synthPreset || 'ambient_calm', song.id, song.durationSeconds);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const unsub = musicAudioEngine.subscribe((state) => {
      setIsPlaying(state.isPlaying);
      if (state.trackId) {
        const found = savedSongs.find((s) => s.id === state.trackId);
        if (found) {
          setActiveSong(found);
        }
      }
    });
    return unsub;
  }, [savedSongs]);

  const handleStop = () => {
    musicAudioEngine.stop();
    setIsPlaying(false);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (isMuted && newVol > 0) setIsMuted(false);
    musicAudioEngine.setVolume(newVol);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      musicAudioEngine.setVolume(volume);
    } else {
      setIsMuted(true);
      musicAudioEngine.setVolume(0);
    }
  };

  // Filter and Sort Saved Songs
  const filteredSongs = useMemo(() => {
    return savedSongs.filter((song) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (song.genre && song.genre.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (song.savedFromAuthorName && song.savedFromAuthorName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesGenre =
        selectedGenre === 'all' ||
        (song.genre && song.genre.toLowerCase().includes(selectedGenre.toLowerCase()));

      return matchesSearch && matchesGenre;
    }).sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
      if (sortBy === 'duration') return (b.durationSeconds || 0) - (a.durationSeconds || 0);
      return 0; // default recent
    });
  }, [savedSongs, searchQuery, selectedGenre, sortBy]);

  // Distinct genres available in saved library
  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    savedSongs.forEach((s) => {
      if (s.genre) set.add(s.genre);
    });
    return Array.from(set);
  }, [savedSongs]);

  // Discoverable Songs across all feed posts that aren't yet saved
  const discoverableSongs = useMemo(() => {
    const savedIds = new Set(savedSongs.map((s) => s.id));
    const list: { song: PostSong; post: Post }[] = [];
    allPosts.forEach((post) => {
      if (post.song && !savedIds.has(post.song.id)) {
        list.push({ song: post.song, post });
      }
    });
    return list;
  }, [allPosts, savedSongs]);

  // Handle Add Custom Ambient Track
  const handleCreateCustomSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSongTitle.trim()) return;

    const newSong: PostSong = {
      id: `song_custom_${Date.now()}`,
      title: newSongTitle.trim(),
      artist: newSongArtist.trim() || currentUser.name,
      album: 'Personal Vault Sessions',
      duration: '3:30',
      durationSeconds: 210,
      genre: newSongGenre,
      synthPreset: newSongPreset,
      coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
      savedAt: 'Just now',
    };

    onToggleSaveSong(newSong);
    setShowAddSongModal(false);
    setNewSongTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Header Hub Card */}
      <div className="bg-neutral-950/90 border border-pink-500/40 rounded-2xl p-5 sm:p-6 shadow-[0_0_20px_rgba(236,72,153,0.15)] relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_8px_rgba(236,72,153,0.25)]">
                <Music className="w-3.5 h-3.5 text-pink-400" />
                <span>Zero-Knowledge Audio Vault</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {savedSongs.length} {savedSongs.length === 1 ? 'song' : 'songs'} archived
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
              <span>Music & Acoustic Library</span>
              <Disc className={`w-6 h-6 text-pink-400 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Curated ambient tracks, spoken word cadences, lo-fi tapes, and acoustic companion scores saved directly from stream posts.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAddSongModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white flex items-center gap-2 shadow-[0_0_12px_rgba(236,72,153,0.4)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Archive Track</span>
            </button>
          </div>
        </div>

        {/* Global Interactive Now Playing Bar */}
        {activeSong && (
          <div className="mt-5 pt-4 border-t border-pink-500/20 flex flex-col gap-3 bg-black/60 rounded-xl p-3.5 border border-pink-500/30">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-pink-500/40 shadow-[0_0_10px_rgba(236,72,153,0.3)]">
                  <img
                    src={activeSong.coverArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'}
                    alt={activeSong.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Disc className={`w-5 h-5 text-pink-300 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 uppercase font-bold">
                      {activeSong.genre || 'Ambient'}
                    </span>
                    {activeSong.savedFromAuthorHandle && (
                      <span className="text-[10px] text-slate-400 truncate">
                        From {activeSong.savedFromAuthorHandle}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 truncate mt-0.5">{activeSong.title}</h4>
                  <p className="text-xs text-slate-400 truncate">{activeSong.artist}</p>
                </div>
              </div>

              {/* Playback Controls & Volume */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                {/* Play / Stop Button */}
                <button
                  onClick={() => handleTogglePlay(activeSong)}
                  className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-lg ${
                    isPlaying
                      ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.7)]'
                      : 'bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                  }`}
                  title={isPlaying ? 'Pause Audio' : 'Play Audio'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                  <span>{isPlaying ? 'Pause' : 'Play Track'}</span>
                </button>

                {/* Volume Slider */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleToggleMute}
                    className="text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-pink-400" /> : <Volume2 className="w-4 h-4 text-pink-400" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16 sm:w-20 accent-pink-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Stylized Active Waveform with Timed Comment Pins */}
            <TrackWaveform
              song={activeSong}
              currentUser={currentUser}
              isPlaying={isPlaying}
              onTogglePlay={() => handleTogglePlay(activeSong)}
              onAddComment={onAddWaveformComment}
              theme="pink"
            />
          </div>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-neutral-900/80 border border-pink-500/30 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search saved songs or artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-black/60 border border-pink-500/30 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-400"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedGenre('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedGenre === 'all'
                ? 'bg-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                : 'text-slate-300 hover:text-white bg-black/40 hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            All Tracks ({savedSongs.length})
          </button>
          {availableGenres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedGenre === genre
                  ? 'bg-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                  : 'text-slate-300 hover:text-white bg-black/40 hover:bg-neutral-800 border border-neutral-800'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Saved Songs Tracklist */}
      {filteredSongs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSongs.map((song, idx) => {
            const isThisPlaying = isPlaying && activeSong?.id === song.id;
            return (
              <div
                key={song.id || idx}
                className={`bg-neutral-950/80 border rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between group ${
                  isThisPlaying
                    ? 'border-pink-400 shadow-[0_0_18px_rgba(236,72,153,0.3)] ring-1 ring-pink-400/40'
                    : 'border-neutral-800 hover:border-pink-500/50 hover:shadow-[0_0_12px_rgba(236,72,153,0.15)]'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Song Cover / Vinyl Image */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-neutral-700/60 shadow-md">
                    <img
                      src={song.coverArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300'}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={() => handleTogglePlay(song)}
                      className={`absolute inset-0 flex items-center justify-center transition-all cursor-pointer ${
                        isThisPlaying
                          ? 'bg-black/40 text-pink-400'
                          : 'bg-black/50 text-white opacity-0 group-hover:opacity-100'
                      }`}
                      title={isThisPlaying ? 'Pause' : 'Play Song'}
                    >
                      {isThisPlaying ? (
                        <Pause className="w-6 h-6 fill-current" />
                      ) : (
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-pink-950/60 text-pink-300 border border-pink-500/30">
                        {song.genre || 'Acoustic'}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {song.duration}
                      </span>
                      {song.bpm && (
                        <span className="text-[10px] font-mono text-slate-500">
                          {song.bpm} BPM
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-100 truncate mt-1">
                      {song.title}
                    </h3>
                    <p className="text-xs text-slate-300 truncate">{song.artist}</p>

                    {/* Origin Post Reference */}
                    {song.savedFromAuthorHandle && (
                      <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                        <span>From post by</span>
                        <span className="font-semibold text-pink-300">{song.savedFromAuthorHandle}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactive Stylized Waveform with Comments */}
                <div className="mt-3">
                  <TrackWaveform
                    song={song}
                    currentUser={currentUser}
                    isPlaying={isThisPlaying}
                    onTogglePlay={() => handleTogglePlay(song)}
                    onAddComment={onAddWaveformComment}
                    theme="pink"
                    compact
                  />
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleTogglePlay(song)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      isThisPlaying
                        ? 'bg-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                        : 'bg-neutral-900 hover:bg-neutral-800 text-pink-300 border border-pink-500/30'
                    }`}
                  >
                    {isThisPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Playing</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play Song</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {onShareToChat && (
                      <button
                        onClick={() => {
                          onShareToChat({
                            id: `song_${song.id}`,
                            title: `🎵 ${song.title} - ${song.artist}`,
                            content: `Shared audio soundtrack from deep_ music library: "${song.title}" (${song.genre})`,
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:text-pink-300 hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
                        title="Share Song to Chat"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => onToggleSaveSong(song, song.savedFromPostId)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
                      title="Remove from Music Library"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-10 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-pink-950/50 border border-pink-500/40 text-pink-400 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.3)]">
            <Music className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">No songs found in this view</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? 'No saved songs match your search filter. Try clearing the search query.'
              : 'Save songs from stream posts by clicking the "Save Song" button on any post with an audio track, or adding posts to your Music folder.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGenre('all');
              }}
              className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-pink-300 hover:bg-neutral-800 border border-pink-500/30 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Discovery Section: Songs in Stream Posts available to save */}
      {discoverableSongs.length > 0 && (
        <div className="bg-neutral-950/90 border border-pink-500/30 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">
                Discover More Songs from Stream Posts
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {discoverableSongs.length} available to save
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {discoverableSongs.map(({ song, post }) => (
              <div
                key={song.id}
                className="bg-black/60 border border-neutral-800 hover:border-pink-500/40 rounded-xl p-3 flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-neutral-700">
                    <img src={song.coverArt} alt={song.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-100 truncate">{song.title}</h5>
                    <p className="text-[11px] text-slate-400 truncate">By {song.artist}</p>
                    <span className="text-[9px] font-mono text-pink-400 font-semibold">{song.genre}</span>
                  </div>
                </div>

                <button
                  onClick={() => onToggleSaveSong(song, post.id)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-pink-600/90 hover:bg-pink-500 text-white flex items-center gap-1 shadow-[0_0_8px_rgba(236,72,153,0.3)] shrink-0 transition-all cursor-pointer"
                  title="Save Song to Music Library"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Ambient Track Modal */}
      {showAddSongModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-pink-500/50 rounded-2xl p-6 max-w-md w-full shadow-[0_0_30px_rgba(236,72,153,0.3)] space-y-4">
            <div className="flex items-center justify-between border-b border-pink-500/20 pb-3">
              <div className="flex items-center gap-2 text-pink-400 font-bold text-sm">
                <Music className="w-4 h-4" />
                <span>Archive New Soundtrack</span>
              </div>
              <button
                onClick={() => setShowAddSongModal(false)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomSong} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Track Title</label>
                <input
                  type="text"
                  placeholder="e.g. Kyoto Nightfall (Ambient Tape)"
                  value={newSongTitle}
                  onChange={(e) => setNewSongTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl text-xs bg-black/60 border border-neutral-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Artist / Composer</label>
                <input
                  type="text"
                  placeholder="Artist name"
                  value={newSongArtist}
                  onChange={(e) => setNewSongArtist(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-black/60 border border-neutral-700 text-slate-100 focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Genre / Acoustic Vibe</label>
                <select
                  value={newSongGenre}
                  onChange={(e) => setNewSongGenre(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-black/60 border border-neutral-700 text-slate-100 focus:outline-none focus:border-pink-400"
                >
                  <option value="Ambient Acoustic">Ambient Acoustic</option>
                  <option value="Lo-Fi Ambient">Lo-Fi Ambient</option>
                  <option value="Modular Synth">Modular Synth</option>
                  <option value="Nocturnal Jazz">Nocturnal Jazz</option>
                  <option value="Zen Meditative">Zen Meditative</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Synthesizer Sound Preset</label>
                <select
                  value={newSongPreset}
                  onChange={(e) => setNewSongPreset(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-black/60 border border-neutral-700 text-slate-100 focus:outline-none focus:border-pink-400"
                >
                  <option value="ambient_calm">Harmonic Bells & Sine Pad (Ambient Calm)</option>
                  <option value="lofi_tape">Rhodes Chords & Vinyl Tape (Lo-Fi)</option>
                  <option value="acoustic_strings">Resonant Plucked Strings (Acoustic)</option>
                  <option value="night_jazz">Mellow Major 9th & Walking Bass (Jazz)</option>
                  <option value="deep_drone">Sub-Bass Analog Modular Drone (Deep)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSongModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.4)] transition-all cursor-pointer"
                >
                  Save Track to Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
