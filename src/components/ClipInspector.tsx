import React from 'react';
import { Clip, TransitionType, FilterType } from '../types/editor';
import { TRANSITIONS_LIBRARY } from '../data/transitionsLibrary';
import { Language, i18n } from '../translations';
import { 
  X, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Type, 
  Sparkles, 
  RotateCw,
  Sliders,
  Move,
  Music,
  Clock
} from 'lucide-react';

interface ClipInspectorProps {
  clip: Clip | null;
  onUpdateClip: (updates: Partial<Clip>) => void;
  onDeleteClip: () => void;
  onClose: () => void;
  language: Language;
}

export const ClipInspector: React.FC<ClipInspectorProps> = ({
  clip,
  onUpdateClip,
  onDeleteClip,
  onClose,
  language
}) => {
  const t = i18n[language];

  if (!clip) {
    return null;
  }

  return (
    <div className="w-72 bg-neutral-900 border-l border-neutral-800 flex flex-col shrink-0 select-none overflow-hidden text-xs z-10">
      {/* Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="font-semibold text-white truncate max-w-[170px]">
            {clip.name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onDeleteClip}
            className="p-1 rounded text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
            title={t.delete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        
        {/* AUDIO SPECIFIC CONTROLS */}
        {clip.type === 'audio' && (
          <div className="space-y-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
            <div className="font-medium text-emerald-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'অডিও ক্লিপ সেটিংস' : 'Audio Clip Settings'}</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                {clip.duration}s
              </span>
            </div>

            {/* Rename audio */}
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">
                {language === 'bn' ? 'অডিও নাম' : 'Audio Track Name'}
              </label>
              <input
                type="text"
                value={clip.name}
                onChange={(e) => onUpdateClip({ name: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1 text-white text-xs focus:border-amber-400 outline-none"
              />
            </div>

            {/* Waveform Visualization Graphic */}
            <div className="p-2.5 bg-neutral-900/80 rounded-lg border border-neutral-800/80">
              <div className="text-[10px] text-neutral-400 mb-1.5 flex items-center justify-between">
                <span>{language === 'bn' ? 'ওয়েভফর্ম গ্রাফ' : 'Waveform'}</span>
                <span className="font-mono text-emerald-400 text-[10px]">{Math.round(clip.duration * 10) / 10}s</span>
              </div>
              <div className="h-8 flex items-center justify-between gap-0.5 px-1 bg-neutral-950 rounded overflow-hidden">
                {(clip.waveform || [0.4, 0.7, 0.3, 0.9, 0.5, 0.8, 0.2, 0.6, 0.7, 0.4, 0.8, 0.3, 0.5, 0.9, 0.6, 0.3]).map((val, idx) => (
                  <div
                    key={idx}
                    className="w-1 bg-emerald-400 rounded-full transition-all"
                    style={{ height: `${Math.max(15, Math.min(100, val * 100))}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Timeline Start & Duration Readout */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-neutral-900 p-2 rounded border border-neutral-800">
                <span className="text-neutral-400 block text-[10px]">{language === 'bn' ? 'শুরুর সময়' : 'Start Time'}</span>
                <span className="font-mono font-semibold text-white">{clip.start}s</span>
              </div>
              <div className="bg-neutral-900 p-2 rounded border border-neutral-800">
                <span className="text-neutral-400 block text-[10px]">{language === 'bn' ? 'মোট দৈর্ঘ্য' : 'Duration'}</span>
                <span className="font-mono font-semibold text-amber-400">{clip.duration}s</span>
              </div>
            </div>
          </div>
        )}

        {/* TEXT SPECIFIC CONTROLS */}
        {clip.type === 'text' && clip.textProperties && (
          <div className="space-y-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
            <div className="font-medium text-amber-400 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" />
              <span>{t.text}</span>
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">
                {language === 'bn' ? 'টেক্সট বিষয়বস্তু' : 'Text Content'}
              </label>
              <textarea
                value={clip.textProperties.text}
                onChange={(e) => {
                  onUpdateClip({
                    textProperties: {
                      ...clip.textProperties!,
                      text: e.target.value
                    }
                  });
                }}
                className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white font-medium focus:border-amber-400 outline-none resize-none h-16"
              />
            </div>

            {/* Font Size */}
            <div>
              <div className="flex justify-between text-neutral-400 mb-1">
                <span>{t.fontSize}</span>
                <span className="font-mono">{clip.textProperties.fontSize}px</span>
              </div>
              <input
                type="range"
                min="16"
                max="96"
                value={clip.textProperties.fontSize}
                onChange={(e) => {
                  onUpdateClip({
                    textProperties: {
                      ...clip.textProperties!,
                      fontSize: Number(e.target.value)
                    }
                  });
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Text Color & Background Color */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-neutral-400 block mb-1">{t.textColor}</label>
                <div className="flex items-center gap-1.5 bg-neutral-900 p-1.5 rounded border border-neutral-700">
                  <input
                    type="color"
                    value={clip.textProperties.color.startsWith('#') ? clip.textProperties.color : '#ffffff'}
                    onChange={(e) => {
                      onUpdateClip({
                        textProperties: {
                          ...clip.textProperties!,
                          color: e.target.value
                        }
                      });
                    }}
                    className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                  />
                  <span className="font-mono text-[10px] text-neutral-300 truncate">
                    {clip.textProperties.color}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">{t.bgColor}</label>
                <div className="flex items-center gap-1.5 bg-neutral-900 p-1.5 rounded border border-neutral-700">
                  <input
                    type="color"
                    value={clip.textProperties.backgroundColor.startsWith('#') ? clip.textProperties.backgroundColor : '#000000'}
                    onChange={(e) => {
                      onUpdateClip({
                        textProperties: {
                          ...clip.textProperties!,
                          backgroundColor: e.target.value
                        }
                      });
                    }}
                    className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                  />
                  <button
                    onClick={() => {
                      onUpdateClip({
                        textProperties: {
                          ...clip.textProperties!,
                          backgroundColor: clip.textProperties!.backgroundColor === 'transparent' ? '#000000' : 'transparent'
                        }
                      });
                    }}
                    className="text-[9px] text-neutral-400 hover:text-white"
                  >
                    {clip.textProperties.backgroundColor === 'transparent' ? 'Solid' : 'None'}
                  </button>
                </div>
              </div>
            </div>

            {/* Animation Style */}
            <div>
              <label className="text-neutral-400 block mb-1">{t.textAnimation}</label>
              <select
                value={clip.textProperties.animation}
                onChange={(e) => {
                  onUpdateClip({
                    textProperties: {
                      ...clip.textProperties!,
                      animation: e.target.value as any
                    }
                  });
                }}
                className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-white outline-none cursor-pointer"
              >
                <option value="none">None</option>
                <option value="pop">Pop / Bounce</option>
                <option value="fade">Fade In</option>
                <option value="slide">Slide Up</option>
                <option value="typewriter">Typewriter</option>
              </select>
            </div>
          </div>
        )}

        {/* TRANSFORM SECTION (All visual clips) */}
        {clip.type !== 'audio' && (
          <div className="space-y-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
            <div className="font-medium text-neutral-300 flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'bn' ? 'পজিশন ও ট্রান্সফর্ম' : 'Transform & Position'}</span>
            </div>

            {/* Scale */}
            <div>
              <div className="flex justify-between text-neutral-400 mb-1">
                <span>{t.scale}</span>
                <span className="font-mono">{Math.round(clip.transform.scale * 100)}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="250"
                value={Math.round(clip.transform.scale * 100)}
                onChange={(e) => {
                  onUpdateClip({
                    transform: {
                      ...clip.transform,
                      scale: Number(e.target.value) / 100
                    }
                  });
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Rotation */}
            <div>
              <div className="flex justify-between text-neutral-400 mb-1">
                <span>{t.rotation}</span>
                <span className="font-mono">{clip.transform.rotation}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={clip.transform.rotation}
                onChange={(e) => {
                  onUpdateClip({
                    transform: {
                      ...clip.transform,
                      rotation: Number(e.target.value)
                    }
                  });
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Opacity */}
            <div>
              <div className="flex justify-between text-neutral-400 mb-1">
                <span>{t.opacity}</span>
                <span className="font-mono">{Math.round(clip.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(clip.opacity * 100)}
                onChange={(e) => {
                  onUpdateClip({
                    opacity: Number(e.target.value) / 100
                  });
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* TRANSITIONS (Video Clips - 200+ Transitions) */}
        {clip.type === 'video' && (
          <div className="space-y-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="font-medium text-neutral-300 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.transitionIn} (200+)</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">
                {TRANSITIONS_LIBRARY.length} options
              </span>
            </div>

            {/* Transition In Select */}
            <select
              value={clip.transitionIn?.type || 'none'}
              onChange={(e) => {
                onUpdateClip({
                  transitionIn: {
                    type: e.target.value as TransitionType,
                    duration: clip.transitionIn?.duration || 0.6
                  }
                });
              }}
              className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-white outline-none cursor-pointer text-xs"
            >
              <option value="none">{language === 'bn' ? 'কোনোটি নয় (None)' : 'None (No Transition)'}</option>
              {Array.from(new Set(TRANSITIONS_LIBRARY.map((t) => t.category))).map((cat) => (
                <optgroup key={cat} label={`── ${cat} ──`}>
                  {TRANSITIONS_LIBRARY.filter((t) => t.category === cat).map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {language === 'bn' ? `${tr.nameBn} (${tr.name})` : tr.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {clip.transitionIn && clip.transitionIn.type !== 'none' && (
              <div>
                <div className="flex justify-between text-neutral-400 mb-1 text-[11px]">
                  <span>{t.duration}</span>
                  <span className="font-mono text-amber-400">{clip.transitionIn.duration}s</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.1"
                  value={clip.transitionIn.duration}
                  onChange={(e) => {
                    onUpdateClip({
                      transitionIn: {
                        ...clip.transitionIn,
                        duration: Number(e.target.value)
                      }
                    });
                  }}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            )}

            {/* Transition Out */}
            <div className="pt-2 border-t border-neutral-800">
              <div className="font-medium text-neutral-300 text-xs mb-1.5">
                {language === 'bn' ? 'ট্রানজিশন আউট (Transition Out)' : 'Transition Out'}
              </div>
              <select
                value={clip.transitionOut?.type || 'none'}
                onChange={(e) => {
                  onUpdateClip({
                    transitionOut: {
                      type: e.target.value as TransitionType,
                      duration: clip.transitionOut?.duration || 0.6
                    }
                  });
                }}
                className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-white outline-none cursor-pointer text-xs"
              >
                <option value="none">{language === 'bn' ? 'কোনোটি নয় (None)' : 'None (No Transition)'}</option>
                {Array.from(new Set(TRANSITIONS_LIBRARY.map((t) => t.category))).map((cat) => (
                  <optgroup key={cat} label={`── ${cat} ──`}>
                    {TRANSITIONS_LIBRARY.filter((t) => t.category === cat).map((tr) => (
                      <option key={tr.id} value={tr.id}>
                        {language === 'bn' ? `${tr.nameBn} (${tr.name})` : tr.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* SPEED & AUDIO VOLUME */}
        <div className="space-y-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
          <div className="font-medium text-neutral-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.speed}</span>
          </div>

          <div>
            <div className="flex justify-between text-neutral-400 mb-1">
              <span>{language === 'bn' ? 'ভিডিও গতি' : 'Playback Speed'}</span>
              <span className="font-mono">{clip.speed}x</span>
            </div>
            <div className="flex items-center gap-1">
              {[0.5, 1.0, 1.5, 2.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => onUpdateClip({ speed: spd })}
                  className={`flex-1 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
                    clip.speed === spd
                      ? 'bg-amber-400 text-neutral-950 font-bold'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Audio Volume if audio/video */}
          {(clip.type === 'audio' || clip.type === 'video') && (
            <div className="border-t border-neutral-800 pt-2">
              <div className="flex justify-between text-neutral-400 mb-1">
                <span>{t.volume}</span>
                <span className="font-mono">{Math.round(clip.volume * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateClip({ muted: !clip.muted })}
                  className="text-neutral-400 hover:text-white"
                >
                  {clip.muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={clip.muted ? 0 : clip.volume}
                  onChange={(e) => {
                    onUpdateClip({ volume: Number(e.target.value), muted: false });
                  }}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
