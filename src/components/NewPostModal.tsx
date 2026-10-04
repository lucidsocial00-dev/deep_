import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, FileText, Upload, Image as ImageIcon, Check, Wand2, Loader2, Tag, PlusCircle, MapPin, Link as LinkIcon, Clock, Scan, Hash } from 'lucide-react';
import { PDFDocument, Post, User, ReadingLink } from '../types';
import { getAutomaticCityForPost, findNearestCityRegion } from '../utils/cityRegions';
import { estimateReadingFromUrl, extractUrlsFromText } from '../utils/readingEstimator';
import { scanPostContentForTags } from '../utils/contentTagScanner';
import { ReadingLinkCard } from './ReadingLinkCard';

interface NewPostModalProps {
  currentUser: User;
  onClose: () => void;
  onSubmitPost: (newPost: Post) => void;
}

export const NewPostModal: React.FC<NewPostModalProps> = ({
  currentUser,
  onClose,
  onSubmitPost,
}) => {
  const [content, setContent] = useState('');
  const [isPoetry, setIsPoetry] = useState(false);
  const [hashtagsInput, setHashtagsInput] = useState('#Poetry #Encrypted');
  const [imageUrl, setImageUrl] = useState('');
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [liveGpsCity, setLiveGpsCity] = useState<string | null>(null);

  // Reading Links Attachment States (Supports up to 3 links)
  const MAX_LINKS = 3;
  const [readingLinks, setReadingLinks] = useState<ReadingLink[]>([]);
  const [readingUrlInput, setReadingUrlInput] = useState('');
  const [isEstimatingLink, setIsEstimatingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const lastProcessedUrlRef = useRef<string>('');

  const autoEstimateAndAddLink = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;

    if (readingLinks.some((l) => l.url.toLowerCase() === trimmed.toLowerCase())) {
      setLinkError('This URL is already attached.');
      return;
    }

    if (readingLinks.length >= MAX_LINKS) {
      setLinkError(`Maximum of ${MAX_LINKS} links per post reached.`);
      return;
    }

    setLinkError(null);
    lastProcessedUrlRef.current = trimmed;
    setIsEstimatingLink(true);

    try {
      const primaryTag = hashtagsInput
        .split(/[\s,]+/)
        .map((t) => t.trim().replace(/^#+/, ''))
        .filter(Boolean)[0] || 'deep_';

      const res = await fetch('/api/reading/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: trimmed,
          hashtag: primaryTag,
        }),
      });

      let linkObj: ReadingLink;
      if (res.ok) {
        const data = await res.json();
        if (data.readingLink) {
          linkObj = data.readingLink;
        } else {
          linkObj = estimateReadingFromUrl(trimmed, undefined, primaryTag);
        }
      } else {
        linkObj = estimateReadingFromUrl(trimmed, undefined, primaryTag);
      }

      setReadingLinks((prev) => {
        if (prev.length >= MAX_LINKS) return prev;
        if (prev.some((l) => l.url.toLowerCase() === linkObj.url.toLowerCase())) return prev;
        return [...prev, linkObj];
      });
      setReadingUrlInput('');
    } catch (err) {
      console.warn('Fallback to client heuristic for auto reading estimate:', err);
      const primaryTag = hashtagsInput
        .split(/[\s,]+/)
        .map((t) => t.trim().replace(/^#+/, ''))
        .filter(Boolean)[0] || 'deep_';
      const fallback = estimateReadingFromUrl(trimmed, undefined, primaryTag);
      setReadingLinks((prev) => {
        if (prev.length >= MAX_LINKS) return prev;
        if (prev.some((l) => l.url.toLowerCase() === fallback.url.toLowerCase())) return prev;
        return [...prev, fallback];
      });
      setReadingUrlInput('');
    } finally {
      setIsEstimatingLink(false);
    }
  };

  const handleRemoveLink = (idxToRemove: number) => {
    setReadingLinks((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    setLinkError(null);
  };

  // Auto detect pasted URLs in content
  useEffect(() => {
    const urls = extractUrlsFromText(content);
    if (urls.length > 0) {
      urls.forEach((url) => {
        if (
          readingLinks.length < MAX_LINKS &&
          !readingLinks.some((l) => l.url.toLowerCase() === url.toLowerCase()) &&
          url !== lastProcessedUrlRef.current
        ) {
          autoEstimateAndAddLink(url);
        }
      });
    }
  }, [content, readingLinks.length]);

  // Attempt browser geolocation for real-time live location detection
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          try {
            const nearest = findNearestCityRegion(
              position.coords.latitude,
              position.coords.longitude
            );
            if (nearest && nearest.name) {
              setLiveGpsCity(nearest.name);
            }
          } catch {
            // Ignore error, fallback gracefully
          }
        },
        () => {
          // Permission denied or unavailable
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    }
  }, []);

  // Automatic Content Scanning & Tag Creation States
  const [isScanningContent, setIsScanningContent] = useState(false);
  const [autoScannedTags, setAutoScannedTags] = useState<string[]>([]);
  const [scanSummary, setScanSummary] = useState<string | null>(null);
  const [autoTagEnabled, setAutoTagEnabled] = useState<boolean>(true);
  const debounceScanTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time automatic location calculation
  const currentTagsList = hashtagsInput
    .split(/[\s,]+/)
    .map((t) => t.trim().replace(/^#+/, ''))
    .filter(Boolean);
  const autoLocation = getAutomaticCityForPost(
    { hashtags: currentTagsList, content },
    liveGpsCity || currentUser.city
  );

  // Automatic Post Content Scanning in Real Time
  useEffect(() => {
    const textToScan = content.trim();
    if (!textToScan && !pdfDoc) return;

    if (debounceScanTimerRef.current) clearTimeout(debounceScanTimerRef.current);
    setIsScanningContent(true);

    debounceScanTimerRef.current = setTimeout(() => {
      const city = liveGpsCity || findNearestCityRegion(currentUser.coordinates)?.name;
      const scanResult = scanPostContentForTags({
        content: textToScan,
        isPoetry,
        hasDocument: !!pdfDoc,
        documentTitle: pdfDoc?.title,
        documentExcerpt: pdfDoc?.excerptText,
        city,
      });

      setAutoScannedTags(scanResult.tags);
      setScanSummary(scanResult.reasoning);

      if (autoTagEnabled && scanResult.tags.length > 0) {
        setHashtagsInput((prev) => {
          const currentArr = prev
            .split(/[\s,]+/)
            .map((t) => t.trim().replace(/^#+/, ''))
            .filter(Boolean);

          const newTags = scanResult.tags.filter(
            (tag) => !currentArr.some((c) => c.toLowerCase() === tag.toLowerCase())
          );

          if (newTags.length === 0) return prev;
          const formatted = newTags.map((t) => `#${t}`).join(' ');
          return prev ? `${prev.trim()} ${formatted}` : formatted;
        });
      }
      setIsScanningContent(false);
    }, 550);

    return () => {
      if (debounceScanTimerRef.current) clearTimeout(debounceScanTimerRef.current);
    };
  }, [content, isPoetry, pdfDoc, liveGpsCity, autoTagEnabled]);

  // Manual Trigger: Scan Content & Create Tags
  const handleTriggerAutoScan = async () => {
    if (!content.trim() && !pdfDoc) return;

    setIsScanningContent(true);
    const city = liveGpsCity || findNearestCityRegion(currentUser.coordinates)?.name;
    const scanResult = scanPostContentForTags({
      content,
      isPoetry,
      hasDocument: !!pdfDoc,
      documentTitle: pdfDoc?.title,
      documentExcerpt: pdfDoc?.excerptText,
      city,
    });

    setAutoScannedTags(scanResult.tags);
    setScanSummary(scanResult.reasoning);

    if (scanResult.tags.length > 0) {
      setHashtagsInput((prev) => {
        const currentArr = prev
          .split(/[\s,]+/)
          .map((t) => t.trim().replace(/^#+/, ''))
          .filter(Boolean);

        const newTags = scanResult.tags.filter(
          (tag) => !currentArr.some((c) => c.toLowerCase() === tag.toLowerCase())
        );

        if (newTags.length === 0) return prev;
        const formatted = newTags.map((t) => `#${t}`).join(' ');
        return prev ? `${prev.trim()} ${formatted}` : formatted;
      });
    }

    try {
      if (content.trim().length > 15 || pdfDoc) {
        const response = await fetch('/api/gemini/suggest-hashtags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            documentTitle: pdfDoc?.title,
            documentSummary: pdfDoc?.excerptText || pdfDoc?.fullText,
          }),
        });

        const data = await response.json();
        if (data.hashtags && Array.isArray(data.hashtags)) {
          setAutoScannedTags((prev) => {
            const combined = [...prev];
            data.hashtags.forEach((t: string) => {
              if (!combined.some((c) => c.toLowerCase() === t.toLowerCase())) {
                combined.push(t);
              }
            });
            return combined;
          });
          if (data.reasoning) setScanSummary(data.reasoning);
        }
      }
    } catch {
      // Local scan succeeded
    } finally {
      setIsScanningContent(false);
    }
  };

  const handleToggleSuggestedTag = (tag: string) => {
    const currentArr = hashtagsInput
      .split(/[\s,]+/)
      .map((t) => t.trim().replace(/^#+/, ''))
      .filter(Boolean);

    const exists = currentArr.some((c) => c.toLowerCase() === tag.toLowerCase());
    let updated: string[];

    if (exists) {
      updated = currentArr.filter((c) => c.toLowerCase() !== tag.toLowerCase());
    } else {
      updated = [...currentArr, tag];
    }

    setHashtagsInput(updated.map((t) => `#${t}`).join(' '));
  };

  // PDF File Upload Handler using FileReader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPdf(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

      const newDoc: PDFDocument = {
        id: 'pdf_' + Date.now(),
        title: file.name.replace('.pdf', ''),
        fileName: file.name,
        fileSize: sizeMb,
        totalPages: Math.max(1, Math.floor(file.size / 30000) || 5),
        category: file.name.toLowerCase().includes('poem') ? 'Poetry' : 'Document',
        uploadedAt: 'Just now',
        excerptText: `PDF Document "${file.name}" uploaded to deep_ Vault. Ready for reading & encrypted analysis.`,
        fullText: `Uploaded Document: ${file.name}\nSize: ${sizeMb}\n\nContent ready for reader and encrypted storage.`,
        fileDataUrl: dataUrl,
      };

      setPdfDoc(newDoc);
      setIsUploadingPdf(false);
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !pdfDoc && readingLinks.length === 0) return;

    // Extract single-word hashtags (remove spaces, symbols, ensure 1 word per tag)
    const tagsFromInput = hashtagsInput
      .split(/[\s,]+/)
      .map((t) => {
        const raw = t.trim().replace(/^#+/, '');
        const singleWord = raw.replace(/[^a-zA-Z0-9_]/g, '');
        return singleWord ? `#${singleWord}` : '';
      })
      .filter(Boolean);

    // If readingLinks exist, make sure their hashtag groups are in hashtags
    readingLinks.forEach((rl) => {
      const tagCandidate = rl.hashtagTag || rl.hashtag;
      if (tagCandidate) {
        const readingTag = `#${tagCandidate.replace(/^#+/, '')}`;
        if (!tagsFromInput.some((t) => t.toLowerCase() === readingTag.toLowerCase())) {
          tagsFromInput.push(readingTag);
        }
      }
    });

    // Automatically resolve location (city & coordinates)
    const finalLocation = getAutomaticCityForPost(
      { hashtags: tagsFromInput, content: content.trim() },
      liveGpsCity || currentUser.city
    );

    const createdPost: Post = {
      id: 'post_' + Date.now(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorHandle: currentUser.handle,
      authorAvatar: currentUser.avatar,
      timestamp: 'Just now',
      city: finalLocation.city,
      coordinates: finalLocation.coordinates,
      content: content.trim(),
      poetryFormatted: isPoetry,
      hashtags: tagsFromInput.length > 0 ? tagsFromInput : ['#deep_'],
      document: pdfDoc || undefined,
      image: imageUrl.trim() || undefined,
      readingLink: readingLinks[0] || undefined,
      readingLinks: readingLinks.length > 0 ? readingLinks : undefined,
      likesCount: 1,
      dislikesCount: 0,
      commentsCount: 0,
      userReaction: 'like',
      likedBy: [currentUser.id],
      dislikedBy: [],
      comments: [],
    };

    onSubmitPost(createdPost);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-950/80 backdrop-blur-2xl border border-pink-500/50 rounded-2xl w-full max-w-xl shadow-[0_0_40px_rgba(244,114,182,0.35),0_15px_40px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-pink-500/20 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-950/60 text-pink-400 border border-pink-500/40 flex items-center justify-center shadow-[0_0_8px_rgba(236,72,153,0.3)]">
              <PlusCircle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-100 text-sm">Create New Feed Post</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-neutral-900 border border-pink-500/20 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* User Header */}
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 rounded-xl object-cover ring-1 ring-pink-500/50"
            />
            <div>
              <h4 className="font-semibold text-slate-100 text-xs">{currentUser.name}</h4>
              <span className="text-[10px] text-pink-400 font-mono">{currentUser.handle}</span>
            </div>

            {/* Verse formatting toggle */}
            <button
              type="button"
              onClick={() => setIsPoetry(!isPoetry)}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                isPoetry
                  ? 'bg-pink-600 text-white border-pink-400/50 shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                  : 'bg-neutral-900 text-slate-400 border-pink-500/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isPoetry ? 'Poetry Mode Active' : 'Poetry Mode'}</span>
            </button>
          </div>

          {/* Text Area */}
          <textarea
            rows={4}
            placeholder={
              isPoetry
                ? 'Compose your verse with rhythmic indentation...\n\nI. THE CIPHER IN THE SILK\nWhere candlelight cuts shadows through the wire...'
                : 'Share your thoughts, deep ideas, or document reflections with the global feed...'
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`w-full bg-neutral-950/80 border border-pink-500/30 rounded-xl p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 ${
              isPoetry ? 'font-serif italic text-sm border-pink-500/50' : ''
            }`}
          ></textarea>

          {/* Hashtags Input & Automatic Content Scanner */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Hash className="w-3.5 h-3.5 text-pink-400" />
                <span>#Hashtags</span>
                <span className="text-[10px] text-pink-400/80 font-normal flex items-center gap-1 ml-1">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse text-pink-400" />
                  <span>Auto-generated from content</span>
                </span>
              </label>

              {isScanningContent && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-pink-300">
                  <Loader2 className="w-3 h-3 animate-spin text-pink-400" />
                  <span>Creating hashtags...</span>
                </div>
              )}
            </div>

            <input
              type="text"
              value={hashtagsInput}
              onChange={(e) => setHashtagsInput(e.target.value)}
              placeholder="e.g. #Poetry #Verse #Cipher #VoicePost (type other hashtags here...)"
              className="w-full bg-neutral-950/80 border border-pink-500/30 rounded-xl px-3 py-2 text-xs text-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500/50 font-mono"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <p>
                💡 <span className="text-pink-300 font-semibold">Hashtags:</span> Automatically routes post into hashtag streams.
              </p>
              <div 
                className="inline-flex items-center gap-1.5 bg-neutral-900/90 border border-pink-500/40 rounded-lg px-2.5 py-1 text-xs text-pink-300 font-mono shadow-[0_0_10px_rgba(236,72,153,0.15)] select-none"
                title={`Your live location: ${autoLocation.city} (${autoLocation.coordinates.lat.toFixed(2)}, ${autoLocation.coordinates.lng.toFixed(2)})`}
              >
                <div className="relative flex h-2 w-2 items-center justify-center shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-pink-500"></span>
                </div>
                <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span className="text-slate-300 text-[11px]">Your Live Location:</span>
                <span className="font-bold text-slate-100 bg-pink-950/60 px-1.5 py-0.5 rounded border border-pink-500/30 text-[11px]">
                  {autoLocation.city}
                </span>
              </div>
            </div>

            {/* Auto-Created Hashtags Chips & Reasoning */}
            {autoScannedTags.length > 0 && (
              <div className="bg-black/60 border border-pink-500/30 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 font-semibold text-pink-300">
                    <Sparkles className="w-3 h-3 text-pink-400" />
                    Auto-Created Hashtags
                  </span>
                  <span className="text-[10px] text-slate-400">Click tag to toggle</span>
                </div>

                {/* Tag Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {autoScannedTags.map((tag) => {
                    const isSelected = hashtagsInput
                      .toLowerCase()
                      .includes(tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleSuggestedTag(tag)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-pink-600 text-white border border-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.3)]'
                            : 'bg-neutral-900 hover:bg-neutral-800 border border-pink-500/20 text-slate-300'
                        }`}
                      >
                        <Tag className="w-3 h-3 text-pink-400" />
                        <span>#{tag}</span>
                        {isSelected && <Check className="w-3 h-3 ml-0.5 text-pink-300" />}
                      </button>
                    );
                  })}
                </div>

                {/* Reasoning text */}
                {scanSummary && (
                  <p className="text-[10px] text-slate-400 italic border-t border-pink-500/20 pt-1.5 mt-1">
                    {scanSummary}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Reading Links Attachment Section (Up to 3 links) */}
          <div className="space-y-2.5 p-3 rounded-xl bg-neutral-950/80 border border-pink-500/30">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <label className="flex items-center gap-1.5 text-pink-300">
                <LinkIcon className="w-3.5 h-3.5 text-pink-400" />
                <span>Attach Reading Links ({readingLinks.length}/{MAX_LINKS}):</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Max 3</span>
            </div>

            {readingLinks.length < MAX_LINKS && (
              <div className="flex items-center gap-2">
                <div className="relative flex-1 flex items-center">
                  <input
                    type="url"
                    placeholder={
                      readingLinks.length === 0
                        ? "Paste link (e.g. https://eff.org/...)"
                        : `Paste link #${readingLinks.length + 1}...`
                    }
                    value={readingUrlInput}
                    onChange={(e) => {
                      setReadingUrlInput(e.target.value);
                      setLinkError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (readingUrlInput.trim()) {
                          autoEstimateAndAddLink(readingUrlInput.trim());
                        }
                      }
                    }}
                    className="w-full bg-neutral-900 border border-pink-500/30 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-400 font-mono"
                  />
                  <div className="absolute right-2 flex items-center gap-1 text-[10px] text-pink-400 font-medium">
                    {isEstimatingLink && (
                      <span className="flex items-center gap-1 text-amber-300">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Calculating...</span>
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (readingUrlInput.trim()) {
                      autoEstimateAndAddLink(readingUrlInput.trim());
                    }
                  }}
                  disabled={!readingUrlInput.trim() || isEstimatingLink}
                  className="px-3 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shrink-0 transition-all shadow-[0_0_8px_rgba(236,72,153,0.3)] border border-pink-400/40"
                >
                  + Add Link
                </button>
              </div>
            )}

            {linkError && (
              <p className="text-[10px] text-rose-400 font-medium">{linkError}</p>
            )}

            {readingLinks.length > 0 && (
              <div className="space-y-2 mt-2">
                {readingLinks.map((link, idx) => (
                  <div key={link.id || link.url || idx} className="bg-neutral-950/90 p-2.5 rounded-xl border border-pink-500/30">
                    <div className="flex items-center justify-between mb-1.5 text-[10px] font-mono text-pink-300">
                      <span className="bg-pink-950/70 border border-pink-500/30 px-2 py-0.5 rounded text-pink-200 font-semibold">
                        Link {idx + 1} of {readingLinks.length} • +{link.readingPoints} pts in #{link.hashtag || link.hashtagTag || 'deep_'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(idx)}
                        className="text-slate-400 hover:text-rose-400 text-[10px] flex items-center gap-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Remove
                      </button>
                    </div>
                    <ReadingLinkCard
                      readingLink={link}
                      compact={false}
                      onReadLink={() => {}}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PDF Upload Dropzone */}
          <div className="bg-black/40 border border-dashed border-pink-500/40 hover:border-pink-500/80 rounded-xl p-4 text-center transition-all">
            {pdfDoc ? (
              <div className="flex items-center justify-between bg-pink-950/40 p-3 rounded-xl border border-pink-500/30 text-xs text-left">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-pink-400 shrink-0" />
                  <div>
                    <h5 className="font-bold text-slate-100">{pdfDoc.title}</h5>
                    <span className="text-[10px] text-slate-400">{pdfDoc.fileSize} • PDF Attached</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPdfDoc(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center space-y-1.5">
                <Upload className="w-6 h-6 text-pink-400" />
                <span className="text-xs font-semibold text-slate-200">
                  {isUploadingPdf ? 'Uploading PDF Document...' : 'Upload PDF Document or Poetry Verse'}
                </span>
                <span className="text-[10px] text-slate-500">
                  Supports .pdf files up to 20MB. Encrypted into vault.
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Optional Image URL */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Optional Image URL:
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-neutral-950/80 border border-pink-500/30 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-pink-500/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-neutral-900 border border-pink-500/20 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim() && !pdfDoc && readingLinks.length === 0}
              className="bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-all shadow-[0_0_12px_rgba(236,72,153,0.4)] border border-pink-400/50"
            >
              Publish to Global Feed
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
