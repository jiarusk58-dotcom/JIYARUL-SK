import React, { useRef, useState, useEffect } from 'react';
import { Clip, Track, TrackType } from '../types/editor';
import { Language, i18n } from '../translations';
import { 
  Scissors, 
  Trash2, 
  Copy, 
  ZoomIn, 
  ZoomOut, 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock,
  Magnet,
  Film,
  Type,
  Smile,
  Music,
  Mic,
  Plus,
  Upload
} from 'lucide-react';
import { getAudioFileMetadata } from '../utils/audioSynth';

interface TimelineProps {
  tracks: Track[];
  clips: Clip[];
  currentTime: number;
  duration: number;
  zoom: number; // pixels per second
  onZoomChange: (newZoom: number) => void;
  onSeek: (time: number) => void;
  selectedClipId: string | null;
  onSelectClip: (clipId: string | null) => void;
  onUpdateClip: (clipId: string, updates: Partial<Clip>) => void;
  onSplitClip: () => void;
  onDeleteClip: () => void;
  onDuplicateClip: () => void;
  onToggleTrackMute: (trackId: string) => void;
  onToggleTrackLock: (trackId: string) => void;
  onOpenAudioTab?: () => void;
  onAddClip?: (partial: Partial<Clip>) => void;
  language: Language;
}

export const Timeline: React.FC<TimelineProps> = ({
  tracks,
  clips,
  currentTime,
  duration,
  zoom,
  onZoomChange,
  onSeek,
  selectedClipId,
  onSelectClip,
  onUpdateClip,
  onSplitClip,
  onDeleteClip,
  onDuplicateClip,
  onToggleTrackMute,
  onToggleTrackLock,
  onOpenAudioTab,
  onAddClip,
  language
}) => {
  const t = i18n[language];
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const timelineAudioInputRef = useRef<HTMLInputElement>(null);

  const handleTimelineAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onAddClip) return;
    for (let i = 0; i < files.length; i++) {
      try {
        const meta = await getAudioFileMetadata(files[i]);
        onAddClip({
          name: meta.name,
          type: 'audio',
          src: meta.url,
          duration: meta.duration,
          trackId: 'track-audio',
          waveform: meta.waveform
        });
      } catch (err) {
        console.error('Timeline audio upload error:', err);
      }
    }
    if (timelineAudioInputRef.current) timelineAudioInputRef.current.value = '';
  };

  const [snapEnabled, setSnapEnabled] = useState(true);

  // Dragging state for playhead
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Dragging state for moving clip
  const [draggingClip, setDraggingClip] = useState<{
    id: string;
    initialStart: number;
    initialMouseX: number;
  } | null>(null);

  // Trimming state for clip edges
  const [trimmingClip, setTrimmingClip] = useState<{
    id: string;
    edge: 'start' | 'end';
    initialStart: number;
    initialDuration: number;
    initialMouseX: number;
  } | null>(null);

  // Snap time helper
  const snapTime = (targetTime: number, excludeClipId?: string): number => {
    if (!snapEnabled) return targetTime;
    const threshold = 6 / zoom; // ~6 pixels snap window

    // Check 0
    if (Math.abs(targetTime - 0) < threshold) return 0;
    // Check playhead
    if (Math.abs(targetTime - currentTime) < threshold) return currentTime;

    // Check clip boundaries
    for (const c of clips) {
      if (c.id === excludeClipId) continue;
      if (Math.abs(targetTime - c.start) < threshold) return c.start;
      if (Math.abs(targetTime - (c.start + c.duration)) < threshold) return c.start + c.duration;
    }
    return targetTime;
  };

  // Playhead scrubber mouse interactions
  const handleRulerMouseDown = (e: React.MouseEvent) => {
    setIsScrubbing(true);
    updatePlayheadFromMouse(e.clientX);
  };

  const updatePlayheadFromMouse = (clientX: number) => {
    if (!scrollContainerRef.current) return;
    const rect = scrollContainerRef.current.getBoundingClientRect();
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const offsetX = clientX - rect.left + scrollLeft;
    const newTime = Math.max(0, Math.min(duration, offsetX / zoom));
    onSeek(newTime);
  };

  // Global mouse move & up listeners for scrubbing & clip dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing) {
        updatePlayheadFromMouse(e.clientX);
      } else if (draggingClip) {
        const deltaX = e.clientX - draggingClip.initialMouseX;
        const deltaTime = deltaX / zoom;
        let newStart = Math.max(0, draggingClip.initialStart + deltaTime);
        newStart = snapTime(newStart, draggingClip.id);
        onUpdateClip(draggingClip.id, { start: Math.round(newStart * 100) / 100 });
      } else if (trimmingClip) {
        const deltaX = e.clientX - trimmingClip.initialMouseX;
        const deltaTime = deltaX / zoom;
        if (trimmingClip.edge === 'end') {
          let newDuration = Math.max(0.3, trimmingClip.initialDuration + deltaTime);
          const endPoint = snapTime(trimmingClip.initialStart + newDuration, trimmingClip.id);
          newDuration = Math.max(0.3, endPoint - trimmingClip.initialStart);
          onUpdateClip(trimmingClip.id, { duration: Math.round(newDuration * 100) / 100 });
        } else {
          // trimming start edge
          let newStart = Math.max(0, trimmingClip.initialStart + deltaTime);
          newStart = snapTime(newStart, trimmingClip.id);
          const maxStart = trimmingClip.initialStart + trimmingClip.initialDuration - 0.3;
          newStart = Math.min(maxStart, newStart);
          const newDuration = (trimmingClip.initialStart + trimmingClip.initialDuration) - newStart;
          onUpdateClip(trimmingClip.id, {
            start: Math.round(newStart * 100) / 100,
            duration: Math.round(newDuration * 100) / 100
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      setDraggingClip(null);
      setTrimmingClip(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrubbing, draggingClip, trimmingClip, zoom, duration, currentTime, clips]);

  // Track icons helper
  const getTrackIcon = (type: TrackType) => {
    switch (type) {
      case 'text':
        return <Type className="w-3.5 h-3.5 text-sky-400" />;
      case 'sticker':
        return <Smile className="w-3.5 h-3.5 text-pink-400" />;
      case 'video':
        return <Film className="w-3.5 h-3.5 text-amber-400" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-emerald-400" />;
      case 'voiceover':
        return <Mic className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  const timelineWidth = Math.max(1200, duration * zoom + 300);

  // Generate ruler tick marks
  const renderRulerTicks = () => {
    const ticks = [];
    const stepSeconds = zoom > 60 ? 1 : zoom > 30 ? 2 : 5;
    for (let s = 0; s <= duration + 5; s += stepSeconds) {
      const x = s * zoom;
      const m = Math.floor(s / 60);
      const sec = s % 60;
      const label = `${m}:${sec.toString().padStart(2, '0')}`;
      ticks.push(
        <div 
          key={s} 
          className="absolute top-0 bottom-0 border-l border-neutral-700/60 flex flex-col justify-between"
          style={{ left: `${x}px` }}
        >
          <span className="text-[10px] font-mono text-neutral-400 pl-1 select-none pointer-events-none">
            {label}
          </span>
          <div className="w-px h-1.5 bg-neutral-600" />
        </div>
      );
    }
    return ticks;
  };

  return (
    <div className="h-64 bg-neutral-950 border-t border-neutral-800 flex flex-col shrink-0 select-none overflow-hidden z-20">
      
      {/* Top Toolbar */}
      <div className="h-10 bg-neutral-900/90 border-b border-neutral-800 px-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onSplitClip}
            disabled={!selectedClipId}
            className={`px-2.5 py-1 rounded flex items-center gap-1 font-medium transition-colors ${
              selectedClipId 
                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white cursor-pointer' 
                : 'text-neutral-600 cursor-not-allowed'
            }`}
            title={t.split}
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.split}</span>
          </button>

          <button
            onClick={onDeleteClip}
            disabled={!selectedClipId}
            className={`p-1.5 rounded transition-colors ${
              selectedClipId 
                ? 'text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 cursor-pointer' 
                : 'text-neutral-600 cursor-not-allowed'
            }`}
            title={t.delete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onDuplicateClip}
            disabled={!selectedClipId}
            className={`p-1.5 rounded transition-colors ${
              selectedClipId 
                ? 'text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer' 
                : 'text-neutral-600 cursor-not-allowed'
            }`}
            title={t.duplicate}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-neutral-800 mx-1" />

          {/* Magnetic snap */}
          <button
            onClick={() => setSnapEnabled(!snapEnabled)}
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
              snapEnabled ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30' : 'text-neutral-500 hover:text-neutral-300'
            }`}
            title={t.snapToGrid}
          >
            <Magnet className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'স্ন্যাপ' : 'Snap'}</span>
          </button>

          <div className="h-4 w-px bg-neutral-800 mx-1" />

          {/* Add Audio Shortcut in Timeline Toolbar */}
          <input
            ref={timelineAudioInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={handleTimelineAudioUpload}
            className="hidden"
          />
          <button
            onClick={() => {
              if (onOpenAudioTab) onOpenAudioTab();
            }}
            className="px-2.5 py-1 rounded flex items-center gap-1.5 text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 transition-colors cursor-pointer shadow-sm"
            title={language === 'bn' ? 'অডিও স্টুডিও ও লাইব্রেরি খুলুন' : 'Open Audio Studio'}
          >
            <Music className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'bn' ? '+ অডিও যোগ করুন' : '+ Add Audio'}</span>
          </button>

          <button
            onClick={() => timelineAudioInputRef.current?.click()}
            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title={language === 'bn' ? 'সরাসরি অডিও ফাইল আপলোড করুন' : 'Upload Audio File'}
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>

        {/* Timeline Zoom Slider */}
        <div className="flex items-center gap-2">
          <ZoomOut className="w-3.5 h-3.5 text-neutral-400" />
          <input
            type="range"
            min="20"
            max="120"
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="w-24 accent-amber-400 cursor-pointer h-1"
          />
          <ZoomIn className="w-3.5 h-3.5 text-neutral-400" />
        </div>
      </div>

      {/* Main Track Lanes + Headers */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Track Headers Column */}
        <div className="w-48 bg-neutral-900 border-r border-neutral-800 shrink-0 flex flex-col pt-6 z-10">
          {tracks.map((track) => (
            <div 
              key={track.id}
              className="h-10 px-2.5 border-b border-neutral-800/80 flex items-center justify-between group hover:bg-neutral-800/40 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                {getTrackIcon(track.type)}
                <span className="font-medium text-xs text-neutral-300 truncate">
                  {language === 'bn' ? track.nameBn : track.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {(track.type === 'audio' || track.type === 'voiceover') && (
                  <button
                    onClick={() => {
                      if (onOpenAudioTab) onOpenAudioTab();
                    }}
                    className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer transition-colors shadow-xs"
                    title={language === 'bn' ? 'অডিও যোগ করুন' : 'Add Audio'}
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>{language === 'bn' ? 'অডিও' : 'Audio'}</span>
                  </button>
                )}
                <button
                  onClick={() => onToggleTrackMute(track.id)}
                  className="p-1 rounded text-neutral-500 hover:text-white transition-colors cursor-pointer"
                  title={track.muted ? 'Unmute track' : 'Mute track'}
                >
                  {track.muted ? (
                    <VolumeX className="w-3 h-3 text-rose-400" />
                  ) : (
                    <Volume2 className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={() => onToggleTrackLock(track.id)}
                  className="p-1 rounded text-neutral-500 hover:text-white transition-colors cursor-pointer"
                  title={track.locked ? 'Unlock track' : 'Lock track'}
                >
                  {track.locked ? (
                    <Lock className="w-3 h-3 text-amber-400" />
                  ) : (
                    <Unlock className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Scrollable Tracks Viewport */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden relative bg-neutral-950"
        >
          {/* Time Ruler */}
          <div 
            ref={rulerRef}
            onMouseDown={handleRulerMouseDown}
            className="h-6 bg-neutral-900 border-b border-neutral-800 relative cursor-pointer select-none"
            style={{ width: `${timelineWidth}px` }}
          >
            {renderRulerTicks()}
          </div>

          {/* Draggable Playhead Needle */}
          <div 
            className="absolute top-0 bottom-0 pointer-events-none z-30"
            style={{ left: `${currentTime * zoom}px` }}
          >
            {/* Playhead marker handle */}
            <div className="w-3 h-3 bg-amber-400 rotate-45 -ml-1.5 -mt-0.5 shadow-md" />
            {/* Playhead vertical line */}
            <div className="w-0.5 h-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          </div>

          {/* Track Lanes */}
          <div 
            className="flex flex-col relative"
            style={{ width: `${timelineWidth}px` }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                onSelectClip(null);
              }
            }}
          >
            {tracks.map((track) => {
              const trackClips = clips.filter((c) => c.trackId === track.id);

              return (
                <div 
                  key={track.id}
                  className="h-10 border-b border-neutral-900 relative bg-neutral-950/40 hover:bg-neutral-900/20 transition-colors"
                >
                  {trackClips.map((clip) => {
                    const isSelected = selectedClipId === clip.id;
                    const left = clip.start * zoom;
                    const width = clip.duration * zoom;

                    return (
                      <div
                        key={clip.id}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          onSelectClip(clip.id);
                          setDraggingClip({
                            id: clip.id,
                            initialStart: clip.start,
                            initialMouseX: e.clientX
                          });
                        }}
                        className={`absolute top-1 bottom-1 rounded-md overflow-hidden flex items-center cursor-grab active:cursor-grabbing border transition-shadow ${
                          isSelected
                            ? 'border-amber-400 shadow-md ring-2 ring-amber-400/30 z-20'
                            : 'border-neutral-700/60 hover:border-neutral-500 z-10'
                        } ${
                          clip.type === 'video'
                            ? 'bg-gradient-to-r from-blue-900/70 to-indigo-900/70 text-blue-100'
                            : clip.type === 'text'
                            ? 'bg-gradient-to-r from-amber-900/70 to-orange-900/70 text-amber-100'
                            : clip.type === 'sticker'
                            ? 'bg-gradient-to-r from-pink-900/70 to-rose-900/70 text-pink-100'
                            : clip.type === 'audio'
                            ? 'bg-gradient-to-r from-emerald-950 to-teal-950 text-emerald-200'
                            : 'bg-gradient-to-r from-rose-950 to-purple-950 text-rose-200'
                        }`}
                        style={{
                          left: `${left}px`,
                          width: `${width}px`
                        }}
                      >
                        {/* Left Trim Handle */}
                        {isSelected && (
                          <div 
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setTrimmingClip({
                                id: clip.id,
                                edge: 'start',
                                initialStart: clip.start,
                                initialDuration: clip.duration,
                                initialMouseX: e.clientX
                              });
                            }}
                            className="absolute left-0 top-0 bottom-0 w-2.5 bg-amber-400 hover:bg-amber-300 cursor-ew-resize z-20 flex items-center justify-center"
                          >
                            <div className="w-0.5 h-3 bg-neutral-950 rounded" />
                          </div>
                        )}

                        {/* Content display */}
                        <div className="flex-1 px-2.5 flex items-center gap-1.5 overflow-hidden text-xs">
                          {/* Mini Thumbnail or icon */}
                          {clip.thumbnail ? (
                            <img 
                              src={clip.thumbnail} 
                              alt="" 
                              className="w-6 h-6 object-cover rounded shrink-0 pointer-events-none" 
                            />
                          ) : clip.type === 'text' ? (
                            <Type className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                          ) : clip.type === 'sticker' ? (
                            <span className="text-sm shrink-0">{clip.stickerProperties?.emojiOrSvg}</span>
                          ) : clip.type === 'audio' ? (
                            <Music className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          ) : (
                            <Mic className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                          )}

                          <span className="font-semibold truncate leading-none text-[11px]">
                            {clip.textProperties ? clip.textProperties.text : clip.name}
                          </span>

                          <span className="text-[10px] opacity-70 ml-auto font-mono shrink-0">
                            {clip.duration.toFixed(1)}s
                          </span>
                        </div>

                        {/* Waveform Visualization for Audio clips */}
                        {(clip.type === 'audio' || clip.trackId === 'track-voiceover') && clip.waveform && (
                          <div className="absolute inset-0 opacity-25 flex items-center justify-around pointer-events-none px-2">
                            {clip.waveform.map((h, i) => (
                              <div
                                key={i}
                                className="w-0.5 bg-current rounded-full"
                                style={{ height: `${h * 100}%` }}
                              />
                            ))}
                          </div>
                        )}

                        {/* Right Trim Handle */}
                        {isSelected && (
                          <div 
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setTrimmingClip({
                                id: clip.id,
                                edge: 'end',
                                initialStart: clip.start,
                                initialDuration: clip.duration,
                                initialMouseX: e.clientX
                              });
                            }}
                            className="absolute right-0 top-0 bottom-0 w-2.5 bg-amber-400 hover:bg-amber-300 cursor-ew-resize z-20 flex items-center justify-center"
                          >
                            <div className="w-0.5 h-3 bg-neutral-950 rounded" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
