import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  FileText,
  Upload,
  Image as ImageIcon,
  Check,
  Wand2,
  Loader2,
  Send,
  X,
  MapPin,
  FileUp,
  BookOpen,
  Clock,
  Award,
  Link as LinkIcon,
  BarChart2,
  PlusCircle,
  Smile,
  Music,
  Play,
  Pause,
  ExternalLink,
  Disc,
  Headphones,
  Flame,
  Rocket,
  Layers,
  Activity,
  Zap,
  Moon,
  ShieldAlert,
  AudioWaveform,
  Trash2,
  Scan,
  Hash,
  Feather,
  ChevronDown,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import { PDFDocument, Poll, Post, PostFirePowerUps, PostMood, PostSong, PostVoiceNote, ReadingLink, User } from '../types';
import { getAutomaticCityForPost, findNearestCityRegion } from '../utils/cityRegions';
import { estimateReadingFromUrl, extractUrlsFromText } from '../utils/readingEstimator';
import { scanPostContentForTags } from '../utils/contentTagScanner';
import { ReadingLinkCard } from './ReadingLinkCard';
import { MOOD_PRESETS, QUICK_EMOJIS } from '../utils/moods';
import { musicAudioEngine } from '../utils/musicAudioEngine';
import { PostPowerUpsMenu, PowerUpsDraftState } from './PostPowerUpsMenu';
import { VoicePostRecordingWaveform } from './VoicePostRecordingWaveform';
import { VoicePostWaveformPlayer } from './VoicePostWaveformPlayer';

const parseMusicLinkInfo = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) return null;

  let platform = 'Music Stream';
  let suggestedTitle = '';
  let suggestedArtist = '';
  let defaultCover = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400';
  let defaultPreset: PostSong['synthPreset'] = 'ambient_calm';
  let defaultGenre = 'Ambient';

  try {
    const rawUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname;

    if (host.includes('spotify.com')) {
      platform = 'Spotify';
      defaultCover = 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&q=80&w=400';
      defaultPreset = 'lofi_tape';
      defaultGenre = 'Lo-Fi';
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        suggestedTitle = decodeURIComponent(parts[1]).replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        suggestedArtist = 'Spotify Artist';
      }
    } else if (host.includes('soundcloud.com')) {
      platform = 'SoundCloud';
      defaultCover = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400';
      defaultPreset = 'deep_drone';
      defaultGenre = 'Electronic';
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        suggestedArtist = decodeURIComponent(parts[0]).replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        suggestedTitle = decodeURIComponent(parts[1]).replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      } else if (parts.length === 1) {
        suggestedArtist = decodeURIComponent(parts[0]).replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      }
    } else if (host.includes('youtube.com') || host.includes('youtu.be')) {
      platform = host.includes('music.youtube.com') ? 'YouTube Music' : 'YouTube';
      defaultCover = 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=400';
      defaultPreset = 'night_jazz';
      defaultGenre = 'Synthwave';
      suggestedTitle = 'YouTube Music Stream';
      suggestedArtist = 'Featured Artist';
    } else if (host.includes('apple.com')) {
      platform = 'Apple Music';
      defaultCover = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400';
      defaultPreset = 'acoustic_strings';
      defaultGenre = 'Neo-Classical';
      suggestedTitle = 'Apple Music Stream';
      suggestedArtist = 'Apple Music Artist';
    } else if (host.includes('bandcamp.com')) {
      platform = 'Bandcamp';
      defaultCover = 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=400';
      defaultPreset = 'acoustic_strings';
      defaultGenre = 'Indie / Acoustic';
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && parts[0] === 'track') {
        suggestedTitle = decodeURIComponent(parts[1]).replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      }
      suggestedArtist = host.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    } else if (host.includes('audius.co')) {
      platform = 'Audius';
      defaultCover = 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=400';
      defaultPreset = 'lofi_tape';
      defaultGenre = 'Cyberpunk';
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        suggestedArtist = decodeURIComponent(parts[0]).replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        suggestedTitle = decodeURIComponent(parts[1]).replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      }
    } else if (trimmed.match(/\.(mp3|wav|ogg|m4a|aac)($|\?)/i)) {
      platform = 'Direct Audio';
      defaultPreset = 'ambient_calm';
      defaultGenre = 'Audio Stream';
      const filename = pathname.split('/').pop() || 'Audio Track';
      suggestedTitle = decodeURIComponent(filename).replace(/\.(mp3|wav|ogg|m4a|aac)($|\?)/i, '').replace(/[-_]/g, ' ');
      suggestedArtist = 'Web Audio Stream';
    }
  } catch {
    // Non-fatal parse error
  }

  return {
    platform,
    suggestedTitle,
    suggestedArtist,
    defaultCover,
    defaultPreset,
    defaultGenre,
  };
};

interface FeedNewPostComposerProps {
  currentUser: User;
  allUsers?: User[];
  onSubmitPost: (newPost: Post) => void;
  defaultHashtag?: string;
  onOpenEstimator?: (tag?: string) => void;
  onCityClick?: (city: string) => void;
  isMusicMode?: boolean;
  onToggleMusicMode?: () => void;
  musicPostsCount?: number;
  feedFilterMode?: string;
  onSelectFeedFilterMode?: (mode: 'all' | 'poetry' | 'literature' | 'music' | string) => void;
  poetryPostsCount?: number;
  literaturePostsCount?: number;
  onClaimFreeSparks?: () => void;
  isAdultSwimMode?: boolean;
}

export const FeedNewPostComposer: React.FC<FeedNewPostComposerProps> = ({
  currentUser,
  allUsers,
  onSubmitPost,
  defaultHashtag,
  onOpenEstimator,
  onCityClick,
  isMusicMode = false,
  onToggleMusicMode,
  musicPostsCount = 0,
  feedFilterMode = 'all',
  onSelectFeedFilterMode,
  poetryPostsCount = 0,
  literaturePostsCount = 0,
  onClaimFreeSparks,
  isAdultSwimMode = false,
}) => {
  const [content, setContent] = useState('');
  const [isPoetry, setIsPoetry] = useState(false);
  const [isAdultSwimPost, setIsAdultSwimPost] = useState<boolean>(isAdultSwimMode);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const modeDropdownRef = useRef<HTMLDivElement>(null);

  // Close mode dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(e.target as Node)) {
        setShowModeDropdown(false);
      }
    };
    if (showModeDropdown) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showModeDropdown]);
  const [hashtagsInput, setHashtagsInput] = useState(
    defaultHashtag ? (defaultHashtag.startsWith('#') ? defaultHashtag : `#${defaultHashtag}`) : isAdultSwimMode ? '#AdultSwim #AfterHours' : '#Poetry #Encrypted'
  );
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [liveGpsCity, setLiveGpsCity] = useState<string | null>(null);
  const [attachedSong, setAttachedSong] = useState<PostSong | null>(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [previewPlayingSongId, setPreviewPlayingSongId] = useState<string | null>(null);
  const [musicLinkUrl, setMusicLinkUrl] = useState('');
  const [musicTrackTitle, setMusicTrackTitle] = useState('');
  const [musicTrackArtist, setMusicTrackArtist] = useState('');
  const [musicGenre, setMusicGenre] = useState('Lo-Fi');
  const [musicSynthPreset, setMusicSynthPreset] = useState<PostSong['synthPreset']>('lofi_tape');
  const [musicLinkError, setMusicLinkError] = useState<string | null>(null);

  // Voice Post Waveform State
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const isVoiceRecordingRef = useRef(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const voiceSecondsRef = useRef(0);
  const [liveVoiceTranscript, setLiveVoiceTranscript] = useState('');
  const [recordedVoiceNote, setRecordedVoiceNote] = useState<PostVoiceNote | null>(null);
  const preRecordingContentRef = useRef<string>('');
  const speechRecognitionRef = useRef<any>(null);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    voiceSecondsRef.current = voiceSeconds;
  }, [voiceSeconds]);

  useEffect(() => {
    if (isVoiceRecording) {
      voiceTimerRef.current = setInterval(() => {
        setVoiceSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      setVoiceSeconds(0);
    }
    return () => {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    };
  }, [isVoiceRecording]);

  const handleStopVoicePost = () => {
    isVoiceRecordingRef.current = false;
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsVoiceRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    } else {
      const durationSecs = Math.max(voiceSecondsRef.current, 5);
      const peaks = Array.from({ length: 44 }, () =>
        Math.max(0.12, Math.min(0.96, Number((0.2 + Math.random() * 0.72).toFixed(2))))
      );
      setRecordedVoiceNote({
        id: 'voice_' + Date.now(),
        durationSeconds: durationSecs,
        durationFormatted: `${Math.floor(durationSecs / 60)}:${String(durationSecs % 60).padStart(2, '0')}`,
        waveformPeaks: peaks,
        transcript: liveVoiceTranscript || content,
        recordedAt: 'Just now',
      });
    }

    setHashtagsInput((prev) => {
      if (!prev.toLowerCase().includes('voicepost') && !prev.toLowerCase().includes('spokenword')) {
        return `${prev.trim()} #VoicePost`.trim();
      }
      return prev;
    });
  };

  const handleCancelVoicePost = () => {
    isVoiceRecordingRef.current = false;
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.abort();
      } catch {
        // ignore
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {
        // ignore
      }
      mediaStreamRef.current = null;
    }
    setIsVoiceRecording(false);
    setRecordedVoiceNote(null);
    setContent(preRecordingContentRef.current);
    setLiveVoiceTranscript('');
  };

  const handleToggleVoicePost = () => {
    if (isVoiceRecording) {
      handleStopVoicePost();
      return;
    }

    // Always unconditionally activate voice recording mode
    isVoiceRecordingRef.current = true;
    preRecordingContentRef.current = content;
    setLiveVoiceTranscript('');
    setIsVoiceRecording(true);
    setIsExpanded(true);

    // Capture microphone audio via MediaRecorder if supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        mediaStreamRef.current = stream;
        try {
          const recorder = new MediaRecorder(stream);
          audioChunksRef.current = [];
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };
          recorder.onstop = () => {
            if (audioChunksRef.current.length > 0) {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              const audioUrl = URL.createObjectURL(audioBlob);
              const durationSecs = Math.max(voiceSecondsRef.current, 5);
              const peaks = Array.from({ length: 44 }, () =>
                Math.max(0.12, Math.min(0.96, Number((0.2 + Math.random() * 0.72).toFixed(2))))
              );
              setRecordedVoiceNote({
                id: 'voice_' + Date.now(),
                audioUrl,
                durationSeconds: durationSecs,
                durationFormatted: `${Math.floor(durationSecs / 60)}:${String(durationSecs % 60).padStart(2, '0')}`,
                waveformPeaks: peaks,
                transcript: liveVoiceTranscript || content,
                recordedAt: 'Just now',
              });
            }
            if (mediaStreamRef.current) {
              mediaStreamRef.current.getTracks().forEach((track) => track.stop());
              mediaStreamRef.current = null;
            }
          };
          recorder.start();
          mediaRecorderRef.current = recorder;
        } catch (err) {
          console.warn('MediaRecorder error notice:', err);
        }
      }).catch((err) => {
        console.warn('Microphone stream access notice:', err);
      });
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Speech recognition API not supported in current environment; visual waveform remains fully active
      console.info('SpeechRecognition not supported in browser environment, visual recording active');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setLiveVoiceTranscript(transcript);
          setContent(() => {
            const base = preRecordingContentRef.current.trim();
            return base ? `${base} ${transcript}` : transcript;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Voice post speech recognition notice:', event.error);
        // Do NOT abort recording mode! Allow visual waveform and microphone stream to continue
      };

      recognition.onend = () => {
        if (isVoiceRecordingRef.current) {
          try {
            recognition.start();
          } catch {
            // ignore
          }
        }
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('SpeechRecognition could not start:', err);
      // Keep isVoiceRecording true so waveform remains visible and recording
    }
  };

  useEffect(() => {
    return () => {
      isVoiceRecordingRef.current = false;
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const detectedMusicInfo = React.useMemo(() => {
    return parseMusicLinkInfo(musicLinkUrl);
  }, [musicLinkUrl]);

  const handleAttachMusicLink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = musicLinkUrl.trim();
    if (!trimmed) {
      setMusicLinkError('Please paste or type a valid music link (e.g. Spotify, SoundCloud, YouTube, Bandcamp, or audio URL).');
      return;
    }

    const info = parseMusicLinkInfo(trimmed);
    const finalTitle = musicTrackTitle.trim() || info?.suggestedTitle || 'Music Stream Track';
    const finalArtist =
      musicTrackArtist.trim() ||
      info?.suggestedArtist ||
      (info?.platform ? `${info.platform} Creator` : 'Artist');

    const newSong: PostSong = {
      id: 'song_' + Date.now(),
      title: finalTitle,
      artist: finalArtist,
      album: info?.platform || 'Music Link',
      duration: 'Stream',
      genre: musicGenre || info?.defaultGenre || 'Ambient',
      audioUrl: trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`,
      coverArt: info?.defaultCover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
      synthPreset: musicSynthPreset || info?.defaultPreset || 'ambient_calm',
    };

    setAttachedSong(newSong);
    setMusicLinkError(null);
    setShowMusicPicker(false);
  };

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
          // Permission denied or unavailable - silently fallback to user city
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    }
  }, []);

  // Synchronize Adult Swim mode when switching feed views
  useEffect(() => {
    if (isAdultSwimMode) {
      setIsAdultSwimPost(true);
      setHashtagsInput((prev) => {
        if (!prev.toLowerCase().includes('adultswim')) {
          return `${prev.trim()} #AdultSwim`.trim();
        }
        return prev;
      });
    }
  }, [isAdultSwimMode]);

  // Derive automatic location tag in real-time
  const currentTagsList = hashtagsInput
    .split(/[\s,]+/)
    .map((t) => t.trim().replace(/^#+/, ''))
    .filter(Boolean);
  const autoLocation = getAutomaticCityForPost(
    { hashtags: currentTagsList, content },
    liveGpsCity || currentUser.city
  );

  // Reading Link Attachment States (supports up to 3 links)
  const MAX_LINKS = 3;
  const [readingLinks, setReadingLinks] = useState<ReadingLink[]>([]);
  const [showReadingInput, setShowReadingInput] = useState(false);
  const [readingUrlInput, setReadingUrlInput] = useState('');
  const [isEstimatingLink, setIsEstimatingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const lastProcessedUrlRef = useRef<string>('');

  // Automatic Content Scanning & Tag Creation States
  const [isScanningContent, setIsScanningContent] = useState(false);
  const [autoScannedTags, setAutoScannedTags] = useState<string[]>([]);
  const [scanSummary, setScanSummary] = useState<string | null>(null);
  const [autoTagEnabled, setAutoTagEnabled] = useState<boolean>(true);
  const debounceScanTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mood Attachment States
  const [selectedMood, setSelectedMood] = useState<PostMood | null>(null);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [customMoodEmoji, setCustomMoodEmoji] = useState('✨');
  const [customMoodLabel, setCustomMoodLabel] = useState('');

  // Poll Attachment States
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollError, setPollError] = useState<string | null>(null);

  // Power-Ups Menu & Pre-Ignition Draft State
  const [showPowerUpsMenu, setShowPowerUpsMenu] = useState(false);
  const [selectedPowerUpGroupTag, setSelectedPowerUpGroupTag] = useState<string>(() => {
    if (defaultHashtag) return defaultHashtag.replace(/^#+/, '');
    const userGroups = currentUser.groupPoints || {};
    const topGroup = Object.entries(userGroups).sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0))[0]?.[0];
    return topGroup || 'Poetry';
  });
  const [powerUpsDraft, setPowerUpsDraft] = useState<PowerUpsDraftState>({
    boost: { active: false, score: 100, cost: 50 },
    glow: { active: false, style: 'flame', cost: 40 },
    multiplier: { active: false, factor: 3, cycles: 3, cost: 60 },
    viral: { active: false, cost: 75 },
  });

  const activePowerUpsCount = [
    powerUpsDraft.boost.active,
    powerUpsDraft.glow.active,
    powerUpsDraft.multiplier.active,
    powerUpsDraft.viral.active,
  ].filter(Boolean).length;

  const totalCostArmed =
    (powerUpsDraft.boost.active ? powerUpsDraft.boost.cost : 0) +
    (powerUpsDraft.glow.active ? powerUpsDraft.glow.cost : 0) +
    (powerUpsDraft.multiplier.active ? powerUpsDraft.multiplier.cost : 0) +
    (powerUpsDraft.viral.active ? powerUpsDraft.viral.cost : 0);

  const handleAddPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions((prev) => [...prev, '']);
      setPollError(null);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions((prev) => prev.filter((_, i) => i !== index));
      setPollError(null);
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    setPollOptions((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
    setPollError(null);
  };

  const handleResetPoll = () => {
    setShowPollCreator(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollError(null);
  };

  // Helper to automatically estimate link reading time & points without requiring a button click
  const autoEstimateAndAddLink = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;

    // Check if already in list
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

      // First try server API endpoint
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
      setIsExpanded(true);
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
      setIsExpanded(true);
    } finally {
      setIsEstimatingLink(false);
    }
  };

  const handleRemoveLink = (indexToRemove: number) => {
    setReadingLinks((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setLinkError(null);
  };

  // Automatic Link Detection as user types or pastes in the main text area
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

  // Automatic Link Estimation when typing/pasting into the link input
  useEffect(() => {
    if (!readingUrlInput.trim()) return;

    const timer = setTimeout(() => {
      if (
        readingUrlInput.startsWith('http://') ||
        readingUrlInput.startsWith('https://') ||
        readingUrlInput.includes('.')
      ) {
        if (readingLinks.length < MAX_LINKS) {
          autoEstimateAndAddLink(readingUrlInput.trim());
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [readingUrlInput, readingLinks.length]);

  // Automatic Post Content Scanning & Tag Creation in Real Time
  useEffect(() => {
    const textToScan = content.trim();
    if (!textToScan && !pdfDoc && !recordedVoiceNote && !attachedSong) {
      return;
    }

    if (debounceScanTimerRef.current) {
      clearTimeout(debounceScanTimerRef.current);
    }

    setIsScanningContent(true);

    debounceScanTimerRef.current = setTimeout(async () => {
      const city = liveGpsCity || findNearestCityRegion(currentUser.coordinates)?.name;
      const scanResult = scanPostContentForTags({
        content: textToScan,
        isPoetry,
        isVoicePost: !!recordedVoiceNote || isVoiceRecording,
        isAdult: isAdultSwimPost,
        hasDocument: !!pdfDoc,
        documentTitle: pdfDoc?.title,
        documentExcerpt: pdfDoc?.excerptText,
        hasSong: !!attachedSong,
        songGenre: attachedSong?.genre,
        city,
        moodLabel: selectedMood?.label,
      });

      setAutoScannedTags(scanResult.tags);
      setScanSummary(scanResult.reasoning);

      // If autoTagEnabled is true, automatically append created tags to hashtagsInput
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
      if (debounceScanTimerRef.current) {
        clearTimeout(debounceScanTimerRef.current);
      }
    };
  }, [
    content,
    isPoetry,
    isVoiceRecording,
    recordedVoiceNote,
    pdfDoc,
    attachedSong,
    selectedMood,
    liveGpsCity,
    isAdultSwimPost,
    autoTagEnabled,
  ]);

  // Manual Trigger: Scan Content & Create Tags immediately
  const handleTriggerAutoScan = async () => {
    if (!content.trim() && !pdfDoc && !recordedVoiceNote) return;

    setIsScanningContent(true);
    const city = liveGpsCity || findNearestCityRegion(currentUser.coordinates)?.name;
    const scanResult = scanPostContentForTags({
      content,
      isPoetry,
      isVoicePost: !!recordedVoiceNote || isVoiceRecording,
      isAdult: isAdultSwimPost,
      hasDocument: !!pdfDoc,
      documentTitle: pdfDoc?.title,
      documentExcerpt: pdfDoc?.excerptText,
      hasSong: !!attachedSong,
      songGenre: attachedSong?.genre,
      city,
      moodLabel: selectedMood?.label,
    });

    setAutoScannedTags(scanResult.tags);
    setScanSummary(scanResult.reasoning);

    // Apply scanned tags to input
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
          if (data.reasoning) {
            setScanSummary(data.reasoning);
          }
        }
      }
    } catch {
      // Local scan already succeeded
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
      setIsExpanded(true);
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Poll validation & construction
    let attachedPoll: Poll | undefined = undefined;
    if (showPollCreator) {
      const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        setPollError('Please provide at least 2 non-empty poll options.');
        return;
      }
      attachedPoll = {
        id: `poll_${Date.now()}`,
        question: pollQuestion.trim() || 'Community Poll',
        options: validOptions.map((optText, idx) => ({
          id: `opt_${Date.now()}_${idx}`,
          text: optText,
          votes: 0,
          votedUserIds: [],
        })),
        totalVotes: 0,
      };
    }

    if (!content.trim() && !pdfDoc && readingLinks.length === 0 && !attachedPoll) return;

    // Extract single-word hashtags
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

    // Automatically determine geographic city and coordinates
    const finalLocation = getAutomaticCityForPost(
      { hashtags: tagsFromInput, content: content.trim() },
      liveGpsCity || currentUser.city
    );

    // If power-ups are armed, attach the funding group hashtag to the post
    if (activePowerUpsCount > 0 && selectedPowerUpGroupTag) {
      const groupHash = `#${selectedPowerUpGroupTag.replace(/^#+/, '')}`;
      if (!tagsFromInput.some((t) => t.toLowerCase() === groupHash.toLowerCase())) {
        tagsFromInput.push(groupHash);
      }
    }

    // If marked as Adult Swim post or currently in Adult Swim mode, attach #AdultSwim
    const isAdultContent = isAdultSwimPost || isAdultSwimMode;
    if (isAdultContent) {
      if (!tagsFromInput.some((t) => t.toLowerCase() === '#adultswim')) {
        tagsFromInput.push('#AdultSwim');
      }
    }

    // Build firePowerUps if armed by post creator
    let constructedPowerUps: PostFirePowerUps | undefined = undefined;
    if (activePowerUpsCount > 0) {
      const nowStr = new Date().toISOString();
      constructedPowerUps = {
        sourceGroupTag: selectedPowerUpGroupTag,
      };

      if (powerUpsDraft.boost.active) {
        constructedPowerUps.boost = {
          active: true,
          pointsSpent: powerUpsDraft.boost.cost,
          boostScore: powerUpsDraft.boost.score,
          activatedAt: nowStr,
        };
      }

      if (powerUpsDraft.glow.active) {
        constructedPowerUps.glow = {
          active: true,
          pointsSpent: powerUpsDraft.glow.cost,
          glowStyle: powerUpsDraft.glow.style,
          activatedAt: nowStr,
        };
      }

      if (powerUpsDraft.multiplier.active) {
        constructedPowerUps.multiplier = {
          active: true,
          multiplierFactor: powerUpsDraft.multiplier.factor,
          cyclesRemaining: powerUpsDraft.multiplier.cycles,
          totalCycles: powerUpsDraft.multiplier.cycles,
          pointsSpent: powerUpsDraft.multiplier.cost,
          activatedAt: nowStr,
        };
      }

      if (powerUpsDraft.viral.active) {
        const friends = currentUser.friends || [];
        const initialKnown = (allUsers || []).filter((u) => friends.includes(u.id));
        constructedPowerUps.viral = {
          active: true,
          pointsSpent: powerUpsDraft.viral.cost,
          infectedProfileIds: initialKnown.map((u) => u.id),
          infectedProfileNames: initialKnown.map((u) => u.handle || u.name),
          fadeAwayRemainingViews: 50,
          totalInfections: initialKnown.length,
          activatedAt: nowStr,
          fadedAway: false,
          contagionEvents: [
            {
              id: 'inf_init_' + Date.now(),
              timestamp: 'Just now',
              viewerId: currentUser.id,
              viewerName: currentUser.name,
              viewerHandle: currentUser.handle,
              viewerAvatar: currentUser.avatar,
              infectedUserIds: initialKnown.map((u) => u.id),
              infectedUserNames: initialKnown.map((u) => u.handle || u.name),
              newInfectionsCount: initialKnown.length,
              totalInfectionsAfter: initialKnown.length,
              bountyPointsEarned: initialKnown.length * 25,
              lifespanRemainingAfter: 50,
              notes: 'Initial contagion outbreak ignited by post creator',
            },
          ],
        };
      }
    }

    const isVoicePostTagged = tagsFromInput.some(
      (t) => t.toLowerCase() === '#voicepost' || t.toLowerCase() === '#spokenword' || t.toLowerCase() === '#audioverse'
    );

    const finalVoiceNote: PostVoiceNote | undefined = recordedVoiceNote
      ? { ...recordedVoiceNote, transcript: content.trim() || recordedVoiceNote.transcript }
      : isVoicePostTagged
      ? {
          id: 'voice_' + Date.now(),
          durationSeconds: Math.max(6, Math.min(60, Math.round(content.trim().split(/\s+/).length / 2.2) || 12)),
          durationFormatted: '0:15',
          transcript: content.trim(),
          recordedAt: 'Just now',
        }
      : undefined;

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
      poll: attachedPoll,
      mood: selectedMood || undefined,
      song: attachedSong || undefined,
      voiceNote: finalVoiceNote,
      isVoicePost: !!finalVoiceNote || isVoicePostTagged,
      firePowerUps: constructedPowerUps,
      isAdult: isAdultContent || undefined,
      likesCount: 1,
      dislikesCount: 0,
      commentsCount: 0,
      userReaction: 'like',
      likedBy: [currentUser.id],
      dislikedBy: [],
      comments: [],
    };

    onSubmitPost(createdPost);

    // Reset Form
    setContent('');
    setRecordedVoiceNote(null);
    setImageUrl('');
    setShowImageInput(false);
    setPdfDoc(null);
    setReadingLinks([]);
    setShowReadingInput(false);
    setReadingUrlInput('');
    setLinkError(null);
    setAutoScannedTags([]);
    setScanSummary(null);
    setSelectedMood(null);
    setShowMoodSelector(false);
    setCustomMoodLabel('');
    setAttachedSong(null);
    setMusicLinkUrl('');
    setMusicTrackTitle('');
    setMusicTrackArtist('');
    setMusicLinkError(null);
    setShowMusicPicker(false);
    setPowerUpsDraft({
      boost: { active: false, score: 100, cost: 50 },
      glow: { active: false, style: 'flame', cost: 40 },
      multiplier: { active: false, factor: 3, cycles: 3, cost: 60 },
      viral: { active: false, cost: 75 },
    });
    setShowPowerUpsMenu(false);
    if (previewPlayingSongId) {
      musicAudioEngine.stop();
      setPreviewPlayingSongId(null);
    }
    handleResetPoll();
    setIsExpanded(false);
  };

  return (
    <div className="relative group">
      {/* Background ambient glow */}
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-pink-400/20 via-pink-300/25 to-pink-500/20 blur-md opacity-50 group-hover:opacity-75 transition-all duration-300 pointer-events-none" />

      <div className="relative bg-black/85 backdrop-blur-xl border border-pink-500/50 hover:border-pink-400 rounded-2xl p-4 sm:p-5 shadow-[0_0_20px_rgba(244,114,182,0.25),0_8px_25px_rgba(0,0,0,0.8)] transition-all duration-300">
        
        {/* Top Header / Author Row */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-pink-500/60 shadow-[0_0_8px_rgba(244,114,182,0.3)]"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-sm">{currentUser.name}</h3>
                <span className="text-[10px] text-pink-400 font-mono bg-pink-950/60 px-2 py-0.5 rounded-full border border-pink-500/30">
                  {currentUser.handle}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Share your stanza, thoughts, or manuscript directly to the feed</p>
            </div>
          </div>

          {/* Header Action Badges */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-start gap-2 flex-wrap justify-end">
              {/* Attached Mood Indicator Badge if selected */}
              {selectedMood && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMoodSelector(!showMoodSelector);
                    setIsExpanded(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-900 border border-neutral-800 text-slate-200 hover:border-neutral-700 transition-colors cursor-pointer"
                  title="Click to edit or change mood"
                >
                  <span className="text-sm leading-none">{selectedMood.emoji}</span>
                  <span className="text-slate-200 font-medium">Mood: {selectedMood.label}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMood(null);
                    }}
                    className="p-0.5 hover:text-rose-400 rounded transition-colors ml-0.5"
                    title="Remove mood"
                  >
                    <X className="w-3 h-3" />
                  </span>
                </button>
              )}

              {/* Poetry, Literature & Music Mode Dropdown Button */}
              <div className="relative" ref={modeDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowModeDropdown(!showModeDropdown)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                    feedFilterMode === 'poetry'
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-400/80 shadow-[0_0_12px_rgba(236,72,153,0.5)] ring-1 ring-pink-400/40'
                      : feedFilterMode === 'literature'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.5)] ring-1 ring-amber-400/40'
                      : feedFilterMode === 'music'
                      ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white border-sky-400/80 shadow-[0_0_12px_rgba(56,189,248,0.5)] ring-1 ring-sky-400/40'
                      : 'bg-neutral-900/90 hover:bg-neutral-800/90 text-pink-300 hover:text-white border-pink-500/30 hover:border-pink-400 shadow-sm'
                  }`}
                  title="Choose feed mode: Poetry Mode (only poetry), Literature Mode (only PDFs, manuscripts, books, and long articles), Music Mode (only tracks), or All Feed"
                >
                    {feedFilterMode === 'poetry' ? (
                      <>
                        <Feather className="w-3.5 h-3.5 text-pink-200 animate-pulse" />
                        <span>Poetry Mode Active</span>
                        {poetryPostsCount > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 text-white border border-white/40">
                            {poetryPostsCount}
                          </span>
                        )}
                      </>
                    ) : feedFilterMode === 'literature' ? (
                      <>
                        <BookOpen className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                        <span>Literature Mode Active</span>
                        {literaturePostsCount > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 text-white border border-white/40">
                            {literaturePostsCount}
                          </span>
                        )}
                      </>
                    ) : feedFilterMode === 'music' ? (
                      <>
                        <Music className="w-3.5 h-3.5 text-sky-200 animate-pulse" />
                        <span>Music Mode Active</span>
                        {musicPostsCount > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 text-white border border-white/40">
                            {musicPostsCount}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <SlidersHorizontal className="w-3.5 h-3.5 text-pink-400" />
                        <span>Feed Modes</span>
                      </>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showModeDropdown ? 'rotate-180 text-white' : 'text-slate-400'}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showModeDropdown && (
                    <div className="absolute right-0 top-full mt-1.5 z-50 w-72 bg-neutral-950/95 backdrop-blur-xl border border-pink-500/40 rounded-2xl shadow-[0_12px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(236,72,153,0.25)] p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-pink-500/20 flex items-center justify-between">
                        <span>Feed Modes</span>
                        <span className="text-pink-400">Stream Filter</span>
                      </div>

                      {/* Poetry Mode */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectFeedFilterMode?.(feedFilterMode === 'poetry' ? 'all' : 'poetry');
                          setShowModeDropdown(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl transition-all text-left cursor-pointer ${
                          feedFilterMode === 'poetry'
                            ? 'bg-pink-950/80 border border-pink-400/80 text-white shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                            : 'hover:bg-neutral-900/80 text-slate-200 border border-transparent'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-400/40 flex items-center justify-center shrink-0 mt-0.5 text-pink-300">
                          <Feather className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-pink-200">Poetry Mode</span>
                            {poetryPostsCount > 0 && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-pink-950 text-pink-300 border border-pink-500/30">
                                {poetryPostsCount} poems
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                            Shows only poetry, stanzas, verses, and poems in the feed.
                          </p>
                        </div>
                        {feedFilterMode === 'poetry' && (
                          <Check className="w-4 h-4 text-pink-400 shrink-0 self-center" />
                        )}
                      </button>

                      {/* Literature Mode */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectFeedFilterMode?.(feedFilterMode === 'literature' ? 'all' : 'literature');
                          setShowModeDropdown(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl transition-all text-left cursor-pointer ${
                          feedFilterMode === 'literature'
                            ? 'bg-amber-950/80 border border-amber-400/80 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                            : 'hover:bg-neutral-900/80 text-slate-200 border border-transparent'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 mt-0.5 text-amber-300">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-200">Literature Mode</span>
                            {literaturePostsCount > 0 && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 border border-amber-500/30">
                                {literaturePostsCount} works
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                            Shows only PDF, manuscripts, books, and long articles.
                          </p>
                        </div>
                        {feedFilterMode === 'literature' && (
                          <Check className="w-4 h-4 text-amber-400 shrink-0 self-center" />
                        )}
                      </button>

                      {/* Music Mode */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectFeedFilterMode?.(feedFilterMode === 'music' ? 'all' : 'music');
                          setShowModeDropdown(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl transition-all text-left cursor-pointer ${
                          feedFilterMode === 'music'
                            ? 'bg-sky-950/80 border border-sky-400/80 text-white shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                            : 'hover:bg-neutral-900/80 text-slate-200 border border-transparent'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0 mt-0.5 text-sky-300">
                          <Music className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-sky-200">Music Mode</span>
                            {musicPostsCount > 0 && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-sky-950 text-sky-300 border border-sky-500/30">
                                {musicPostsCount} tracks
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                            Shows only music posts featuring attached songs, tapes & soundtracks.
                          </p>
                        </div>
                        {feedFilterMode === 'music' && (
                          <Check className="w-4 h-4 text-sky-400 shrink-0 self-center" />
                        )}
                      </button>

                      {/* Reset to All Posts */}
                      <div className="pt-1 border-t border-pink-500/20">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectFeedFilterMode?.('all');
                            setShowModeDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            feedFilterMode === 'all'
                              ? 'bg-neutral-800 text-white'
                              : 'text-slate-400 hover:text-white hover:bg-neutral-900'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                            <span>All Posts (Global Stream)</span>
                          </span>
                          {feedFilterMode === 'all' && (
                            <span className="text-[10px] text-pink-400 font-mono">Active</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              {/* Armed Power-Ups Header Badge */}
              {activePowerUpsCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowPowerUpsMenu(!showPowerUpsMenu);
                    setIsExpanded(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-950 to-amber-950 border border-orange-400 text-orange-200 shadow-[0_0_12px_rgba(249,115,22,0.4)] cursor-pointer hover:brightness-110 transition-all"
                  title="Click to view or edit armed power-ups"
                >
                  <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400 animate-pulse" />
                  <span>{activePowerUpsCount} Power-Up{activePowerUpsCount > 1 ? 's' : ''} Armed</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* Main Textarea Container with Bottom Right Waveform Icon */}
          <div className="relative">
            <textarea
              id="status-update-textarea"
              rows={isExpanded || isPoetry ? 4 : 2}
              onFocus={() => setIsExpanded(true)}
              placeholder={
                isVoiceRecording
                  ? '🎙️ Listening to your voice post... Speak now (audio waveform active)...'
                  : isPoetry
                  ? 'Compose your verse with rhythmic indentation...\n\nI. THE CIPHER IN THE SILK\nWhere candlelight cuts shadows through the wire...'
                  : 'What are you thinking? Write a thought, creative verse, or upload a PDF document to the global stream...'
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`w-full bg-neutral-950/90 border ${
                isVoiceRecording
                  ? 'border-pink-500 ring-2 ring-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.35)]'
                  : 'border-pink-500/30 focus:border-pink-400'
              } rounded-xl p-3.5 pb-9 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all ${
                isPoetry ? 'font-serif italic text-sm border-pink-500/60 leading-relaxed' : ''
              }`}
            />

            {/* Waveform Icon Button at the Bottom Right Corner for Voice Posts */}
            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5 z-20 pointer-events-auto">
              <button
                type="button"
                id="status-update-waveform-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToggleVoicePost();
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer select-none ${
                  isVoiceRecording
                    ? 'bg-pink-600 text-white shadow-[0_0_14px_rgba(236,72,153,0.85)] ring-2 ring-pink-400/80 animate-pulse'
                    : 'bg-neutral-900/90 hover:bg-pink-950/60 border border-pink-500/30 hover:border-pink-400 text-pink-300 hover:text-white shadow-sm active:scale-95'
                }`}
                title={isVoiceRecording ? "Recording voice post... Click to stop" : "Record voice post (Audio waveform)"}
                aria-label="Voice post waveform recorder"
              >
                {isVoiceRecording ? (
                  <>
                    <div className="flex items-center gap-0.5 h-3 px-0.5">
                      <span className="w-0.5 bg-white rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
                      <span className="w-0.5 bg-pink-200 rounded-full animate-bounce h-3.5" style={{ animationDelay: '150ms' }} />
                      <span className="w-0.5 bg-white rounded-full animate-bounce h-1.5" style={{ animationDelay: '300ms' }} />
                      <span className="w-0.5 bg-pink-100 rounded-full animate-bounce h-3" style={{ animationDelay: '450ms' }} />
                    </div>
                    <span className="text-[10px] font-bold">REC {Math.floor(voiceSeconds / 60)}:{String(voiceSeconds % 60).padStart(2, '0')}</span>
                  </>
                ) : (
                  <>
                    <AudioWaveform className="w-3.5 h-3.5 text-pink-400" />
                    <span className="text-[10px] text-pink-300/90 font-medium">Voice Post</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real-time Voice Post Recording Waveform Animation Panel */}
          <AnimatePresence>
            {isVoiceRecording && (
              <VoicePostRecordingWaveform
                isRecording={isVoiceRecording}
                recordingSeconds={voiceSeconds}
                liveTranscript={liveVoiceTranscript}
                onStopRecording={handleStopVoicePost}
                onCancelRecording={handleCancelVoicePost}
              />
            )}
          </AnimatePresence>

          {/* Recorded Voice Post Preview with Play Button and Waveform */}
          {recordedVoiceNote && !isVoiceRecording && (
            <div className="relative group/voice-preview mt-2 p-1.5 rounded-xl bg-pink-950/20 border border-pink-500/30">
              <div className="flex items-center justify-between text-[11px] font-mono text-pink-300 font-bold mb-1.5 px-1.5 pt-0.5">
                <span className="flex items-center gap-1.5">
                  <AudioWaveform className="w-3.5 h-3.5 text-pink-400" />
                  Voice Post Attachment (Play Button & Waveform Active)
                </span>
                <button
                  type="button"
                  onClick={() => setRecordedVoiceNote(null)}
                  className="text-[11px] text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Remove recorded voice note"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove Audio</span>
                </button>
              </div>
              <VoicePostWaveformPlayer
                voiceNote={recordedVoiceNote}
                postContent={content}
                authorName={currentUser.name}
                authorAvatar={currentUser.avatar}
                postId="composer_preview"
                theme="pink"
              />
            </div>
          )}

          {/* Expandable Controls */}
          {isExpanded && (
            <div className="space-y-3 pt-1 border-t border-pink-500/20">
              
              {/* Armed Power-Ups Chip Banner */}
              {activePowerUpsCount > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-gradient-to-r from-orange-950/50 via-amber-950/40 to-neutral-950 border border-orange-500/40 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-orange-300 font-bold font-mono">
                      <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400 animate-pulse" />
                      <span>Armed:</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-900/80 border border-orange-500/40 text-orange-200 font-normal">
                        Fueled by #{selectedPowerUpGroupTag} ({totalCostArmed} pts)
                      </span>
                    </div>

                    {powerUpsDraft.boost.active && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/90 border border-amber-400 text-amber-200 text-[11px] font-mono shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                        <Rocket className="w-3 h-3 text-amber-300" />
                        <span>+{powerUpsDraft.boost.score} Boost</span>
                        <button
                          type="button"
                          onClick={() => setPowerUpsDraft((p) => ({ ...p, boost: { ...p.boost, active: false } }))}
                          className="hover:text-white ml-0.5 text-amber-400 cursor-pointer font-bold"
                          title="Remove boost"
                        >
                          ×
                        </button>
                      </span>
                    )}

                    {powerUpsDraft.glow.active && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-950/90 border border-orange-400 text-orange-200 text-[11px] font-mono shadow-[0_0_8px_rgba(249,115,22,0.25)]">
                        <Sparkles className="w-3 h-3 text-orange-300" />
                        <span>{powerUpsDraft.glow.style.toUpperCase()} Glow</span>
                        <button
                          type="button"
                          onClick={() => setPowerUpsDraft((p) => ({ ...p, glow: { ...p.glow, active: false } }))}
                          className="hover:text-white ml-0.5 text-orange-400 cursor-pointer font-bold"
                          title="Remove glow"
                        >
                          ×
                        </button>
                      </span>
                    )}

                    {powerUpsDraft.multiplier.active && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-950/90 border border-purple-400 text-purple-200 text-[11px] font-mono shadow-[0_0_8px_rgba(168,85,247,0.25)]">
                        <Layers className="w-3 h-3 text-purple-300" />
                        <span>{powerUpsDraft.multiplier.factor}x Multiplier</span>
                        <button
                          type="button"
                          onClick={() => setPowerUpsDraft((p) => ({ ...p, multiplier: { ...p.multiplier, active: false } }))}
                          className="hover:text-white ml-0.5 text-purple-400 cursor-pointer font-bold"
                          title="Remove multiplier"
                        >
                          ×
                        </button>
                      </span>
                    )}

                    {powerUpsDraft.viral.active && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-950/90 border border-rose-400 text-rose-200 text-[11px] font-mono shadow-[0_0_8px_rgba(244,63,94,0.25)]">
                        <Activity className="w-3 h-3 text-rose-300" />
                        <span>Viral Outbreak</span>
                        <button
                          type="button"
                          onClick={() => setPowerUpsDraft((p) => ({ ...p, viral: { ...p.viral, active: false } }))}
                          className="hover:text-white ml-0.5 text-rose-400 cursor-pointer font-bold"
                          title="Remove viral"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPowerUpsMenu(!showPowerUpsMenu);
                      setIsExpanded(true);
                    }}
                    className="text-[11px] text-orange-300 hover:text-white underline font-semibold cursor-pointer"
                  >
                    {showPowerUpsMenu ? 'Hide Power-Ups Menu' : 'Adjust in Menu'}
                  </button>
                </div>
              )}

              {/* Hashtag input & Automatic Content Scanner */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-pink-400" />
                      <span>#Hashtags</span>
                    </span>
                    <span className="text-[10px] text-pink-400/80 font-normal flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 animate-pulse text-pink-400" />
                      <span>Auto-generated from content</span>
                    </span>
                  </div>

                  {isScanningContent && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-pink-300">
                      <Loader2 className="w-3 h-3 animate-spin text-pink-400" />
                      <span>Creating hashtags...</span>
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="#Poetry #Encrypted #Nightfall #VoicePost (type other hashtags here...)"
                  value={hashtagsInput}
                  onChange={(e) => setHashtagsInput(e.target.value)}
                  className="w-full bg-neutral-950/80 border border-pink-500/30 rounded-xl px-3 py-2 text-xs text-pink-300 font-mono focus:outline-none focus:ring-1 focus:ring-pink-400"
                />

                {/* Automatically Created Tags Chips from Content Scan */}
                {autoScannedTags.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-pink-950/40 border border-pink-500/30 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-pink-300 font-semibold flex-wrap gap-1">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-pink-400 animate-pulse" />
                        <span>Auto-Created Tags from Content:</span>
                      </span>
                      {scanSummary && (
                        <span className="text-slate-400 italic font-normal text-[10px]">
                          {scanSummary}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {autoScannedTags.map((tag) => {
                        const clean = tag.replace(/^#+/, '');
                        const isAdded = hashtagsInput.toLowerCase().includes(clean.toLowerCase());
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleSuggestedTag(clean)}
                            className={`px-2 py-0.5 rounded-full text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer ${
                              isAdded
                                ? 'bg-pink-600 text-white font-bold border border-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.4)]'
                                : 'bg-neutral-900 text-pink-300 border border-pink-500/30 hover:border-pink-400'
                            }`}
                          >
                            <span>#{clean}</span>
                            {isAdded ? <Check className="w-3 h-3" /> : <span className="text-[10px] opacity-70">+</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Image URL Input Field */}
              {showImageInput && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                    <label>Image URL (Optional):</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowImageInput(false);
                        setImageUrl('');
                      }}
                      className="text-slate-400 hover:text-slate-200 text-[10px]"
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-neutral-950/80 border border-pink-500/30 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-400"
                  />
                </div>
              )}

              {/* Optional Reading Link URL Input Field */}
              {showReadingInput && (
                <div className="space-y-2.5 p-3 rounded-xl bg-neutral-950/90 border border-pink-500/40">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                    <label className="flex items-center gap-1.5 text-pink-300">
                      <LinkIcon className="w-3.5 h-3.5 text-pink-400" />
                      <span>Attach Links ({readingLinks.length}/{MAX_LINKS}):</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReadingInput(false);
                        setReadingUrlInput('');
                        setLinkError(null);
                      }}
                      className="text-slate-400 hover:text-slate-200 text-[10px]"
                    >
                      Close
                    </button>
                  </div>

                  {readingLinks.length < MAX_LINKS ? (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 flex items-center">
                        <input
                          type="url"
                          placeholder={
                            readingLinks.length === 0
                              ? "Paste link (e.g. https://eff.org/...)"
                              : `Paste link #${readingLinks.length + 1} (up to 3 total)...`
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
                  ) : (
                    <div className="p-2 rounded-lg bg-pink-950/40 border border-pink-500/30 text-[11px] text-pink-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Check className="w-3.5 h-3.5 text-sky-400" />
                        Maximum 3 links attached to this post.
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">3 / 3</span>
                    </div>
                  )}

                  {linkError && (
                    <p className="text-[10px] text-rose-400 font-medium">{linkError}</p>
                  )}

                  <p className="text-[10px] text-slate-400">
                    ⚡ Add up to 3 links per post. Reading time, word count, and point bounty are calculated automatically for each link.
                  </p>
                </div>
              )}

              {/* Attached Reading Links Previews (Up to 3) */}
              {readingLinks.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-pink-300">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-pink-400" />
                      Attached Links ({readingLinks.length}/{MAX_LINKS})
                    </span>
                    {readingLinks.length < MAX_LINKS && !showReadingInput && (
                      <button
                        type="button"
                        onClick={() => setShowReadingInput(true)}
                        className="text-pink-400 hover:text-pink-300 text-[10px] flex items-center gap-1 font-semibold"
                      >
                        + Add Another Link ({readingLinks.length}/3)
                      </button>
                    )}
                  </div>

                  {readingLinks.map((link, idx) => (
                    <div key={link.id || link.url || idx} className="relative group/rl bg-neutral-950/60 p-2.5 rounded-xl border border-pink-500/30">
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

              {/* Uploaded PDF Attachment Card */}
              {pdfDoc && (
                <div className="p-3 rounded-xl bg-pink-950/40 border border-pink-500/40 flex items-center justify-between gap-3 shadow-[0_0_10px_rgba(236,72,153,0.2)]">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-pink-900/60 border border-pink-500/40 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-pink-300" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-100 truncate">{pdfDoc.title}</p>
                      <span className="text-[10px] text-pink-300 font-mono">{pdfDoc.fileSize} • {pdfDoc.category}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPdfDoc(null)}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-neutral-900 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Attached Music Link / Song Preview Card */}
              {attachedSong && (
                <div className="p-3 rounded-xl bg-neutral-950/95 border border-pink-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_14px_rgba(236,72,153,0.25)] animate-in fade-in duration-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-pink-500/40 shadow-sm bg-neutral-900">
                      <img
                        src={attachedSong.coverArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'}
                        alt={attachedSong.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (previewPlayingSongId === attachedSong.id) {
                            musicAudioEngine.stop();
                            setPreviewPlayingSongId(null);
                          } else {
                            musicAudioEngine.playPreset(attachedSong.synthPreset || 'ambient_calm');
                            setPreviewPlayingSongId(attachedSong.id);
                          }
                        }}
                        className="absolute inset-0 bg-black/40 hover:bg-black/65 flex items-center justify-center text-white cursor-pointer transition-colors"
                        title={previewPlayingSongId === attachedSong.id ? 'Stop audio preview' : 'Play audio preview'}
                      >
                        {previewPlayingSongId === attachedSong.id ? (
                          <Pause className="w-4 h-4 fill-current text-pink-400" />
                        ) : (
                          <Play className="w-4 h-4 fill-current text-white ml-0.5" />
                        )}
                      </button>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/40">
                          {attachedSong.album || 'Music Link'}
                        </span>
                        <span className="text-[10px] text-pink-400 font-mono px-1.5 py-0.2 rounded bg-pink-950/80 border border-pink-500/30">
                          {attachedSong.genre || 'Soundtrack'}
                        </span>
                        {previewPlayingSongId === attachedSong.id && (
                          <span className="text-[10px] font-mono text-pink-400 font-bold flex items-center gap-1">
                            <Disc className="w-3 h-3 animate-spin" />
                            <span>Previewing</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-100 truncate mt-0.5">{attachedSong.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{attachedSong.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {attachedSong.audioUrl && (attachedSong.audioUrl.startsWith('http://') || attachedSong.audioUrl.startsWith('https://')) && (
                      <a
                        href={attachedSong.audioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-pink-300 hover:text-pink-200 border border-pink-500/40 hover:border-pink-400 transition-all cursor-pointer shadow-sm"
                        title="Open original music link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Open Link</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedSong(null);
                        if (previewPlayingSongId) {
                          musicAudioEngine.stop();
                          setPreviewPlayingSongId(null);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                      title="Remove attached music track"
                    >
                      <X className="w-4 h-4" />
                      <span className="sm:hidden">Remove</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Interactive Poll Creator Card */}
              {showPollCreator && (
                <div className="space-y-3 p-3.5 rounded-xl bg-neutral-950/90 border border-pink-500/40 shadow-[0_0_12px_rgba(236,72,153,0.15)]">
                  <div className="flex items-center justify-between text-xs font-semibold text-pink-300">
                    <div className="flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-pink-400" />
                      <span>Attach Community Deep Poll</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetPoll}
                      className="text-slate-400 hover:text-rose-400 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove Deep Poll</span>
                    </button>
                  </div>

                  {/* Poll Question Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                      Poll Question / Topic:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Which cryptography approach is most elegant?"
                      value={pollQuestion}
                      onChange={(e) => {
                        setPollQuestion(e.target.value);
                        setPollError(null);
                      }}
                      className="w-full bg-neutral-900 border border-pink-500/30 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-400"
                    />
                  </div>

                  {/* Poll Options List */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                      Options ({pollOptions.length}/6):
                    </label>
                    <div className="space-y-1.5">
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-5 text-center text-[11px] font-mono text-pink-400/80">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            placeholder={`Option ${idx + 1}...`}
                            value={opt}
                            onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                            className="flex-1 bg-neutral-900 border border-pink-500/30 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-400"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePollOption(idx)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-neutral-900 transition-colors"
                              title="Remove option"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {pollOptions.length < 6 && (
                      <button
                        type="button"
                        onClick={handleAddPollOption}
                        className="mt-1 flex items-center gap-1.5 text-[11px] text-pink-400 hover:text-pink-300 font-medium cursor-pointer transition-colors px-2.5 py-1 rounded-lg hover:bg-pink-950/40 border border-dashed border-pink-500/30"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+ Add Option ({pollOptions.length}/6)</span>
                      </button>
                    )}
                  </div>

                  {pollError && (
                    <p className="text-[10px] text-rose-400 font-medium">{pollError}</p>
                  )}

                  <p className="text-[10px] text-slate-400">
                    ⚡ Feed viewers can vote on this poll in real-time and see interactive percentage graphs.
                  </p>
                </div>
              )}

              {/* Mood Selector Dropdown / Panel */}
              {showMoodSelector && (
                <div className="space-y-3 p-3.5 rounded-xl bg-neutral-950/95 border border-pink-500/40 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-pink-950/80 border border-pink-500/40 flex items-center justify-center text-pink-300">
                        <Smile className="w-3.5 h-3.5 text-pink-400" />
                      </div>
                      <div>
                        <span className="text-pink-200 font-bold">Post Mood & Vibe</span>
                        <span className="text-[10px] text-slate-400 font-normal ml-2 hidden sm:inline">
                          Attach an emoji and emotional tone to your post
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedMood && (
                        <button
                          type="button"
                          onClick={() => setSelectedMood(null)}
                          className="text-rose-400 hover:text-rose-300 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Clear Mood
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowMoodSelector(false)}
                        className="text-slate-400 hover:text-slate-200 text-[11px] cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {/* Curated Mood Presets */}
                  <div>
                    <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>Curated Moods</span>
                      {selectedMood && (
                        <span className="text-pink-300 font-semibold lowercase">
                          active: {selectedMood.emoji} {selectedMood.label}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {MOOD_PRESETS.map((m) => {
                        const isSelected =
                          selectedMood?.label.toLowerCase() === m.label.toLowerCase() &&
                          selectedMood?.emoji === m.emoji;
                        return (
                          <button
                            key={m.label}
                            type="button"
                            onClick={() => {
                              setSelectedMood(isSelected ? null : m);
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-pink-700 text-white font-bold border border-pink-600'
                                : 'bg-neutral-900 text-slate-200 border border-neutral-800 hover:border-neutral-700 hover:text-white'
                            }`}
                          >
                            <span className="text-sm leading-none">{m.emoji}</span>
                            <span>{m.label}</span>
                            {isSelected && <Check className="w-3 h-3 text-white ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Mood Input */}
                  <div className="pt-2.5 border-t border-pink-500/20 space-y-1.5">
                    <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                      Or Create Custom Mood
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Quick emoji dropdown */}
                      <select
                        value={customMoodEmoji}
                        onChange={(e) => setCustomMoodEmoji(e.target.value)}
                        className="bg-neutral-900 border border-pink-500/40 rounded-xl px-2.5 py-1.5 text-base text-slate-100 focus:outline-none focus:ring-1 focus:ring-pink-400 cursor-pointer"
                        title="Pick Emoji"
                      >
                        {QUICK_EMOJIS.map((emoji) => (
                          <option key={emoji} value={emoji} className="bg-neutral-950 text-base">
                            {emoji}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="Type mood (e.g. Philosophical, Nostalgic...)"
                        value={customMoodLabel}
                        onChange={(e) => setCustomMoodLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (customMoodLabel.trim()) {
                              setSelectedMood({
                                emoji: customMoodEmoji,
                                label: customMoodLabel.trim(),
                              });
                              setCustomMoodLabel('');
                              setShowMoodSelector(false);
                            }
                          }
                        }}
                        maxLength={25}
                        className="flex-1 bg-neutral-900 border border-pink-500/30 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-400"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          if (customMoodLabel.trim()) {
                            setSelectedMood({
                              emoji: customMoodEmoji,
                              label: customMoodLabel.trim(),
                            });
                            setCustomMoodLabel('');
                            setShowMoodSelector(false);
                          }
                        }}
                        disabled={!customMoodLabel.trim()}
                        className="px-3.5 py-1.5 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shrink-0 transition-all border border-pink-400/40 cursor-pointer"
                      >
                        Set Mood
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Music Link & Soundtrack Selector Panel */}
              {showMusicPicker && (
                <div className="space-y-3.5 p-4 rounded-2xl bg-neutral-950/95 border border-pink-500/50 shadow-[0_0_25px_rgba(236,72,153,0.18)] animate-in fade-in zoom-in-95 duration-150">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-pink-950/80 border border-pink-500/40 flex items-center justify-center text-pink-300 shadow-sm">
                        <Music className="w-4 h-4 text-pink-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-pink-300 font-bold text-sm">Attach Music Link</span>
                          <span className="text-[10px] text-pink-400 font-mono px-2 py-0.5 rounded-full bg-pink-950 border border-pink-500/40">
                            Streaming & Audio
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-normal">
                          Attach music links from Spotify, SoundCloud, YouTube, Apple Music, or Bandcamp
                        </span>
                      </div>
                    </div>

                    {attachedSong && (
                      <button
                        type="button"
                        onClick={() => {
                          setAttachedSong(null);
                          if (previewPlayingSongId) {
                            musicAudioEngine.stop();
                            setPreviewPlayingSongId(null);
                          }
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Remove Attached Music</span>
                      </button>
                    )}
                  </div>

                  {/* Music Link Attachment Form */}
                  <div className="space-y-3 pt-1">
                      {/* URL Input */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-mono text-pink-300 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                            <Music className="w-3.5 h-3.5 text-pink-400" />
                            Music Link URL:
                          </label>
                          {detectedMusicInfo?.platform && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-pink-950 text-pink-300 border border-pink-500/40 flex items-center gap-1">
                              <Check className="w-3 h-3 text-pink-400" />
                              Detected: {detectedMusicInfo.platform}
                            </span>
                          )}
                        </div>

                        <div className="relative">
                          <input
                            type="url"
                            value={musicLinkUrl}
                            onChange={(e) => {
                              setMusicLinkUrl(e.target.value);
                              setMusicLinkError(null);
                              const info = parseMusicLinkInfo(e.target.value);
                              if (info?.suggestedTitle && !musicTrackTitle) {
                                setMusicTrackTitle(info.suggestedTitle);
                              }
                              if (info?.suggestedArtist && !musicTrackArtist) {
                                setMusicTrackArtist(info.suggestedArtist);
                              }
                              if (info?.defaultGenre) {
                                setMusicGenre(info.defaultGenre);
                              }
                              if (info?.defaultPreset) {
                                setMusicSynthPreset(info.defaultPreset);
                              }
                            }}
                            placeholder="Paste Spotify, SoundCloud, YouTube, Apple Music, Bandcamp, or audio URL..."
                            className="w-full bg-neutral-900/90 border border-pink-500/40 focus:border-pink-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                          />
                          {musicLinkUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setMusicLinkUrl('');
                                setMusicLinkError(null);
                              }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title & Artist Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                            Track Title:
                          </label>
                          <input
                            type="text"
                            value={musicTrackTitle}
                            onChange={(e) => setMusicTrackTitle(e.target.value)}
                            placeholder={detectedMusicInfo?.suggestedTitle || "e.g. Midnight Waves"}
                            className="w-full bg-neutral-900/90 border border-pink-500/30 focus:border-pink-400 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                            Artist / Channel:
                          </label>
                          <input
                            type="text"
                            value={musicTrackArtist}
                            onChange={(e) => setMusicTrackArtist(e.target.value)}
                            placeholder={detectedMusicInfo?.suggestedArtist || "e.g. Tycho / Chillhop"}
                            className="w-full bg-neutral-900/90 border border-pink-500/30 focus:border-pink-400 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Genre & Synth Soundscape Engine Pairing */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                            Genre Tag:
                          </label>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {['Lo-Fi', 'Ambient', 'Electronic', 'Synthwave', 'Jazz', 'Acoustic'].map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setMusicGenre(g)}
                                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer border ${
                                  musicGenre === g
                                    ? 'bg-pink-500/30 text-pink-300 border-pink-400'
                                    : 'bg-neutral-900 text-slate-400 border-neutral-800 hover:border-pink-500/40'
                                }`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <span>In-App Synth Sound:</span>
                            <span className="text-[9px] text-pink-400 font-normal">(Plays right in feed)</span>
                          </label>
                          <select
                            value={musicSynthPreset}
                            onChange={(e) => setMusicSynthPreset(e.target.value as PostSong['synthPreset'])}
                            className="w-full bg-neutral-900 border border-pink-500/30 focus:border-pink-400 rounded-lg px-2.5 py-1.5 text-xs text-pink-300 focus:outline-none cursor-pointer"
                          >
                            <option value="lofi_tape">Lo-Fi Tape Hiss & Rhodes</option>
                            <option value="ambient_calm">Calm Ambient Horizon</option>
                            <option value="night_jazz">Night Jazz Cafe Piano</option>
                            <option value="deep_drone">Tectonic Deep Drone</option>
                            <option value="acoustic_strings">Acoustic Strings & Harp</option>
                          </select>
                        </div>
                      </div>

                      {/* Quick Sample Links Helpers */}
                      <div className="pt-1">
                        <div className="text-[10px] font-mono text-slate-400 mb-1 flex items-center gap-1">
                          <span>Try Sample Music Links:</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setMusicLinkUrl('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT');
                              setMusicTrackTitle('Never Gonna Give You Up');
                              setMusicTrackArtist('Rick Astley');
                              setMusicGenre('Synthwave');
                              setMusicSynthPreset('night_jazz');
                              setMusicLinkError(null);
                            }}
                            className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-[11px] text-pink-300 border border-pink-500/30 hover:border-pink-400 transition-colors cursor-pointer"
                          >
                            🎵 Spotify Demo
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMusicLinkUrl('https://soundcloud.com/chillhopdotcom/sets/chillhop-essentials-spring-2024');
                              setMusicTrackTitle('Chillhop Essentials');
                              setMusicTrackArtist('Chillhop Music');
                              setMusicGenre('Lo-Fi');
                              setMusicSynthPreset('lofi_tape');
                              setMusicLinkError(null);
                            }}
                            className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-[11px] text-pink-300 border border-pink-500/30 hover:border-pink-400 transition-colors cursor-pointer"
                          >
                            ☁️ SoundCloud Demo
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMusicLinkUrl('https://music.youtube.com/watch?v=5qap5aO4i9A');
                              setMusicTrackTitle('Lofi Hip Hop Radio');
                              setMusicTrackArtist('Lofi Girl');
                              setMusicGenre('Lo-Fi');
                              setMusicSynthPreset('lofi_tape');
                              setMusicLinkError(null);
                            }}
                            className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-[11px] text-pink-300 border border-pink-500/30 hover:border-pink-400 transition-colors cursor-pointer"
                          >
                            ▶️ YouTube Music Demo
                          </button>
                        </div>
                      </div>

                      {/* Error Alert if any */}
                      {musicLinkError && (
                        <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/50 text-xs text-rose-300 flex items-center gap-1.5">
                          <X className="w-3.5 h-3.5 shrink-0" />
                          <span>{musicLinkError}</span>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowMusicPicker(false)}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded-lg hover:bg-neutral-900 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttachMusicLink()}
                          className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-semibold transition-all shadow-[0_0_12px_rgba(236,72,153,0.4)] border border-pink-400/50 cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Attach Music Link</span>
                        </button>
                      </div>
                    </div>
                </div>
              )}

              {/* Power-Ups Menu Expandable Drawer */}
              {showPowerUpsMenu && (
                <div className="pt-2">
                  <PostPowerUpsMenu
                    currentUser={currentUser}
                    isOpen={showPowerUpsMenu}
                    onClose={() => setShowPowerUpsMenu(false)}
                    draft={powerUpsDraft}
                    onChangeDraft={setPowerUpsDraft}
                    selectedGroupTag={selectedPowerUpGroupTag}
                    onSelectGroupTag={setSelectedPowerUpGroupTag}
                    onClaimGroupPoints={(tag) => onClaimFreeSparks && onClaimFreeSparks(tag)}
                    onClaimFreeSparks={onClaimFreeSparks}
                  />
                </div>
              )}
            </div>
          )}

          {/* Bottom Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            
            {/* Attachment Triggers & City Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* Poll Toggle Button (Deep Poll - Moved to First Button) */}
              <button
                type="button"
                id="composer-deep-poll-btn"
                onClick={() => {
                  setShowPollCreator(!showPollCreator);
                  setIsExpanded(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  showPollCreator
                    ? 'bg-pink-950/80 border-pink-400 text-pink-200 shadow-[0_0_12px_rgba(236,72,153,0.35)] ring-1 ring-pink-400/40'
                    : 'bg-neutral-900/90 hover:bg-neutral-800 border-pink-500/30 hover:border-pink-400 text-slate-200 hover:text-pink-300'
                }`}
                title="Create an interactive Deep Poll for peer compatibility and consensus"
              >
                <BarChart2 className="w-3.5 h-3.5 text-pink-400" />
                <span>{showPollCreator ? 'Deep Poll Active' : 'Deep Poll'}</span>
              </button>

              {/* Power-Ups Button */}
              <button
                type="button"
                id="composer-power-ups-btn"
                onClick={() => {
                  setShowPowerUpsMenu(!showPowerUpsMenu);
                  setIsExpanded(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  showPowerUpsMenu || activePowerUpsCount > 0
                    ? 'bg-gradient-to-r from-orange-950/90 to-amber-950/90 border-orange-400 text-orange-200 shadow-[0_0_15px_rgba(249,115,22,0.4)] ring-1 ring-orange-400/40'
                    : 'bg-neutral-900/90 hover:bg-neutral-800 border-orange-500/30 hover:border-orange-400 text-orange-300 hover:text-white'
                }`}
                title={`Power-ups funded by #${selectedPowerUpGroupTag} points (${(currentUser.groupPoints && currentUser.groupPoints[selectedPowerUpGroupTag]) || 0} pts available)`}
              >
                <Flame className={`w-3.5 h-3.5 ${showPowerUpsMenu || activePowerUpsCount > 0 ? 'fill-orange-400 text-orange-400 animate-pulse' : 'text-orange-400'}`} />
                <span>Power-Ups</span>
                {activePowerUpsCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-orange-500 text-black font-extrabold shadow-[0_0_6px_rgba(249,115,22,0.6)]">
                    {activePowerUpsCount} • #{selectedPowerUpGroupTag}
                  </span>
                )}
              </button>

              {/* Mood Selector Button */}
              <button
                type="button"
                onClick={() => {
                  setShowMoodSelector(!showMoodSelector);
                  setIsExpanded(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                  showMoodSelector || selectedMood
                    ? 'bg-pink-950/80 border-pink-400 text-pink-200'
                    : 'bg-neutral-900/90 hover:bg-neutral-800 border-pink-500/30 hover:border-pink-400 text-slate-300 hover:text-pink-300'
                }`}
                title="Attach an emoji and mood to your post"
              >
                <Smile className="w-3.5 h-3.5 text-pink-400" />
                <span>{selectedMood ? `${selectedMood.emoji} ${selectedMood.label}` : 'Mood'}</span>
              </button>

              {/* Attach Music Button (for Music Links & Soundtracks) */}
              <button
                type="button"
                onClick={() => {
                  setShowMusicPicker(!showMusicPicker);
                  setIsExpanded(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  showMusicPicker || attachedSong
                    ? 'bg-pink-950/80 border-pink-400 text-pink-200 shadow-[0_0_12px_rgba(236,72,153,0.35)] ring-1 ring-pink-400/40'
                    : 'bg-neutral-900/90 hover:bg-neutral-800 border-pink-500/30 hover:border-pink-400 text-pink-300 hover:text-white'
                }`}
                title="Attach music links from Spotify, SoundCloud, YouTube, Apple Music, or Bandcamp"
              >
                <Music className="w-3.5 h-3.5 text-pink-400" />
                <span>{attachedSong ? `🎵 ${attachedSong.title}` : 'Attach Music'}</span>
              </button>

              {/* Voice Post Button in Toolbar */}
              <button
                type="button"
                id="composer-voice-post-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToggleVoicePost();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  isVoiceRecording
                    ? 'bg-pink-950/90 border-pink-400 text-pink-200 shadow-[0_0_14px_rgba(236,72,153,0.5)] ring-1 ring-pink-400/50 animate-pulse'
                    : 'bg-neutral-900/90 hover:bg-neutral-800 border-pink-500/30 hover:border-pink-400 text-pink-300 hover:text-white'
                }`}
                title="Record audio verse or voice post with live waveform"
              >
                <AudioWaveform className="w-3.5 h-3.5 text-pink-400" />
                <span>{isVoiceRecording ? `Recording (${Math.floor(voiceSeconds / 60)}:${String(voiceSeconds % 60).padStart(2, '0')})` : 'Voice Post'}</span>
              </button>

              {/* Reading Link Add Trigger */}
              <button
                type="button"
                onClick={() => {
                  setShowReadingInput(!showReadingInput);
                  setIsExpanded(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                  showReadingInput || readingLinks.length > 0
                    ? 'bg-pink-950/80 border-pink-400 text-pink-200 shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                    : 'bg-neutral-900/90 hover:bg-neutral-800 border-pink-500/30 hover:border-pink-400 text-slate-300 hover:text-pink-300'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5 text-pink-400" />
                <span>
                  {readingLinks.length > 0 ? `Links (${readingLinks.length}/${MAX_LINKS})` : 'Attach Links (up to 3)'}
                </span>
              </button>

              {/* PDF File Upload Trigger */}
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-pink-500/30 hover:border-pink-400 text-slate-300 hover:text-pink-300 text-xs font-medium cursor-pointer transition-all">
                <FileUp className="w-3.5 h-3.5 text-pink-400" />
                <span className="hidden sm:inline">Attach PDF</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Image URL Toggle */}
              <button
                type="button"
                onClick={() => {
                  setShowImageInput(!showImageInput);
                  setIsExpanded(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                  showImageInput || imageUrl
                    ? 'bg-pink-950/80 border-pink-400 text-pink-200'
                    : 'bg-neutral-900/90 hover:bg-neutral-800 border-pink-500/30 hover:border-pink-400 text-slate-300 hover:text-pink-300'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                <span className="hidden sm:inline">Add Image</span>
              </button>

              {/* Adult Swim (18+) Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  const next = !isAdultSwimPost;
                  setIsAdultSwimPost(next);
                  if (next) {
                    if (!hashtagsInput.toLowerCase().includes('adultswim')) {
                      setHashtagsInput((prev) => `${prev.trim()} #AdultSwim`.trim());
                    }
                  }
                  setIsExpanded(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  isAdultSwimPost
                    ? 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-[0_0_12px_rgba(225,29,72,0.4)] ring-1 ring-rose-500/50'
                    : 'bg-neutral-900/90 hover:bg-neutral-800 border-rose-500/30 hover:border-rose-400 text-rose-400 hover:text-white'
                }`}
                title="Toggle [adult swim] 18+ after-hours categorization for this post"
              >
                <Moon className="w-3.5 h-3.5 text-rose-400" />
                <span>{isAdultSwimPost ? '[adult swim] 18+' : '18+ Adult Swim'}</span>
              </button>

              {/* Your Live Location Tag */}
              <div 
                className="flex items-center gap-1.5 bg-neutral-900/90 border border-pink-500/40 rounded-xl px-3 py-1.5 text-xs text-pink-300 font-mono shadow-[0_0_12px_rgba(236,72,153,0.2)] select-none transition-all"
                title={`Your live location: ${autoLocation.city} (${autoLocation.coordinates.lat.toFixed(2)}, ${autoLocation.coordinates.lng.toFixed(2)})`}
              >
                <div className="relative flex h-2 w-2 items-center justify-center shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-pink-500"></span>
                </div>
                <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span className="text-[11px] text-slate-300">Live Location:</span>
                {onCityClick ? (
                  <button
                    type="button"
                    onClick={() => onCityClick(autoLocation.city)}
                    className="font-bold text-slate-100 bg-pink-950/80 hover:bg-pink-900 px-2 py-0.5 rounded-full border border-pink-500/40 hover:border-pink-300 text-[11px] transition-all cursor-pointer active:scale-95 flex items-center gap-1 group/loctag"
                    title={`Filter feed by location tag: ${autoLocation.city}`}
                  >
                    <span>{autoLocation.city}</span>
                  </button>
                ) : (
                  <span className="font-bold text-slate-100 bg-pink-950/60 px-1.5 py-0.5 rounded border border-pink-500/30 text-[11px]">
                    {autoLocation.city}
                  </span>
                )}
              </div>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center gap-2 ml-auto">
              {isExpanded && (
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    setContent('');
                    setImageUrl('');
                    setShowImageInput(false);
                    setPdfDoc(null);
                    setReadingLinks([]);
                    setShowReadingInput(false);
                    setReadingUrlInput('');
                    setLinkError(null);
                    setSelectedMood(null);
                    setShowMoodSelector(false);
                    setCustomMoodLabel('');
                    setPowerUpsDraft({
                      boost: { active: false, score: 100, cost: 50 },
                      glow: { active: false, style: 'flame', cost: 40 },
                      multiplier: { active: false, factor: 3, cycles: 3, cost: 60 },
                      viral: { active: false, cost: 75 },
                    });
                    setShowPowerUpsMenu(false);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-neutral-900 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={!content.trim() && !pdfDoc && readingLinks.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white text-xs font-bold shadow-[0_0_15px_rgba(236,72,153,0.5)] border border-pink-400/50 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
