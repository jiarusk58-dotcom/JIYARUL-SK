import React, { useState, useRef, useEffect } from 'react';
import { SidebarTab } from './LeftSidebar';
import { Clip, FilterType, TransitionType, FilterAdjustments, VideoTemplate } from '../types/editor';
import { STOCK_VIDEOS, STOCK_AUDIO, TEXT_PRESETS, STICKER_PRESETS } from '../data/stockLibrary';
import { VIDEO_TEMPLATES } from '../data/videoTemplates';
import { TRANSITIONS_LIBRARY } from '../data/transitionsLibrary';
import { Language, i18n } from '../translations';
import { 
  VoiceRecorder, 
  createSyntheticAudioBuffer, 
  generateWaveformPoints,
  getAudioFileMetadata,
  extractAudioFromVideo,
  SynthAudioType
} from '../utils/audioSynth';
import { 
  Upload, 
  Plus, 
  Play, 
  Pause, 
  Mic, 
  Square, 
  Sliders, 
  Check, 
  RotateCcw,
  Sparkles,
  Music,
  Film,
  LayoutTemplate,
  Layers,
  ArrowRight,
  Search,
  Zap,
  FileAudio,
  Radio,
  Link as LinkIcon,
  Wand2,
  Volume2,
  FolderPlus,
  Loader2,
  CheckCircle2,
  Flame,
  Trash2,
  ExternalLink
} from 'lucide-react';

interface AssetPanelProps {
  activeTab: SidebarTab;
  language: Language;
  onAddClip: (clipPartial: Partial<Clip>) => void;
  onApplyTemplate: (template: VideoTemplate) => void;
  selectedClip: Clip | null;
  onUpdateSelectedClip: (updates: Partial<Clip>) => void;
  currentTime: number;
}

export const AssetPanel: React.FC<AssetPanelProps> = ({
  activeTab,
  language,
  onAddClip,
  onApplyTemplate,
  selectedClip,
  onUpdateSelectedClip,
  currentTime
}) => {
  const t = i18n[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template filter state
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);

  // Transitions state (200+ transitions)
  const [transitionCategory, setTransitionCategory] = useState<string>('all');
  const [transitionSearch, setTransitionSearch] = useState<string>('');
  const [transitionDuration, setTransitionDuration] = useState<number>(0.6);

  // Audio preview playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const audioPreviewPromiseRef = useRef<Promise<void> | null>(null);

  // Audio Tab Expanded States
  const [audioCategory, setAudioCategory] = useState<'all' | 'bgm' | 'sfx' | 'uploads' | 'synth'>('all');
  const [audioSearchQuery, setAudioSearchQuery] = useState('');
  const [audioToast, setAudioToast] = useState<string | null>(null);
  const [isExtractingAudio, setIsExtractingAudio] = useState(false);
  const [audioUrlInput, setAudioUrlInput] = useState('');
  const [isImportingUrl, setIsImportingUrl] = useState(false);

  // Custom synth state
  const [synthPreset, setSynthPreset] = useState<SynthAudioType>('lofi-beat');
  const [synthDuration, setSynthDuration] = useState<number>(8);

  // Dedicated Audio file inputs
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const videoExtractInputRef = useRef<HTMLInputElement>(null);

  // Uploaded and generated audios state
  const [uploadedAudios, setUploadedAudios] = useState<Array<{
    id: string;
    name: string;
    url: string;
    duration: number;
    category: string;
    waveform: number[];
  }>>([]);

  const triggerAudioToast = (msg: string) => {
    setAudioToast(msg);
    setTimeout(() => {
      setAudioToast(null);
    }, 3200);
  };

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null);
  const recordIntervalRef = useRef<number | null>(null);
  const [micVolume, setMicVolume] = useState(0);
  const micAnimRef = useRef<number | null>(null);

  // Cleanup audio preview on unmount
  useEffect(() => {
    return () => {
      if (audioPreviewRef.current) {
        const p = audioPreviewPromiseRef.current;
        if (p) {
          p.catch(() => {}).finally(() => {
            try {
              audioPreviewRef.current?.pause();
            } catch {
              // ignore
            }
          });
        } else {
          try {
            audioPreviewRef.current.pause();
          } catch {
            // ignore
          }
        }
      }
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
      }
      if (micAnimRef.current) {
        cancelAnimationFrame(micAnimRef.current);
      }
    };
  }, []);

  // Handle local user file upload (media tab)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const isImage = file.type.startsWith('image/');

      if (isVideo || isImage) {
        onAddClip({
          name: file.name,
          type: isVideo ? 'video' : 'image',
          src: url,
          duration: isVideo ? 5.0 : 4.0,
          trackId: 'track-video',
        });
      } else if (isAudio) {
        onAddClip({
          name: file.name,
          type: 'audio',
          src: url,
          duration: 6.0,
          trackId: 'track-audio',
          waveform: generateWaveformPoints(30)
        });
      }
    }
  };

  // Dedicated audio file upload with accurate duration & waveform calculation
  const handleDedicatedAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const meta = await getAudioFileMetadata(file);
        const newTrack = {
          id: `up-audio-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: meta.name,
          url: meta.url,
          duration: meta.duration,
          category: 'My Uploads',
          waveform: meta.waveform
        };

        // Add directly to timeline
        onAddClip({
          name: meta.name,
          type: 'audio',
          src: meta.url,
          duration: meta.duration,
          trackId: 'track-audio',
          waveform: meta.waveform
        });

        // Store in uploadedAudios so user can use again
        setUploadedAudios((prev) => [newTrack, ...prev]);

        triggerAudioToast(
          language === 'bn' 
            ? `"${meta.name}" অডিও সফলভাবে টাইমলাইনে যোগ হয়েছে!` 
            : `"${meta.name}" added to timeline!`
        );
      } catch (err) {
        console.error('Audio upload error:', err);
      }
    }
    if (audioFileInputRef.current) audioFileInputRef.current.value = '';
  };

  // Extract audio from video file and place onto timeline
  const handleExtractAudioFromVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsExtractingAudio(true);
    try {
      const meta = await extractAudioFromVideo(file);
      onAddClip({
        name: meta.name,
        type: 'audio',
        src: meta.url,
        duration: meta.duration,
        trackId: 'track-audio',
        waveform: meta.waveform
      });

      const newTrack = {
        id: `extracted-${Date.now()}`,
        name: meta.name,
        url: meta.url,
        duration: meta.duration,
        category: 'My Uploads',
        waveform: meta.waveform
      };
      setUploadedAudios((prev) => [newTrack, ...prev]);

      triggerAudioToast(
        language === 'bn' 
          ? 'ভিডিও থেকে অডিও পৃথক করে সফলভাবে টাইমলাইনে যোগ হয়েছে!' 
          : 'Extracted audio placed on timeline!'
      );
    } catch (err) {
      console.error('Error extracting audio:', err);
    } finally {
      setIsExtractingAudio(false);
      if (videoExtractInputRef.current) videoExtractInputRef.current.value = '';
    }
  };

  // Import audio from a direct Web URL
  const handleImportAudioUrl = () => {
    const trimmed = audioUrlInput.trim();
    if (!trimmed) return;

    setIsImportingUrl(true);
    const audio = new Audio();
    audio.src = trimmed;
    audio.onloadedmetadata = () => {
      const dur = Math.max(1, Math.round(audio.duration * 10) / 10 || 8);
      const name = trimmed.split('/').pop()?.split('?')[0] || 'Web Audio';
      const wave = generateWaveformPoints(35);

      onAddClip({
        name,
        type: 'audio',
        src: trimmed,
        duration: dur,
        trackId: 'track-audio',
        waveform: wave
      });

      setUploadedAudios((prev) => [
        {
          id: `url-${Date.now()}`,
          name,
          url: trimmed,
          duration: dur,
          category: 'Web URL',
          waveform: wave
        },
        ...prev
      ]);

      triggerAudioToast(
        language === 'bn' ? 'ওয়েব লিঙ্ক থেকে অডিও টাইমলাইনে যোগ হয়েছে!' : 'Audio from URL added!'
      );
      setAudioUrlInput('');
      setIsImportingUrl(false);
    };
    audio.onerror = () => {
      setIsImportingUrl(false);
      alert(
        language === 'bn' 
          ? 'অডিও লিঙ্কটি লোড করা সম্ভব হয়নি। সরাসরি কাজ করে এমন অডিও ফাইল লিঙ্ক দিন।' 
          : 'Failed to load audio from URL. Please ensure it is a valid direct audio link.'
      );
    };
  };

  // Custom synth generator handler
  const handleGenerateSynthTrack = () => {
    const url = createSyntheticAudioBuffer(synthPreset, synthDuration);
    const presetLabels: Record<string, { en: string; bn: string }> = {
      'lofi-beat': { en: 'Lo-Fi Chill Beat', bn: 'লো-ফাই চিল বিট' },
      'cinematic-drone': { en: 'Cinematic Ambient Bass', bn: 'সিনেমাটিক ড্রোন' },
      'cinematic-epic': { en: 'Cinematic Epic Taiko', bn: 'এপিক অর্কেস্ট্রাল টাইকো' },
      'upbeat-vlog': { en: 'Upbeat Vlog Pop', bn: 'আপবিট ভ্লগ পপ' },
      'edm-drop': { en: 'Gaming EDM Festival Drop', bn: 'গেমিং ইডিএম ড্রপ' },
      'cyber-synth': { en: 'Cyber Synthwave 80s', bn: 'সাইবার সিন্থওয়েভ' },
      'acoustic-warm': { en: 'Warm Acoustic Guitar', bn: 'অ্যাকোস্টিক গিটার' },
      'ambient-piano': { en: 'Emotional Piano Ambient', bn: 'ইমোশনাল পিয়ানো' },
      'dramatic-sting': { en: 'Dramatic Horn Sting', bn: 'ড্রামাটিক ব্রাশিং হর্ন' },
      'hiphop-trap': { en: 'Punchy 808 Trap Beat', bn: 'পাঞ্চি ৮০৮ ট্র্যাপ' },
      'celebration-fanfare': { en: 'Celebration Fanfare', bn: 'সেলিব্রেশন ফ্যানফেয়ার' },
      'chillhop': { en: 'Chillhop Vinyl Rhodes', bn: 'চিলহপ ভিনাইল' },
      'corporate-uplifting': { en: 'Corporate Marimba', bn: 'কর্পোরেট ম্যারিম্বা' },
      'retro-synthwave': { en: 'Retro Neon Wave', bn: 'রেট্রো নিয়ন ওয়েভ' },
      'bengali-flute': { en: 'Bengali Flute & Tanpura', bn: 'বাংলার সুর বাঁশি ও তানপুরা' },
      'rain-ambient': { en: 'Gentle Rain Ambient', bn: 'শান্ত বৃষ্টির আবহ' },
      'whoosh': { en: 'Whoosh SFX', bn: 'উশ সাউন্ড' },
      'pop': { en: 'Bubble Pop SFX', bn: 'বাবল পপ' },
      'bell': { en: 'Notice Bell SFX', bn: 'নোটিফিকেশন বেল' },
      'camera': { en: 'Camera Shutter SFX', bn: 'ক্যামেরা ক্লিক' },
      'glitch': { en: 'Glitch Zap SFX', bn: 'গ্লিচ সাউন্ড' },
      'laser': { en: 'Laser Pew SFX', bn: 'লেজার বিম' },
      'explosion': { en: 'Sub Explosion SFX', bn: 'এক্সপ্লোশন ধামাকা' },
      'applause': { en: 'Crowd Cheering SFX', bn: 'হাততালি ও উল্লাস' },
      'keyboard': { en: 'Keyboard Typing SFX', bn: 'কীবোর্ড টাইপিং' },
      'heartbeat': { en: 'Heartbeat Thump SFX', bn: 'হার্টবিট স্পন্দন' },
      'success-ding': { en: 'Success Ding SFX', bn: 'সফলতা কমপ্লিট ডিং' },
      'error-buzz': { en: 'Error Buzzer SFX', bn: 'ভুল বাজার' },
      'game-coin': { en: 'Game Coin SFX', bn: 'গেম কয়েন জাম্প' },
      'riser': { en: 'Tension Riser SFX', bn: 'টেনশন রাইজার' }
    };

    const label = presetLabels[synthPreset] || { en: synthPreset, bn: synthPreset };
    const clipName = `${language === 'bn' ? label.bn : label.en} (${synthDuration}s)`;

    onAddClip({
      name: clipName,
      type: 'audio',
      src: url,
      duration: synthDuration,
      trackId: 'track-audio',
      waveform: generateWaveformPoints(Math.min(50, synthDuration * 3))
    });

    triggerAudioToast(
      language === 'bn'
        ? `"${clipName}" সিন্থেসাইজ করে টাইমলাইনে যোগ করা হয়েছে!`
        : `"${clipName}" synthesized & added!`
    );
  };

  // Play audio preview in library
  const handlePreviewAudio = (assetId: string, url: string, duration?: number) => {
    if (playingAudioId === assetId) {
      if (audioPreviewRef.current) {
        const p = audioPreviewPromiseRef.current;
        if (p) {
          p.catch(() => {}).finally(() => {
            try {
              if (audioPreviewRef.current) {
                audioPreviewRef.current.pause();
                audioPreviewRef.current.currentTime = 0;
              }
            } catch {
              // ignore
            }
          });
        } else {
          try {
            audioPreviewRef.current.pause();
            audioPreviewRef.current.currentTime = 0;
          } catch {
            // ignore
          }
        }
      }
      setPlayingAudioId(null);
      return;
    }

    let actualUrl = url;
    if (url.startsWith('synth://')) {
      const synthType = url.replace('synth://', '') as any;
      actualUrl = createSyntheticAudioBuffer(synthType, duration || 4);
    }

    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio();
    }

    // Safely start new preview audio
    const startPlay = () => {
      if (!audioPreviewRef.current) return;
      audioPreviewRef.current.src = actualUrl;
      audioPreviewRef.current.currentTime = 0;
      const playPromise = audioPreviewRef.current.play();
      if (playPromise !== undefined) {
        audioPreviewPromiseRef.current = playPromise;
        playPromise
          .catch((err) => {
            if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
              console.warn('Preview audio play error:', err);
            }
          })
          .finally(() => {
            if (audioPreviewPromiseRef.current === playPromise) {
              audioPreviewPromiseRef.current = null;
            }
          });
      }
      setPlayingAudioId(assetId);

      audioPreviewRef.current.onended = () => {
        setPlayingAudioId(null);
      };
    };

    const currentPromise = audioPreviewPromiseRef.current;
    if (currentPromise) {
      currentPromise
        .catch(() => {})
        .finally(() => {
          try {
            audioPreviewRef.current?.pause();
          } catch {
            // ignore
          }
          startPlay();
        });
    } else {
      try {
        audioPreviewRef.current.pause();
      } catch {
        // ignore
      }
      startPlay();
    }
  };

  // Start voiceover recording
  const handleStartRecording = async () => {
    const recorder = new VoiceRecorder();
    const success = await recorder.start();
    if (!success) {
      alert(language === 'bn' ? 'মাইক্রোফোনের অনুমতি প্রয়োজন।' : 'Microphone permission denied.');
      return;
    }

    voiceRecorderRef.current = recorder;
    setIsRecording(true);
    setRecordingSeconds(0);

    recordIntervalRef.current = window.setInterval(() => {
      setRecordingSeconds((prev) => prev + 0.1);
      // Simulate live volume meter
      setMicVolume(Math.random() * 0.7 + 0.3);
    }, 100);
  };

  // Stop voiceover recording and add clip to timeline
  const handleStopRecording = async () => {
    if (!voiceRecorderRef.current) return;
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
    }

    try {
      const result = await voiceRecorderRef.current.stop();
      setIsRecording(false);
      setMicVolume(0);

      onAddClip({
        name: `Voiceover_${Math.round(currentTime)}s`,
        type: 'audio',
        src: result.audioUrl,
        duration: Math.max(1, result.duration),
        trackId: 'track-voiceover',
        waveform: generateWaveformPoints(35)
      });
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  return (
    <div className="w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col shrink-0 select-none overflow-hidden z-10">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-neutral-800 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
          {activeTab === 'templates' && t.templates}
          {activeTab === 'media' && t.media}
          {activeTab === 'text' && t.text}
          {activeTab === 'transitions' && t.transitions}
          {activeTab === 'filters' && t.filters}
          {activeTab === 'audio' && t.audio}
          {activeTab === 'voiceover' && t.voiceover}
          {activeTab === 'stickers' && t.stickers}
        </h2>
      </div>

      {/* Panel Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
        
        {/* TAB 0: TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="space-y-3.5">
            {/* Trust badge */}
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-2 text-emerald-300 text-[11px]">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                {language === 'bn' 
                  ? '১০০% কপিরাইট-মুক্ত ফুটেজ, টাইটেল ও মিউজিকসহ প্রস্তুত টেমপ্লেট' 
                  : '100% Copyright-Free footage, animated titles & audio included'}
              </span>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
              {[
                { id: 'all', label: language === 'bn' ? 'সবগুলো (১৫)' : 'All (15)' },
                { id: '16:9', label: '16:9' },
                { id: '9:16', label: '9:16' },
                { id: '1:1', label: '1:1' },
                { id: 'Vlog', label: 'Vlog' },
                { id: 'Gaming', label: 'Gaming' },
                { id: 'News', label: 'News' },
                { id: 'Podcast', label: 'Podcast' },
                { id: 'Trailer', label: 'Trailer' },
                { id: 'Fashion', label: 'Fashion' },
                { id: 'Promo', label: 'Promo' },
                { id: 'Retro', label: 'Retro' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTemplateFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    templateFilter === f.id
                      ? 'bg-amber-400 text-neutral-950 font-semibold'
                      : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Template Cards List */}
            <div className="space-y-3">
              {VIDEO_TEMPLATES
                .filter((tmpl) => {
                  if (templateFilter === 'all') return true;
                  if (templateFilter === '16:9' || templateFilter === '9:16' || templateFilter === '1:1') {
                    return tmpl.aspectRatio === templateFilter;
                  }
                  return tmpl.category === templateFilter;
                })
                .map((tmpl) => {
                  const isLoaded = loadedTemplateId === tmpl.id;
                  const isAudioPlaying = playingAudioId === `tmpl-${tmpl.id}`;

                  return (
                    <div
                      key={tmpl.id}
                      className="bg-neutral-950 border border-neutral-800 hover:border-amber-400/70 rounded-xl overflow-hidden transition-all group flex flex-col"
                    >
                      {/* Thumbnail Container */}
                      <div className="relative aspect-video w-full bg-neutral-900 overflow-hidden">
                        <img
                          src={tmpl.thumbnail}
                          alt={tmpl.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        {/* Gradient Scrim */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-black/80 border border-white/10 text-[9px] font-mono font-semibold text-amber-300">
                            {tmpl.aspectRatio}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-black/80 border border-white/10 text-[9px] font-mono text-neutral-300">
                            {tmpl.duration}s
                          </span>
                        </div>

                        {/* Audio Preview Button */}
                        <button
                          onClick={() => {
                            const audioClip = tmpl.clips.find((c) => c.type === 'audio');
                            if (audioClip?.src) {
                              handlePreviewAudio(`tmpl-${tmpl.id}`, audioClip.src);
                            }
                          }}
                          className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/80 hover:bg-neutral-800 text-neutral-200 border border-white/10 flex items-center gap-1.5 text-[10px] cursor-pointer"
                          title="Preview Audio Track"
                        >
                          {isAudioPlaying ? (
                            <Pause className="w-3 h-3 text-amber-400" />
                          ) : (
                            <Play className="w-3 h-3 text-amber-400" />
                          )}
                          <span className="truncate max-w-[120px]">
                            {language === 'bn' ? tmpl.audioNameBn : tmpl.audioName}
                          </span>
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                        <div>
                          <div className="font-semibold text-neutral-100 text-xs leading-snug">
                            {language === 'bn' ? tmpl.titleBn : tmpl.title}
                          </div>
                          <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-normal">
                            {language === 'bn' ? tmpl.descriptionBn : tmpl.description}
                          </p>
                        </div>

                        {/* Apply Template Button */}
                        <button
                          onClick={() => {
                            onApplyTemplate(tmpl);
                            setLoadedTemplateId(tmpl.id);
                            setTimeout(() => setLoadedTemplateId(null), 2500);
                          }}
                          className={`w-full py-2 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                            isLoaded
                              ? 'bg-emerald-500 text-white'
                              : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 active:scale-98'
                          }`}
                        >
                          {isLoaded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>{t.templateLoaded}</span>
                            </>
                          ) : (
                            <>
                              <LayoutTemplate className="w-3.5 h-3.5" />
                              <span>{t.loadTemplate}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 1: MEDIA */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            {/* Upload Box */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-700 hover:border-amber-400 bg-neutral-950/60 rounded-xl p-4 text-center cursor-pointer transition-all hover:bg-neutral-800/40 group"
            >
              <input 
                ref={fileInputRef} 
                type="file" 
                multiple 
                accept="video/*,image/*,audio/*" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <Upload className="w-6 h-6 mx-auto mb-2 text-neutral-400 group-hover:text-amber-400 transition-colors" />
              <div className="font-medium text-neutral-200">{t.uploadMedia}</div>
              <p className="text-[11px] text-neutral-400 mt-1">{t.uploadHint}</p>
            </div>

            {/* Stock Footage Grid */}
            <div>
              <div className="text-neutral-400 font-medium mb-2">{t.stockFootage}</div>
              <div className="grid grid-cols-2 gap-2">
                {STOCK_VIDEOS.map((item) => (
                  <div 
                    key={item.id}
                    className="relative group bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden hover:border-amber-400/80 transition-all flex flex-col"
                  >
                    <div className="aspect-video w-full relative bg-neutral-800">
                      {item.thumbnail ? (
                        <img 
                          src={item.thumbnail} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-500">
                          <Film className="w-6 h-6" />
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/70 text-[9px] font-mono text-neutral-300">
                        {item.duration}s
                      </div>
                    </div>
                    <div className="p-2 flex-1 flex flex-col justify-between">
                      <div className="font-medium text-neutral-200 truncate">
                        {language === 'bn' ? item.nameBn : item.name}
                      </div>
                      <button
                        onClick={() => onAddClip({
                          name: language === 'bn' ? item.nameBn : item.name,
                          type: 'video',
                          src: item.url,
                          thumbnail: item.thumbnail,
                          duration: item.duration,
                          trackId: 'track-video',
                        })}
                        className="mt-2 w-full py-1 bg-neutral-800 hover:bg-amber-400 hover:text-neutral-950 text-neutral-200 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.addToTimeline}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEXT */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <div className="text-neutral-400 font-medium mb-2">{t.textPresets}</div>
            {TEXT_PRESETS.map((preset) => (
              <div 
                key={preset.id}
                className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 hover:border-amber-400/70 transition-all flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-200">
                    {language === 'bn' ? preset.nameBn : preset.name}
                  </span>
                  <button
                    onClick={() => onAddClip({
                      name: language === 'bn' ? preset.nameBn : preset.name,
                      type: 'text',
                      duration: 4.0,
                      trackId: 'track-text',
                      textProperties: {
                        text: language === 'bn' ? preset.textBn : preset.text,
                        fontSize: preset.fontSize,
                        fontFamily: preset.fontFamily,
                        color: preset.color,
                        backgroundColor: preset.backgroundColor,
                        borderColor: preset.borderColor,
                        borderWidth: preset.borderWidth,
                        shadow: preset.shadow,
                        align: 'center',
                        animation: preset.animation
                      }
                    })}
                    className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.addToTimeline}</span>
                  </button>
                </div>
                {/* Preview text */}
                <div 
                  className="py-2 px-3 rounded bg-neutral-900 text-center font-bold truncate"
                  style={{
                    color: preset.color,
                    backgroundColor: preset.backgroundColor !== 'transparent' ? preset.backgroundColor : '#171717',
                    fontSize: '13px'
                  }}
                >
                  {language === 'bn' ? preset.textBn : preset.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: TRANSITIONS (200+ Transitions Library) */}
        {activeTab === 'transitions' && (
          <div className="space-y-3">
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-100 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{language === 'bn' ? '২০০+ প্রো ট্রানজিশন লাইব্রেরি' : '200+ Pro Transitions Library'}</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {language === 'bn' 
                    ? 'ক্লিপের শুরুতে বা ট্রানজিশন পয়েন্টে ফিল্মোরা/কাইনমাস্টার স্টাইল এফেক্ট যোগ করুন' 
                    : 'Add Filmora / KineMaster style cinematic transitions between clips'}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 text-[10px] font-mono font-bold">
                {TRANSITIONS_LIBRARY.length}
              </span>
            </div>

            {/* Selected Clip Notice */}
            {selectedClip ? (
              <div className="p-2.5 bg-neutral-950 border border-amber-400/40 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-amber-400 font-medium">
                    {language === 'bn' ? 'টার্গেট ক্লিপ:' : 'Target Clip:'}
                  </div>
                  <div className="font-semibold text-neutral-200 text-xs truncate max-w-[170px]">
                    {selectedClip.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-neutral-400">
                    {language === 'bn' ? 'বর্তমান এফেক্ট:' : 'Current:'}
                  </div>
                  <span className="text-[11px] font-mono font-medium text-amber-300">
                    {selectedClip.transitionIn?.type && selectedClip.transitionIn.type !== 'none'
                      ? selectedClip.transitionIn.type
                      : (language === 'bn' ? 'কোনোটি নয়' : 'None')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-neutral-400 text-[11px] flex items-center gap-2">
                <span className="text-amber-400 font-bold">ℹ️</span>
                <span>
                  {language === 'bn' 
                    ? 'টাইমলাইনের একটি ভিডিও ক্লিপ সিলেক্ট করুন ট্রানজিশন অ্যাপ্লাই করতে।' 
                    : 'Select a video clip on the timeline to apply a transition.'}
                </span>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
              <input
                type="text"
                value={transitionSearch}
                onChange={(e) => setTransitionSearch(e.target.value)}
                placeholder={language === 'bn' ? '২০০+ ট্রানজিশন খুঁজুন (যেমন: Zoom, Slide, Glitch)...' : 'Search 200+ transitions (e.g. Zoom, Wipe, Glitch)...'}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 outline-none focus:border-amber-400 transition-colors"
              />
              {transitionSearch && (
                <button
                  onClick={() => setTransitionSearch('')}
                  className="absolute right-2 top-2 text-[10px] text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Duration Slider & Remove Button */}
            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-300 font-medium">
                  {language === 'bn' ? 'ট্রানজিশন ডিউরেশন (গতি):' : 'Transition Duration:'}
                </span>
                <span className="font-mono text-amber-400 font-semibold">{transitionDuration}s</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.1"
                value={transitionDuration}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTransitionDuration(val);
                  if (selectedClip && selectedClip.transitionIn?.type && selectedClip.transitionIn.type !== 'none') {
                    onUpdateSelectedClip({
                      transitionIn: { ...selectedClip.transitionIn, duration: val }
                    });
                  }
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />

              <div className="pt-1 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (selectedClip) {
                      onUpdateSelectedClip({
                        transitionIn: { type: 'none', duration: 0 }
                      });
                    }
                  }}
                  className="w-full py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-neutral-400" />
                  <span>{language === 'bn' ? 'কোনো ট্রানজিশন নয় (রিমুভ)' : 'None (Remove Transition)'}</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {[
                { id: 'all', label: language === 'bn' ? 'সব (২৩৫)' : 'All (235)' },
                { id: 'Dissolve', label: language === 'bn' ? 'ডিসলভ' : 'Dissolve' },
                { id: 'Slide', label: language === 'bn' ? 'স্লাইড' : 'Slide' },
                { id: 'Zoom', label: language === 'bn' ? 'জুম' : 'Zoom' },
                { id: 'Wipe', label: language === 'bn' ? 'ওয়াইপ' : 'Wipe' },
                { id: 'Glitch', label: language === 'bn' ? 'গ্লিচ' : 'Glitch' },
                { id: '3D', label: language === 'bn' ? '৩ডি' : '3D' },
                { id: 'Shape', label: language === 'bn' ? 'শেপ' : 'Shape' },
                { id: 'Light', label: language === 'bn' ? 'লাইট' : 'Light' },
                { id: 'Spin', label: language === 'bn' ? 'স্পিন' : 'Spin' },
                { id: 'Retro', label: language === 'bn' ? 'রেট্রো' : 'Retro' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setTransitionCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    transitionCategory === cat.id
                      ? 'bg-amber-400 text-neutral-950 font-semibold'
                      : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Transitions Grid (All 235 items) */}
            <div className="grid grid-cols-2 gap-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
              {TRANSITIONS_LIBRARY
                .filter((item) => {
                  if (transitionCategory !== 'all' && item.category !== transitionCategory) {
                    return false;
                  }
                  if (transitionSearch.trim()) {
                    const q = transitionSearch.toLowerCase();
                    return item.name.toLowerCase().includes(q) || 
                           item.nameBn.toLowerCase().includes(q) ||
                           item.id.toLowerCase().includes(q) ||
                           item.category.toLowerCase().includes(q);
                  }
                  return true;
                })
                .map((tr) => {
                  const isCurrent = selectedClip?.transitionIn?.type === tr.id;
                  return (
                    <button
                      key={tr.id}
                      onClick={() => {
                        if (selectedClip) {
                          onUpdateSelectedClip({
                            transitionIn: { type: tr.id, duration: transitionDuration }
                          });
                        } else {
                          // Prompt or automatically select first video clip
                          alert(language === 'bn' 
                            ? 'অনুগ্রহ করে প্রথমে টাইমলাইন থেকে একটি ক্লিপ সিলেক্ট করুন।' 
                            : 'Please select a clip on the timeline first.');
                        }
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[74px] group relative ${
                        isCurrent
                          ? 'border-amber-400 bg-amber-400/15 text-white ring-1 ring-amber-400'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-amber-400/60 hover:bg-neutral-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[9px] font-mono text-neutral-400 group-hover:text-amber-300 transition-colors">
                          {tr.category}
                        </span>
                        {isCurrent ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <Sparkles className="w-3 h-3 text-neutral-600 group-hover:text-amber-400 transition-colors" />
                        )}
                      </div>

                      <div className="mt-1.5">
                        <div className="text-[11px] font-semibold text-neutral-100 leading-tight group-hover:text-amber-300 transition-colors">
                          {language === 'bn' ? tr.nameBn : tr.name}
                        </div>
                        <div className="text-[9px] font-mono text-neutral-500 mt-0.5">
                          {tr.id}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 4: FILTERS & LUTS */}
        {activeTab === 'filters' && (
          <div className="space-y-4">
            <div className="text-neutral-400 font-medium">{t.videoFilters}</div>

            {/* Filter Presets Grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'none', label: 'Original', labelBn: 'অরিজিনাল' },
                { id: 'warm', label: 'Warm Glow', labelBn: 'ওয়ার্ম গোল্ডেন' },
                { id: 'cyberpunk', label: 'Cyberpunk', labelBn: 'সাইবারপাঙ্ক' },
                { id: 'vintage', label: 'Vintage 35mm', labelBn: 'ভিন্টেজ ৩৫মিমি' },
                { id: 'noir', label: 'B&W Noir', labelBn: 'ব্ল্যাক & হোয়াইট' },
                { id: 'vivid', label: 'Vivid Pop', labelBn: 'ভিভিড কালার' },
                { id: 'sepia', label: 'Sepia Film', labelBn: 'সেপিয়া' },
                { id: 'cinematic-teal', label: 'Teal Cine', labelBn: 'সিনেমাটিক টিল' },
                { id: 'cold-blue', label: 'Cold Blue', labelBn: 'কোল্ড ব্লু' },
              ].map((f) => {
                const isActive = (selectedClip?.filter || 'none') === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      if (selectedClip) {
                        onUpdateSelectedClip({ filter: f.id as FilterType });
                      }
                    }}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                      isActive
                        ? 'border-amber-400 bg-amber-400/15 text-amber-300 font-medium'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="truncate text-[11px]">
                      {language === 'bn' ? f.labelBn : f.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Manual Color Sliders */}
            <div className="border-t border-neutral-800 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'bn' ? 'কালার অ্যাডজাস্টমেন্ট' : 'Color Tuning'}</span>
                </span>
                <button
                  onClick={() => {
                    if (selectedClip) {
                      onUpdateSelectedClip({
                        filterAdjustments: {
                          brightness: 100,
                          contrast: 100,
                          saturation: 100,
                          vignette: 0,
                          blur: 0
                        }
                      });
                    }
                  }}
                  className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.resetFilters}</span>
                </button>
              </div>

              {/* Brightness */}
              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>{t.brightness}</span>
                  <span className="font-mono">{selectedClip?.filterAdjustments?.brightness || 100}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="180"
                  value={selectedClip?.filterAdjustments?.brightness || 100}
                  onChange={(e) => {
                    if (selectedClip) {
                      onUpdateSelectedClip({
                        filterAdjustments: {
                          ...selectedClip.filterAdjustments,
                          brightness: Number(e.target.value)
                        }
                      });
                    }
                  }}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>{t.contrast}</span>
                  <span className="font-mono">{selectedClip?.filterAdjustments?.contrast || 100}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="180"
                  value={selectedClip?.filterAdjustments?.contrast || 100}
                  onChange={(e) => {
                    if (selectedClip) {
                      onUpdateSelectedClip({
                        filterAdjustments: {
                          ...selectedClip.filterAdjustments,
                          contrast: Number(e.target.value)
                        }
                      });
                    }
                  }}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>{t.saturation}</span>
                  <span className="font-mono">{selectedClip?.filterAdjustments?.saturation || 100}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={selectedClip?.filterAdjustments?.saturation || 100}
                  onChange={(e) => {
                    if (selectedClip) {
                      onUpdateSelectedClip({
                        filterAdjustments: {
                          ...selectedClip.filterAdjustments,
                          saturation: Number(e.target.value)
                        }
                      });
                    }
                  }}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Vignette */}
              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>{t.vignette}</span>
                  <span className="font-mono">{selectedClip?.filterAdjustments?.vignette || 0}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedClip?.filterAdjustments?.vignette || 0}
                  onChange={(e) => {
                    if (selectedClip) {
                      onUpdateSelectedClip({
                        filterAdjustments: {
                          ...selectedClip.filterAdjustments,
                          vignette: Number(e.target.value)
                        }
                      });
                    }
                  }}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIO & SFX (Comprehensive Audio Studio) */}
        {activeTab === 'audio' && (
          <div className="space-y-3.5">
            {/* Success Toast */}
            {audioToast && (
              <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium truncate">{audioToast}</span>
              </div>
            )}

            {/* Hidden file inputs */}
            <input 
              ref={audioFileInputRef} 
              type="file" 
              accept="audio/*" 
              multiple 
              onChange={handleDedicatedAudioUpload} 
              className="hidden" 
            />
            <input 
              ref={videoExtractInputRef} 
              type="file" 
              accept="video/*" 
              onChange={handleExtractAudioFromVideo} 
              className="hidden" 
            />

            {/* Quick Action 1: Upload Audio File */}
            <div
              onClick={() => audioFileInputRef.current?.click()}
              className="group border border-dashed border-amber-400/50 hover:border-amber-400 bg-amber-400/5 hover:bg-amber-400/10 rounded-xl p-3.5 text-center cursor-pointer transition-all shadow-sm"
            >
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileAudio className="w-5 h-5" />
              </div>
              <div className="font-semibold text-neutral-100 text-xs group-hover:text-amber-300 transition-colors">
                {language === 'bn' ? 'ডিভাইস থেকে অডিও আপলোড করুন' : 'Upload Audio from Device'}
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                {language === 'bn' ? 'MP3, WAV, M4A, AAC, OGG অডিও ফাইল সমর্থন করে' : 'Supports MP3, WAV, M4A, AAC, OGG files'}
              </p>
            </div>

            {/* Quick Actions 2 & 3: Extract from Video & URL Import */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => videoExtractInputRef.current?.click()}
                disabled={isExtractingAudio}
                className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
              >
                {isExtractingAudio ? (
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                ) : (
                  <Film className="w-4 h-4 text-sky-400" />
                )}
                <span className="text-[11px] font-medium text-neutral-200">
                  {language === 'bn' ? 'ভিডিও থেকে অডিও' : 'Rip from Video'}
                </span>
              </button>

              <button
                onClick={() => setAudioCategory('synth')}
                className={`p-2.5 border rounded-lg flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer text-center ${
                  audioCategory === 'synth'
                    ? 'bg-amber-400/15 border-amber-400 text-amber-300'
                    : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 hover:border-neutral-700 text-neutral-200'
                }`}
              >
                <Wand2 className="w-4 h-4 text-purple-400" />
                <span className="text-[11px] font-medium">
                  {language === 'bn' ? 'সাউন্ড সিন্থেসাইজার' : 'Audio Synth'}
                </span>
              </button>
            </div>

            {/* Web Audio URL Import Bar */}
            <div className="bg-neutral-950 border border-neutral-800/80 rounded-lg p-2.5">
              <div className="text-[10px] text-neutral-400 font-medium mb-1.5 flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-amber-400" />
                <span>{language === 'bn' ? 'ওয়েব লিঙ্ক থেকে অডিও যুক্ত করুন' : 'Import from Audio Web Link'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input 
                  type="url"
                  value={audioUrlInput}
                  onChange={(e) => setAudioUrlInput(e.target.value)}
                  placeholder="https://.../music.mp3"
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-xs text-neutral-200 focus:border-amber-400 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleImportAudioUrl()}
                />
                <button
                  onClick={handleImportAudioUrl}
                  disabled={!audioUrlInput.trim() || isImportingUrl}
                  className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-neutral-950 font-semibold text-xs rounded transition-colors cursor-pointer"
                >
                  {isImportingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (language === 'bn' ? 'যোগ' : 'Add')}
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              {[
                { id: 'all', label: language === 'bn' ? 'সবগুলো' : 'All', count: STOCK_AUDIO.length + uploadedAudios.length },
                { id: 'bgm', label: language === 'bn' ? 'বিজিএম মিউজিক' : 'Music (BGM)', count: STOCK_AUDIO.filter(a => a.category === 'Background Music').length },
                { id: 'sfx', label: language === 'bn' ? 'সাউন্ড এফেক্টস' : 'Sound FX', count: STOCK_AUDIO.filter(a => a.category === 'Sound FX').length },
                { id: 'uploads', label: language === 'bn' ? 'আমার আপলোড' : 'My Uploads', count: uploadedAudios.length },
                { id: 'synth', label: language === 'bn' ? 'সিন্থেসাইজার' : 'Synth Gen', count: '⚡' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAudioCategory(tab.id as any)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all font-medium flex items-center gap-1 cursor-pointer ${
                    audioCategory === tab.id
                      ? 'bg-amber-400 text-neutral-950 shadow-sm font-semibold'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[9px] px-1 rounded-full ${
                    audioCategory === tab.id ? 'bg-neutral-950/20 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input (for music & sfx) */}
            {audioCategory !== 'synth' && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={audioSearchQuery}
                  onChange={(e) => setAudioSearchQuery(e.target.value)}
                  placeholder={language === 'bn' ? 'অডিও বা সাউন্ড এফেক্ট খুঁজুন...' : 'Search music or sound effects...'}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:border-amber-400/80 outline-none"
                />
                {audioSearchQuery && (
                  <button 
                    onClick={() => setAudioSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* CUSTOM SYNTH GENERATOR PANEL */}
            {audioCategory === 'synth' && (
              <div className="p-3 bg-neutral-950 border border-amber-400/40 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-amber-400/20 text-amber-400">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-100">
                      {language === 'bn' ? 'ওয়েব অডিও সিন্থেসাইজার' : 'Web Audio Synthesizer'}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {language === 'bn' ? 'ব্রাউজারে রিয়েল-টাইম সাউন্ড তৈরি করে সরাসরি টাইমলাইনে নিন' : 'Synthesize custom royalty-free sounds directly'}
                    </div>
                  </div>
                </div>

                {/* Preset Dropdown */}
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">
                    {language === 'bn' ? 'সাউন্ড বা মিউজিক স্টাইল' : 'Sound or Music Style'}
                  </label>
                  <select
                    value={synthPreset}
                    onChange={(e) => setSynthPreset(e.target.value as SynthAudioType)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-xs text-neutral-200 focus:border-amber-400 outline-none cursor-pointer"
                  >
                    <optgroup label="── Background Music / বিজিএম ──">
                      <option value="lofi-beat">Lo-Fi Chill Beats (লো-ফাই চিল)</option>
                      <option value="cinematic-epic">Cinematic Epic Taiko (এপিক টাইকো ড্রাম)</option>
                      <option value="cinematic-drone">Cinematic Ambient Bass (সিনেমাটিক ড্রোন)</option>
                      <option value="cyber-synth">Cyber Synthwave 80s (সাইবার সিন্থওয়েভ)</option>
                      <option value="acoustic-warm">Warm Acoustic Guitar (অ্যাকোস্টিক গিটার)</option>
                      <option value="upbeat-vlog">Upbeat Vlog Pop Beat (আপবিট ভ্লগ পপ)</option>
                      <option value="ambient-piano">Emotional Piano Ambient (ইমোশনাল পিয়ানো)</option>
                      <option value="edm-drop">Gaming EDM Festival Drop (গেমিং ইডিএম)</option>
                      <option value="hiphop-trap">Punchy 808 Trap Beat (পাঞ্চি ৮০৮ ট্র্যাপ)</option>
                      <option value="celebration-fanfare">Celebration Fanfare (সেলিব্রেশন ফ্যানফেয়ার)</option>
                      <option value="chillhop">Chillhop Vinyl Rhodes (চিলহপ ভিনাইল)</option>
                      <option value="corporate-uplifting">Corporate Marimba (কর্পোরেট ম্যারিম্বা)</option>
                      <option value="retro-synthwave">Retro Neon Wave (রেট্রো নিয়ন ওয়েভ)</option>
                      <option value="bengali-flute">Bengali Flute & Tanpura (বাংলার বাঁশি ও তানপুরা)</option>
                      <option value="rain-ambient">Gentle Rain Ambient (শান্ত বৃষ্টির আবহ)</option>
                    </optgroup>
                    <optgroup label="── Sound Effects / সাউন্ড এফেক্টস ──">
                      <option value="whoosh">Fast Whoosh Transition (উশ ট্রানজিশন)</option>
                      <option value="pop">Clean Bubble Pop (বাবল পপ)</option>
                      <option value="bell">Notification Bell (নোটিফিকেশন বেল)</option>
                      <option value="camera">Vintage Camera Click (ক্যামেরা ক্লিক)</option>
                      <option value="glitch">Digital Glitch Zap (ডিজিটাল গ্লিচ)</option>
                      <option value="laser">Sci-Fi Laser Pew (লেজার বিম শুট)</option>
                      <option value="explosion">Cinematic Sub Explosion (এক্সপ্লোশন ধামাকা)</option>
                      <option value="applause">Audience Applause (হাততালি ও উল্লাস)</option>
                      <option value="keyboard">Keyboard Typing (কীবোর্ড টাইপিং)</option>
                      <option value="heartbeat">Heartbeat Thump (হার্টবিট স্পন্দন)</option>
                      <option value="success-ding">Success Achievement Ding (কমপ্লিট ডিং)</option>
                      <option value="error-buzz">Error Alert Buzzer (ভুল বাজার)</option>
                      <option value="game-coin">Retro 8-Bit Coin (গেম কয়েন জাম্প)</option>
                      <option value="riser">Tension Pitch Riser (টেনশন রাইজার)</option>
                    </optgroup>
                  </select>
                </div>

                {/* Duration Slider */}
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>{language === 'bn' ? 'সময়কাল' : 'Duration'}</span>
                    <span className="font-mono text-amber-400 font-semibold">{synthDuration}s</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    step="1"
                    value={synthDuration}
                    onChange={(e) => setSynthDuration(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-neutral-500 font-mono mt-0.5">
                    <span>2s</span>
                    <span>15s</span>
                    <span>30s</span>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateSynthTrack}
                  className="w-full py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-transform active:scale-98 flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'bn' ? 'তৈরি করে টাইমলাইনে যোগ করুন' : 'Synthesize & Add to Timeline'}</span>
                </button>
              </div>
            )}

            {/* AUDIO TRACKS LIST */}
            {audioCategory !== 'synth' && (
              <div className="space-y-2">
                {(() => {
                  // Compile list based on category and search
                  const allItems: Array<{
                    id: string;
                    name: string;
                    nameBn: string;
                    category: string;
                    duration: number;
                    url: string;
                    isUploaded?: boolean;
                  }> = [
                    ...uploadedAudios.map((u) => ({
                      id: u.id,
                      name: u.name,
                      nameBn: u.name,
                      category: 'My Uploads',
                      duration: u.duration,
                      url: u.url,
                      isUploaded: true
                    })),
                    ...STOCK_AUDIO.map((s) => ({
                      id: s.id,
                      name: s.name,
                      nameBn: s.nameBn || s.name,
                      category: s.category || 'Background Music',
                      duration: s.duration,
                      url: s.url,
                      isUploaded: false
                    }))
                  ];

                  let filtered = allItems;
                  if (audioCategory === 'bgm') {
                    filtered = filtered.filter((i) => i.category === 'Background Music');
                  } else if (audioCategory === 'sfx') {
                    filtered = filtered.filter((i) => i.category === 'Sound FX');
                  } else if (audioCategory === 'uploads') {
                    filtered = filtered.filter((i) => i.isUploaded);
                  }

                  if (audioSearchQuery.trim()) {
                    const q = audioSearchQuery.toLowerCase();
                    filtered = filtered.filter((i) => 
                      i.name.toLowerCase().includes(q) || 
                      i.nameBn.toLowerCase().includes(q) ||
                      i.category.toLowerCase().includes(q)
                    );
                  }

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-8 text-neutral-500 text-xs">
                        {audioCategory === 'uploads' ? (
                          <div className="space-y-2">
                            <FileAudio className="w-8 h-8 mx-auto text-neutral-600" />
                            <div>{language === 'bn' ? 'কোনো আপলোড করা অডিও পাওয়া যায়নি।' : 'No uploaded audio yet.'}</div>
                            <button
                              onClick={() => audioFileInputRef.current?.click()}
                              className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded text-[11px] font-medium"
                            >
                              {language === 'bn' ? 'অডিও ফাইল আপলোড করুন' : 'Upload an Audio File'}
                            </button>
                          </div>
                        ) : (
                          <div>{language === 'bn' ? 'কোনো অডিও ট্র্যাক মেলেনি।' : 'No matching audio tracks found.'}</div>
                        )}
                      </div>
                    );
                  }

                  return filtered.map((item) => {
                    const isPlaying = playingAudioId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 bg-neutral-950 border rounded-lg flex items-center justify-between transition-all group ${
                          isPlaying 
                            ? 'border-amber-400/80 bg-neutral-900/80 ring-1 ring-amber-400/20' 
                            : 'border-neutral-800/80 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                          <button
                            onClick={() => handlePreviewAudio(item.id, item.url, item.duration)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
                              isPlaying
                                ? 'bg-amber-400 text-neutral-950 shadow-md animate-pulse'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-amber-400'
                            }`}
                            title={isPlaying ? t.pause : t.play}
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 ml-0.5 fill-current" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-neutral-200 truncate text-xs group-hover:text-amber-300 transition-colors">
                              {language === 'bn' ? item.nameBn : item.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-neutral-400">
                              <span className="font-mono text-neutral-400">{item.duration}s</span>
                              <span>·</span>
                              <span className="px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-400 text-[9px] border border-neutral-800 truncate">
                                {item.isUploaded 
                                  ? (language === 'bn' ? 'আমার ফাইল' : 'Uploaded')
                                  : (item.category === 'Sound FX' ? 'SFX' : 'BGM')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Add to Timeline Button */}
                        <button
                          onClick={() => {
                            const src = item.url.startsWith('synth://')
                              ? createSyntheticAudioBuffer(item.url.replace('synth://', '') as any, item.duration)
                              : item.url;

                            onAddClip({
                              name: language === 'bn' ? item.nameBn : item.name,
                              type: 'audio',
                              src,
                              duration: item.duration,
                              trackId: 'track-audio',
                              waveform: generateWaveformPoints(Math.min(50, Math.round(item.duration * 4)))
                            });

                            triggerAudioToast(
                              language === 'bn'
                                ? `"${item.nameBn}" টাইমলাইনে যোগ হয়েছে!`
                                : `"${item.name}" added to timeline!`
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-amber-400 hover:text-neutral-950 text-neutral-200 transition-all flex items-center gap-1 text-[11px] font-semibold shrink-0 cursor-pointer shadow-sm active:scale-95"
                          title={t.addToTimeline}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{language === 'bn' ? 'যোগ' : 'Add'}</span>
                        </button>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: VOICEOVER MIC */}
        {activeTab === 'voiceover' && (
          <div className="space-y-4">
            <div className="text-center py-4 bg-neutral-950 border border-neutral-800 rounded-xl p-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <Mic className={`w-8 h-8 ${isRecording ? 'animate-pulse text-rose-500' : ''}`} />
              </div>

              <div className="text-lg font-mono font-bold text-white mb-1">
                {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:
                {(recordingSeconds % 60).toFixed(1).padStart(4, '0')}
              </div>

              <div className="text-[11px] text-neutral-400 mb-4">
                {isRecording 
                  ? t.recordingActive 
                  : (language === 'bn' ? 'মাইক্রোফোনে কথা বলে সরাসরি ভিডিওতে ভয়েস যোগ করুন' : 'Record voiceover and place directly onto timeline')}
              </div>

              {/* Volume VU Meter bar */}
              {isRecording && (
                <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden mb-4">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-75"
                    style={{ width: `${Math.min(100, micVolume * 100)}%` }}
                  />
                </div>
              )}

              {isRecording ? (
                <button
                  onClick={handleStopRecording}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold flex items-center gap-2 mx-auto shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <Square className="w-4 h-4" />
                  <span>{t.stopRecording}</span>
                </button>
              ) : (
                <button
                  onClick={handleStartRecording}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold flex items-center gap-2 mx-auto shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>{t.startRecording}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: STICKERS */}
        {activeTab === 'stickers' && (
          <div className="space-y-3">
            <div className="text-neutral-400 font-medium">{t.stickers}</div>
            <div className="grid grid-cols-4 gap-2">
              {STICKER_PRESETS.map((stk, idx) => (
                <button
                  key={idx}
                  onClick={() => onAddClip({
                    name: `Sticker ${stk.label}`,
                    type: 'sticker',
                    duration: 3.0,
                    trackId: 'track-sticker',
                    stickerProperties: {
                      emojiOrSvg: stk.emoji,
                      category: stk.category
                    }
                  })}
                  className="h-14 bg-neutral-950 border border-neutral-800 hover:border-amber-400/80 rounded-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-pointer"
                  title={stk.label}
                >
                  {stk.emoji}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
