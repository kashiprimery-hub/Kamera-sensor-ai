import { RawDetection } from '../types';

export class DemoGenerator {
  private frameCount: number = 0;
  private objects = [
    {
      id: 'person-1',
      class: 'person',
      baseX: 0.15,
      baseY: 0.35,
      width: 0.18,
      height: 0.45,
      speedX: 0.003,
      speedY: 0.001,
      minX: 0.05,
      maxX: 0.75,
      score: 0.97
    },
    {
      id: 'cat-1',
      class: 'cat',
      baseX: 0.65,
      baseY: 0.60,
      width: 0.14,
      height: 0.18,
      speedX: -0.002,
      speedY: 0.0005,
      minX: 0.10,
      maxX: 0.85,
      score: 0.94
    },
    {
      id: 'car-1',
      class: 'car',
      baseX: 0.40,
      baseY: 0.40,
      width: 0.28,
      height: 0.25,
      speedX: 0.0015,
      speedY: 0.0025, // approaching camera effect
      minX: 0.10,
      maxX: 0.80,
      score: 0.92
    },
    {
      id: 'chair-1',
      class: 'chair',
      baseX: 0.80,
      baseY: 0.55,
      width: 0.12,
      height: 0.22,
      speedX: 0,
      speedY: 0, // static object
      minX: 0.80,
      maxX: 0.80,
      score: 0.89
    }
  ];

  public drawDemoCanvas(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): RawDetection[] {
    this.frameCount++;

    // Draw futuristic animated background canvas grid
    const time = this.frameCount * 0.03;
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0a0f1d');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Scanning radar line effect
    const scanY = (Math.sin(time * 0.8) * 0.5 + 0.5) * height;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, scanY);
    ctx.lineTo(width, scanY);
    ctx.stroke();

    const detections: RawDetection[] = [];

    // Update demo object positions and render shapes onto canvas
    this.objects.forEach((obj) => {
      // Update position with sine curve or bounds bouncing
      obj.baseX += obj.speedX;
      obj.baseY += obj.speedY;

      if (obj.baseX > obj.maxX || obj.baseX < obj.minX) {
        obj.speedX *= -1;
      }
      if (obj.baseY > 0.75 || obj.baseY < 0.25) {
        obj.speedY *= -1;
      }

      // Calculate absolute box
      const absX = obj.baseX * width;
      const absY = obj.baseY * height;
      const absW = obj.width * width;
      const absH = obj.height * height;

      // Draw object representation on demo canvas feed
      ctx.save();
      if (obj.class === 'person') {
        // Draw person silhouette
        ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.beginPath();
        ctx.arc(absX + absW / 2, absY + absH * 0.2, absW * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(absX + absW * 0.2, absY + absH * 0.35, absW * 0.6, absH * 0.6);
      } else if (obj.class === 'cat') {
        // Draw cat silhouette
        ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.fillRect(absX, absY + absH * 0.3, absW, absH * 0.6);
        ctx.beginPath();
        ctx.arc(absX + absW * 0.2, absY + absH * 0.3, absW * 0.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.class === 'car') {
        // Draw car silhouette
        ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.fillRect(absX, absY + absH * 0.4, absW, absH * 0.5);
        ctx.fillRect(absX + absW * 0.2, absY + absH * 0.15, absW * 0.6, absH * 0.3);
      } else {
        // Draw generic box silhouette
        ctx.fillStyle = 'rgba(139, 92, 246, 0.35)';
        ctx.fillRect(absX, absY, absW, absH);
      }
      ctx.restore();

      detections.push({
        bbox: [absX, absY, absW, absH],
        class: obj.class,
        score: obj.score
      });
    });

    return detections;
  }
}
