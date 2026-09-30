/**
 * Procedural canvas video generators for built-in animated motion clips
 * (e.g. Countdown leader, Neon Cyber Grid, Gradient Wave, Cinematic Particle Dust)
 */

export function renderProceduralClip(
  ctx: CanvasRenderingContext2D,
  type: string,
  timeInClip: number,
  width: number,
  height: number
) {
  if (type === 'cyber-grid') {
    // Cyberpunk neon digital grid
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, width, height);

    const horizon = height * 0.55;
    const speed = timeInClip * 120;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
    skyGrad.addColorStop(0, '#04020e');
    skyGrad.addColorStop(1, '#2c0c45');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, horizon);

    // Neon sun
    ctx.save();
    ctx.beginPath();
    ctx.arc(width * 0.5, horizon - 20, 90, 0, Math.PI * 2);
    const sunGrad = ctx.createLinearGradient(width * 0.5, horizon - 110, width * 0.5, horizon + 70);
    sunGrad.addColorStop(0, '#ffec3d');
    sunGrad.addColorStop(0.5, '#ff4d4f');
    sunGrad.addColorStop(1, '#eb2f96');
    ctx.fillStyle = sunGrad;
    ctx.shadowColor = '#ff4d4f';
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.restore();

    // Horizontal grid lines with perspective
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    for (let y = horizon; y <= height; y += 15) {
      const p = (y - horizon) / (height - horizon);
      const curvedY = horizon + Math.pow(p, 1.8) * (height - horizon);
      const offset = (curvedY + speed) % 25;
      ctx.beginPath();
      ctx.moveTo(0, curvedY + offset * p);
      ctx.lineTo(width, curvedY + offset * p);
      ctx.stroke();
    }

    // Perspective vertical grid lines
    const numLines = 14;
    for (let i = -numLines; i <= numLines; i++) {
      const bottomX = width * 0.5 + i * (width / 10);
      ctx.beginPath();
      ctx.moveTo(width * 0.5, horizon);
      ctx.lineTo(bottomX, height);
      ctx.stroke();
    }

  } else if (type === 'countdown') {
    // 5-4-3-2-1 Filmora/KineMaster style countdown leader
    ctx.fillStyle = '#111116';
    ctx.fillRect(0, 0, width, height);

    const countNum = Math.max(1, 5 - Math.floor(timeInClip));
    const subProgress = timeInClip % 1;

    // Crosshairs
    ctx.strokeStyle = '#3a3a4c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width * 0.5, 0);
    ctx.lineTo(width * 0.5, height);
    ctx.moveTo(0, height * 0.5);
    ctx.lineTo(width, height * 0.5);
    ctx.stroke();

    // Concentric circles
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.5, 140, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.5, 180, 0, Math.PI * 2);
    ctx.stroke();

    // Sweeping radar arc
    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.beginPath();
    ctx.moveTo(width * 0.5, height * 0.5);
    ctx.arc(width * 0.5, height * 0.5, 140, -Math.PI / 2, -Math.PI / 2 + subProgress * Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    // Number display
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 96px "JetBrains Mono", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${countNum}`, width * 0.5, height * 0.5);

  } else if (type === 'particles') {
    // Ambient floating golden particle dust
    ctx.fillStyle = '#05070e';
    ctx.fillRect(0, 0, width, height);

    const numP = 40;
    for (let i = 0; i < numP; i++) {
      const seedX = (Math.sin(i * 99 + timeInClip * 0.4) * 0.5 + 0.5) * width;
      const seedY = ((i * 37 + timeInClip * 40) % height);
      const size = (Math.sin(i * 13) * 0.5 + 0.5) * 4 + 2;
      const alpha = (Math.sin(i * 5 + timeInClip * 2) * 0.5 + 0.5) * 0.7 + 0.2;

      ctx.beginPath();
      ctx.arc(seedX, seedY, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245, 180, 60, ${alpha})`;
      ctx.shadowColor = '#f5b43c';
      ctx.shadowBlur = 12;
      ctx.fill();
    }
  } else {
    // Flowing gradient wave
    const grad = ctx.createLinearGradient(0, 0, width, height);
    const hue1 = (timeInClip * 30) % 360;
    const hue2 = (hue1 + 80) % 360;
    grad.addColorStop(0, `hsl(${hue1}, 70%, 15%)`);
    grad.addColorStop(1, `hsl(${hue2}, 80%, 25%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Wave curves
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.6);
    for (let x = 0; x <= width; x += 30) {
      const y = height * 0.6 + Math.sin(x * 0.01 + timeInClip * 2) * 40;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
  }
}
