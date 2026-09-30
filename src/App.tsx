/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clip, Track, AspectRatio, VideoTemplate } from './types/editor';
import { Language, i18n } from './translations';
import { Header } from './components/Header';
import { LeftSidebar, SidebarTab } from './components/LeftSidebar';
import { AssetPanel } from './components/AssetPanel';
import { PreviewPlayer } from './components/PreviewPlayer';
import { Timeline } from './components/Timeline';
import { ClipInspector } from './components/ClipInspector';
import { ExportModal } from './components/ExportModal';
import { STOCK_VIDEOS, STOCK_AUDIO } from './data/stockLibrary';
import { generateWaveformPoints, createSyntheticAudioBuffer } from './utils/audioSynth';

const INITIAL_TRACKS: Track[] = [
  { id: 'track-text', name: 'Text & Titles', nameBn: 'টেক্সট ও টাইটেল', type: 'text', muted: false, locked: false, visible: true },
  { id: 'track-sticker', name: 'Stickers & PIP', nameBn: 'স্টিকার ও পিআইপি', type: 'sticker', muted: false, locked: false, visible: true },
  { id: 'track-video', name: 'Main Video', nameBn: 'প্রধান ভিডিও ট্র্যাক', type: 'video', muted: false, locked: false, visible: true },
  { id: 'track-audio', name: 'Background Music', nameBn: 'মিউজিক ট্র্যাক', type: 'audio', muted: false, locked: false, visible: true },
  { id: 'track-voiceover', name: 'Voiceover Audio', nameBn: 'ভয়েসওভার ট্র্যাক', type: 'voiceover', muted: false, locked: false, visible: true },
];

export default function App() {
  // App state
  const [language, setLanguage] = useState<Language>('bn');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [activeTab, setActiveTab] = useState<SidebarTab>('templates');
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  // Playback state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(45); // pixels per second
  const [selectedClipId, setSelectedClipId] = useState<string | null>('clip-video-1');

  // Initial rich sample project clips so the editor is populated and alive immediately!
  const [clips, setClips] = useState<Clip[]>([
    {
      id: 'clip-video-1',
      trackId: 'track-video',
      name: 'Mountain Sunset',
      type: 'video',
      src: STOCK_VIDEOS[0].url,
      thumbnail: STOCK_VIDEOS[0].thumbnail,
      start: 0,
      duration: 5.0,
      trimStart: 0,
      volume: 1.0,
      muted: false,
      speed: 1.0,
      opacity: 1.0,
      filter: 'warm',
      filterAdjustments: { brightness: 105, contrast: 110, saturation: 115, vignette: 20, blur: 0 },
      transform: { x: 0, y: 0, scale: 1.0, rotation: 0 },
      transitionIn: { type: 'fade', duration: 0.8 },
      transitionOut: { type: 'fade', duration: 0.6 }
    },
    {
      id: 'clip-video-2',
      trackId: 'track-video',
      name: 'Cyberpunk Neon',
      type: 'video',
      src: STOCK_VIDEOS[1].url,
      thumbnail: STOCK_VIDEOS[1].thumbnail,
      start: 5.0,
      duration: 5.0,
      trimStart: 0,
      volume: 1.0,
      muted: false,
      speed: 1.0,
      opacity: 1.0,
      filter: 'cyberpunk',
      filterAdjustments: { brightness: 100, contrast: 120, saturation: 130, vignette: 30, blur: 0 },
      transform: { x: 0, y: 0, scale: 1.0, rotation: 0 },
      transitionIn: { type: 'zoom-in', duration: 0.7 },
      transitionOut: { type: 'fade', duration: 0.6 }
    },
    {
      id: 'clip-text-1',
      trackId: 'track-text',
      name: 'Title Overlay',
      type: 'text',
      start: 0.5,
      duration: 4.0,
      trimStart: 0,
      volume: 1.0,
      muted: false,
      speed: 1.0,
      opacity: 1.0,
      filter: 'none',
      filterAdjustments: { brightness: 100, contrast: 100, saturation: 100, vignette: 0, blur: 0 },
      transform: { x: 0, y: 25, scale: 1.0, rotation: 0 },
      transitionIn: { type: 'fade', duration: 0.5 },
      transitionOut: { type: 'fade', duration: 0.5 },
      textProperties: {
        text: 'CINECRAFT STUDIO',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontSize: 44,
        color: '#fbbf24',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        borderColor: '#000000',
        borderWidth: 1,
        shadow: true,
        align: 'center',
        animation: 'pop'
      }
    },
    {
      id: 'clip-sticker-1',
      trackId: 'track-sticker',
      name: 'Fire Sticker',
      type: 'sticker',
      start: 5.5,
      duration: 3.5,
      trimStart: 0,
      volume: 1.0,
      muted: false,
      speed: 1.0,
      opacity: 1.0,
      filter: 'none',
      filterAdjustments: { brightness: 100, contrast: 100, saturation: 100, vignette: 0, blur: 0 },
      transform: { x: 35, y: -25, scale: 1.2, rotation: 12 },
      transitionIn: { type: 'fade', duration: 0.4 },
      transitionOut: { type: 'fade', duration: 0.4 },
      stickerProperties: {
        emojiOrSvg: '🔥',
        category: 'emoji'
      }
    },
    {
      id: 'clip-audio-1',
      trackId: 'track-audio',
      name: 'Lo-Fi Chill Beats',
      type: 'audio',
      src: createSyntheticAudioBuffer('lofi-beat', 8),
      start: 0,
      duration: 10.0,
      trimStart: 0,
      volume: 0.8,
      muted: false,
      speed: 1.0,
      opacity: 1.0,
      filter: 'none',
      filterAdjustments: { brightness: 100, contrast: 100, saturation: 100, vignette: 0, blur: 0 },
      transform: { x: 0, y: 0, scale: 1.0, rotation: 0 },
      transitionIn: { type: 'none', duration: 0 },
      transitionOut: { type: 'none', duration: 0 },
      waveform: generateWaveformPoints(45)
    }
  ]);

  // Undo / Redo history
  const [history, setHistory] = useState<Clip[][]>(() => [JSON.parse(JSON.stringify(clips))]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Push history on changes
  const pushHistory = useCallback((newClips: Clip[]) => {
    setHistory((prev) => {
      const slice = prev.slice(0, historyIndex + 1);
      return [...slice, JSON.parse(JSON.stringify(newClips))];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetState = history[historyIndex - 1];
      setClips(JSON.parse(JSON.stringify(targetState)));
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetState = history[historyIndex + 1];
      setClips(JSON.parse(JSON.stringify(targetState)));
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  // Compute total duration dynamically from clips
  const projectDuration = Math.max(10, ...clips.map((c) => c.start + c.duration));

  // Playback requestAnimationFrame loop
  const lastTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();

      const loop = (now: number) => {
        const delta = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= projectDuration) {
            return 0; // loop back to start
          }
          return next;
        });

        animFrameRef.current = requestAnimationFrame(loop);
      };

      animFrameRef.current = requestAnimationFrame(loop);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, projectDuration]);

  // Play / Pause toggle
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Seek time
  const handleSeek = (newTime: number) => {
    setCurrentTime(Math.max(0, Math.min(projectDuration, newTime)));
  };

  // Currently selected clip object
  const selectedClip = clips.find((c) => c.id === selectedClipId) || null;

  // Apply a complete pre-built video template
  const handleApplyTemplate = (template: VideoTemplate) => {
    setAspectRatio(template.aspectRatio);
    const newClips = JSON.parse(JSON.stringify(template.clips));
    setClips(newClips);
    setCurrentTime(0);
    const firstVid = newClips.find((c: Clip) => c.type === 'video') || newClips[0];
    setSelectedClipId(firstVid?.id || null);
    pushHistory(newClips);
    setIsPlaying(false);
  };

  // Add new clip onto timeline at playhead or end of track
  const handleAddClip = (partial: Partial<Clip>) => {
    const trackId = partial.trackId || 'track-video';
    const trackClips = clips.filter((c) => c.trackId === trackId);
    
    // Position at playhead or after last clip on that track
    let startPos = currentTime;
    if (trackClips.length > 0 && startPos === 0) {
      const maxEnd = Math.max(...trackClips.map((c) => c.start + c.duration));
      startPos = maxEnd;
    }

    const newClip: Clip = {
      id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      trackId,
      name: partial.name || 'New Clip',
      type: partial.type || 'video',
      src: partial.src,
      thumbnail: partial.thumbnail,
      start: Math.round(startPos * 10) / 10,
      duration: partial.duration || 4.0,
      trimStart: 0,
      volume: partial.volume ?? 1.0,
      muted: false,
      speed: 1.0,
      opacity: 1.0,
      filter: 'none',
      filterAdjustments: { brightness: 100, contrast: 100, saturation: 100, vignette: 0, blur: 0 },
      transform: { x: 0, y: 0, scale: 1.0, rotation: 0 },
      transitionIn: { type: 'fade', duration: 0.5 },
      transitionOut: { type: 'fade', duration: 0.5 },
      textProperties: partial.textProperties,
      stickerProperties: partial.stickerProperties,
      waveform: partial.waveform,
      ...partial
    };

    const nextClips = [...clips, newClip];
    setClips(nextClips);
    setSelectedClipId(newClip.id);
    pushHistory(nextClips);
  };

  // Update selected clip properties
  const handleUpdateSelectedClip = (updates: Partial<Clip>) => {
    if (!selectedClipId) return;
    handleUpdateClip(selectedClipId, updates);
  };

  // Update specific clip by ID
  const handleUpdateClip = (clipId: string, updates: Partial<Clip>) => {
    setClips((prev) =>
      prev.map((c) => {
        if (c.id === clipId) {
          return { ...c, ...updates };
        }
        return c;
      })
    );
  };

  // Split selected clip at playhead
  const handleSplitClip = () => {
    if (!selectedClip) return;
    if (currentTime <= selectedClip.start + 0.3 || currentTime >= selectedClip.start + selectedClip.duration - 0.3) {
      return; // Too close to edges
    }

    const firstDuration = currentTime - selectedClip.start;
    const secondDuration = selectedClip.duration - firstDuration;

    const secondClip: Clip = {
      ...JSON.parse(JSON.stringify(selectedClip)),
      id: `clip_${Date.now()}_split`,
      start: currentTime,
      duration: secondDuration,
      trimStart: selectedClip.trimStart + firstDuration
    };

    const updatedClips = clips.map((c) => {
      if (c.id === selectedClip.id) {
        return { ...c, duration: firstDuration };
      }
      return c;
    });

    const nextClips = [...updatedClips, secondClip];
    setClips(nextClips);
    setSelectedClipId(secondClip.id);
    pushHistory(nextClips);
  };

  // Delete selected clip
  const handleDeleteClip = () => {
    if (!selectedClipId) return;
    const nextClips = clips.filter((c) => c.id !== selectedClipId);
    setClips(nextClips);
    setSelectedClipId(null);
    pushHistory(nextClips);
  };

  // Duplicate selected clip
  const handleDuplicateClip = () => {
    if (!selectedClip) return;
    const cloned: Clip = {
      ...JSON.parse(JSON.stringify(selectedClip)),
      id: `clip_${Date.now()}_dup`,
      start: selectedClip.start + selectedClip.duration + 0.5,
      name: `${selectedClip.name} (Copy)`
    };
    const nextClips = [...clips, cloned];
    setClips(nextClips);
    setSelectedClipId(cloned.id);
    pushHistory(nextClips);
  };

  // Global keyboard shortcuts (Undo / Redo / Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId) {
          e.preventDefault();
          handleDeleteClip();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectedClipId, clips]);

  // Toggle track mute
  const handleToggleTrackMute = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t))
    );
  };

  // Toggle track lock
  const handleToggleTrackLock = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, locked: !t.locked } : t))
    );
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none">
      
      {/* 1. Header Bar */}
      <Header
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenExport={() => setIsExportOpen(true)}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* 2. Middle Row: Left Sidebar + Asset Panel + Preview Player + Inspector */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Leftmost Tool Navigation Bar */}
        <LeftSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          language={language}
        />

        {/* Media & Tool Asset Panel */}
        <AssetPanel
          activeTab={activeTab}
          language={language}
          onAddClip={handleAddClip}
          onApplyTemplate={handleApplyTemplate}
          selectedClip={selectedClip}
          onUpdateSelectedClip={handleUpdateSelectedClip}
          currentTime={currentTime}
        />

        {/* Live Canvas Video Preview Monitor */}
        <PreviewPlayer
          clips={clips}
          currentTime={currentTime}
          duration={projectDuration}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          aspectRatio={aspectRatio}
          language={language}
          selectedClip={selectedClip}
          onUpdateSelectedClip={handleUpdateSelectedClip}
          onSplitClip={handleSplitClip}
          onDeleteClip={handleDeleteClip}
          onDuplicateClip={handleDuplicateClip}
        />

        {/* Clip Properties Inspector Drawer */}
        {isInspectorOpen && selectedClip && (
          <ClipInspector
            clip={selectedClip}
            onUpdateClip={handleUpdateSelectedClip}
            onDeleteClip={handleDeleteClip}
            onClose={() => setSelectedClipId(null)}
            language={language}
          />
        )}
      </div>

      {/* 3. Bottom Multi-Track Timeline */}
      <Timeline
        tracks={tracks}
        clips={clips}
        currentTime={currentTime}
        duration={projectDuration}
        zoom={zoom}
        onZoomChange={setZoom}
        onSeek={handleSeek}
        selectedClipId={selectedClipId}
        onSelectClip={setSelectedClipId}
        onUpdateClip={handleUpdateClip}
        onSplitClip={handleSplitClip}
        onDeleteClip={handleDeleteClip}
        onDuplicateClip={handleDuplicateClip}
        onToggleTrackMute={handleToggleTrackMute}
        onToggleTrackLock={handleToggleTrackLock}
        onOpenAudioTab={() => setActiveTab('audio')}
        onAddClip={handleAddClip}
        language={language}
      />

      {/* 4. Video Export Dialog */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        clips={clips}
        duration={projectDuration}
        aspectRatio={aspectRatio}
        language={language}
      />
    </div>
  );
}
