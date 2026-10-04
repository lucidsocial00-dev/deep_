import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  Search,
  Filter,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Compass,
  ArrowUpDown,
  BookOpen,
  X,
  MessageCircle,
  FolderHeart,
  Hash,
  Tag,
  Layers,
  List,
  Smile,
  Music,
  Folder,
  FolderPlus,
  Check,
} from 'lucide-react';
import { PDFDocument, Post, PostSong, User, WaveformComment, PostMood } from '../types';
import { PostCard } from './PostCard';
import { calculateCompatibility } from '../utils/compatibility';

interface SavedPostsViewProps {
  currentUser: User;
  allPosts: Post[];
  allUsers?: User[];
  onLike: (postId: string) => void;
  onDislike: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onHashtagClick: (tag: string) => void;
  onOpenPdf: (doc: PDFDocument) => void;
  onShareToChat?: (post: Post) => void;
  onSharePost?: (post: Post, method: 'feed' | 'chat' | 'copy' | 'sms') => void;
  onToggleBookmarkPost: (postId: string, folderId?: string) => void;
  onCreateBookmarkFolder?: (folderName: string, postIdToSave?: string) => void;
  onToggleSaveSong?: (song: PostSong, postId?: string) => void;
  onAddWaveformComment?: (songId: string, comment: WaveformComment, postId?: string) => void;
  onNavigateToFeed: () => void;
  onInspectCompatibility?: (userId: string) => void;
  onCityClick?: (cityName: string) => void;
  onOpenReadingLink?: (link: any) => void;
  onClaimReadingPoints?: (post: Post, points: number, hashtag: string) => void;
  onVotePoll?: (postId: string, optionId: string) => void;
  onRequestCreateQuoteCard?: (data: {
    quoteText: string;
    sourceTitle: string;
    sourceType: 'poetry' | 'pdf';
    sourceAuthor?: string;
    sourceAuthorAvatar?: string;
    sourceId?: string;
    sourceDoc?: PDFDocument;
  }) => void;
  onMoodClick?: (mood: PostMood) => void;
}

export const SavedPostsView: React.FC<SavedPostsViewProps> = ({
  currentUser,
  allPosts,
  allUsers = [],
  onLike,
  onDislike,
  onAddComment,
  onHashtagClick,
  onOpenPdf,
  onShareToChat,
  onSharePost,
  onToggleBookmarkPost,
  onCreateBookmarkFolder,
  onToggleSaveSong,
  onNavigateToFeed,
  onInspectCompatibility,
  onCityClick,
  onOpenReadingLink,
  onClaimReadingPoints,
  onVotePoll,
  onAddWaveformComment,
  onRequestCreateQuoteCard,
  onMoodClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'poetry' | 'pdf' | 'media'>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'hashtag' | 'newest' | 'oldest' | 'likes'>('hashtag');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const savedPostIds = currentUser.savedPostIds || [];

  // Filter all posts that are saved by current user
  const savedPosts = useMemo(() => {
    return allPosts.filter((p) => savedPostIds.includes(p.id));
  }, [allPosts, savedPostIds]);

  // Extract folder statistics
  const folderStats = useMemo(() => {
    let memes = 0;
    let music = 0;
    let general = 0;
    const custom: Record<string, number> = {};

    savedPosts.forEach((post) => {
      const folders = currentUser.savedPostFolders?.[post.id] || ['general'];
      if (folders.includes('memes')) memes++;
      if (folders.includes('music')) music++;
      if (folders.includes('general')) general++;
      (currentUser.customBookmarkFolders || []).forEach((cf) => {
        if (folders.includes(cf.id)) {
          custom[cf.id] = (custom[cf.id] || 0) + 1;
        }
      });
    });

    return {
      all: savedPosts.length,
      memes,
      music,
      general,
      custom,
    };
  }, [savedPosts, currentUser.savedPostFolders, currentUser.customBookmarkFolders]);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    if (onCreateBookmarkFolder) {
      onCreateBookmarkFolder(newFolderName.trim());
    }
    setNewFolderName('');
    setShowNewFolderInput(false);
  };

  // Extract all unique hashtags and counts across saved memories
  const savedHashtags = useMemo(() => {
    const map: Record<string, number> = {};
    savedPosts.forEach((post) => {
      const tags = (post.hashtags && post.hashtags.length > 0)
        ? post.hashtags
        : ['#General'];
      tags.forEach((t) => {
        const clean = t.startsWith('#') ? t : `#${t}`;
        map[clean] = (map[clean] || 0) + 1;
      });
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count }));
  }, [savedPosts]);

  // Helper to extract primary hashtag for sorting/grouping
  const getPrimaryTag = (post: Post): string => {
    if (post.hashtags && post.hashtags.length > 0) {
      const first = post.hashtags[0].trim();
      return first.startsWith('#') ? first : `#${first}`;
    }
    return '#General';
  };

  // Counts for quick filter pills
  const counts = useMemo(() => {
    return {
      all: savedPosts.length,
      poetry: savedPosts.filter((p) => p.poetryFormatted).length,
      pdf: savedPosts.filter((p) => Boolean(p.document)).length,
      media: savedPosts.filter((p) => Boolean(p.image)).length,
    };
  }, [savedPosts]);

  // Apply search query, filter type, hashtag filter, and sorting
  const filteredAndSortedPosts = useMemo(() => {
    let result = savedPosts.filter((post) => {
      // Folder Filter (e.g. 'memes', 'music', 'general', or custom folder id)
      if (selectedFolder !== 'all') {
        const postFolders = currentUser.savedPostFolders?.[post.id] || ['general'];
        if (!postFolders.includes(selectedFolder)) {
          return false;
        }
      }

      // Filter Type
      if (filterType === 'poetry' && !post.poetryFormatted) return false;
      if (filterType === 'pdf' && !post.document) return false;
      if (filterType === 'media' && !post.image) return false;

      // Specific Hashtag Filter
      if (selectedTag) {
        const cleanSelected = selectedTag.toLowerCase().replace(/^#+/, '');
        const hasTag = (post.hashtags || []).some(
          (t) => t.toLowerCase().replace(/^#+/, '') === cleanSelected
        );
        if (!hasTag) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesContent = post.content.toLowerCase().includes(q);
        const matchesAuthor =
          post.authorName.toLowerCase().includes(q) ||
          post.authorHandle.toLowerCase().includes(q);
        const matchesHashtag = (post.hashtags || []).some((h) =>
          h.toLowerCase().includes(q)
        );
        const matchesDoc =
          post.document &&
          (post.document.title.toLowerCase().includes(q) ||
            post.document.category.toLowerCase().includes(q));

        if (!matchesContent && !matchesAuthor && !matchesHashtag && !matchesDoc) {
          return false;
        }
      }

      return true;
    });

    // Sorting by hashtag, newest, oldest, or likes
    result.sort((a, b) => {
      if (sortBy === 'hashtag') {
        const tagA = getPrimaryTag(a).toLowerCase();
        const tagB = getPrimaryTag(b).toLowerCase();
        const comp = tagA.localeCompare(tagB);
        if (comp !== 0) return comp;
        return b.timestamp.localeCompare(a.timestamp);
      }
      if (sortBy === 'likes') {
        return b.likesCount - a.likesCount;
      }
      if (sortBy === 'oldest') {
        return a.timestamp.localeCompare(b.timestamp);
      }
      // default 'newest'
      return b.timestamp.localeCompare(a.timestamp);
    });

    return result;
  }, [savedPosts, filterType, selectedFolder, selectedTag, searchQuery, sortBy, currentUser.savedPostFolders]);

  // Group posts by hashtag when in grouped mode
  const hashtagGroups = useMemo(() => {
    const groups: { tag: string; posts: Post[] }[] = [];
    const groupMap = new Map<string, Post[]>();

    filteredAndSortedPosts.forEach((post) => {
      const tag = getPrimaryTag(post);
      if (!groupMap.has(tag)) {
        groupMap.set(tag, []);
      }
      groupMap.get(tag)!.push(post);
    });

    groupMap.forEach((posts, tag) => {
      groups.push({ tag, posts });
    });

    // Sort groups alphabetically by tag
    groups.sort((a, b) => a.tag.localeCompare(b.tag));
    return groups;
  }, [filteredAndSortedPosts]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative group">
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-pink-500/20 via-rose-400/20 to-pink-500/20 blur-xl opacity-40 group-hover:opacity-60 transition-all duration-500 pointer-events-none" />
        <div className="relative bg-black/80 backdrop-blur-md border border-pink-500/40 rounded-3xl p-6 sm:p-8 card-pink-glow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pink-500/20 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-pink-950/80 border border-pink-500/50 flex items-center justify-center text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.4)]">
                <Bookmark className="w-6 h-6 fill-pink-500/30 text-pink-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-space-mono">
                    Memories
                  </h1>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-pink-950/80 border border-pink-500/40 text-pink-300">
                    {savedPosts.length} saved
                  </span>
                  {savedHashtags.length > 0 && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-pink-500/30 text-slate-300 hidden sm:inline-flex items-center gap-1">
                      <Hash className="w-3 h-3 text-pink-400" />
                      {savedHashtags.length} tags
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Your private collection of bookmarked posts and saved poems, organized by hashtags.
                </p>
              </div>
            </div>

            {/* Quick action button to browse feed */}
            <button
              onClick={onNavigateToFeed}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-pink-500/30 hover:border-pink-500/60 text-xs font-semibold text-pink-300 hover:text-white transition-all shadow-[0_0_10px_rgba(236,72,153,0.15)] self-start sm:self-auto cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Browse Feed</span>
            </button>
          </div>

          {/* Filter, Search & Sorting Bar */}
          <div className="mt-5 space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search memories, poetry, #hashtags, or author..."
                  className="w-full bg-neutral-950/90 border border-pink-500/30 focus:border-pink-500 rounded-xl pl-10 pr-9 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500/50 shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-pink-300 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Mode & Sort Controls */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {/* View Mode Toggle: Grouped vs Flat List */}
                <div className="flex items-center bg-neutral-950/90 border border-pink-500/30 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setViewMode('grouped')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'grouped'
                        ? 'bg-pink-600 text-white shadow-[0_0_8px_rgba(236,72,153,0.4)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Group memories into hashtag sections"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">By Hashtags</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-pink-600 text-white shadow-[0_0_8px_rgba(236,72,153,0.4)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="View as continuous sorted stream"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Stream</span>
                  </button>
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-1.5 bg-neutral-950/90 border border-pink-500/30 rounded-xl px-3 py-2 text-xs text-slate-300">
                  <ArrowUpDown className="w-3.5 h-3.5 text-pink-400" />
                  <span className="text-[11px] text-slate-400">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer font-semibold"
                  >
                    <option value="hashtag" className="bg-neutral-900 text-slate-200">
                      Hashtags (A-Z)
                    </option>
                    <option value="newest" className="bg-neutral-900 text-slate-200">
                      Newest First
                    </option>
                    <option value="oldest" className="bg-neutral-900 text-slate-200">
                      Oldest First
                    </option>
                    <option value="likes" className="bg-neutral-900 text-slate-200">
                      Most Liked
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Folder Collections Bar */}
            <div className="pt-2 border-t border-pink-500/15">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                  <Folder className="w-3.5 h-3.5 text-pink-400" />
                  <span>Collections & Folders:</span>
                </div>
                {!showNewFolderInput ? (
                  <button
                    type="button"
                    onClick={() => setShowNewFolderInput(true)}
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-pink-400 hover:text-pink-300 transition-colors cursor-pointer px-2 py-0.5 rounded-lg bg-pink-950/40 border border-pink-500/30 hover:border-pink-500/60"
                  >
                    <FolderPlus className="w-3 h-3" />
                    <span>+ New Folder</span>
                  </button>
                ) : (
                  <form onSubmit={handleCreateFolder} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Folder name..."
                      className="bg-neutral-900 border border-pink-500/50 rounded-lg px-2 py-0.5 text-[11px] text-pink-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-400 w-28 sm:w-36"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!newFolderName.trim()}
                      className="px-2 py-0.5 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-[10px] text-white font-semibold cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewFolderInput(false);
                        setNewFolderName('');
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-200 text-[10px] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </form>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setSelectedFolder('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                    selectedFolder === 'all'
                      ? 'bg-pink-600/30 text-pink-200 border-pink-400/80 shadow-[0_0_10px_rgba(236,72,153,0.3)] font-bold'
                      : 'bg-neutral-900/60 text-slate-400 hover:text-slate-200 border-neutral-800 hover:border-pink-500/30'
                  }`}
                >
                  <FolderHeart className="w-3.5 h-3.5 text-pink-400" />
                  <span>All Vault</span>
                  <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-md font-mono">
                    {folderStats.all}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFolder('memes')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                    selectedFolder === 'memes'
                      ? 'bg-purple-600/30 text-purple-200 border-purple-400/80 shadow-[0_0_10px_rgba(168,85,247,0.3)] font-bold'
                      : 'bg-neutral-900/60 text-slate-400 hover:text-purple-300 border-neutral-800 hover:border-purple-500/30'
                  }`}
                >
                  <Smile className="w-3.5 h-3.5 text-purple-400" />
                  <span>Meme Collections</span>
                  <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-md font-mono">
                    {folderStats.memes}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFolder('music')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                    selectedFolder === 'music'
                      ? 'bg-sky-500/25 text-sky-200 border-sky-400/80 shadow-[0_0_10px_rgba(56,189,248,0.35)] font-bold'
                      : 'bg-neutral-900/60 text-slate-400 hover:text-sky-300 border-neutral-800 hover:border-sky-500/30'
                  }`}
                >
                  <Music className="w-3.5 h-3.5 text-sky-400" />
                  <span>Music</span>
                  <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-md font-mono">
                    {folderStats.music}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFolder('general')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                    selectedFolder === 'general'
                      ? 'bg-pink-600/30 text-pink-200 border-pink-400/80 shadow-[0_0_10px_rgba(244,114,182,0.3)] font-bold'
                      : 'bg-neutral-900/60 text-slate-400 hover:text-pink-300 border-neutral-800 hover:border-pink-500/30'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 text-pink-400" />
                  <span>General Vault</span>
                  <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-md font-mono">
                    {folderStats.general}
                  </span>
                </button>

                {/* Custom Folders */}
                {(currentUser.customBookmarkFolders || []).map((cf) => (
                  <button
                    key={cf.id}
                    type="button"
                    onClick={() => setSelectedFolder(cf.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                      selectedFolder === cf.id
                        ? 'bg-sky-600/30 text-sky-200 border-sky-400/80 shadow-[0_0_10px_rgba(56,189,248,0.3)] font-bold'
                        : 'bg-neutral-900/60 text-slate-400 hover:text-sky-300 border-neutral-800 hover:border-sky-500/30'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-sky-400" />
                    <span>{cf.name}</span>
                    <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-md font-mono">
                      {folderStats.custom[cf.id] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Category Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setFilterType('all');
                  setSelectedTag(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  filterType === 'all' && !selectedTag
                    ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                    : 'bg-neutral-900/80 text-slate-300 hover:bg-neutral-900 border border-pink-500/20 hover:border-pink-500/50'
                }`}
              >
                <FolderHeart className="w-3.5 h-3.5" />
                <span>All Memories</span>
                <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-md font-mono">
                  {counts.all}
                </span>
              </button>

              <button
                onClick={() => setFilterType('poetry')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  filterType === 'poetry'
                    ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                    : 'bg-neutral-900/80 text-slate-300 hover:bg-neutral-900 border border-pink-500/20 hover:border-pink-500/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-300" />
                <span>Poetry & Verses</span>
                <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-md font-mono">
                  {counts.poetry}
                </span>
              </button>

              <button
                onClick={() => setFilterType('pdf')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  filterType === 'pdf'
                    ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                    : 'bg-neutral-900/80 text-slate-300 hover:bg-neutral-900 border border-pink-500/20 hover:border-pink-500/50'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-pink-300" />
                <span>PDF Documents</span>
                <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-md font-mono">
                  {counts.pdf}
                </span>
              </button>

              <button
                onClick={() => setFilterType('media')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  filterType === 'media'
                    ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                    : 'bg-neutral-900/80 text-slate-300 hover:bg-neutral-900 border border-pink-500/20 hover:border-pink-500/50'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-pink-300" />
                <span>Images</span>
                <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-md font-mono">
                  {counts.media}
                </span>
              </button>
            </div>

            {/* Interactive Hashtags Row */}
            {savedHashtags.length > 0 && (
              <div className="pt-2 border-t border-pink-500/15">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-pink-300 flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-pink-400" />
                    <span>Hashtag Streams in Your Memories:</span>
                  </span>
                  {selectedTag && (
                    <button
                      onClick={() => setSelectedTag(null)}
                      className="text-[10px] text-pink-400 hover:text-pink-200 font-mono underline cursor-pointer"
                    >
                      Clear hashtag filter
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {savedHashtags.map(({ tag, count }) => {
                    const isSelected =
                      selectedTag?.toLowerCase() === tag.toLowerCase();
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTag(isSelected ? null : tag);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-pink-600 text-white border border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.5)] font-bold'
                            : 'bg-neutral-950/80 hover:bg-neutral-900 border border-pink-500/25 text-pink-300 hover:text-white'
                        }`}
                      >
                        <Hash className="w-3 h-3 text-pink-400 opacity-80" />
                        <span>{tag}</span>
                        <span className="text-[10px] bg-black/50 text-slate-300 px-1.5 py-0.2 rounded-md">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Saved Posts Stream */}
      {filteredAndSortedPosts.length > 0 ? (
        viewMode === 'grouped' && !selectedTag ? (
          /* Grouped by Hashtags View */
          <div className="space-y-8">
            {hashtagGroups.map((group) => (
              <div key={group.tag} className="space-y-4">
                {/* Hashtag Group Header */}
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-pink-500/20">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onHashtagClick(group.tag)}
                      className="flex items-center gap-1.5 text-base font-bold font-mono text-pink-300 hover:text-white transition-colors cursor-pointer group/tag"
                    >
                      <Hash className="w-4 h-4 text-pink-400 group-hover/tag:scale-110 transition-transform" />
                      <span>{group.tag}</span>
                    </button>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-pink-950/80 border border-pink-500/30 text-pink-300">
                      {group.posts.length} {group.posts.length === 1 ? 'memory' : 'memories'}
                    </span>
                  </div>

                  <button
                    onClick={() => onHashtagClick(group.tag)}
                    className="text-[11px] font-semibold text-pink-400 hover:text-pink-200 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>View Stream</span>
                    <span>&rarr;</span>
                  </button>
                </div>

                {/* Posts in this Hashtag Group */}
                <div className="space-y-4">
                  {group.posts.map((post) => {
                    const authorUser = allUsers.find((u) => u.id === post.authorId);
                    const authorComp = calculateCompatibility(
                      currentUser,
                      authorUser || {
                        id: post.authorId,
                        name: post.authorName,
                        handle: post.authorHandle,
                        avatar: post.authorAvatar,
                        bio: '',
                        location: '',
                        verified: true,
                        joinDate: '',
                        likedPostIds: [],
                        dislikedPostIds: [],
                        friends: [],
                        vaultLocked: true,
                      },
                      allPosts
                    );

                    return (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        onLike={onLike}
                        onDislike={onDislike}
                        onAddComment={onAddComment}
                        onHashtagClick={onHashtagClick}
                        onOpenPdf={onOpenPdf}
                        onShareToChat={onShareToChat}
                        onSharePost={onSharePost}
                        onToggleBookmark={onToggleBookmarkPost}
                        onCreateBookmarkFolder={onCreateBookmarkFolder}
                        isBookmarked={true}
                        authorCompatibilityPercent={authorComp.matchPercentage}
                        onInspectCompatibility={onInspectCompatibility}
                        onCityClick={onCityClick}
                        onOpenReadingLink={onOpenReadingLink}
                        onClaimReadingPoints={onClaimReadingPoints}
                        onVotePoll={onVotePoll}
                        onToggleSaveSong={onToggleSaveSong}
                        onAddWaveformComment={onAddWaveformComment}
                        onRequestCreateQuoteCard={onRequestCreateQuoteCard}
                        onMoodClick={onMoodClick}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Continuous List View (Sorted by Hashtag or Selected Criterion) */
          <div className="space-y-4">
            {filteredAndSortedPosts.map((post) => {
              const authorUser = allUsers.find((u) => u.id === post.authorId);
              const authorComp = calculateCompatibility(
                currentUser,
                authorUser || {
                  id: post.authorId,
                  name: post.authorName,
                  handle: post.authorHandle,
                  avatar: post.authorAvatar,
                  bio: '',
                  location: '',
                  verified: true,
                  joinDate: '',
                  likedPostIds: [],
                  dislikedPostIds: [],
                  friends: [],
                  vaultLocked: true,
                },
                allPosts
              );

              return (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onLike={onLike}
                  onDislike={onDislike}
                  onAddComment={onAddComment}
                  onHashtagClick={onHashtagClick}
                  onOpenPdf={onOpenPdf}
                  onShareToChat={onShareToChat}
                  onSharePost={onSharePost}
                  onToggleBookmark={onToggleBookmarkPost}
                  onCreateBookmarkFolder={onCreateBookmarkFolder}
                  isBookmarked={true}
                  authorCompatibilityPercent={authorComp.matchPercentage}
                  onInspectCompatibility={onInspectCompatibility}
                  onCityClick={onCityClick}
                  onOpenReadingLink={onOpenReadingLink}
                  onClaimReadingPoints={onClaimReadingPoints}
                  onVotePoll={onVotePoll}
                  onToggleSaveSong={onToggleSaveSong}
                  onAddWaveformComment={onAddWaveformComment}
                  onRequestCreateQuoteCard={onRequestCreateQuoteCard}
                  onMoodClick={onMoodClick}
                />
              );
            })}
          </div>
        )
      ) : savedPosts.length === 0 ? (
        /* Empty State: No posts saved yet */
        <div className="relative group text-center py-16 px-4">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-pink-500/10 via-pink-400/15 to-pink-500/10 blur-xl opacity-30 pointer-events-none" />
          <div className="relative bg-black/75 backdrop-blur-md border border-pink-500/30 rounded-3xl p-8 sm:p-12 max-w-md mx-auto space-y-4 card-pink-glow">
            <div className="w-16 h-16 rounded-3xl bg-pink-950/80 border border-pink-500/50 flex items-center justify-center text-pink-400 mx-auto shadow-[0_0_20px_rgba(236,72,153,0.4)]">
              <Bookmark className="w-8 h-8 text-pink-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-100">No Memories Saved Yet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Whenever you find a thought, verse, poem, or PDF in the feed that you want to hold onto, click the bookmark icon on the post to store it in your Memories archive.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={onNavigateToFeed}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-all hover:scale-105 active:scale-95 border border-pink-400/50 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Global Feed</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State: Search or filter returned no matches */
        <div className="text-center py-12 px-4 bg-black/60 backdrop-blur-md border border-pink-500/20 rounded-2xl p-8 space-y-3">
          <p className="text-sm font-semibold text-slate-300">
            No memories match your current search or hashtag filter.
          </p>
          <p className="text-xs text-slate-500">
            Try adjusting your search terms or selecting a different hashtag stream.
          </p>
          <div className="pt-2 flex justify-center gap-2 flex-wrap">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-pink-400 hover:text-pink-300 font-semibold underline px-3 py-1 cursor-pointer"
              >
                Clear Search
              </button>
            )}
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-xs text-pink-400 hover:text-pink-300 font-semibold underline px-3 py-1 cursor-pointer"
              >
                Clear Tag Filter
              </button>
            )}
            {filterType !== 'all' && (
              <button
                onClick={() => setFilterType('all')}
                className="text-xs text-pink-400 hover:text-pink-300 font-semibold underline px-3 py-1 cursor-pointer"
              >
                Show All Memories
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
