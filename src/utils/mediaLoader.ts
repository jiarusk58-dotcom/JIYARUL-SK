/**
 * Unified Media Loader supporting both HTMLImageElement and HTMLVideoElement
 * for real video uploads, stock stills, and audio sources.
 */

export type MediaElement = HTMLImageElement | HTMLVideoElement;

const imageCache = new Map<string, HTMLImageElement>();
const videoCache = new Map<string, HTMLVideoElement>();

export function isVideoSource(src?: string, type?: string): boolean {
  if (!src) return false;
  if (src.startsWith('procedural://') || src.startsWith('synth://')) return false;
  if (type === 'image') return false;
  if (type === 'video') {
    // Check if it's an image file acting as video still
    if (/\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(src)) {
      return false;
    }
    return true;
  }
  return /\.(mp4|webm|mov|ogg|m4v)($|\?)/i.test(src);
}

export async function loadMediaElement(src: string, isVideo: boolean): Promise<MediaElement | null> {
  if (isVideo) {
    if (videoCache.has(src)) {
      return videoCache.get(src)!;
    }
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = src;

    return new Promise((resolve) => {
      let resolved = false;
      const onReady = () => {
        if (!resolved) {
          resolved = true;
          videoCache.set(src, video);
          resolve(video);
        }
      };

      video.onloadeddata = onReady;
      video.onloadedmetadata = onReady;
      video.oncanplay = onReady;
      video.onerror = () => {
        if (!resolved) {
          resolved = true;
          // Fallback or resolve null
          resolve(null);
        }
      };

      // Timeout safety
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          videoCache.set(src, video);
          resolve(video);
        }
      }, 3000);
    });
  } else {
    if (imageCache.has(src)) {
      return imageCache.get(src)!;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    return new Promise((resolve) => {
      img.onload = () => {
        imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = () => {
        resolve(null);
      };
    });
  }
}

export function getCachedMedia(src: string): MediaElement | undefined {
  return videoCache.get(src) || imageCache.get(src);
}
