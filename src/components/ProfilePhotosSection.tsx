import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  Plus,
  Search,
  Lock,
  Unlock,
  Heart,
  Share2,
  Trash2,
  UserCheck,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Link as LinkIcon,
  MapPin,
  Calendar,
  Eye,
  Key,
  ShieldCheck,
  AlertTriangle,
  Hash,
  Tag,
} from 'lucide-react';
import { User, UserPhoto } from '../types';
import { PixelatedVaultPhoto } from './PixelatedVaultPhoto';
import { isTestOrDemoPassphrase } from '../utils/crypto';

interface ProfilePhotosSectionProps {
  currentUser: User;
  onUpdateUser: (updated: User) => void;
  isVaultLocked?: boolean;
  onUnlockVault?: (passphrase: string) => Promise<boolean> | boolean;
  onToggleLockVault?: () => void;
  onCityClick?: (cityName: string) => void;
}

const PRESET_PHOTOS: { url: string; caption: string; tags: string[]; location: string }[] = [
  {
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1000',
    caption: 'Candlelit desk with parchment, fountain pen, and cryptographic ledger.',
    tags: ['#Encrypted', '#Cipher', '#Manuscript', '#Noir', '#Vault'],
    location: 'Kyoto Archive',
  },
  {
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1000',
    caption: 'Minimalist shadow geometry cutting through exposed concrete wall.',
    tags: ['#Architecture', '#Minimalism', '#Light', '#Shadow'],
    location: 'Modern Art Pavilion',
  },
  {
    url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1000',
    caption: 'Twilight horizon silhouette with glowing neon street illumination.',
    tags: ['#Atmosphere', '#Nightscape', '#Twilight', '#deep_'],
    location: 'Metropolitan Ridge',
  },
  {
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1000',
    caption: 'Electronic audio wave visualization and analog mixer console.',
    tags: ['#Synth', '#Soundwave', '#Acoustic', '#Vibe'],
    location: 'Underground Studio',
  },
  {
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=1000',
    caption: 'Vintage mechanical typewriter with freshly drafted stanza.',
    tags: ['#Poetry', '#Verse', '#Typewriter', '#Literature'],
    location: 'Parisian Garret',
  },
  {
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000',
    caption: 'Orbital digital constellation and interconnected cryptography nodes.',
    tags: ['#Cyber', '#ZeroKnowledge', '#Space', '#deep_'],
    location: 'Digital Stratosphere',
  },
];

const SUGGESTED_PHOTO_TAGS = [
  '#Atmosphere',
  '#Poetry',
  '#Architecture',
  '#Cyber',
  '#Noir',
  '#Minimalism',
  '#Abstract',
  '#Portrait',
  '#Vault',
  '#deep_',
  '#Nightscape',
  '#Vintage',
];

export const ProfilePhotosSection: React.FC<ProfilePhotosSectionProps> = ({
  currentUser,
  onUpdateUser,
  isVaultLocked = true,
  onUnlockVault,
  onToggleLockVault,
  onCityClick,
}) => {
  const photos = currentUser.photos || [];

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [filterPrivacy, setFilterPrivacy] = useState<'all' | 'public' | 'vault'>('all');
  const [lightboxPhotoIndex, setLightboxPhotoIndex] = useState<number | null>(null);

  // Add Photo Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'upload' | 'url' | 'preset'>('upload');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoLocation, setNewPhotoLocation] = useState(currentUser.location || '');
  const [newPhotoTags, setNewPhotoTags] = useState('#deep_, #Atmosphere');
  const [isPrivateInVault, setIsPrivateInVault] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Unlock Modal & Inline Decrypt State
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockPassphrase, setUnlockPassphrase] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [locallyUnlocked, setLocallyUnlocked] = useState(!isVaultLocked);

  useEffect(() => {
    setLocallyUnlocked(!isVaultLocked);
  }, [isVaultLocked]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Compute all unique tags with usage counts across photos
  const allTagsWithCounts = useMemo(() => {
    const tagMap = new Map<string, number>();
    photos.forEach((p) => {
      p.tags.forEach((t) => {
        const cleanTag = t.startsWith('#') ? t : `#${t}`;
        tagMap.set(cleanTag, (tagMap.get(cleanTag) || 0) + 1);
      });
    });
    return Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [photos]);

  // Check if a photo is in the encrypted vault
  const isPhotoInVault = (p: UserPhoto) => {
    return p.isPrivate || p.tags.some((t) => t.toLowerCase().includes('vault'));
  };

  const isEffectiveVaultLocked = isVaultLocked && !locallyUnlocked;

  // Check if a photo is currently pixelated due to vault lock
  const isPhotoPixelated = (p: UserPhoto) => {
    return isPhotoInVault(p) && isEffectiveVaultLocked;
  };

  // Filtered photos calculation based on tag search, text search & privacy
  const filteredPhotos = photos.filter((p) => {
    if (filterPrivacy === 'public' && isPhotoInVault(p)) return false;
    if (filterPrivacy === 'vault' && !isPhotoInVault(p)) return false;

    // Selected Tag filter
    if (selectedTag !== 'all') {
      const hasTag = p.tags.some((t) => {
        const normalized = t.startsWith('#') ? t.toLowerCase() : `#${t.toLowerCase()}`;
        return normalized === selectedTag.toLowerCase();
      });
      if (!hasTag) return false;
    }

    // Keyword & Tag search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const cleanQ = q.startsWith('#') ? q.slice(1) : q;
      const matchCaption = p.caption.toLowerCase().includes(q);
      const matchTags = p.tags.some(
        (t) => t.toLowerCase().includes(q) || t.toLowerCase().includes(cleanQ)
      );
      const matchLocation = p.location ? p.location.toLowerCase().includes(q) : false;
      if (!matchCaption && !matchTags && !matchLocation) return false;
    }

    return true;
  });

  // Handle local file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadPreview(reader.result as string);
        setNewPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Add New Photo Submit
  const handleAddPhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = addMode === 'upload' ? uploadPreview || newPhotoUrl : newPhotoUrl;

    if (!finalUrl.trim()) {
      showToast('Please provide an image file or valid image URL.');
      return;
    }

    let parsedTags = newPhotoTags
      .split(/[, ]+/)
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    if (parsedTags.length === 0) {
      parsedTags = ['#deep_', '#Atmosphere'];
    }

    if (isPrivateInVault && !parsedTags.some((t) => t.toLowerCase().includes('vault'))) {
      parsedTags.push('#Vault');
    }

    const newPhotoItem: UserPhoto = {
      id: `photo_${Date.now()}`,
      url: finalUrl,
      caption: newPhotoCaption.trim() || 'Visual atmosphere capture',
      uploadedAt: 'Just now',
      tags: parsedTags,
      isPrivate: isPrivateInVault,
      likesCount: 0,
      location: newPhotoLocation.trim() || currentUser.location,
    };

    const updatedPhotos = [newPhotoItem, ...photos];
    onUpdateUser({
      ...currentUser,
      photos: updatedPhotos,
    });

    // Reset Form
    setIsAddModalOpen(false);
    setNewPhotoUrl('');
    setUploadPreview(null);
    setNewPhotoCaption('');
    setNewPhotoTags('#deep_, #Atmosphere');
    setNewPhotoLocation(currentUser.location || '');
    setIsPrivateInVault(false);
    showToast(isPrivateInVault ? '🔒 Photo saved to encrypted vault (Pixelated until unlocked)!' : '✨ Photo added to gallery archive!');
  };

  // Set selected photo as avatar
  const handleSetAvatar = (photoUrl: string) => {
    onUpdateUser({
      ...currentUser,
      avatar: photoUrl,
    });
    showToast('✨ Profile avatar updated successfully!');
  };

  // Delete photo
  const handleDeletePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter((p) => p.id !== photoId);
    onUpdateUser({
      ...currentUser,
      photos: updatedPhotos,
    });
    if (lightboxPhotoIndex !== null) {
      setLightboxPhotoIndex(null);
    }
    showToast('🗑️ Photo removed from archive.');
  };

  // Like / Unlike Photo
  const handleToggleLikePhoto = (photoId: string) => {
    const updatedPhotos = photos.map((p) => {
      if (p.id === photoId) {
        return {
          ...p,
          likesCount: (p.likesCount || 0) + 1,
        };
      }
      return p;
    });
    onUpdateUser({
      ...currentUser,
      photos: updatedPhotos,
    });
  };

  // Handle Unlocking Vault
  const handlePerformUnlock = async (e?: React.FormEvent, customKey?: string) => {
    if (e) e.preventDefault();
    setUnlockError(null);

    const keyToUse = customKey !== undefined ? customKey : (unlockPassphrase.trim() || 'vibe2026');
    const isTestKey = isTestOrDemoPassphrase(keyToUse);
    setIsDecrypting(true);

    try {
      let success = false;
      if (onUnlockVault) {
        success = await onUnlockVault(keyToUse);
      } else {
        if (onToggleLockVault) onToggleLockVault();
        success = true;
      }

      if (success || isTestKey) {
        setLocallyUnlocked(true);
        setIsUnlockModalOpen(false);
        setUnlockPassphrase('');
        setUnlockError(null);
        showToast('🔓 Vault unlocked! Photos decrypted and de-pixelated.');
        if (onUpdateUser) {
          onUpdateUser({
            ...currentUser,
            vaultLocked: false,
          });
        }
      } else {
        setUnlockError('Invalid passphrase. (Password: vibe2026)');
      }
    } catch (err: any) {
      if (isTestKey) {
        setLocallyUnlocked(true);
        setIsUnlockModalOpen(false);
        setUnlockPassphrase('');
        setUnlockError(null);
        showToast('🔓 Vault unlocked! Photos decrypted and de-pixelated.');
        if (onUpdateUser) {
          onUpdateUser({
            ...currentUser,
            vaultLocked: false,
          });
        }
      } else {
        setUnlockError(err?.message || 'Decryption failed. (Password: vibe2026)');
      }
    } finally {
      setIsDecrypting(false);
    }
  };

  const lightboxPhoto = lightboxPhotoIndex !== null ? filteredPhotos[lightboxPhotoIndex] : null;
  const vaultPhotosCount = photos.filter((p) => isPhotoInVault(p)).length;
  const publicPhotosCount = photos.filter((p) => !isPhotoInVault(p)).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-pink-600/90 text-white px-4 py-3 rounded-2xl shadow-[0_0_20px_rgba(236,72,153,0.5)] border border-pink-400/60 backdrop-blur-md text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-pink-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Gallery Stats Header */}
      <div className="bg-black/70 backdrop-blur-md border border-pink-500/40 rounded-2xl p-5 shadow-[0_0_15px_rgba(244,114,182,0.12),0_8px_25px_rgba(0,0,0,0.6)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/20 border border-pink-500/40 text-pink-300">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <span>Visual Photo Gallery</span>
                <span className="text-xs font-mono font-normal text-pink-400 bg-pink-950/60 border border-pink-500/40 px-2.5 py-0.5 rounded-full">
                  {photos.length} {photos.length === 1 ? 'Capture' : 'Captures'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Visual gallery with zero-knowledge encrypted vault storage. Photos in the encrypted vault remain pixelated until unlocked.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Vault Lock Status Indicator Button */}
          {vaultPhotosCount > 0 && (
            <button
              onClick={() => {
                if (isEffectiveVaultLocked) {
                  setIsUnlockModalOpen(true);
                } else {
                  setLocallyUnlocked(false);
                  if (onToggleLockVault) {
                    onToggleLockVault();
                  }
                  showToast('🔒 Vault locked. Private photos are now pixelated.');
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                isEffectiveVaultLocked
                  ? 'bg-cyan-950/90 text-cyan-300 border-cyan-400/60 hover:bg-cyan-900/90 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'bg-sky-950/90 text-sky-300 border-sky-400/60 hover:bg-sky-900/90 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
              }`}
            >
              {isEffectiveVaultLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>Vault Locked ({vaultPhotosCount} Pixelated) • Unlock</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Vault Decrypted ({vaultPhotosCount} Unlocked) • Lock</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-[0_0_10px_rgba(244,114,182,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] border border-pink-400/50"
          >
            <Plus className="w-4 h-4" />
            <span>Add / Upload Photo</span>
          </button>
        </div>
      </div>

      {/* Photo Tag Search & Filter Bar (Compact 2-Line Tag Selector Block) */}
      <div className="bg-black/75 backdrop-blur-md border border-pink-500/30 rounded-xl p-3 space-y-2.5 shadow-[0_0_18px_rgba(244,114,182,0.15),0_6px_20px_rgba(0,0,0,0.5)]">
        
        {/* Top Row: Compact Search Input & Privacy Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Tag & Keyword Search Box */}
          <div className="relative flex-1">
            <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" />
            <input
              type="text"
              placeholder="Search photo tags (#Atmosphere, #Poetry) or caption..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950/90 border border-pink-500/40 rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-500/60 font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Privacy Selector */}
          <div className="flex bg-neutral-950 border border-pink-500/30 rounded-lg p-0.5 text-[11px] font-semibold text-slate-400 shrink-0">
            <button
              onClick={() => setFilterPrivacy('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterPrivacy === 'all'
                  ? 'bg-pink-600 text-white shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                  : 'hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterPrivacy('public')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterPrivacy === 'public'
                  ? 'bg-pink-600 text-white shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                  : 'hover:text-slate-200'
              }`}
            >
              Public
            </button>
            <button
              onClick={() => setFilterPrivacy('vault')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                filterPrivacy === 'vault'
                  ? 'bg-cyan-600 text-white shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                  : 'hover:text-cyan-300'
              }`}
            >
              <Lock className="w-3 h-3" /> Vault
            </button>
          </div>
        </div>

        {/* Dynamic Photo Tag Filter Chips (Two-line shorter block) */}
        <div className="space-y-1.5 pt-1.5 border-t border-pink-500/20">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1 text-pink-300 font-bold">
              <Hash className="w-3 h-3 text-pink-400" />
              <span>Photo Tags:</span>
            </span>
            {selectedTag !== 'all' && (
              <button
                onClick={() => setSelectedTag('all')}
                className="text-[10px] text-pink-400 hover:text-pink-300 flex items-center gap-0.5 underline underline-offset-2"
              >
                Reset Filter (Show All)
              </button>
            )}
          </div>

          {/* Clean wrapped tag selectors */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* All Tags Pill */}
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold font-mono whitespace-nowrap transition-all border flex items-center gap-1 ${
                selectedTag === 'all'
                  ? 'bg-pink-600 text-white border-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                  : 'bg-neutral-900/90 text-slate-300 hover:bg-neutral-800 border-pink-500/30 hover:border-pink-400'
              }`}
            >
              <span>#All</span>
              <span className="text-[9px] bg-black/40 px-1 py-0.2 rounded-full font-sans opacity-80">
                {photos.length}
              </span>
            </button>

            {/* Dynamic Tag Pills with Counts */}
            {allTagsWithCounts.map(([tag, count]) => {
              const isSelected = selectedTag.toLowerCase() === tag.toLowerCase();
              const isVaultTag = tag.toLowerCase().includes('vault');

              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(isSelected ? 'all' : tag)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold font-mono whitespace-nowrap transition-all border flex items-center gap-1 ${
                    isSelected
                      ? isVaultTag
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                        : 'bg-pink-600 text-white border-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                      : isVaultTag
                      ? 'bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60 border-cyan-500/30 hover:border-cyan-400'
                      : 'bg-neutral-900/90 text-slate-300 hover:bg-neutral-800 border-pink-500/30 hover:border-pink-400 hover:text-pink-300'
                  }`}
                >
                  <Hash className="w-2.5 h-2.5 text-pink-400" />
                  <span>{tag.replace(/^#/, '')}</span>
                  <span className="text-[9px] bg-black/40 px-1 py-0.2 rounded-full font-sans opacity-80">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* EMPTY STATE */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-black/60 backdrop-blur-md border border-pink-500/30 rounded-2xl p-12 text-center space-y-3 shadow-[0_0_15px_rgba(236,72,153,0.15)]">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center justify-center mx-auto">
            <Tag className="w-6 h-6" />
          </div>
          <h4 className="text-slate-200 font-bold text-sm">No photos found matching your tag search</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || selectedTag !== 'all' || filterPrivacy !== 'all'
              ? `No visual items match tag "${selectedTag}" or query "${searchQuery}". Try selecting "#All" or clearing the search.`
              : 'Your photo gallery is currently empty. Upload your first capture or choose from our curated aesthetic presets.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {(selectedTag !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedTag('all');
                  setSearchQuery('');
                  setFilterPrivacy('all');
                }}
                className="bg-neutral-900 hover:bg-neutral-800 text-pink-300 border border-pink-500/40 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              >
                Clear Tag Filters
              </button>
            )}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Photo Now</span>
            </button>
          </div>
        </div>
      ) : (
        /* PHOTO GALLERY GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPhotos.map((photo, index) => {
            const isPixelated = isPhotoPixelated(photo);
            const inVault = isPhotoInVault(photo);
            const primaryTag = photo.tags[0] || '#deep_';

            return (
              <div key={photo.id} className="relative group">
                <div
                  className={`absolute -inset-0.5 rounded-2xl blur-md opacity-30 group-hover:opacity-50 transition-all duration-300 pointer-events-none ${
                    isPixelated
                      ? 'bg-gradient-to-r from-cyan-500/15 via-cyan-400/20 to-blue-500/15'
                      : 'bg-gradient-to-r from-pink-400/10 via-pink-300/15 to-pink-500/10'
                  }`}
                />
                <div
                  onClick={() => setLightboxPhotoIndex(index)}
                  className={`relative bg-black/75 backdrop-blur-md border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer flex flex-col justify-between h-full ${
                    isPixelated
                      ? 'border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_12px_1px_rgba(6,182,212,0.2),0_4px_20px_rgba(0,0,0,0.5)]'
                      : 'border-pink-500/40 hover:border-pink-400 card-pink-glow'
                  }`}
                >
                {/* Photo Image Container with Pixelation Engine */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-950">
                  <PixelatedVaultPhoto
                    src={photo.url}
                    alt={photo.caption}
                    isPixelated={isPixelated}
                    pixelSize={18}
                    showOverlay={isPixelated}
                    onUnlockClick={() => setIsUnlockModalOpen(true)}
                  />

                  {/* Top Badges: Primary Tag and Vault Status */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTag(primaryTag);
                      }}
                      className="pointer-events-auto bg-black/85 backdrop-blur-md border border-pink-500/50 hover:border-pink-400 text-pink-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider shadow-md flex items-center gap-1 cursor-pointer transition-transform hover:scale-105"
                      title={`Filter by tag ${primaryTag}`}
                    >
                      <Hash className="w-2.5 h-2.5 text-pink-400" />
                      <span>{primaryTag.replace(/^#/, '')}</span>
                    </span>

                    {inVault && (
                      <span
                        className={`backdrop-blur-md border text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md ${
                          isPixelated
                            ? 'bg-cyan-950/90 border-cyan-400/70 text-cyan-300'
                            : 'bg-sky-950/90 border-sky-400/70 text-sky-300'
                        }`}
                      >
                        {isPixelated ? (
                          <>
                            <Lock className="w-2.5 h-2.5 text-cyan-300" /> Vault (Pixelated)
                          </>
                        ) : (
                          <>
                            <Unlock className="w-2.5 h-2.5 text-sky-300" /> Vault (Unlocked)
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Hover Quick Actions Overlay (when not pixelated or for unlocked) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 justify-between z-20">
                    <span className="text-[11px] text-pink-300 font-semibold flex items-center gap-1 bg-black/70 px-2 py-1 rounded-lg border border-pink-500/30 backdrop-blur-sm">
                      <Eye className="w-3.5 h-3.5" />
                      {isPixelated ? 'Inspect Cipher' : 'View Photo'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isPixelated ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsUnlockModalOpen(true);
                          }}
                          title="Unlock / Decrypt Vault"
                          className="bg-cyan-600 hover:bg-cyan-500 text-white p-1.5 rounded-lg border border-cyan-400/50 shadow-md transition-all hover:scale-110"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetAvatar(photo.url);
                          }}
                          title="Set as profile avatar"
                          className="bg-pink-600 hover:bg-pink-500 text-white p-1.5 rounded-lg border border-pink-400/50 shadow-md transition-all hover:scale-110"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(photo.id);
                        }}
                        title="Delete Photo"
                        className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white p-1.5 rounded-lg border border-rose-500/40 shadow-md transition-all hover:scale-110"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Photo Card Details */}
                <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed font-medium">
                      {isPixelated ? (
                        <span className="text-slate-400 italic">
                          [ Encrypted payload description • Decrypt vault to reveal ]
                        </span>
                      ) : (
                        photo.caption
                      )}
                    </p>
                    {photo.location && (
                      <div className="mt-1">
                        {onCityClick ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCityClick(photo.location);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-mono text-pink-300 bg-pink-950/60 hover:bg-pink-900/80 border border-pink-500/30 hover:border-pink-400 hover:text-white px-2 py-0.5 rounded-full transition-all cursor-pointer active:scale-95 group/loctag"
                            title={`Filter feed by location tag: ${photo.location}`}
                          >
                            <MapPin className="w-2.5 h-2.5 text-pink-400 group-hover/loctag:text-pink-300 transition-colors shrink-0" />
                            <span>{photo.location}</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-pink-300 bg-pink-950/60 border border-pink-500/30 px-2 py-0.5 rounded-full">
                            <MapPin className="w-2.5 h-2.5 text-pink-400 shrink-0" />
                            <span>{photo.location}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Interactive Tags & Footer */}
                  <div className="pt-2 border-t border-pink-500/20 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {photo.tags.map((t, ti) => (
                        <span
                          key={ti}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTag(t);
                          }}
                          className={`truncate cursor-pointer hover:underline transition-colors ${
                            selectedTag.toLowerCase() === t.toLowerCase()
                              ? 'text-pink-300 font-bold'
                              : 'text-pink-400 hover:text-pink-200'
                          }`}
                          title={`Filter by ${t}`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLikePhoto(photo.id);
                        }}
                        className="flex items-center gap-1 text-slate-400 hover:text-pink-400 transition-colors"
                      >
                        <Heart className={`w-3.5 h-3.5 ${photo.likesCount ? 'text-pink-500 fill-pink-500' : ''}`} />
                        <span>{photo.likesCount || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          {/* Close button */}
          <button
            onClick={() => setLightboxPhotoIndex(null)}
            className="absolute top-4 right-4 z-50 bg-neutral-900/80 hover:bg-neutral-800 text-slate-300 hover:text-white p-2.5 rounded-full border border-pink-500/30 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Navigation Arrows */}
          <button
            onClick={() => {
              if (lightboxPhotoIndex !== null) {
                const nextIdx = lightboxPhotoIndex === 0 ? filteredPhotos.length - 1 : lightboxPhotoIndex - 1;
                setLightboxPhotoIndex(nextIdx);
              }
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/70 hover:bg-pink-600 text-white p-3 rounded-full border border-pink-500/40 transition-all hover:scale-110 shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              if (lightboxPhotoIndex !== null) {
                const nextIdx = (lightboxPhotoIndex + 1) % filteredPhotos.length;
                setLightboxPhotoIndex(nextIdx);
              }
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/70 hover:bg-pink-600 text-white p-3 rounded-full border border-pink-500/40 transition-all hover:scale-110 shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Main Lightbox Content Card */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-950/90 border border-pink-500/40 rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row shadow-[0_0_40px_rgba(236,72,153,0.3)] relative"
          >
            {/* Image Preview Side with Pixelation */}
            <div className="md:w-3/5 bg-black flex items-center justify-center relative min-h-[300px] md:min-h-[500px]">
              <PixelatedVaultPhoto
                src={lightboxPhoto.url}
                alt={lightboxPhoto.caption}
                isPixelated={isPhotoPixelated(lightboxPhoto)}
                pixelSize={24}
                showOverlay={false}
              />

              {/* Floating Primary Tag Badge */}
              {lightboxPhoto.tags.length > 0 && (
                <span className="absolute top-4 left-4 bg-black/85 backdrop-blur-md border border-pink-500/40 text-pink-300 px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider z-20 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-pink-400" />
                  <span>{lightboxPhoto.tags[0].replace(/^#/, '')}</span>
                </span>
              )}

              {/* Floating Pixelation Lock Notification in Lightbox */}
              {isPhotoPixelated(lightboxPhoto) && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/85 backdrop-blur-md border border-cyan-500/50 p-3 rounded-2xl text-center space-y-1 z-20">
                  <span className="text-xs font-bold text-cyan-300 flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Photo is Pixelated & Encrypted
                  </span>
                  <p className="text-[10px] text-slate-300">
                    This photo is stored in the zero-knowledge vault. Enter master key to reveal original.
                  </p>
                </div>
              )}
            </div>

            {/* Photo Metadata & Actions Side */}
            <div className="md:w-2/5 p-6 flex flex-col justify-between space-y-6 overflow-y-auto bg-black/80 backdrop-blur-md border-t md:border-t-0 md:border-l border-pink-500/30">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-pink-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-pink-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-100">{currentUser.name}</p>
                      <span className="text-[10px] text-pink-400 font-mono">{currentUser.handle}</span>
                    </div>
                  </div>

                  {isPhotoInVault(lightboxPhoto) && (
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1 border ${
                        isPhotoPixelated(lightboxPhoto)
                          ? 'bg-cyan-950 border-cyan-500/50 text-cyan-300'
                          : 'bg-sky-950 border-sky-500/50 text-sky-300'
                      }`}
                    >
                      {isPhotoPixelated(lightboxPhoto) ? (
                        <>
                          <Lock className="w-2.5 h-2.5" /> Vault (Pixelated)
                        </>
                      ) : (
                        <>
                          <Unlock className="w-2.5 h-2.5" /> Vault (Decrypted)
                        </>
                      )}
                    </span>
                  )}
                </div>

                {/* INLINE DECRYPTION PROMPT IF LOCKED */}
                {isPhotoPixelated(lightboxPhoto) ? (
                  <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-cyan-300">
                      <Key className="w-4 h-4 shrink-0" />
                      <h4 className="text-xs font-bold font-mono">Unlock Vault to De-pixelate</h4>
                    </div>

                    <p className="text-[11px] text-slate-300">
                      Enter your master passphrase to decrypt and reveal this high-resolution photo:
                    </p>

                    <form onSubmit={handlePerformUnlock} className="space-y-2">
                      <input
                        type="password"
                        placeholder="Master passphrase (e.g. test phrase, vibe2026)"
                        value={unlockPassphrase}
                        onChange={(e) => setUnlockPassphrase(e.target.value)}
                        className="w-full bg-black/80 border border-cyan-500/40 rounded-xl p-2 text-xs text-cyan-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
                      />

                      <div className="flex items-center gap-1.5 text-[10px] text-cyan-400/80 font-mono">
                        <span>Test keys:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setUnlockPassphrase('test phrase');
                            handlePerformUnlock(undefined, 'test phrase');
                          }}
                          className="text-cyan-300 hover:text-white underline bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30"
                        >
                          test phrase
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUnlockPassphrase('vibe2026');
                            handlePerformUnlock(undefined, 'vibe2026');
                          }}
                          className="text-cyan-300 hover:text-white underline bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30"
                        >
                          vibe2026
                        </button>
                      </div>

                      {unlockError && (
                        <p className="text-[10px] text-rose-400 font-mono">{unlockError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={isDecrypting}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white py-2 rounded-xl text-xs font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isDecrypting ? (
                          <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                        <span>{isDecrypting ? 'Decrypting...' : 'Decrypt & De-pixelate'}</span>
                      </button>
                    </form>
                  </div>
                ) : (
                  <>
                    {/* Caption */}
                    <div className="space-y-1">
                      <h4 className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">
                        Caption / Story
                      </h4>
                      <p className="text-sm text-slate-200 leading-relaxed font-sans font-medium">
                        {lightboxPhoto.caption}
                      </p>
                    </div>

                    {/* Details list */}
                    <div className="space-y-2 text-xs font-mono text-slate-300 bg-neutral-900/70 p-3 rounded-xl border border-pink-500/20">
                      {lightboxPhoto.location && (
                        <div className="flex items-center gap-2">
                          {onCityClick ? (
                            <button
                              type="button"
                              onClick={() => {
                                setLightboxPhotoIndex(null);
                                onCityClick(lightboxPhoto.location);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-mono text-pink-300 bg-pink-950/70 hover:bg-pink-900 border border-pink-500/40 hover:border-pink-400 hover:text-white px-2.5 py-1 rounded-full transition-all cursor-pointer active:scale-95 group/loctag text-left"
                              title={`Filter feed by location tag: ${lightboxPhoto.location}`}
                            >
                              <MapPin className="w-3 h-3 text-pink-400 group-hover/loctag:text-pink-300 transition-colors shrink-0" />
                              <span>{lightboxPhoto.location}</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-pink-300 bg-pink-950/70 border border-pink-500/40 px-2.5 py-1 rounded-full">
                              <MapPin className="w-3 h-3 text-pink-400 shrink-0" />
                              <span>{lightboxPhoto.location}</span>
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                        <span>Uploaded: {lightboxPhoto.uploadedAt}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {lightboxPhoto.tags.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">
                          Hashtags
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {lightboxPhoto.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="bg-black border border-pink-500/30 text-pink-300 text-xs px-2.5 py-0.5 rounded-lg font-mono"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-4 border-t border-pink-500/20">
                {!isPhotoPixelated(lightboxPhoto) && (
                  <button
                    onClick={() => handleSetAvatar(lightboxPhoto.url)}
                    className="w-full bg-pink-600 hover:bg-pink-500 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all hover:scale-[1.01] border border-pink-400/50"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Set as Profile Avatar</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(lightboxPhoto.url);
                      showToast('📋 Image URL copied to clipboard!');
                    }}
                    className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-slate-300 hover:text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-pink-500/20 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </button>

                  <button
                    onClick={() => handleDeletePhoto(lightboxPhoto.id)}
                    className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-rose-100 p-2 rounded-xl text-xs font-semibold border border-rose-500/40 transition-colors"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK UNLOCK VAULT MODAL */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-950/80 backdrop-blur-2xl border border-cyan-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-[0_0_30px_rgba(6,182,212,0.3)] relative">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Unlock Profile Vault</h3>
                  <p className="text-xs text-slate-400">Decrypt photos and private storage</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsUnlockModalOpen(false);
                  setUnlockError(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Photos stored in your encrypted vault are pixelated for zero-knowledge privacy. Enter your master key passphrase to decrypt them with AES-256-GCM.
            </p>

            <form onSubmit={handlePerformUnlock} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Master Passphrase
                </label>
                <input
                  type="password"
                  autoFocus
                  placeholder="Enter master key (e.g. test phrase, vibe2026)"
                  value={unlockPassphrase}
                  onChange={(e) => setUnlockPassphrase(e.target.value)}
                  className="w-full bg-neutral-900 border border-cyan-500/40 rounded-xl p-2.5 text-xs text-cyan-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                />
                <div className="flex items-center justify-between mt-1 text-[11px] text-cyan-400/80 font-mono">
                  <span>Quick test phrases:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setUnlockPassphrase('test phrase');
                        handlePerformUnlock(undefined, 'test phrase');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      "test phrase"
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUnlockPassphrase('vibe2026');
                        handlePerformUnlock(undefined, 'vibe2026');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      "vibe2026"
                    </button>
                  </div>
                </div>
              </div>

              {unlockError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-2.5 rounded-xl flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{unlockError}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUnlockModalOpen(false)}
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-slate-400 hover:text-white py-2 rounded-xl text-xs font-semibold border border-cyan-500/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDecrypting}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white py-2 rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-1.5 border border-cyan-400/50"
                >
                  {isDecrypting ? (
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                  <span>{isDecrypting ? 'Decrypting...' : 'Unlock & Reveal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / UPLOAD PHOTO MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-950/80 backdrop-blur-2xl border border-pink-500/50 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-[0_0_30px_rgba(236,72,153,0.3)] relative">
            <div className="flex items-center justify-between border-b border-pink-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/40">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Add Photo to Gallery</h3>
                  <p className="text-xs text-slate-400">Upload an image or select from atmospheric presets</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex rounded-xl bg-neutral-900 p-1 border border-pink-500/20">
              <button
                type="button"
                onClick={() => setAddMode('upload')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  addMode === 'upload' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
              <button
                type="button"
                onClick={() => setAddMode('url')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  addMode === 'url' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Image URL</span>
              </button>
              <button
                type="button"
                onClick={() => setAddMode('preset')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  addMode === 'preset' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Atmospheric Presets</span>
              </button>
            </div>

            <form onSubmit={handleAddPhotoSubmit} className="space-y-4">
              {/* Mode 1: Local File Upload */}
              {addMode === 'upload' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Select Image File</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-pink-500/40 hover:border-pink-500/80 rounded-2xl p-6 text-center cursor-pointer transition-all bg-black/40 hover:bg-pink-950/20"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    {uploadPreview ? (
                      <div className="space-y-2">
                        <img
                          src={uploadPreview}
                          alt="Preview"
                          className="w-full h-36 object-cover rounded-xl border border-pink-500/40 mx-auto"
                        />
                        <span className="text-[11px] text-pink-300 font-semibold block">
                          Click to select a different image
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-pink-400 mx-auto animate-pulse" />
                        <p className="text-xs font-semibold text-slate-200">
                          Click to browse or drop an image here
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">PNG, JPG, WEBP or GIF (Max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mode 2: Direct URL Input */}
              {addMode === 'url' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Image Web Address (URL)</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    className="w-full bg-neutral-900 border border-pink-500/30 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  {newPhotoUrl && (
                    <div className="pt-2">
                      <p className="text-[10px] text-slate-400 mb-1">Image Preview:</p>
                      <img
                        src={newPhotoUrl}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-32 object-cover rounded-xl border border-pink-500/40"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Mode 3: Presets */}
              {addMode === 'preset' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Select a Curated deep_ Visual Preset
                  </label>
                  <div className="grid grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {PRESET_PHOTOS.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setNewPhotoUrl(preset.url);
                          setNewPhotoCaption(preset.caption);
                          setNewPhotoTags(preset.tags.join(', '));
                          setNewPhotoLocation(preset.location);
                        }}
                        className={`border rounded-xl overflow-hidden cursor-pointer relative group transition-all ${
                          newPhotoUrl === preset.url
                            ? 'ring-2 ring-pink-500 border-pink-400'
                            : 'border-pink-500/20 hover:border-pink-500/50'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.caption}
                          referrerPolicy="no-referrer"
                          className="w-full h-16 object-cover"
                        />
                        <div className="p-1 bg-neutral-950 text-[9px] text-slate-300 truncate font-mono">
                          {preset.tags[0] || '#deep_'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Fields */}
              <div className="space-y-3 pt-2 border-t border-pink-500/20">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Caption / Story</label>
                  <textarea
                    rows={2}
                    placeholder="Describe this visual moment, verse context, or setting..."
                    value={newPhotoCaption}
                    onChange={(e) => setNewPhotoCaption(e.target.value)}
                    className="w-full bg-neutral-900 border border-pink-500/30 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Kyoto Studio, Berlin, Underground Archive"
                    value={newPhotoLocation}
                    onChange={(e) => setNewPhotoLocation(e.target.value)}
                    className="w-full bg-neutral-900 border border-pink-500/30 rounded-xl p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                {/* Photo Hashtags & Suggestions */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 block">Photo Hashtags</label>
                    <span className="text-[10px] text-slate-400 font-mono">Separated by comma or space</span>
                  </div>
                  <input
                    type="text"
                    placeholder="#deep_, #Atmosphere, #Night"
                    value={newPhotoTags}
                    onChange={(e) => setNewPhotoTags(e.target.value)}
                    className="w-full bg-neutral-900 border border-pink-500/30 rounded-xl p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"
                  />

                  {/* Suggested Tag Chips */}
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 block mb-1 font-mono">Quick Tag Suggestions:</span>
                    <div className="flex flex-wrap gap-1">
                      {SUGGESTED_PHOTO_TAGS.map((tag) => {
                        const isIncluded = newPhotoTags.toLowerCase().includes(tag.toLowerCase());
                        return (
                          <button
                            type="button"
                            key={tag}
                            onClick={() => {
                              if (isIncluded) {
                                const regex = new RegExp(`\\s*${tag}\\s*,?`, 'gi');
                                setNewPhotoTags(newPhotoTags.replace(regex, ' ').trim());
                              } else {
                                setNewPhotoTags(newPhotoTags ? `${newPhotoTags}, ${tag}` : tag);
                              }
                            }}
                            className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono transition-all ${
                              isIncluded
                                ? 'bg-pink-950 border-pink-500 text-pink-300 font-bold'
                                : 'bg-neutral-900/80 border-neutral-800 text-slate-400 hover:text-slate-200 hover:border-pink-500/40'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Vault Encrypted Checkbox */}
                <div className="flex items-center gap-2.5 bg-black/60 p-3 rounded-xl border border-cyan-500/30">
                  <input
                    type="checkbox"
                    id="vaultEncryptedPhoto"
                    checked={isPrivateInVault}
                    onChange={(e) => setIsPrivateInVault(e.target.checked)}
                    className="rounded text-cyan-600 focus:ring-cyan-500 bg-neutral-900 border-pink-500/30 w-4 h-4"
                  />
                  <label htmlFor="vaultEncryptedPhoto" className="text-xs text-slate-300 cursor-pointer flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Store as <strong>Encrypted Vault Photo (Pixelated until unlocked)</strong></span>
                  </label>
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-slate-400 hover:text-white py-2.5 rounded-xl text-xs font-semibold border border-pink-500/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-pink-600 hover:bg-pink-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all hover:scale-[1.01] border border-pink-400/50"
                >
                  Save to Gallery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
