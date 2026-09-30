import { FilterType, FilterAdjustments } from '../types/editor';

export function getCssFilterString(filter: FilterType, adjustments: FilterAdjustments): string {
  let base = '';
  switch (filter) {
    case 'warm':
      base = 'sepia(0.25) saturate(1.3) hue-rotate(-10deg)';
      break;
    case 'cyberpunk':
      base = 'contrast(1.25) saturate(1.4) hue-rotate(15deg)';
      break;
    case 'vintage':
      base = 'sepia(0.35) contrast(0.9) brightness(1.05) saturate(0.85)';
      break;
    case 'noir':
      base = 'grayscale(1) contrast(1.4) brightness(0.95)';
      break;
    case 'vivid':
      base = 'saturate(1.7) contrast(1.15) brightness(1.02)';
      break;
    case 'sepia':
      base = 'sepia(0.8) contrast(1.05) brightness(0.9)';
      break;
    case 'vhs':
      base = 'contrast(1.2) saturate(1.2) hue-rotate(-5deg)';
      break;
    case 'cold-blue':
      base = 'hue-rotate(180deg) saturate(0.9) brightness(1.05)';
      break;
    case 'cinematic-teal':
      base = 'contrast(1.18) saturate(1.25) hue-rotate(150deg) sepia(0.15)';
      break;
    case 'none':
    default:
      base = '';
      break;
  }

  // Combine with custom slider adjustments
  const b = adjustments.brightness / 100;
  const c = adjustments.contrast / 100;
  const s = adjustments.saturation / 100;
  const bl = adjustments.blur > 0 ? `blur(${adjustments.blur}px)` : '';

  const manual = `brightness(${b}) contrast(${c}) saturate(${s}) ${bl}`.trim();
  return `${base} ${manual}`.trim() || 'none';
}

export function drawVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
) {
  if (intensity <= 0) return;
  const radius = Math.max(width, height) * 0.7;
  const grad = ctx.createRadialGradient(
    width / 2,
    height / 2,
    radius * 0.4,
    width / 2,
    height / 2,
    radius
  );
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, `rgba(0, 0, 0, ${intensity / 100 * 0.85})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}
