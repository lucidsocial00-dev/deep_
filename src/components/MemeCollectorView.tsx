import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  Search,
  Plus,
  Image as ImageIcon,
  Share2,
  Download,
  Copy,
  Check,
  Heart,
  Sliders,
  Maximize2,
  Trash2,
  Shuffle,
  Grid,
  Layers,
  Wand2,
  MessageCircle,
  X,
  ExternalLink,
  Eye,
  Send,
  Upload,
  RefreshCw,
  FolderHeart,
  HelpCircle,
} from 'lucide-react';
import { MemeItem, Post, User } from '../types';
import { INITIAL_MEMES, MEME_TEMPLATES, MemeTemplate } from '../data/mockMemes';

interface MemeCollectorViewProps {
  currentUser: User;
  allPosts?: Post[];
  onShareToFeed?: (postData: { content: string; image?: string; hashtags: string[] }) => void;
  onShareToChat?: (meme: MemeItem) => void;
  onHashtagClick?: (tag: string) => void;
  onNavigateToCreator?: () => void;
}

export const MemeCollectorView: React.FC<MemeCollectorViewProps> = ({
  currentUser,
  allPosts = [],
  onShareToFeed,
  onShareToChat,
  onHashtagClick,
  onNavigateToCreator,
}) => {
  // Meme state (persisted to localStorage or initialized from mock)
  const [memes, setMemes] = useState<MemeItem[]>(() => {
    try {
      const saved = localStorage.getItem('lucid_meme_collection');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load memes from storage:', e);
    }
    return INITIAL_MEMES;
  });

  // Save to local storage whenever memes list updates
  useEffect(() => {
    try {
      localStorage.setItem('lucid_meme_collection', JSON.stringify(memes));
    } catch (e) {
      console.warn('Failed to save memes:', e);
    }
  }, [memes]);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'likes' | 'spicy' | 'title'>('newest');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'masonry' | 'compact'>('grid');

  // Modals
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [lightboxMeme, setLightboxMeme] = useState<MemeItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareMenuMemeId, setShareMenuMemeId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Studio Generator State
  const [studioBaseImage, setStudioBaseImage] = useState<string>(MEME_TEMPLATES[0].url);
  const [studioTopText, setStudioTopText] = useState('WHEN THE CIPHER DECRYPTS');
  const [studioBottomText, setStudioBottomText] = useState('AND IT IS A PERFECT HAIKU');
  const [studioTitle, setStudioTitle] = useState('Cryptographic Epiphany');
  const [studioCategory, setStudioCategory] = useState<MemeItem['category']>('Cyberpunk');
  const [studioTags, setStudioTags] = useState('#Cyberpunk, #Crypto, #Verse, #deep_');
  const [studioFilter, setStudioFilter] = useState<'none' | 'neon' | 'noir' | 'glitch'>('none');
  const [studioTextColor, setStudioTextColor] = useState('#FFFFFF');
  const [studioFontSize, setStudioFontSize] = useState<number>(36);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Add Meme Modal State
  const [addMode, setAddMode] = useState<'url' | 'upload' | 'template'>('upload');
  const [newMemeTitle, setNewMemeTitle] = useState('');
  const [newMemeUrl, setNewMemeUrl] = useState('');
  const [newMemeCaption, setNewMemeCaption] = useState('');
  const [newMemeCategory, setNewMemeCategory] = useState<MemeItem['category']>('Cyberpunk');
  const [newMemeTags, setNewMemeTags] = useState('#Dank, #deep_');
  const [newMemeSpicy, setNewMemeSpicy] = useState<number>(4);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  // Trigger temporary notification
  const notify = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Filter and sort memes
  const filteredMemes = useMemo(() => {
    return memes
      .filter((m) => {
        // Search query (supports tags with/without '#', multi-terms, captions, and titles)
        if (searchQuery.trim()) {
          const raw = searchQuery.trim().toLowerCase();
          const terms = raw
            .split(/[\s,]+/)
            .map((t) => t.trim())
            .filter(Boolean);

          if (terms.length > 0) {
            const matchesAll = terms.every((term) => {
              const cleanTerm = term.replace(/^#+/, '');
              const matchesTag = m.tags.some((t) => {
                const cleanTag = t.toLowerCase().replace(/^#+/, '');
                return cleanTag.includes(cleanTerm) || t.toLowerCase().includes(term);
              });
              const matchesTitle = m.title.toLowerCase().includes(cleanTerm);
              const matchesCaption = (m.caption || '').toLowerCase().includes(cleanTerm);
              const matchesTop = (m.topText || '').toLowerCase().includes(cleanTerm);
              const matchesBottom = (m.bottomText || '').toLowerCase().includes(cleanTerm);
              const matchesCat = m.category.toLowerCase().includes(cleanTerm);
              return matchesTag || matchesTitle || matchesCaption || matchesTop || matchesBottom || matchesCat;
            });
            if (!matchesAll) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.id.localeCompare(a.id);
        if (sortBy === 'likes') return b.likesCount - a.likesCount;
        if (sortBy === 'spicy') return (b.spicinessScore || 0) - (a.spicinessScore || 0);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [memes, searchQuery, sortBy]);

  // Handle meme like toggle
  const handleToggleLike = (memeId: string) => {
    setMemes((prev) =>
      prev.map((m) => {
        if (m.id === memeId) {
          const nextLiked = !m.isLiked;
          return {
            ...m,
            isLiked: nextLiked,
            likesCount: nextLiked ? m.likesCount + 1 : Math.max(0, m.likesCount - 1),
          };
        }
        return m;
      })
    );
  };

  // Handle meme delete
  const handleDeleteMeme = (memeId: string) => {
    if (window.confirm('Remove this meme from your collection?')) {
      setMemes((prev) => prev.filter((m) => m.id !== memeId));
      if (lightboxMeme?.id === memeId) setLightboxMeme(null);
      notify('Meme removed from collection');
    }
  };

  // Handle copy image link
  const handleCopyLink = (meme: MemeItem) => {
    navigator.clipboard.writeText(meme.url);
    setCopiedId(meme.id);
    notify('📋 Meme URL copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle Share to Feed
  const handleShareMemeToFeed = (meme: MemeItem) => {
    if (onShareToFeed) {
      const textOverlay =
        meme.topText || meme.bottomText
          ? `"${[meme.topText, meme.bottomText].filter(Boolean).join(' — ')}"`
          : '';
      const content = `${meme.title}\n\n${textOverlay ? `${textOverlay}\n\n` : ''}${meme.caption || 'Shared from my Meme Collector stash ⚡'}`;
      onShareToFeed({
        content,
        image: meme.url,
        hashtags: [...new Set(['#Meme', ...meme.tags, '#deep_'])],
      });
      notify('🚀 Meme shared to the live public feed!');
    } else {
      notify('Shared to feed!');
    }
  };

  // Canvas Generator Rendering
  useEffect(() => {
    if (!isStudioOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = studioBaseImage;
    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;

      // Draw base image scaled to fit square canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Apply aesthetic filter
      if (studioFilter === 'neon') {
        ctx.fillStyle = 'rgba(236, 72, 153, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (studioFilter === 'noir') {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (studioFilter === 'glitch') {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.18)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Vignette effect
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        150,
        canvas.width / 2,
        canvas.height / 2,
        350
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Configure Meme Typography
      ctx.fillStyle = studioTextColor;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(3, studioFontSize / 7);
      ctx.textAlign = 'center';
      ctx.font = `900 ${studioFontSize}px "Impact", "Arial Black", sans-serif`;

      // Draw Top Text
      if (studioTopText.trim()) {
        ctx.textBaseline = 'top';
        const lines = wrapCanvasText(ctx, studioTopText.toUpperCase(), canvas.width - 40);
        lines.forEach((line, idx) => {
          const y = 25 + idx * (studioFontSize + 6);
          ctx.strokeText(line, canvas.width / 2, y);
          ctx.fillText(line, canvas.width / 2, y);
        });
      }

      // Draw Bottom Text
      if (studioBottomText.trim()) {
        ctx.textBaseline = 'bottom';
        const lines = wrapCanvasText(ctx, studioBottomText.toUpperCase(), canvas.width - 40);
        lines.reverse().forEach((line, idx) => {
          const y = canvas.height - 25 - idx * (studioFontSize + 6);
          ctx.strokeText(line, canvas.width / 2, y);
          ctx.fillText(line, canvas.width / 2, y);
        });
      }

      // Watermark in corner
      ctx.font = '600 11px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.textAlign = 'right';
      ctx.fillText('⚡ LUCID VAULT', canvas.width - 15, canvas.height - 10);
    };
  }, [
    isStudioOpen,
    studioBaseImage,
    studioTopText,
    studioBottomText,
    studioFilter,
    studioTextColor,
    studioFontSize,
  ]);

  // Helper to wrap text on canvas
  const wrapCanvasText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Save generated meme from studio
  const handleSaveStudioMeme = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const tagList = studioTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith('#') ? t : `#${t}`));

      const newMeme: MemeItem = {
        id: `meme_gen_${Date.now()}`,
        title: studioTitle || 'Custom Meme Stash',
        url: dataUrl,
        topText: studioTopText,
        bottomText: studioBottomText,
        caption: `${studioTopText} - ${studioBottomText}`,
        category: studioCategory,
        tags: tagList.length ? tagList : ['#Custom', '#Dank', '#deep_'],
        likesCount: 1,
        isLiked: true,
        collectedAt: 'Just now',
        source: 'Meme Studio',
        spicinessScore: 5,
        authorName: currentUser.name,
      };

      setMemes((prev) => [newMeme, ...prev]);
      setIsStudioOpen(false);
      notify('✨ Custom Meme saved to your collector!');
    } catch (e) {
      console.error(e);
      notify('Error exporting canvas meme.');
    }
  };

  // Handle manual file upload in Add Meme Modal
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedPreview(result);
      setNewMemeUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Save added meme
  const handleSaveAddedMeme = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = newMemeUrl || uploadedPreview;
    if (!finalUrl) {
      alert('Please provide an image URL or upload a file.');
      return;
    }

    const tagList = newMemeTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const newMeme: MemeItem = {
      id: `meme_added_${Date.now()}`,
      title: newMemeTitle || 'Collected Meme',
      url: finalUrl,
      caption: newMemeCaption,
      category: newMemeCategory,
      tags: tagList.length ? tagList : ['#Meme', '#deep_'],
      likesCount: 0,
      isLiked: false,
      collectedAt: 'Just now',
      source: 'Uploaded',
      spicinessScore: newMemeSpicy,
      authorName: currentUser.name,
    };

    setMemes((prev) => [newMeme, ...prev]);
    setIsAddModalOpen(false);
    // Reset form
    setNewMemeTitle('');
    setNewMemeUrl('');
    setNewMemeCaption('');
    setUploadedPreview(null);
    notify('🎉 New meme added to your collector vault!');
  };

  // Shuffle random meme
  const handleRandomMeme = () => {
    if (memes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * memes.length);
    setLightboxMeme(memes[randomIndex]);
  };

  return (
    <div className="space-y-6">
      {/* Toast feedback banner */}
      {actionFeedback && (
        <div className="fixed top-20 right-6 z-50 bg-neutral-900/95 border border-pink-500/80 text-pink-200 px-4 py-3 rounded-2xl shadow-[0_0_20px_rgba(236,72,153,0.5)] flex items-center gap-3 backdrop-blur-md animate-bounce">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span className="text-xs font-semibold">{actionFeedback}</span>
        </div>
      )}

      {/* Hero Control Bar & Vault Stats */}
      <div className="bg-black/75 backdrop-blur-md border border-pink-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_20px_rgba(244,114,182,0.15),0_10px_30px_rgba(0,0,0,0.7)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-pink-600/10 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_8px_rgba(236,72,153,0.3)]">
                <Flame className="w-3.5 h-3.5 text-pink-400" />
                <span>Encrypted Meme Vault & Generator</span>
              </span>
              <span className="text-[11px] font-mono text-slate-300">
                {memes.length} {memes.length === 1 ? 'Meme' : 'Memes'} in Stash
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
              <span>Meme Collector</span>
              <span className="text-pink-400 text-sm px-2.5 py-0.5 rounded-lg bg-pink-950/60 border border-pink-500/40 font-mono">
                v2.4
              </span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Curate, craft, generate, and share cryptographic, cyber-noir, AI, and philosophical memes. Save directly to your vault or broadcast to the live network.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                if (onNavigateToCreator) {
                  onNavigateToCreator();
                } else {
                  setIsStudioOpen(true);
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)] hover:shadow-[0_0_25px_rgba(236,72,153,0.8)] hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Wand2 className="w-4 h-4 text-pink-200 animate-pulse" />
              <span>Meme Creator</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-neutral-900/90 text-pink-300 border border-pink-500/40 hover:bg-neutral-800 hover:text-white transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Meme</span>
            </button>

            <button
              onClick={handleRandomMeme}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-neutral-900/90 text-slate-300 border border-neutral-800 hover:text-pink-300 hover:border-pink-500/30 transition-all cursor-pointer"
              title="Shuffle a random meme from your vault"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle</span>
            </button>
          </div>
        </div>

        {/* Search & Layout Toolbar */}
        <div className="mt-6 pt-5 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Search Input for Tags */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tags (e.g. #cyberpunk, #dank, #glitch, #ai)..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-neutral-900/90 border border-neutral-700/80 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Layout Mode Switcher */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="flex items-center bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setLayoutMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  layoutMode === 'grid' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Standard Grid"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('masonry')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  layoutMode === 'masonry' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Card Mode"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Search / Tag Filter Status */}
        {searchQuery.trim() && (
          <div className="mt-3.5 flex items-center justify-between text-xs text-slate-400 px-0.5">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Search:</span>
              <span className="inline-flex items-center font-mono text-pink-300 bg-pink-950/60 border border-pink-500/30 px-2.5 py-0.5 rounded-lg text-xs font-semibold">
                {searchQuery}
              </span>
              <span className="text-[11px] text-slate-400">
                ({filteredMemes.length} {filteredMemes.length === 1 ? 'match' : 'matches'})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[11px] text-pink-400 hover:text-pink-300 transition-colors cursor-pointer font-medium"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Memes Grid */}
      {filteredMemes.length === 0 ? (
        <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-3xl p-12 text-center">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200 mb-1">No Memes Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            {searchQuery
              ? `No memes match "${searchQuery}". Try searching for another tag (e.g. #cyberpunk, #glitch) or clear the search.`
              : 'Your meme vault is currently empty. Create a new custom meme or upload one!'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 text-slate-200 hover:bg-neutral-700 cursor-pointer"
              >
                Clear Search
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsStudioOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-pink-600 text-white shadow-lg hover:bg-pink-500 cursor-pointer"
            >
              Open Meme Creator
            </button>
          </div>
        </div>
      ) : (
        <div
          className={
            layoutMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
              : 'grid grid-cols-1 md:grid-cols-2 gap-6'
          }
        >
          {filteredMemes.map((meme) => (
            <div
              key={meme.id}
              className="group bg-black/70 backdrop-blur-md border border-neutral-800/80 hover:border-pink-500/60 rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(244,114,182,0.2)] transition-all duration-300 flex flex-col"
            >
              {/* Meme Image Container */}
              <div
                onClick={() => setLightboxMeme(meme)}
                className="relative aspect-square sm:aspect-[4/3] w-full overflow-hidden bg-neutral-950 cursor-pointer"
              >
                <img
                  src={meme.url}
                  alt={meme.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Cyber Scanline Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                {/* Top Badge: Category & Spicy */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-black/80 backdrop-blur-md text-pink-300 border border-pink-500/40">
                    {meme.category}
                  </span>

                  <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>{meme.spicinessScore || 4}/5</span>
                  </div>
                </div>

                {/* Hover Inspect Prompt */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[1px] pointer-events-none">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600/90 text-white text-xs font-bold shadow-lg">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Inspect Meme</span>
                  </span>
                </div>
              </div>

              {/* Meme Details & Footer */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm line-clamp-1 group-hover:text-pink-300 transition-colors">
                    {meme.title}
                  </h3>
                  {meme.caption && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 italic">
                      "{meme.caption}"
                    </p>
                  )}

                  {/* Tags */}
                  {meme.tags && meme.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {meme.tags.map((t) => {
                        const isMatch = searchQuery.trim() && (
                          t.toLowerCase().includes(searchQuery.toLowerCase().trim().replace(/^#+/, '')) ||
                          searchQuery.toLowerCase().trim().includes(t.toLowerCase().replace(/^#+/, ''))
                        );
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchQuery(t);
                            }}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-md border cursor-pointer transition-all ${
                              isMatch
                                ? 'bg-pink-500/20 text-pink-300 border-pink-500/50 shadow-[0_0_6px_rgba(236,72,153,0.3)]'
                                : 'bg-neutral-900 border-neutral-800 text-slate-400 hover:text-pink-300 hover:border-pink-500/40'
                            }`}
                            title={`Search for tag ${t} in search bar`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action Toolbar */}
                <div className="pt-3 border-t border-neutral-900/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Upvote Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleLike(meme.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        meme.isLiked
                          ? 'bg-pink-950/80 border border-pink-500 text-pink-300 shadow-[0_0_8px_rgba(244,114,182,0.4)]'
                          : 'bg-neutral-900 border border-neutral-800 text-slate-400 hover:text-pink-300'
                      }`}
                      title="Like meme"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${meme.isLiked ? 'fill-pink-400 text-pink-400' : ''}`}
                      />
                      <span>{meme.likesCount}</span>
                    </button>

                    {/* Copy Link */}
                    <button
                      type="button"
                      onClick={() => handleCopyLink(meme)}
                      className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-slate-400 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
                      title="Copy Meme URL"
                    >
                      {copiedId === meme.id ? (
                        <Check className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Share Button & Popover */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareMenuMemeId(shareMenuMemeId === meme.id ? null : meme.id);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-600/20 hover:bg-pink-600 text-pink-300 hover:text-white border border-pink-500/40 hover:border-pink-400 transition-all cursor-pointer shadow-[0_0_10px_rgba(236,72,153,0.15)]"
                        title="Share this meme"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </button>

                      {shareMenuMemeId === meme.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShareMenuMemeId(null);
                            }}
                          />
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute bottom-full right-0 mb-2 w-48 z-40 bg-neutral-950/95 border border-pink-500/60 rounded-xl p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.95)] backdrop-blur-xl space-y-1"
                          >
                            <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-slate-400 border-b border-white/10">
                              Share Meme
                            </div>

                            {/* Broadcast to Feed */}
                            <button
                              type="button"
                              onClick={() => {
                                handleShareMemeToFeed(meme);
                                setShareMenuMemeId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-pink-600/30 hover:text-pink-200 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5 text-pink-400" />
                              <span>Post to Feed</span>
                            </button>

                            {/* Send in Chat if onShareToChat */}
                            {onShareToChat && (
                              <button
                                type="button"
                                onClick={() => {
                                  onShareToChat(meme);
                                  notify('💬 Sent meme to messaging!');
                                  setShareMenuMemeId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-sky-600/30 hover:text-sky-200 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
                                <span>Send in Chat</span>
                              </button>
                            )}

                            {/* Copy Link */}
                            <button
                              type="button"
                              onClick={() => {
                                handleCopyLink(meme);
                                setShareMenuMemeId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-neutral-800 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copy Link</span>
                            </button>

                            {/* Native Share */}
                            {typeof navigator !== 'undefined' && !!navigator.share && (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await navigator.share({
                                      title: meme.title,
                                      text: meme.caption || meme.title,
                                      url: meme.url,
                                    });
                                    notify('Shared successfully!');
                                  } catch (err) {
                                    // ignore cancel
                                  }
                                  setShareMenuMemeId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-neutral-800 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>More Options...</span>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Delete Meme */}
                    <button
                      type="button"
                      onClick={() => handleDeleteMeme(meme.id)}
                      className="p-1.5 rounded-xl bg-neutral-900 text-slate-500 hover:text-red-400 hover:bg-red-950/40 border border-neutral-800 hover:border-red-500/30 transition-colors cursor-pointer"
                      title="Remove from Stash"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MEME STUDIO GENERATOR MODAL */}
      {/* ========================================================================= */}
      {isStudioOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-950/80 backdrop-blur-2xl border border-pink-500/50 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_40px_rgba(236,72,153,0.3)] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-pink-600/20 border border-pink-500/40 text-pink-400">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Meme Creator & Studio</h2>
                  <p className="text-xs text-slate-400">Craft custom cyber-noir stanzas and visual memes</p>
                </div>
              </div>
              <button
                onClick={() => setIsStudioOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Studio Body: Canvas & Controls */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Canvas Preview */}
              <div className="lg:col-span-7 flex flex-col items-center">
                <div className="relative w-full max-w-md aspect-square bg-black rounded-2xl overflow-hidden border border-pink-500/40 shadow-2xl flex items-center justify-center">
                  <canvas ref={canvasRef} className="w-full h-full object-contain" />
                </div>
                <p className="text-[11px] font-mono text-slate-400 mt-2 text-center">
                  ⚡ High-Resolution Real-time Render
                </p>

                {/* Base Template Selector */}
                <div className="w-full mt-4">
                  <label className="text-xs font-bold text-slate-300 mb-2 block">
                    Choose Template / Base Canvas:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {MEME_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => {
                          setStudioBaseImage(tmpl.url);
                          if (tmpl.defaultTopText) setStudioTopText(tmpl.defaultTopText);
                          if (tmpl.defaultBottomText) setStudioBottomText(tmpl.defaultBottomText);
                          setStudioTitle(tmpl.name);
                        }}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer relative group ${
                          studioBaseImage === tmpl.url
                            ? 'border-pink-500 ring-2 ring-pink-500/50 scale-105'
                            : 'border-neutral-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={tmpl.url} alt={tmpl.name} className="w-full h-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-black/80 text-[8px] font-bold text-white py-0.5 truncate px-1 text-center">
                          {tmpl.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Text & Styling Controls */}
              <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Meme Title</label>
                    <input
                      type="text"
                      value={studioTitle}
                      onChange={(e) => setStudioTitle(e.target.value)}
                      placeholder="e.g. Midnight Code Epiphany"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-slate-200 focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Top Text</label>
                    <textarea
                      rows={2}
                      value={studioTopText}
                      onChange={(e) => setStudioTopText(e.target.value)}
                      placeholder="TOP TEXT..."
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-slate-200 focus:outline-none focus:border-pink-500 font-bold uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Bottom Text</label>
                    <textarea
                      rows={2}
                      value={studioBottomText}
                      onChange={(e) => setStudioBottomText(e.target.value)}
                      placeholder="BOTTOM TEXT..."
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-slate-200 focus:outline-none focus:border-pink-500 font-bold uppercase"
                    />
                  </div>

                  {/* Aesthetic Filter & Styling */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Atmosphere Filter</label>
                      <select
                        value={studioFilter}
                        onChange={(e) => setStudioFilter(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-slate-200 focus:outline-none focus:border-pink-500 cursor-pointer"
                      >
                        <option value="none">Normal / High Contrast</option>
                        <option value="neon">Neon Cyber Glow</option>
                        <option value="noir">Noir Monochrome</option>
                        <option value="glitch">Glitch Cyan Tint</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                      <select
                        value={studioCategory}
                        onChange={(e) => setStudioCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-slate-200 focus:outline-none focus:border-pink-500 cursor-pointer"
                      >
                        <option value="Cyberpunk">Cyberpunk</option>
                        <option value="AI & Tech">AI & Tech</option>
                        <option value="Philosophy">Philosophy</option>
                        <option value="Dank">Dank</option>
                        <option value="Reaction">Reaction</option>
                        <option value="Wholesome">Wholesome</option>
                        <option value="Crypto">Crypto</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>
                  </div>

                  {/* Font Size Slider */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                      <span>Font Size</span>
                      <span className="font-mono text-pink-400">{studioFontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={64}
                      value={studioFontSize}
                      onChange={(e) => setStudioFontSize(Number(e.target.value))}
                      className="w-full accent-pink-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Tags (Comma Separated)</label>
                    <input
                      type="text"
                      value={studioTags}
                      onChange={(e) => setStudioTags(e.target.value)}
                      placeholder="#Cyberpunk, #Dank, #deep_"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-slate-200 focus:outline-none focus:border-pink-500 font-mono"
                    />
                  </div>
                </div>

                {/* Studio Footer Buttons */}
                <div className="pt-4 border-t border-neutral-900 flex items-center justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsStudioOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStudioMeme}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)] hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Save to Vault</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / UPLOAD MEME MODAL */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-950/80 backdrop-blur-2xl border border-pink-500/50 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-600/20 text-pink-400">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-100 text-sm">Add Meme to Collection</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddedMeme} className="p-6 space-y-4">
              {/* Method Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setAddMode('upload')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    addMode === 'upload' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('url')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    addMode === 'url' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Image URL / Link
                </button>
              </div>

              {/* File Upload / URL input */}
              {addMode === 'upload' ? (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">Select Image File</label>
                  <div className="border-2 border-dashed border-neutral-800 hover:border-pink-500/60 rounded-2xl p-6 text-center bg-neutral-900/40 relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {uploadedPreview ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={uploadedPreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-xl border border-pink-500/50 shadow-md mb-2"
                        />
                        <span className="text-xs text-pink-300 font-semibold">Click or drag to replace image</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 text-pink-400 mb-2" />
                        <span className="text-xs font-semibold text-slate-200">Drag & drop or click to upload</span>
                        <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, GIF, WebP supported</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Meme Image URL</label>
                  <input
                    type="url"
                    value={newMemeUrl}
                    onChange={(e) => {
                      setNewMemeUrl(e.target.value);
                      setUploadedPreview(e.target.value);
                    }}
                    placeholder="https://example.com/meme.jpg"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-slate-200 focus:outline-none focus:border-pink-500"
                  />
                  {newMemeUrl && (
                    <div className="mt-2 text-center">
                      <img
                        src={newMemeUrl}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-lg mx-auto border border-neutral-800"
                        onError={() => console.log('Invalid URL')}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Title & Caption */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Meme Title</label>
                <input
                  type="text"
                  value={newMemeTitle}
                  onChange={(e) => setNewMemeTitle(e.target.value)}
                  placeholder="e.g. Zero-Knowledge Cryptography Vibe"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-slate-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Caption / Punchline</label>
                <textarea
                  rows={2}
                  value={newMemeCaption}
                  onChange={(e) => setNewMemeCaption(e.target.value)}
                  placeholder="Optional humorous backstory or punchline..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-slate-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Category & Spicy Score */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                  <select
                    value={newMemeCategory}
                    onChange={(e) => setNewMemeCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-slate-200 focus:outline-none focus:border-pink-500 cursor-pointer"
                  >
                    <option value="Cyberpunk">Cyberpunk</option>
                    <option value="AI & Tech">AI & Tech</option>
                    <option value="Philosophy">Philosophy</option>
                    <option value="Dank">Dank</option>
                    <option value="Reaction">Reaction</option>
                    <option value="Wholesome">Wholesome</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Spiciness Rating</label>
                  <select
                    value={newMemeSpicy}
                    onChange={(e) => setNewMemeSpicy(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-slate-200 focus:outline-none focus:border-pink-500 cursor-pointer"
                  >
                    <option value={1}>Mild (1/5 🔥)</option>
                    <option value={2}>Warm (2/5 🔥)</option>
                    <option value={3}>Spicy (3/5 🔥)</option>
                    <option value={4}>Hot (4/5 🔥)</option>
                    <option value={5}>Ultra Inferno (5/5 🔥)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Hashtags</label>
                <input
                  type="text"
                  value={newMemeTags}
                  onChange={(e) => setNewMemeTags(e.target.value)}
                  placeholder="#Dank, #Crypto, #deep_"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-slate-200 focus:outline-none focus:border-pink-500 font-mono"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-neutral-900 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-pink-600 text-white shadow-lg hover:bg-pink-500 transition-all cursor-pointer"
                >
                  Add to Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LIGHTBOX FULLSCREEN PREVIEW MODAL */}
      {/* ========================================================================= */}
      {lightboxMeme && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-neutral-950/80 backdrop-blur-2xl border border-pink-500/60 rounded-3xl max-w-3xl w-full overflow-hidden shadow-[0_0_50px_rgba(236,72,153,0.3)] flex flex-col max-h-[95vh]">
            {/* Lightbox Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-900/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40">
                  {lightboxMeme.category}
                </span>
                <h3 className="font-bold text-slate-100 text-sm truncate max-w-xs sm:max-w-md">
                  {lightboxMeme.title}
                </h3>
              </div>
              <button
                onClick={() => setLightboxMeme(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lightbox Main Image */}
            <div className="p-4 sm:p-6 flex-1 flex items-center justify-center bg-black/95 overflow-hidden">
              <img
                src={lightboxMeme.url}
                alt={lightboxMeme.title}
                className="max-h-[60vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-neutral-800"
              />
            </div>

            {/* Lightbox Footer & Actions */}
            <div className="p-5 border-t border-neutral-800/80 bg-neutral-900/70 space-y-4 shrink-0 overflow-y-auto max-h-[40vh]">
              {lightboxMeme.caption && (
                <p className="text-xs text-slate-300 italic">"{lightboxMeme.caption}"</p>
              )}

              {/* Meme Details & Metadata (without reactions) */}
              <div className="p-3.5 rounded-2xl bg-black/60 border border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-slate-300 font-mono text-[11px]">
                    Category: <span className="text-pink-300 font-bold">{lightboxMeme.category}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-amber-300 font-mono text-[11px] flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Spiciness: {lightboxMeme.spicinessScore || 4}/5</span>
                  </span>
                  {lightboxMeme.authorName && (
                    <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-slate-400 font-mono text-[11px]">
                      By {lightboxMeme.authorName}
                    </span>
                  )}
                </div>

                {lightboxMeme.tags && lightboxMeme.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {lightboxMeme.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-pink-950/40 text-pink-300 border border-pink-500/30"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(lightboxMeme.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      lightboxMeme.isLiked
                        ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.6)]'
                        : 'bg-neutral-900 text-slate-300 border border-neutral-800 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${lightboxMeme.isLiked ? 'fill-white' : ''}`} />
                    <span>{lightboxMeme.likesCount} Likes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(lightboxMeme)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 text-slate-300 border border-neutral-800 hover:text-white cursor-pointer"
                  >
                    {copiedId === lightboxMeme.id ? (
                      <Check className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>Copy Link</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {onShareToChat && (
                    <button
                      type="button"
                      onClick={() => {
                        onShareToChat(lightboxMeme);
                        notify('💬 Sent meme to messaging!');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 text-slate-300 border border-neutral-800 hover:text-white cursor-pointer"
                      title="Send in Direct Messages"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
                      <span>Chat</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      handleShareMemeToFeed(lightboxMeme);
                      setLightboxMeme(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-pink-600 text-white shadow-md hover:bg-pink-500 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share to Feed</span>
                  </button>

                  <a
                    href={lightboxMeme.url}
                    download={`${lightboxMeme.title.toLowerCase().replace(/\s+/g, '_')}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-neutral-900 text-slate-400 hover:text-white border border-neutral-800"
                    title="Download Meme"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
