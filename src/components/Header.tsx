import React from 'react';
import { AspectRatio } from '../types/editor';
import { Language, i18n } from '../translations';
import { Download, Undo2, Redo2, Film, Globe } from 'lucide-react';

interface HeaderProps {
  aspectRatio: AspectRatio;
  onAspectRatioChange: (aspect: AspectRatio) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenExport: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({
  aspectRatio,
  onAspectRatioChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenExport,
  language,
  onLanguageChange,
}) => {
  const t = i18n[language];

  const aspectRatios: { value: AspectRatio; label: string; iconLabel: string }[] = [
    { value: '16:9', label: '16:9 (YouTube)', iconLabel: '16:9' },
    { value: '9:16', label: '9:16 (Shorts/Reels)', iconLabel: '9:16' },
    { value: '1:1', label: '1:1 (Square)', iconLabel: '1:1' },
    { value: '4:5', label: '4:5 (Portrait)', iconLabel: '4:5' },
    { value: '21:9', label: '21:9 (Cinematic)', iconLabel: '21:9' },
  ];

  return (
    <header className="h-14 bg-neutral-900 border-b border-neutral-800 px-4 flex items-center justify-between shrink-0 select-none z-30">
      {/* Zone 1: Single text element Brand wordmark with subtle studio icon */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-sm">
          <Film className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold tracking-tight text-white text-base leading-none">
            {t.appName}
          </span>
          <span className="text-[11px] text-neutral-400 leading-tight">
            {language === 'bn' ? 'প্রো ভিডিও এডিটর' : 'Pro Video Studio'}
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation & Project Controls */}
      <div className="flex items-center gap-3">
        {/* Aspect Ratio Selector */}
        <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-1">
          {aspectRatios.map((item) => (
            <button
              key={item.value}
              onClick={() => onAspectRatioChange(item.value)}
              title={item.label}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap ${
                aspectRatio === item.value
                  ? 'bg-neutral-800 text-amber-400 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {item.iconLabel}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-neutral-800 mx-1" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title={`${t.undo} (Ctrl+Z)`}
            className={`p-1.5 rounded-md transition-colors ${
              canUndo
                ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                : 'text-neutral-600 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title={`${t.redo} (Ctrl+Y)`}
            className={`p-1.5 rounded-md transition-colors ${
              canRedo
                ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                : 'text-neutral-600 cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Zone 3: Language & Export Action */}
      <div className="flex items-center gap-3">
        {/* Language switcher */}
        <button
          onClick={() => onLanguageChange(language === 'bn' ? 'en' : 'bn')}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors"
          title="Switch Language / ভাষা পরিবর্তন"
        >
          <Globe className="w-3.5 h-3.5 text-neutral-400" />
          <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-sm transition-all active:scale-95 whitespace-nowrap cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{t.exportVideo}</span>
        </button>
      </div>
    </header>
  );
};
