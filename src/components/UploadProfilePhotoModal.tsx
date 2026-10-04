import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  Image as ImageIcon,
  Check,
  Sparkles,
  RefreshCw,
  Link,
  ShieldCheck,
  FolderHeart,
  Sliders,
  Trash2,
} from 'lucide-react';
import { User, UserPhoto } from '../types';

interface UploadProfilePhotoModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdateAvatar: (newAvatarUrl: string, addToGallery?: boolean) => void;
}

const PRESET_AVATARS = [
  {
    name: 'Cyber Noir Minimal',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
  },
  {
    name: 'Neon Horizon',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
  },
  {
    name: 'Monochrome Poet',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
  },
  {
    name: 'Atmospheric Violet',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
  },
  {
    name: 'Ethereal Silhouette',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
  },
  {
    name: 'Midnight Echo',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600',
  },
];

export const UploadProfilePhotoModal: React.FC<UploadProfilePhotoModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUpdateAvatar,
}) => {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>(currentUser.avatar);
  const [urlInput, setUrlInput] = useState<string>('');
  const [activeSourceTab, setActiveSourceTab] = useState<'upload' | 'gallery' | 'url' | 'camera' | 'presets'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [saveToGalleryArchive, setSaveToGalleryArchive] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sync selected image with current user avatar on open
  useEffect(() => {
    if (isOpen) {
      setSelectedImageUrl(currentUser.avatar);
      setUrlInput('');
      setCameraActive(false);
    }
  }, [isOpen, currentUser.avatar]);

  // Clean up camera stream on close or switch
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (!isOpen) return null;

  // Process image file to base64 Data URL
  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WebP, GIF).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSelectedImageUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Start Camera
  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      alert('Camera access could not be initialized. You can upload a photo file from your device instead.');
      setCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Capture Snapshot from Camera
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 480;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedImageUrl(dataUrl);
      stopCamera();
    }
  };

  // Save new profile photo
  const handleSaveAvatar = () => {
    if (!selectedImageUrl) return;
    setIsSaving(true);
    setTimeout(() => {
      onUpdateAvatar(selectedImageUrl, saveToGalleryArchive);
      setIsSaving(false);
      stopCamera();
      onClose();
    }, 250);
  };

  const userPhotos: UserPhoto[] = currentUser.photos || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-neutral-950/80 backdrop-blur-2xl border border-pink-500/50 rounded-3xl p-6 shadow-[0_0_40px_rgba(236,72,153,0.3)] max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-pink-500/20 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-pink-950/80 border border-pink-500/50 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.35)]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Update Profile Photo</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-pink-950/80 border border-pink-500/40 text-pink-300">
                  Instant Preview
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload from device, capture with camera, or select from your gallery
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl bg-neutral-900 text-slate-400 hover:text-white hover:bg-neutral-800 border border-pink-500/20 hover:border-pink-500/50 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Profile Photo Preview Hero */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-neutral-900/80 border border-pink-500/30 mb-5">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden ring-3 ring-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.4)] bg-neutral-950 relative">
              <img
                src={selectedImageUrl}
                alt="Avatar Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <Sparkles className="w-6 h-6 text-pink-300 animate-pulse" />
              </div>
            </div>
            {selectedImageUrl !== currentUser.avatar && (
              <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-sky-400 text-black text-[10px] font-bold font-mono shadow-md">
                NEW
              </span>
            )}
          </div>

          <div className="text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h3 className="font-bold text-white text-base">{currentUser.name}</h3>
              <span className="text-xs font-mono text-pink-400">{currentUser.handle}</span>
            </div>
            <p className="text-xs text-slate-300 line-clamp-2">
              {currentUser.bio || 'Your public atmosphere description and poetic profile'}
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> End-to-End Synced
              </span>
              {selectedImageUrl !== currentUser.avatar && (
                <button
                  type="button"
                  onClick={() => setSelectedImageUrl(currentUser.avatar)}
                  className="text-[11px] text-slate-400 hover:text-pink-300 underline underline-offset-2 ml-2 cursor-pointer"
                >
                  Reset to original
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Source Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900/90 border border-pink-500/20 mb-4 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveSourceTab('upload');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
              activeSourceTab === 'upload'
                ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveSourceTab('gallery');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
              activeSourceTab === 'gallery'
                ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <FolderHeart className="w-3.5 h-3.5" />
            <span>My Gallery ({userPhotos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSourceTab('camera');
              startCamera();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
              activeSourceTab === 'camera'
                ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveSourceTab('url');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
              activeSourceTab === 'url'
                ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Image Link</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveSourceTab('presets');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
              activeSourceTab === 'presets'
                ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Presets</span>
          </button>
        </div>

        {/* Tab 1: File Upload & Drag-and-Drop */}
        {activeSourceTab === 'upload' && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                isDragging
                  ? 'border-pink-400 bg-pink-950/40 shadow-[0_0_25px_rgba(236,72,153,0.3)]'
                  : 'border-pink-500/30 hover:border-pink-500/70 bg-neutral-900/60 hover:bg-neutral-900/90'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="p-3.5 rounded-2xl bg-pink-950/80 border border-pink-500/40 text-pink-400 mb-3 shadow-[0_0_15px_rgba(236,72,153,0.25)]">
                <Upload className="w-6 h-6 animate-bounce" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">
                Drag and drop your new profile picture here
              </p>
              <p className="text-xs text-slate-400 mb-3">
                Supports JPG, PNG, WebP, GIF (Square aspect ratio recommended)
              </p>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all cursor-pointer"
              >
                Browse Device Files
              </button>
            </div>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 p-2 rounded-xl bg-neutral-900/70 border border-pink-500/20 cursor-pointer">
              <input
                type="checkbox"
                checked={saveToGalleryArchive}
                onChange={(e) => setSaveToGalleryArchive(e.target.checked)}
                className="rounded border-pink-500/40 text-pink-600 focus:ring-pink-500"
              />
              <span>Also save this upload to my gallery captures archive</span>
            </label>
          </div>
        )}

        {/* Tab 2: Choose from My Gallery */}
        {activeSourceTab === 'gallery' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Select one of your existing captures to make it your active avatar:
            </p>
            {userPhotos.length === 0 ? (
              <div className="p-8 text-center bg-neutral-900/60 rounded-2xl border border-pink-500/20">
                <ImageIcon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No photos uploaded to your gallery yet.</p>
                <button
                  type="button"
                  onClick={() => setActiveSourceTab('upload')}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-pink-600 text-white text-xs font-semibold"
                >
                  Upload Your First Photo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1">
                {userPhotos.map((photo) => {
                  const isSelected = selectedImageUrl === photo.url;
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setSelectedImageUrl(photo.url)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-pink-400 ring-2 ring-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.5)] scale-[1.02]'
                          : 'border-pink-500/20 hover:border-pink-500/60 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || 'Gallery photo'}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-pink-600/30 flex items-center justify-center">
                          <span className="p-1 rounded-full bg-pink-600 text-white shadow-md">
                            <Check className="w-4 h-4" />
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Camera Live Capture */}
        {activeSourceTab === 'camera' && (
          <div className="space-y-4">
            <div className="relative aspect-video sm:aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden bg-black border border-pink-500/40 shadow-[0_0_20px_rgba(236,72,153,0.2)]">
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-400 space-y-3">
                  <Camera className="w-10 h-10 text-pink-400" />
                  <p className="text-xs">Camera stream ready</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold"
                  >
                    Start Web Camera
                  </button>
                </div>
              )}
            </div>

            {cameraActive && (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={captureSnapshot}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(236,72,153,0.5)] flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Snapshot</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2.5 rounded-xl bg-neutral-900 text-slate-300 hover:text-white border border-pink-500/20 text-xs font-semibold"
                >
                  Cancel Camera
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Direct URL */}
        {activeSourceTab === 'url' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-pink-400 mb-1.5">
                Paste Image Web Address (URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 bg-black/80 border border-pink-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (urlInput.trim()) {
                      setSelectedImageUrl(urlInput.trim());
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(236,72,153,0.4)]"
                >
                  Load
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tip: You can use any high-resolution public photo link from Unsplash, Imgur, or your personal cloud storage.
            </p>
          </div>
        )}

        {/* Tab 5: Aesthetic Presets */}
        {activeSourceTab === 'presets' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Choose from curated cyber-noir & artistic visual identities:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = selectedImageUrl === preset.url;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setSelectedImageUrl(preset.url)}
                    className={`p-2 rounded-2xl bg-neutral-900/80 border text-left transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-pink-400 ring-2 ring-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                        : 'border-pink-500/20 hover:border-pink-500/50'
                    }`}
                  >
                    <div className="aspect-square rounded-xl overflow-hidden mb-2 bg-neutral-950">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="text-[11px] font-semibold text-slate-200 line-clamp-1 group-hover:text-pink-300">
                      {preset.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-5 mt-5 border-t border-pink-500/20">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-slate-300 text-xs font-semibold border border-pink-500/20"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAvatar}
            disabled={isSaving || !selectedImageUrl}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-pink-500 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(236,72,153,0.5)] flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all hover:scale-[1.02]"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Applying Avatar...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Set as Profile Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
