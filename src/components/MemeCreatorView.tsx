import React, { useState, useEffect, useRef } from 'react';
import {
  Wand2,
  Sparkles,
  Download,
  Share2,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Image as ImageIcon,
  FolderHeart,
  Layers,
  ArrowRight,
  Flame,
  Type,
  Shuffle,
  Upload,
  Link as LinkIcon,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { MemeItem, Post, User } from '../types';
import { MEME_TEMPLATES, MemeTemplate } from '../data/mockMemes';

interface MemeCreatorViewProps {
  currentUser: User;
  allPosts?: Post[];
  onShareToFeed?: (postData: { content: string; image?: string; hashtags: string[] }) => void;
  onShareToChat?: (meme: MemeItem) => void;
  onNavigateToCollector?: () => void;
}

const CYBER_PROMPT_PRESETS = [
  {
    title: 'Zero-Knowledge Proof of Vibe',
    top: 'PROVING I HAVE THE SECRET KEY',
    bottom: 'WITHOUT REVEALING MY EMBARRASSING PLAYLIST',
    category: 'Cyberpunk' as const,
    tags: '#Crypto, #ZKP, #Cyberpunk, #deep_',
  },
  {
    title: 'Pipeline Fearlessness',
    top: 'COMMITTED STRAIGHT TO PRODUCTION AT 4 AM',
    bottom: 'THE CI/CD PIPELINE FEARS MY AUDACITY',
    category: 'AI & Tech' as const,
    tags: '#DevOps, #Coding, #Production, #deep_',
  },
  {
    title: 'Synthetic Haiku Awakening',
    top: 'PROMPT: WRITE A POEM ABOUT RAIN',
    bottom: 'AI: "NEON WEEPS IN ZEROES AND ONES"',
    category: 'Philosophy' as const,
    tags: '#AI, #Poetry, #Haiku, #deep_',
  },
  {
    title: 'Existential Compiler',
    top: 'WHEN THE CODE COMPILES ON THE FIRST TRY',
    bottom: 'AND YOU SPEND 2 HOURS SEARCHING FOR WHY',
    category: 'Dank' as const,
    tags: '#DevLife, #Coding, #Dank, #deep_',
  },
  {
    title: 'Encrypted Heartbeat',
    top: 'MY LOVE FOR YOU IS AES-256 ENCRYPTED',
    bottom: 'AND I THREW AWAY THE PRIVATE KEY',
    category: 'Wholesome' as const,
    tags: '#CryptoLove, #Wholesome, #Verse, #deep_',
  },
  {
    title: 'CSS Spatial Collapse',
    top: 'I WAS PROMISED QUANTUM RECKONING',
    bottom: 'INSTEAD I GOT A CSS VERTICAL CENTERING CRISIS',
    category: 'AI & Tech' as const,
    tags: '#CSS, #Tech, #Glitch, #deep_',
  },
  {
    title: 'Matrix Terminal Epiphany',
    top: 'ONE DOES NOT SIMPLY MERGE INTO MAIN',
    bottom: 'WITHOUT RE-EXAMINING ONE’S LIFE CHOICES',
    category: 'Philosophy' as const,
    tags: '#Matrix, #Git, #Philosophy, #deep_',
  },
];

export const MemeCreatorView: React.FC<MemeCreatorViewProps> = ({
  currentUser,
  allPosts = [],
  onShareToFeed,
  onShareToChat,
  onNavigateToCollector,
}) => {
  // Canvas & Preview State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate>(MEME_TEMPLATES[0]);
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [isUsingCustomImage, setIsUsingCustomImage] = useState<boolean>(false);
  const [showUploadInput, setShowUploadInput] = useState<boolean>(false);

  // Text & Style State
  const [memeTitle, setMemeTitle] = useState('Zero-Knowledge Proof of Vibe');
  const [topText, setTopText] = useState('PROVING I HAVE THE SECRET KEY');
  const [bottomText, setBottomText] = useState('WITHOUT REVEALING MY EMBARRASSING PLAYLIST');
  const [category, setCategory] = useState<MemeItem['category']>('Cyberpunk');
  const [tags, setTags] = useState('#Cyberpunk, #Crypto, #Meme, #deep_');
  const [filter, setFilter] = useState<'none' | 'neon' | 'noir' | 'glitch' | 'matrix' | 'sunset'>('none');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [fontSize, setFontSize] = useState<number>(36);
  const [isUppercase, setIsUppercase] = useState<boolean>(true);

  // Feedback & Copy State
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [renderedImageUrl, setRenderedImageUrl] = useState<string>('');
  const [presetIndex, setPresetIndex] = useState(0);

  const notify = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Base image selection
  const currentBaseImageUrl = isUsingCustomImage && customImageUrl ? customImageUrl : selectedTemplate.url;

  // Real-time HTML5 Canvas Render Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentBaseImageUrl;

    img.onload = () => {
      // Set high resolution canvas dimensions
      canvas.width = 800;
      canvas.height = 800;

      // Draw base image scaled and centered
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.max(hRatio, vRatio);
      const centerShiftX = (canvas.width - img.width * ratio) / 2;
      const centerShiftY = (canvas.height - img.height * ratio) / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        centerShiftX,
        centerShiftY,
        img.width * ratio,
        img.height * ratio
      );

      // Atmospheric Filter Overlay
      if (filter === 'neon') {
        ctx.fillStyle = 'rgba(236, 72, 153, 0.22)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(147, 51, 234, 0.16)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (filter === 'noir') {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
        }
        ctx.putImageData(imgData, 0, 0);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (filter === 'glitch') {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.24)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(236, 72, 153, 0.12)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (filter === 'matrix') {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0, 20, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (filter === 'sunset') {
        ctx.fillStyle = 'rgba(249, 115, 22, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.18)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Vignette border for depth
      const grad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.25,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.72
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Configure Typography
      const appliedTop = isUppercase ? topText.toUpperCase() : topText;
      const appliedBottom = isUppercase ? bottomText.toUpperCase() : bottomText;

      ctx.fillStyle = textColor;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(5, Math.round(fontSize / 6));
      ctx.textAlign = 'center';
      ctx.font = `900 ${fontSize}px "Space Grotesk", Impact, "Arial Black", sans-serif`;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;

      // Helper function for wrapping multi-line text
      const drawWrappedText = (text: string, yStart: number, isTop: boolean) => {
        if (!text) return;
        const words = text.split(' ');
        let line = '';
        const lines: string[] = [];
        const maxWidth = canvas.width - 60;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            lines.push(line.trim());
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line.trim());

        const lineHeight = fontSize * 1.15;
        let y = yStart;
        if (!isTop) {
          y = yStart - (lines.length - 1) * lineHeight;
        }

        for (let k = 0; k < lines.length; k++) {
          ctx.strokeText(lines[k], canvas.width / 2, y + k * lineHeight);
          ctx.fillText(lines[k], canvas.width / 2, y + k * lineHeight);
        }
      };

      // Draw Top Text
      if (appliedTop.trim()) {
        drawWrappedText(appliedTop, fontSize + 24, true);
      }

      // Draw Bottom Text
      if (appliedBottom.trim()) {
        drawWrappedText(appliedBottom, canvas.height - 35, false);
      }

      // Deep_ Studios cryptographic watermark
      ctx.font = '700 12px "Space Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.textAlign = 'right';
      ctx.fillText('⚡ DEEP_ STUDIOS // CRYPTO-STANZA', canvas.width - 20, canvas.height - 14);

      // Save rendered data URL for quick preview/export
      try {
        setRenderedImageUrl(canvas.toDataURL('image/png'));
      } catch (err) {
        // Handle potential tainted canvas gracefully
      }
    };

    img.onerror = () => {
      // Fallback placeholder rendering if image fails to load
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f43f5e';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Image failed to load. Select a template.', canvas.width / 2, canvas.height / 2);
    };
  }, [
    currentBaseImageUrl,
    topText,
    bottomText,
    filter,
    textColor,
    fontSize,
    isUppercase,
  ]);

  // Handle Preset Prompt Rotation
  const handleNextCyberPrompt = () => {
    const nextIdx = (presetIndex + 1) % CYBER_PROMPT_PRESETS.length;
    setPresetIndex(nextIdx);
    const p = CYBER_PROMPT_PRESETS[nextIdx];
    setMemeTitle(p.title);
    setTopText(p.top);
    setBottomText(p.bottom);
    setCategory(p.category);
    setTags(p.tags);
    notify(`⚡ Loaded cyber preset: "${p.title}"`);
  };

  // Save crafted meme directly to Meme Collector stash in localStorage
  const handleSaveToCollector = () => {
    const canvas = canvasRef.current;
    let finalImageUrl = currentBaseImageUrl;
    if (canvas) {
      try {
        finalImageUrl = canvas.toDataURL('image/png');
      } catch (e) {
        console.warn('Canvas export tainted, using base URL:', e);
      }
    }

    const cleanTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const newMeme: MemeItem = {
      id: `meme_created_${Date.now()}`,
      title: memeTitle.trim() || 'Custom Stanza Meme',
      url: finalImageUrl,
      topText: topText.trim(),
      bottomText: bottomText.trim(),
      caption: `${memeTitle}: ${topText} — ${bottomText}`,
      category: category,
      tags: cleanTags.length > 0 ? cleanTags : ['#Meme', '#deep_'],
      likesCount: 1,
      isLiked: true,
      collectedAt: 'Just now',
      source: 'Meme Creator',
      spicinessScore: 5,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      reactions: {
        lol: 1,
        dank: 1,
        cringe: 0,
        fire: 2,
        dead: 0,
      },
      userReactions: ['dank', 'fire'],
    };

    try {
      const existing = localStorage.getItem('lucid_meme_collection');
      const list: MemeItem[] = existing ? JSON.parse(existing) : [];
      const updated = [newMeme, ...list];
      localStorage.setItem('lucid_meme_collection', JSON.stringify(updated));
      setHasSaved(true);
      notify('✨ Saved directly to your Meme Collector stash!');
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
      notify('Saved locally in temporary session!');
    }
  };

  // Broadcast to Live Feed
  const handleBroadcastToFeed = () => {
    const canvas = canvasRef.current;
    let finalImageUrl = currentBaseImageUrl;
    if (canvas) {
      try {
        finalImageUrl = canvas.toDataURL('image/png');
      } catch (e) {
        // Fallback to base image
      }
    }

    const cleanTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    if (onShareToFeed) {
      onShareToFeed({
        content: `⚡ ${memeTitle.toUpperCase()}\n\n"${topText}"\n${bottomText}\n\nCrafted in Meme Creator 🎨`,
        image: finalImageUrl,
        hashtags: [...new Set(['#Meme', ...cleanTags, '#deep_'])],
      });
      notify('🚀 Broadcasted to live feed!');
    } else {
      notify('Meme broadcasted!');
    }
  };

  // Download high-resolution PNG
  const handleDownloadMeme = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const link = document.createElement('a');
      link.download = `${memeTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_deep_meme.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      notify('📥 High-res meme downloaded!');
    } catch (e) {
      notify('Unable to download automatically due to image permissions');
    }
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCustomImageUrl(result);
        setIsUsingCustomImage(true);
        notify('📷 Custom canvas image loaded!');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionFeedback && (
        <div className="fixed top-20 right-6 z-50 bg-neutral-900/95 border border-pink-500/80 text-pink-200 px-4 py-3 rounded-2xl shadow-[0_0_25px_rgba(236,72,153,0.6)] flex items-center gap-3 backdrop-blur-md animate-bounce">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span className="text-xs font-semibold">{actionFeedback}</span>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="bg-black/75 backdrop-blur-md border border-pink-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_20px_rgba(244,114,182,0.15),0_10px_30px_rgba(0,0,0,0.7)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-600/15 via-purple-600/15 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_8px_rgba(236,72,153,0.3)]">
                <Wand2 className="w-3.5 h-3.5 text-pink-400" />
                <span>Interactive Creative Studio</span>
              </span>
              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-500/30">
                Live Canvas Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
              <span>Meme Creator</span>
              <span className="text-xs font-mono font-bold text-pink-400 px-2 py-0.5 rounded-lg bg-pink-950/60 border border-pink-500/30">
                PRO STUDIO
              </span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Design high-resolution cryptographic memes, cyber-noir stanzas, and dialectic reflections. Select templates or upload imagery, customize atmospheric typography, and save directly to your Meme Collector stash.
            </p>
          </div>

          {/* Quick Nav & AI Preset Action */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleNextCyberPrompt}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-neutral-900/90 text-slate-200 border border-pink-500/30 hover:border-pink-500 hover:text-pink-300 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
              title="Generate a random cyber-noir meme prompt"
            >
              <Shuffle className="w-3.5 h-3.5 text-pink-400" />
              <span>Cyber Stanza Prompt</span>
            </button>

            {onNavigateToCollector && (
              <button
                onClick={onNavigateToCollector}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-neutral-900/90 text-pink-300 border border-pink-500/50 hover:bg-neutral-800 hover:text-white transition-all cursor-pointer shadow-[0_0_12px_rgba(236,72,153,0.25)] hover:scale-[1.02]"
              >
                <Layers className="w-4 h-4 text-pink-400" />
                <span>Meme Collector Stash</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Studio Workspace: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Canvas Preview & Template Selector (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Canvas Stage */}
          <div className="bg-neutral-950/90 border border-pink-500/30 rounded-3xl p-5 shadow-2xl relative">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 text-pink-300 font-semibold">
                <Eye className="w-3.5 h-3.5 text-pink-400" />
                <span>Live Canvas Preview (800 × 800)</span>
              </span>
              <span className="text-[10px] bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                Filter: {filter.toUpperCase()}
              </span>
            </div>

            {/* Canvas Container with glowing shadow */}
            <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border border-pink-500/40 shadow-[0_0_30px_rgba(236,72,153,0.18)] flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain select-none"
              />
            </div>

            {/* Canvas Action Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadMeme}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-slate-300 hover:text-white border border-neutral-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (renderedImageUrl) {
                      navigator.clipboard.writeText(renderedImageUrl);
                      notify('📋 Canvas image data copied to clipboard!');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-slate-300 hover:text-white border border-neutral-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-pink-400" />
                  <span>Copy</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveToCollector}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <FolderHeart className="w-3.5 h-3.5" />
                  <span>Save to Collector</span>
                </button>

                {onShareToFeed && (
                  <button
                    type="button"
                    onClick={handleBroadcastToFeed}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all cursor-pointer hover:scale-[1.02]"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Broadcast</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Template Selection Palette */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-3xl p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-pink-400" />
                <span>Base Template Selector</span>
              </label>
              <button
                type="button"
                onClick={() => setShowUploadInput(!showUploadInput)}
                className="text-[11px] text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>{showUploadInput ? 'Hide Custom Upload' : 'Upload Own Image'}</span>
              </button>
            </div>

            {/* Custom Image Upload Tray */}
            {showUploadInput && (
              <div className="mb-4 p-3 rounded-2xl bg-neutral-900 border border-pink-500/30 space-y-2">
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-pink-500/50 hover:border-pink-400 text-xs text-slate-300 hover:text-white transition-colors bg-neutral-950/60">
                    <Upload className="w-3.5 h-3.5 text-pink-400" />
                    <span>Choose File from Device...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-500">or</span>
                  <div className="flex-1 flex items-center gap-1.5 bg-neutral-950/60 border border-neutral-700 rounded-xl px-2 py-1">
                    <LinkIcon className="w-3 h-3 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Paste Image URL..."
                      value={customImageUrl}
                      onChange={(e) => {
                        setCustomImageUrl(e.target.value);
                        setIsUsingCustomImage(true);
                      }}
                      className="w-full bg-transparent text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Template Thumbnails Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {MEME_TEMPLATES.map((tmpl) => {
                const isActive = !isUsingCustomImage && selectedTemplate.id === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setIsUsingCustomImage(false);
                      setSelectedTemplate(tmpl);
                      if (tmpl.defaultTopText) setTopText(tmpl.defaultTopText);
                      if (tmpl.defaultBottomText) setBottomText(tmpl.defaultBottomText);
                      setMemeTitle(tmpl.name);
                    }}
                    className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer relative group flex flex-col justify-end ${
                      isActive
                        ? 'border-pink-500 ring-2 ring-pink-500/50 scale-[1.03] shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                        : 'border-neutral-800 opacity-70 hover:opacity-100 hover:border-pink-500/40'
                    }`}
                  >
                    <img
                      src={tmpl.url}
                      alt={tmpl.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="relative z-10 bg-black/80 backdrop-blur-xs text-[9px] font-bold text-white py-1 px-1 text-center truncate">
                      {tmpl.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Typography & Shader Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-neutral-950/90 border border-pink-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-pink-400" />
                <span>Text & Styling Controls</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsUppercase(!isUppercase)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  isUppercase
                    ? 'bg-pink-600/30 border-pink-500 text-pink-300 font-bold'
                    : 'bg-neutral-900 border-neutral-700 text-slate-400'
                }`}
              >
                {isUppercase ? 'ALL CAPS' : 'Standard Case'}
              </button>
            </div>

            {/* Meme Title */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Meme Title / Concept
              </label>
              <input
                type="text"
                value={memeTitle}
                onChange={(e) => setMemeTitle(e.target.value)}
                placeholder="e.g. Zero-Knowledge Proof of Vibe"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-slate-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 font-medium"
              />
            </div>

            {/* Top Text */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Top Stanza Text</label>
                {topText && (
                  <button
                    type="button"
                    onClick={() => setTopText('')}
                    className="text-[10px] text-slate-500 hover:text-pink-400"
                  >
                    Clear
                  </button>
                )}
              </div>
              <textarea
                rows={2}
                value={topText}
                onChange={(e) => setTopText(e.target.value)}
                placeholder="ENTER TOP STANZA TEXT..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-slate-100 focus:outline-none focus:border-pink-500 font-bold uppercase tracking-wide"
              />
            </div>

            {/* Bottom Text */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Bottom Stanza Text</label>
                {bottomText && (
                  <button
                    type="button"
                    onClick={() => setBottomText('')}
                    className="text-[10px] text-slate-500 hover:text-pink-400"
                  >
                    Clear
                  </button>
                )}
              </div>
              <textarea
                rows={2}
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
                placeholder="ENTER BOTTOM STANZA TEXT..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-slate-100 focus:outline-none focus:border-pink-500 font-bold uppercase tracking-wide"
              />
            </div>

            {/* Atmosphere Shader & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Atmosphere Filter</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-slate-200 focus:outline-none focus:border-pink-500 cursor-pointer"
                >
                  <option value="none">Normal / High Contrast</option>
                  <option value="neon">Neon Cyber Glow</option>
                  <option value="noir">Noir Monochrome</option>
                  <option value="glitch">Glitch Cyan Tint</option>
                  <option value="matrix">Matrix Phosphor</option>
                  <option value="sunset">Vaporwave Sunset</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
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

            {/* Font Size & Color Palette */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
                <span>Typography Size</span>
                <span className="font-mono text-pink-400">{fontSize}px</span>
              </div>
              <input
                type="range"
                min={20}
                max={60}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>

            {/* Quick Text Color Chips */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Text Tint
              </label>
              <div className="flex items-center gap-2">
                {[
                  { label: 'White', color: '#FFFFFF' },
                  { label: 'Cyber Yellow', color: '#FACC15' },
                  { label: 'Neon Pink', color: '#F472B6' },
                  { label: 'Cyan Glow', color: '#38BDF8' },
                  { label: 'Matrix Green', color: '#4ADE80' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setTextColor(c.color)}
                    className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                      textColor === c.color
                        ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.color }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Tags Input */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Tags (Comma Separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="#Cyberpunk, #Crypto, #Meme, #deep_"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-slate-200 focus:outline-none focus:border-pink-500 font-mono"
              />
            </div>

            {/* Primary Action Buttons */}
            <div className="pt-4 border-t border-neutral-800 space-y-2.5">
              <button
                type="button"
                onClick={handleSaveToCollector}
                className="w-full py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:shadow-[0_0_30px_rgba(236,72,153,0.8)] hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <FolderHeart className="w-4 h-4 text-pink-200" />
                <span>Save Directly to Meme Collector</span>
              </button>

              {onNavigateToCollector && hasSaved && (
                <button
                  type="button"
                  onClick={onNavigateToCollector}
                  className="w-full py-2.5 rounded-2xl text-xs font-bold bg-neutral-900 text-pink-300 border border-pink-500/40 hover:bg-neutral-850 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-pink-400" />
                  <span>View in Meme Collector Stash →</span>
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
