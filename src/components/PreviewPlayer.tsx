import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Clip, AspectRatio } from '../types/editor';
import { renderFrameAtTime } from '../utils/videoExporter';
import { Language, i18n } from '../translations';
import { loadMediaElement, isVideoSource, MediaElement } from '../utils/mediaLoader';
import { 
  Play, 
  Pause, 
  SkipBack, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Scissors, 
  Trash2, 
  Copy,
  Repeat
} from 'lucide-react';

interface PreviewPlayerProps {
  clips: Clip[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  aspectRatio: AspectRatio;
  language: Language;
  selectedClip: Clip | null;
  onUpdateSelectedClip: (updates: Partial<Clip>) => void;
  onSplitClip: () => void;
  onDeleteClip: () => void;
  onDuplicateClip: () => void;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  clips,
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  aspectRatio,
  language,
  selectedClip,
  onUpdateSelectedClip,
  onSplitClip,
  onDeleteClip,
  onDuplicateClip
}) => {
  const t = i18n[language];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLooping, setIsLooping] = useState(true);
  const [masterVolume, setMasterVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Audio elements pool for live synchronized playback
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  // In-flight play promises to guard against "The play() request was interrupted by a call to pause()."
  const playPromisesRef = useRef<Map<string, Promise<void>>>(new Map());

  // Cached preloaded media (images and real video elements)
  const mediaCacheRef = useRef<Map<string, MediaElement>>(new Map());

  // Safe play helper
  const safePlayAudio = useCallback((id: string, el: HTMLAudioElement) => {
    if (!el.paused) return;
    try {
      const promise = el.play();
      if (promise !== undefined) {
        playPromisesRef.current.set(id, promise);
        promise
          .catch((err) => {
            // Silence AbortError / NotAllowedError caused by rapid play/pause or browser policy
            if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
              console.warn('Audio play exception:', err);
            }
          })
          .finally(() => {
            if (playPromisesRef.current.get(id) === promise) {
              playPromisesRef.current.delete(id);
            }
          });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Audio play error:', err);
      }
    }
  }, []);

  // Safe pause helper that awaits any pending play promise before calling pause()
  const safePauseAudio = useCallback((id: string, el: HTMLAudioElement) => {
    const pendingPromise = playPromisesRef.current.get(id);
    if (pendingPromise) {
      pendingPromise
        .catch(() => {})
        .finally(() => {
          try {
            if (!el.paused) {
              el.pause();
            }
          } catch {
            // ignore
          }
        });
    } else {
      try {
        if (!el.paused) {
          el.pause();
        }
      } catch {
        // ignore
      }
    }
  }, []);

  // Preload media (images and videos) whenever clips change
  useEffect(() => {
    clips.forEach(async (clip) => {
      if (clip.src && !clip.src.startsWith('procedural://') && !clip.src.startsWith('synth://')) {
        if (!mediaCacheRef.current.has(clip.src)) {
          const isVid = isVideoSource(clip.src, clip.type);
          const el = await loadMediaElement(clip.src, isVid);
          if (el) {
            mediaCacheRef.current.set(clip.src, el);
            drawCurrentFrame();
          }
        }
      }
    });
  }, [clips]);

  // Render canvas frame
  const drawCurrentFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed internal canvas resolution for crisp rendering
    const width = 1280;
    const height = Math.round(
      aspectRatio === '16:9' ? 720 :
      aspectRatio === '9:16' ? (1280 * 16) / 9 :
      aspectRatio === '1:1' ? 1280 :
      aspectRatio === '4:5' ? (1280 * 5) / 4 :
      (1280 * 9) / 21
    );

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    renderFrameAtTime(ctx, clips, currentTime, width, height, mediaCacheRef.current);
  }, [clips, currentTime, aspectRatio]);

  useEffect(() => {
    drawCurrentFrame();
  }, [drawCurrentFrame]);

  // Cleanup all audio on unmount
  useEffect(() => {
    return () => {
      audioElementsRef.current.forEach((el, id) => {
        safePauseAudio(id, el);
      });
    };
  }, [safePauseAudio]);

  // Audio synchronization during playback
  useEffect(() => {
    const activeAudios = clips.filter(
      (c) => (c.type === 'audio' || c.type === 'video') && 
             c.src && 
             currentTime >= c.start && 
             currentTime < c.start + c.duration &&
             !c.muted
    );
    const activeIds = new Set(activeAudios.map((c) => c.id));

    if (isPlaying && !isMuted) {
      activeAudios.forEach((clip) => {
        let el = audioElementsRef.current.get(clip.id);
        if (!el) {
          el = new Audio(clip.src);
          audioElementsRef.current.set(clip.id, el);
        }
        const timeInClip = (currentTime - clip.start) * clip.speed;
        // Only re-align if out of sync by more than 350ms to prevent stutter and play cancellation
        if (Math.abs(el.currentTime - timeInClip) > 0.35) {
          el.currentTime = Math.max(0, timeInClip);
        }
        el.volume = Math.max(0, Math.min(1, clip.volume * masterVolume));
        if (el.paused) {
          safePlayAudio(clip.id, el);
        }
      });

      // Pause audio elements that are no longer active
      audioElementsRef.current.forEach((el, id) => {
        if (!activeIds.has(id)) {
          safePauseAudio(id, el);
        }
      });
    } else {
      // Pause all audio safely
      audioElementsRef.current.forEach((el, id) => {
        safePauseAudio(id, el);
      });
    }
  }, [isPlaying, currentTime, clips, masterVolume, isMuted, safePlayAudio, safePauseAudio]);

  // Keyboard shortcut listener (Spacebar for play/pause, Left/Right arrows for frame step)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // don't hijack inputs
      }
      if (e.code === 'Space') {
        e.preventDefault();
        onPlayPause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onSeek(Math.max(0, currentTime - 0.1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onSeek(Math.min(duration, currentTime + 0.1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, isPlaying, onPlayPause, onSeek]);

  // Format timecode (00:04.12)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    const f = Math.floor((secs % 1) * 100).toString().padStart(2, '0');
    return `${m}:${s}.${f}`;
  };

  // Dragging overlay element directly on canvas
  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number; initialClipX: number; initialClipY: number }>({
    x: 0,
    y: 0,
    initialClipX: 0,
    initialClipY: 0
  });

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (!selectedClip) return;
    setIsDraggingOverlay(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      initialClipX: selectedClip.transform.x,
      initialClipY: selectedClip.transform.y
    };
  };

  const handleOverlayMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingOverlay || !selectedClip || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaXPercent = ((e.clientX - dragStartPos.current.x) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - dragStartPos.current.y) / rect.height) * 100;

    onUpdateSelectedClip({
      transform: {
        ...selectedClip.transform,
        x: Math.round(dragStartPos.current.initialClipX + deltaXPercent),
        y: Math.round(dragStartPos.current.initialClipY + deltaYPercent)
      }
    });
  };

  const handleOverlayMouseUp = () => {
    setIsDraggingOverlay(false);
  };

  // Determine CSS aspect ratio class
  const getAspectStyle = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[460px]';
      case '1:1':
        return 'aspect-square max-h-[460px]';
      case '4:5':
        return 'aspect-[4/5] max-h-[460px]';
      case '21:9':
        return 'aspect-[21/9] max-h-[380px]';
      case '16:9':
      default:
        return 'aspect-video max-h-[460px]';
    }
  };

  return (
    <div 
      className="flex-1 bg-neutral-950 flex flex-col min-w-0 select-none overflow-hidden relative"
      onMouseMove={handleOverlayMouseMove}
      onMouseUp={handleOverlayMouseUp}
    >
      {/* Top Quick Actions Bar */}
      <div className="h-10 px-4 border-b border-neutral-800/80 bg-neutral-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedClip ? (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-400">{language === 'bn' ? 'ক্লিপ:' : 'Clip:'}</span>
              <span className="font-semibold text-white truncate max-w-[160px]">{selectedClip.name}</span>
              <div className="h-3 w-px bg-neutral-700 mx-1" />
              <button
                onClick={onSplitClip}
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                title={t.split}
              >
                <Scissors className="w-3 h-3 text-amber-400" />
                <span>{t.split}</span>
              </button>
              <button
                onClick={onDuplicateClip}
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                title={t.duplicate}
              >
                <Copy className="w-3 h-3 text-neutral-400" />
                <span>{t.duplicate}</span>
              </button>
              <button
                onClick={onDeleteClip}
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-rose-900/40 text-neutral-300 hover:text-rose-400 flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                title={t.delete}
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>{t.delete}</span>
              </button>
            </div>
          ) : (
            <span className="text-xs text-neutral-500 italic">
              {t.noClipSelected}
            </span>
          )}
        </div>

        {/* Timecode readouts */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-amber-400 font-semibold">{formatTime(currentTime)}</span>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-400">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Screen Viewport Container */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 bg-neutral-950/90 relative">
        <div 
          ref={containerRef}
          className={`relative border border-neutral-800 rounded-lg shadow-2xl bg-black overflow-hidden flex items-center justify-center ${getAspectStyle()}`}
        >
          <canvas 
            ref={canvasRef} 
            className="w-full h-full object-contain pointer-events-none"
          />

          {/* Draggable Bounding Box Overlay for Selected Text/Sticker */}
          {selectedClip && (selectedClip.type === 'text' || selectedClip.type === 'sticker') && (
            <div
              onMouseDown={handleOverlayMouseDown}
              className="absolute border-2 border-dashed border-amber-400 bg-amber-400/10 cursor-move rounded transition-transform"
              style={{
                left: `calc(50% + ${selectedClip.transform.x}%)`,
                top: `calc(50% + ${selectedClip.transform.y}%)`,
                transform: `translate(-50%, -50%) scale(${selectedClip.transform.scale}) rotate(${selectedClip.transform.rotation}deg)`,
                padding: '8px 16px',
                zIndex: 20
              }}
            >
              <span className="text-[10px] bg-amber-400 text-neutral-950 font-bold px-1 py-0.5 rounded absolute -top-4 left-0 pointer-events-none">
                {selectedClip.type.toUpperCase()}
              </span>
              <div className="text-white text-xs opacity-0">DRAG OVERLAY</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Transport Controls Bar */}
      <div className="h-12 px-4 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between shrink-0 select-none">
        
        {/* Left: Frame Navigation & Loop */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSeek(0)}
            className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Jump to Start"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 0.1))}
            className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Step Backward 0.1s"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSeek(Math.min(duration, currentTime + 0.1))}
            className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Step Forward 0.1s"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              isLooping ? 'text-amber-400 bg-neutral-800' : 'text-neutral-500 hover:text-neutral-300'
            }`}
            title="Loop playback"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Main Play/Pause Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPlayPause}
            className="w-9 h-9 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center justify-center font-bold shadow transition-transform active:scale-95 cursor-pointer"
            title="Play / Pause (Spacebar)"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-neutral-950" />
            ) : (
              <Play className="w-4 h-4 fill-neutral-950 ml-0.5" />
            )}
          </button>
        </div>

        {/* Right: Volume & Fullscreen */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-neutral-400 hover:text-white cursor-pointer"
            >
              {isMuted || masterVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : masterVolume}
              onChange={(e) => {
                setMasterVolume(Number(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-16 accent-amber-400 cursor-pointer h-1"
            />
          </div>

          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                containerRef.current?.requestFullscreen();
                setIsFullscreen(true);
              } else {
                document.exitFullscreen();
                setIsFullscreen(false);
              }
            }}
            className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
