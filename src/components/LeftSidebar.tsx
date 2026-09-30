import React from 'react';
import { Language, i18n } from '../translations';
import { 
  LayoutTemplate,
  FolderPlus, 
  Type, 
  Sparkles, 
  SlidersHorizontal, 
  Music, 
  Mic, 
  Smile
} from 'lucide-react';

export type SidebarTab = 'templates' | 'media' | 'text' | 'transitions' | 'filters' | 'audio' | 'voiceover' | 'stickers';

interface LeftSidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  language: Language;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTab,
  onTabChange,
  language
}) => {
  const t = i18n[language];

  const tabs: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { id: 'templates', label: t.templates, icon: <LayoutTemplate className="w-5 h-5" /> },
    { id: 'media', label: t.media, icon: <FolderPlus className="w-5 h-5" /> },
    { id: 'text', label: t.text, icon: <Type className="w-5 h-5" /> },
    { id: 'transitions', label: t.transitions, icon: <Sparkles className="w-5 h-5" /> },
    { id: 'filters', label: t.filters, icon: <SlidersHorizontal className="w-5 h-5" /> },
    { id: 'audio', label: t.audio, icon: <Music className="w-5 h-5" /> },
    { id: 'voiceover', label: t.voiceover, icon: <Mic className="w-5 h-5" /> },
    { id: 'stickers', label: t.stickers, icon: <Smile className="w-5 h-5" /> },
  ];

  return (
    <nav className="w-20 bg-neutral-950 border-r border-neutral-800 flex flex-col items-center py-3 gap-1 shrink-0 select-none z-20">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-16 py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all text-xs font-medium ${
              isActive
                ? 'bg-neutral-800/90 text-amber-400 border border-neutral-700/80 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] tracking-tight leading-none text-center px-1 truncate max-w-full">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
