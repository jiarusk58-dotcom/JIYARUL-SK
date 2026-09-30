import { Clip, AspectRatio, ExportSettings } from '../types/editor';
import { getCssFilterString, drawVignette } from './filterLuts';
import { renderProceduralClip } from './motionCanvasGenerator';
import { loadMediaElement, isVideoSource, MediaElement } from './mediaLoader';
import { applyTransitionTransform, drawTransitionPostOverlay } from './transitionRenderer';

export interface ExportProgress {
  progress: number; // 0 to 100
  currentFrame: number;
  totalFrames: number;
  statusText: string;
}

export async function exportVideo(
  clips: Clip[],
  duration: number,
  aspectRatio: AspectRatio,
  settings: ExportSettings,
  onProgress: (prog: ExportProgress) => void
): Promise<{ url: string; blob: Blob; filename: string }> {
  // Determine pixel dimensions
  let width = 1280;
  let height = 720;

  if (settings.resolution === '1080p') {
    if (aspectRatio === '16:9') { width = 1920; height = 1080; }
    else if (aspectRatio === '9:16') { width = 1080; height = 1920; }
    else if (aspectRatio === '1:1') { width = 1080; height = 1080; }
    else if (aspectRatio === '4:5') { width = 1080; height = 1350; }
    else if (aspectRatio === '21:9') { width = 2560; height = 1080; }
  } else {
    // 720p baseline
    if (aspectRatio === '16:9') { width = 1280; height = 720; }
    else if (aspectRatio === '9:16') { width = 720; height = 1280; }
    else if (aspectRatio === '1:1') { width = 720; height = 720; }
    else if (aspectRatio === '4:5') { width = 720; height = 900; }
    else if (aspectRatio === '21:9') { width = 1680; height = 720; }
  }

  const fps = settings.fps || 30;
  const totalFrames = Math.max(1, Math.round(duration * fps));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas 2D context');

  // Pre-load all visual media (images and real videos)
  const mediaCache = new Map<string, MediaElement>();
  for (const clip of clips) {
    if (clip.src && !clip.src.startsWith('procedural://') && !clip.src.startsWith('synth://')) {
      if (!mediaCache.has(clip.src)) {
        try {
          const isVid = isVideoSource(clip.src, clip.type);
          const el = await loadMediaElement(clip.src, isVid);
          if (el) {
            mediaCache.set(clip.src, el);
          }
        } catch {
          // ignore error
        }
      }
    }
  }

  // Setup Web Audio for export audio mixing
  const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtxClass();
  if (audioCtx.state === 'suspended') {
    try {
      await audioCtx.resume();
    } catch {}
  }

  const destNode = audioCtx.createMediaStreamDestination();

  // Create silent baseline node to keep audio stream track active
  const silenceGain = audioCtx.createGain();
  silenceGain.gain.value = 0.0001;
  const osc = audioCtx.createOscillator();
  osc.connect(silenceGain);
  silenceGain.connect(destNode);
  try {
    osc.start();
  } catch {}

  // Setup audio elements for audio clips to play into destNode
  const exportAudioPlayers: { el: HTMLAudioElement; clip: Clip; started: boolean }[] = [];
  for (const clip of clips) {
    if ((clip.type === 'audio' || clip.type === 'video') && clip.src && !clip.muted) {
      try {
        const a = new Audio(clip.src);
        a.crossOrigin = 'anonymous';
        const source = audioCtx.createMediaElementSource(a);
        const gain = audioCtx.createGain();
        gain.gain.value = Math.max(0, Math.min(1.5, clip.volume));
        source.connect(gain);
        gain.connect(destNode);
        exportAudioPlayers.push({ el: a, clip, started: false });
      } catch (err) {
        console.warn('Audio export connection fallback:', err);
      }
    }
  }

  // Create combined media stream
  const canvasStream = canvas.captureStream(fps);
  const audioTracks = destNode.stream.getAudioTracks();
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioTracks
  ]);

  let mimeType = 'video/webm;codecs=vp9,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }
    }
  }

  const recordedChunks: Blob[] = [];
  const mediaRecorder = new MediaRecorder(combinedStream, {
    mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
    videoBitsPerSecond: settings.resolution === '1080p' ? 8000000 : 4000000
  });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  return new Promise(async (resolve, reject) => {
    mediaRecorder.onstop = () => {
      // Clean up audio
      try {
        osc.stop();
        exportAudioPlayers.forEach((p) => p.el.pause());
        audioCtx.close();
      } catch {}

      const outputBlob = new Blob(recordedChunks, { type: mimeType.split(';')[0] });
      const url = URL.createObjectURL(outputBlob);
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const filename = `GM_Video_Editor_${aspectRatio.replace(':', 'x')}_${Date.now()}.${ext}`;
      resolve({ url, blob: outputBlob, filename });
    };

    mediaRecorder.onerror = (e) => {
      try {
        audioCtx.close();
      } catch {}
      reject(e);
    };

    mediaRecorder.start(250);

    const exportStartTime = performance.now();

    // Render frame-by-frame with precise wall-clock pacing
    for (let frame = 0; frame < totalFrames; frame++) {
      const time = frame / fps;

      // Draw background
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);

      // Handle audio triggers during export
      for (const item of exportAudioPlayers) {
        if (time >= item.clip.start && time < item.clip.start + item.clip.duration) {
          if (!item.started) {
            item.started = true;
            item.el.currentTime = Math.max(0, item.clip.trimStart);
            item.el.play().catch(() => {});
          }
        } else if (item.started && time >= item.clip.start + item.clip.duration) {
          item.el.pause();
        }
      }

      // Render video/text/sticker frames
      renderFrameAtTime(ctx, clips, time, width, height, mediaCache);

      const percent = Math.min(99, Math.round((frame / totalFrames) * 100));
      onProgress({
        progress: percent,
        currentFrame: frame,
        totalFrames,
        statusText: `Encoding frame ${frame}/${totalFrames} (${percent}%)`
      });

      // Wall-clock pacing so MediaRecorder gets exact duration
      const expectedElapsedMs = (frame / fps) * 1000;
      const actualElapsedMs = performance.now() - exportStartTime;
      const waitTime = expectedElapsedMs - actualElapsedMs;

      if (waitTime > 2) {
        await new Promise((r) => setTimeout(r, waitTime));
      } else if (frame % 8 === 0) {
        await new Promise((r) => setTimeout(r, 4));
      }
    }

    onProgress({
      progress: 100,
      currentFrame: totalFrames,
      totalFrames,
      statusText: 'Finalizing video stream...'
    });

    // Wait a brief moment to ensure recorder catches the final frame
    setTimeout(() => {
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    }, 400);
  });
}

export function renderFrameAtTime(
  ctx: CanvasRenderingContext2D,
  clips: Clip[],
  time: number,
  width: number,
  height: number,
  loadedMedia?: Map<string, MediaElement>
) {
  // Sort clips by layer type: video first, then sticker, then text
  const layerOrder: Record<string, number> = {
    video: 1,
    sticker: 2,
    text: 3,
    audio: 0,
    voiceover: 0
  };

  const activeClips = clips
    .filter((c) => time >= c.start && time < c.start + c.duration)
    .sort((a, b) => (layerOrder[a.type] || 0) - (layerOrder[b.type] || 0));

  for (const clip of activeClips) {
    const timeInClip = time - clip.start;

    ctx.save();

    // Global clip opacity
    ctx.globalAlpha = Math.max(0, Math.min(1, clip.opacity));

    // Base Transform (Pan, Zoom, Rotation)
    const centerX = width / 2 + (clip.transform.x / 100) * width;
    const centerY = height / 2 + (clip.transform.y / 100) * height;

    ctx.translate(centerX, centerY);
    if (clip.transform.rotation) {
      ctx.rotate((clip.transform.rotation * Math.PI) / 180);
    }
    ctx.scale(clip.transform.scale, clip.transform.scale);

    // Apply Transition In (supports all 200+ transitions)
    if (clip.transitionIn && clip.transitionIn.type && clip.transitionIn.type !== 'none') {
      const tInDur = clip.transitionIn.duration || 0.6;
      if (timeInClip < tInDur) {
        const p = Math.max(0, Math.min(1, timeInClip / tInDur));
        applyTransitionTransform(ctx, clip.transitionIn.type, p, width, height, false);
      }
    }

    // Apply Transition Out
    if (clip.transitionOut && clip.transitionOut.type && clip.transitionOut.type !== 'none') {
      const remainingTime = clip.duration - timeInClip;
      const tOutDur = clip.transitionOut.duration || 0.6;
      if (remainingTime < tOutDur) {
        const p = Math.max(0, Math.min(1, (tOutDur - remainingTime) / tOutDur));
        applyTransitionTransform(ctx, clip.transitionOut.type, p, width, height, true);
      }
    }

    // Filter effects
    const cssFilter = getCssFilterString(clip.filter, clip.filterAdjustments);
    if (cssFilter && cssFilter !== 'none') {
      ctx.filter = cssFilter;
    }

    // 1. VIDEO / IMAGE CLIPS
    if (clip.type === 'video' || clip.type === 'image') {
      if (clip.src?.startsWith('procedural://')) {
        const procType = clip.src.replace('procedural://', '');
        ctx.translate(-width / 2, -height / 2);
        renderProceduralClip(ctx, procType, timeInClip, width, height);
      } else if (clip.src && loadedMedia && loadedMedia.has(clip.src)) {
        const media = loadedMedia.get(clip.src)!;

        // If it's a video element, seek to appropriate timestamp
        if (media instanceof HTMLVideoElement) {
          const targetTime = Math.max(0, clip.trimStart + (timeInClip * clip.speed));
          if (Math.abs(media.currentTime - targetTime) > 0.1) {
            media.currentTime = targetTime;
          }
        }

        const mediaWidth = (media as HTMLVideoElement).videoWidth || (media as HTMLImageElement).naturalWidth || width;
        const mediaHeight = (media as HTMLVideoElement).videoHeight || (media as HTMLImageElement).naturalHeight || height;

        const imgRatio = mediaWidth / mediaHeight;
        const screenRatio = width / height;
        let dw = width;
        let dh = height;

        if (imgRatio > screenRatio) {
          dw = height * imgRatio;
        } else {
          dh = width / imgRatio;
        }

        try {
          ctx.drawImage(media, -dw / 2, -dh / 2, dw, dh);
        } catch {
          // If media not fully decode ready, draw fallback
          ctx.fillStyle = '#1c1c24';
          ctx.fillRect(-width / 2, -height / 2, width, height);
        }
      } else {
        // Fallback procedural graphic if media is loading
        ctx.fillStyle = '#1c1c24';
        ctx.fillRect(-width / 2, -height / 2, width, height);
        ctx.fillStyle = '#64748b';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(clip.name, 0, 0);
      }

      // Vignette effect
      if (clip.filterAdjustments.vignette > 0) {
        ctx.filter = 'none';
        drawVignette(ctx, width, height, clip.filterAdjustments.vignette);
      }
    }

    // 2. TEXT CLIPS
    else if (clip.type === 'text' && clip.textProperties) {
      const tp = clip.textProperties;
      ctx.filter = 'none';

      // Animation calculations
      let animScale = 1;
      let animAlpha = 1;
      let animY = 0;

      if (tp.animation === 'pop' && timeInClip < 0.4) {
        animScale = Math.min(1.2, 0.4 + (timeInClip / 0.4) * 0.8);
        if (timeInClip > 0.3) animScale = 1.0;
      } else if (tp.animation === 'fade' && timeInClip < 0.5) {
        animAlpha = timeInClip / 0.5;
      } else if (tp.animation === 'slide' && timeInClip < 0.4) {
        animY = (1 - timeInClip / 0.4) * 50;
      }

      ctx.globalAlpha = ctx.globalAlpha * animAlpha;
      ctx.scale(animScale, animScale);

      // Measure text
      ctx.font = `bold ${tp.fontSize}px ${tp.fontFamily}`;
      ctx.textAlign = tp.align || 'center';
      ctx.textBaseline = 'middle';

      let textToShow = tp.text;
      if (tp.animation === 'typewriter') {
        const charCount = Math.floor((timeInClip / Math.min(1.5, clip.duration)) * tp.text.length);
        textToShow = tp.text.slice(0, Math.max(1, charCount));
      }

      const metrics = ctx.measureText(textToShow);
      const textWidth = metrics.width;
      const textHeight = tp.fontSize * 1.3;

      // Background Box
      if (tp.backgroundColor && tp.backgroundColor !== 'transparent') {
        ctx.fillStyle = tp.backgroundColor;
        const padX = 24;
        const padY = 12;
        let bgX = -textWidth / 2 - padX;
        if (tp.align === 'left') bgX = -padX;
        if (tp.align === 'right') bgX = -textWidth - padX;

        ctx.beginPath();
        const r = 8;
        const bx = bgX;
        const by = -textHeight / 2 - padY / 2 + animY;
        const bw = textWidth + padX * 2;
        const bh = textHeight + padY;
        ctx.roundRect(bx, by, bw, bh, r);
        ctx.fill();
      }

      // Drop shadow
      if (tp.shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 3;
      } else {
        ctx.shadowColor = 'transparent';
      }

      // Text stroke
      if (tp.borderWidth > 0 && tp.borderColor) {
        ctx.strokeStyle = tp.borderColor;
        ctx.lineWidth = tp.borderWidth;
        ctx.strokeText(textToShow, 0, animY);
      }

      // Text Fill
      ctx.fillStyle = tp.color;
      ctx.fillText(textToShow, 0, animY);
    }

    // 3. STICKER CLIPS
    else if (clip.type === 'sticker' && clip.stickerProperties) {
      ctx.filter = 'none';
      const sp = clip.stickerProperties;
      ctx.font = '72px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sp.emojiOrSvg, 0, 0);
    }

    // Post-overlay effect (Flash, light leak)
    if (clip.transitionIn && clip.transitionIn.type && clip.transitionIn.type !== 'none') {
      const tInDur = clip.transitionIn.duration || 0.6;
      if (timeInClip < tInDur) {
        const p = Math.max(0, Math.min(1, timeInClip / tInDur));
        drawTransitionPostOverlay(ctx, clip.transitionIn.type, p, width, height, false);
      }
    }

    ctx.restore();
  }
}
