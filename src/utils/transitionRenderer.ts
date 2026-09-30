import { TransitionItem } from '../types/editor';
import { TRANSITIONS_LIBRARY } from '../data/transitionsLibrary';

// Quick lookup map for transition definitions
const transitionsMap = new Map<string, TransitionItem>();
TRANSITIONS_LIBRARY.forEach((t) => transitionsMap.set(t.id, t));

export function getTransitionInfo(id: string): TransitionItem | undefined {
  return transitionsMap.get(id);
}

export function applyTransitionTransform(
  ctx: CanvasRenderingContext2D,
  transitionId: string,
  progress: number, // 0 (start) to 1 (end)
  width: number,
  height: number,
  isOut: boolean = false
) {
  // If isOut, p goes from 1 to 0
  const p = isOut ? 1 - progress : progress;
  const item = transitionsMap.get(transitionId);
  const engine = item?.engine || 'fade';
  const direction = item?.direction || 'left';

  switch (engine) {
    case 'fade': {
      ctx.globalAlpha = ctx.globalAlpha * Math.max(0, Math.min(1, p));
      break;
    }

    case 'slide': {
      ctx.globalAlpha = ctx.globalAlpha * Math.min(1, p * 1.5);
      const ease = 1 - Math.pow(1 - p, 3); // cubic ease-out
      if (direction === 'left') {
        ctx.translate(width * (1 - ease), 0);
      } else if (direction === 'right') {
        ctx.translate(-width * (1 - ease), 0);
      } else if (direction === 'up') {
        ctx.translate(0, height * (1 - ease));
      } else if (direction === 'down') {
        ctx.translate(0, -height * (1 - ease));
      }
      break;
    }

    case 'zoom': {
      ctx.globalAlpha = ctx.globalAlpha * Math.min(1, p * 1.4);
      if (direction === 'in') {
        const s = 0.3 + 0.7 * Math.pow(p, 2);
        ctx.scale(s, s);
      } else {
        const s = 1.7 - 0.7 * Math.pow(p, 2);
        ctx.scale(s, s);
      }
      break;
    }

    case 'spin': {
      ctx.globalAlpha = ctx.globalAlpha * Math.min(1, p * 1.5);
      const angle = (1 - p) * Math.PI * (direction === 'ccw' ? -2 : 2);
      ctx.rotate(angle);
      const s = 0.4 + 0.6 * p;
      ctx.scale(s, s);
      break;
    }

    case 'flip': {
      ctx.globalAlpha = ctx.globalAlpha * Math.min(1, p * 1.6);
      if (direction === 'up' || direction === 'down') {
        const sy = Math.max(0.01, Math.cos((1 - p) * Math.PI * 0.5));
        ctx.scale(1, sy);
      } else {
        const sx = Math.max(0.01, Math.cos((1 - p) * Math.PI * 0.5));
        ctx.scale(sx, 1);
      }
      break;
    }

    case 'glitch': {
      ctx.globalAlpha = ctx.globalAlpha * (0.4 + 0.6 * p);
      if (p < 0.9) {
        const shiftX = (Math.random() - 0.5) * 35 * (1 - p);
        const shiftY = (Math.random() - 0.5) * 15 * (1 - p);
        ctx.translate(shiftX, shiftY);
      }
      break;
    }

    case 'flash': {
      ctx.globalAlpha = ctx.globalAlpha * Math.min(1, p * 1.2);
      break;
    }

    case 'wipe': {
      // Wipes use geometric clipping paths
      ctx.beginPath();
      if (direction === 'right') {
        ctx.rect(-width / 2, -height / 2, width * p, height);
      } else if (direction === 'left') {
        ctx.rect(-width / 2 + width * (1 - p), -height / 2, width * p, height);
      } else if (direction === 'up') {
        ctx.rect(-width / 2, -height / 2 + height * (1 - p), width, height * p);
      } else if (direction === 'down') {
        ctx.rect(-width / 2, -height / 2, width, height * p);
      } else if (direction === 'cw' || direction === 'ccw') {
        // Radial clock wipe
        const r = Math.max(width, height);
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
        ctx.closePath();
      } else {
        // Center split horizontal
        const w = width * p;
        ctx.rect(-w / 2, -height / 2, w, height);
      }
      ctx.clip();
      break;
    }

    case 'shape': {
      // Shape mask clipping
      ctx.beginPath();
      const maxR = Math.max(width, height) * 0.85;
      const currentR = Math.max(0.1, maxR * p);

      if (transitionId.includes('diamond')) {
        ctx.moveTo(0, -currentR);
        ctx.lineTo(currentR, 0);
        ctx.lineTo(0, currentR);
        ctx.lineTo(-currentR, 0);
        ctx.closePath();
      } else if (transitionId.includes('heart')) {
        const d = currentR * 0.8;
        ctx.moveTo(0, d * 0.3);
        ctx.bezierCurveTo(d * 0.5, -d * 0.5, d, -d * 0.1, 0, d);
        ctx.bezierCurveTo(-d, -d * 0.1, -d * 0.5, -d * 0.5, 0, d * 0.3);
      } else if (transitionId.includes('star')) {
        const spikes = 5;
        const outer = currentR;
        const inner = currentR * 0.45;
        let rot = (Math.PI / 2) * 3;
        const step = Math.PI / spikes;
        ctx.moveTo(0, -outer);
        for (let i = 0; i < spikes; i++) {
          let x = Math.cos(rot) * outer;
          let y = Math.sin(rot) * outer;
          ctx.lineTo(x, y);
          rot += step;
          x = Math.cos(rot) * inner;
          y = Math.sin(rot) * inner;
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.closePath();
      } else {
        // Circle iris default
        ctx.arc(0, 0, currentR, 0, Math.PI * 2);
      }
      ctx.clip();
      break;
    }

    case 'retro': {
      ctx.globalAlpha = ctx.globalAlpha * (0.3 + 0.7 * p);
      if (p < 0.85) {
        const jumpY = (Math.random() - 0.5) * 20 * (1 - p);
        ctx.translate(0, jumpY);
      }
      break;
    }

    default:
      ctx.globalAlpha = ctx.globalAlpha * p;
      break;
  }
}

// Draw optional flash or glitch post-overlay during transition
export function drawTransitionPostOverlay(
  ctx: CanvasRenderingContext2D,
  transitionId: string,
  progress: number,
  width: number,
  height: number,
  isOut: boolean = false
) {
  const p = isOut ? 1 - progress : progress;
  const item = transitionsMap.get(transitionId);

  if (item?.engine === 'flash' && p < 0.7) {
    const flashIntensity = (1 - p / 0.7) * 0.85;
    ctx.save();
    if (transitionId.includes('amber') || transitionId.includes('sunset') || transitionId.includes('gold')) {
      ctx.fillStyle = `rgba(251, 191, 36, ${flashIntensity})`;
    } else if (transitionId.includes('cyber') || transitionId.includes('neon') || transitionId.includes('laser')) {
      ctx.fillStyle = `rgba(56, 189, 248, ${flashIntensity})`;
    } else {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity})`;
    }
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.restore();
  }
}
