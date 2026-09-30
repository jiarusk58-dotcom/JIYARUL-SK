import React, { useState } from 'react';
import { Clip, AspectRatio, ExportSettings } from '../types/editor';
import { exportVideo, ExportProgress } from '../utils/videoExporter';
import { Language, i18n } from '../translations';
import { 
  X, 
  Download, 
  Film, 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  Sliders,
  Play
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clips: Clip[];
  duration: number;
  aspectRatio: AspectRatio;
  language: Language;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  clips,
  duration,
  aspectRatio,
  language
}) => {
  const t = i18n[language];

  const [settings, setSettings] = useState<ExportSettings>({
    resolution: '720p',
    fps: 30,
    format: 'webm',
    quality: 'high'
  });

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [exportedResult, setExportedResult] = useState<{ url: string; blob: Blob; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress({ progress: 0, currentFrame: 0, totalFrames: Math.round(duration * settings.fps), statusText: 'Initializing renderer...' });
    setError(null);
    setExportedResult(null);

    try {
      const result = await exportVideo(
        clips,
        duration,
        aspectRatio,
        settings,
        (prog) => setProgress(prog)
      );
      setExportedResult(result);
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err?.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportedResult) return;
    const a = document.createElement('a');
    a.href = exportedResult.url;
    a.download = exportedResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-neutral-200">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                {t.exportVideo}
              </h3>
              <p className="text-[11px] text-neutral-400">
                {aspectRatio} · {duration.toFixed(1)}s · {clips.length} {language === 'bn' ? 'ক্লিপ' : 'clips'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {!isExporting && !exportedResult && (
            <>
              {/* Resolution selection */}
              <div>
                <label className="text-neutral-400 block mb-1.5 font-medium">
                  {language === 'bn' ? 'রেজোলিউশন (Resolution)' : 'Resolution'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSettings({ ...settings, resolution: '720p' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      settings.resolution === '720p'
                        ? 'border-amber-400 bg-amber-400/10 text-white font-medium'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-bold text-sm">720p HD</div>
                    <div className="text-[10px] text-neutral-400">{t.res720p}</div>
                  </button>

                  <button
                    onClick={() => setSettings({ ...settings, resolution: '1080p' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      settings.resolution === '1080p'
                        ? 'border-amber-400 bg-amber-400/10 text-white font-medium'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-bold text-sm">1080p FHD</div>
                    <div className="text-[10px] text-neutral-400">{t.res1080p}</div>
                  </button>
                </div>
              </div>

              {/* Frame rate & Format */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1 font-medium">{t.fps}</label>
                  <select
                    value={settings.fps}
                    onChange={(e) => setSettings({ ...settings, fps: Number(e.target.value) as 30 | 60 })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white outline-none"
                  >
                    <option value={30}>30 FPS (Standard)</option>
                    <option value={60}>60 FPS (Smooth)</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1 font-medium">{t.format}</label>
                  <select
                    value={settings.format}
                    onChange={(e) => setSettings({ ...settings, format: e.target.value as 'webm' | 'mp4' })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white outline-none"
                  >
                    <option value="webm">WebM (Fast & Universal)</option>
                    <option value="mp4">MP4 Video</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-[11px]">
                  {error}
                </div>
              )}
            </>
          )}

          {/* Exporting Progress */}
          {isExporting && progress && (
            <div className="py-6 space-y-4 text-center">
              <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
              <div className="text-sm font-semibold text-white">
                {t.rendering}
              </div>
              <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-rose-500 h-full transition-all duration-150"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-neutral-400 font-mono text-[11px]">
                <span>{progress.statusText}</span>
                <span>{progress.progress}%</span>
              </div>
            </div>
          )}

          {/* Success / Download View */}
          {exportedResult && (
            <div className="py-4 space-y-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <div>
                <h4 className="font-bold text-white text-base mb-1">
                  {t.downloadReady}
                </h4>
                <p className="text-neutral-400 text-xs font-mono">
                  {exportedResult.filename} ({(exportedResult.blob.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              </div>

              {/* Video Preview */}
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-neutral-800 shadow">
                <video
                  src={exportedResult.url}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              <button
                onClick={handleDownload}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer text-sm"
              >
                <Download className="w-4 h-4" />
                <span>{t.downloadFile}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isExporting && !exportedResult && (
          <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-neutral-400 hover:text-white transition-colors"
            >
              {t.close}
            </button>
            <button
              onClick={handleStartExport}
              className="px-5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-semibold rounded-lg shadow transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'এক্সপোর্ট শুরু করুন' : 'Start Export'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
