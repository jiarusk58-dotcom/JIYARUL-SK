export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9';

export type MediaType = 'video' | 'image' | 'audio' | 'text' | 'sticker';

export type TrackType = 'text' | 'sticker' | 'video' | 'audio' | 'voiceover';

export type TransitionType = string;

export interface TransitionItem {
  id: string;
  name: string;
  nameBn: string;
  category: string;
  categoryBn: string;
  engine: 'fade' | 'slide' | 'zoom' | 'spin' | 'glitch' | 'flash' | 'wipe' | 'shape' | 'flip' | 'retro';
  direction?: 'left' | 'right' | 'up' | 'down' | 'cw' | 'ccw' | 'in' | 'out';
  iconName?: string;
}

export type FilterType = 
  | 'none' 
  | 'warm' 
  | 'cyberpunk' 
  | 'vintage' 
  | 'noir' 
  | 'vivid' 
  | 'sepia' 
  | 'vhs' 
  | 'cold-blue' 
  | 'cinematic-teal';

export interface FilterAdjustments {
  brightness: number; // 0 to 200, default 100
  contrast: number;   // 0 to 200, default 100
  saturation: number; // 0 to 200, default 100
  vignette: number;   // 0 to 100, default 0
  blur: number;       // 0 to 20, default 0
}

export interface TextProperties {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  shadow: boolean;
  align: 'left' | 'center' | 'right';
  animation: 'none' | 'fade' | 'slide' | 'pop' | 'typewriter' | 'bounce';
}

export interface StickerProperties {
  emojiOrSvg: string;
  category: 'emoji' | 'badge' | 'social' | 'arrow';
}

export interface Clip {
  id: string;
  trackId: string;
  name: string;
  type: MediaType;
  src?: string; // image/video/audio data or asset url
  thumbnail?: string;
  start: number; // timeline start time in seconds
  duration: number; // duration on timeline in seconds
  trimStart: number; // offset in source media in seconds
  sourceDuration?: number; // total duration of source file
  volume: number; // 0 to 2, default 1
  muted: boolean;
  speed: number; // 0.25 to 4, default 1
  opacity: number; // 0 to 1, default 1
  filter: FilterType;
  filterAdjustments: FilterAdjustments;
  transform: {
    x: number; // offset X in percentage (-50 to 50)
    y: number; // offset Y in percentage (-50 to 50)
    scale: number; // 0.2 to 3, default 1
    rotation: number; // -180 to 180 degrees
  };
  transitionIn: {
    type: TransitionType;
    duration: number;
  };
  transitionOut: {
    type: TransitionType;
    duration: number;
  };
  textProperties?: TextProperties;
  stickerProperties?: StickerProperties;
  waveform?: number[]; // Audio waveform points
  color?: string; // Track item accent color
}

export interface Track {
  id: string;
  name: string;
  nameBn: string;
  type: TrackType;
  muted: boolean;
  locked: boolean;
  visible: boolean;
}

export interface StockAsset {
  id: string;
  name: string;
  nameBn: string;
  type: MediaType;
  url: string;
  thumbnail: string;
  duration: number;
  category: string;
  aspect?: string;
}

export interface VideoTemplate {
  id: string;
  title: string;
  titleBn: string;
  category: 
    | 'Vlog' 
    | 'Reels' 
    | 'Trailer' 
    | 'Corporate' 
    | 'Retro' 
    | 'Culinary'
    | 'Gaming'
    | 'News'
    | 'Podcast'
    | 'Fashion'
    | 'Celebration'
    | 'Motivation'
    | 'Promo'
    | string;
  categoryBn: string;
  aspectRatio: AspectRatio;
  duration: number;
  thumbnail: string;
  description: string;
  descriptionBn: string;
  audioName: string;
  audioNameBn: string;
  clips: Clip[];
}

export interface ExportSettings {
  resolution: '720p' | '1080p' | '4k';
  fps: 30 | 60;
  format: 'webm' | 'mp4';
  quality: 'high' | 'medium' | 'fast';
}
