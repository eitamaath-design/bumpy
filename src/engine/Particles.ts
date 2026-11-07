// Particle & Visual FX System for Bumpy

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'square' | 'sparkle' | 'text';
  text?: string;
  gravity?: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      if (p.gravity) {
        p.vy += p.gravity * dt * 60;
      }
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;

      if (p.shape === 'text' && p.text) {
        ctx.fillStyle = p.color;
        ctx.font = 'bold 14px "Press Start 2P", monospace, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.shape === 'sparkle') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        const s = p.size;
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x + s * 0.4, p.y - s * 0.4);
        ctx.lineTo(p.x + s, p.y);
        ctx.lineTo(p.x + s * 0.4, p.y + s * 0.4);
        ctx.lineTo(p.x, p.y + s);
        ctx.lineTo(p.x - s * 0.4, p.y + s * 0.4);
        ctx.lineTo(p.x - s, p.y);
        ctx.lineTo(p.x - s * 0.4, p.y - s * 0.4);
        ctx.closePath();
        ctx.fill();
      } else if (p.shape === 'square') {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else {
        // Circle default
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size * (1 - p.life / p.maxLife * 0.5)), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  public clear() {
    this.particles = [];
  }

  // --- Particle Presets ---

  public emitBounceDust(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + 2,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -Math.random() * 1.5,
        size: 2 + Math.random() * 3,
        color: '#e2e8f0',
        alpha: 0.8,
        life: 0,
        maxLife: 0.25,
        gravity: 0.05
      });
    }
  }

  public emitCrumble(x: number, y: number, tileSize: number) {
    const colors = ['#94a3b8', '#64748b', '#cbd5e1', '#475569'];
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        x: x + Math.random() * tileSize,
        y: y + Math.random() * tileSize,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
        shape: 'square',
        gravity: 0.18
      });
    }
  }

  public emitExtinguish(x: number, y: number, tileSize: number) {
    // Steam cloud + water droplets
    for (let i = 0; i < 16; i++) {
      this.particles.push({
        x: x + Math.random() * tileSize,
        y: y + Math.random() * tileSize * 0.5,
        vx: (Math.random() - 0.5) * 2,
        vy: -1.5 - Math.random() * 2.5,
        size: 4 + Math.random() * 6,
        color: Math.random() > 0.5 ? '#f1f5f9' : '#93c5fd',
        alpha: 0.9,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.3,
        gravity: -0.02
      });
    }
  }

  public emitHammerHit(x: number, y: number, tileSize: number) {
    // Heavy rock shards + yellow impact sparks
    for (let i = 0; i < 20; i++) {
      const isSpark = Math.random() > 0.6;
      this.particles.push({
        x: x + tileSize / 2,
        y: y + tileSize / 2,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.7) * 6,
        size: isSpark ? 2 : 4 + Math.random() * 4,
        color: isSpark ? '#fde047' : '#78716c',
        alpha: 1,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3,
        shape: isSpark ? 'sparkle' : 'square',
        gravity: 0.2
      });
    }
  }

  public emitPickup(x: number, y: number, text?: string, color: string = '#facc15') {
    // Sparkles
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color: color,
        alpha: 1,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.2,
        shape: 'sparkle'
      });
    }

    if (text) {
      this.particles.push({
        x: x,
        y: y - 10,
        vx: 0,
        vy: -1.2,
        size: 14,
        color: '#ffffff',
        alpha: 1,
        life: 0,
        maxLife: 0.6,
        shape: 'text',
        text: text
      });
    }
  }

  public emitPortalWhoosh(x: number, y: number) {
    const portalColors = ['#a855f7', '#c084fc', '#38bdf8', '#818cf8'];
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 5 + Math.random() * 20;
      this.particles.push({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: -Math.cos(angle) * 1.5,
        vy: -Math.sin(angle) * 1.5,
        size: 2 + Math.random() * 3,
        color: portalColors[Math.floor(Math.random() * portalColors.length)],
        alpha: 0.9,
        life: 0,
        maxLife: 0.35,
        shape: 'sparkle'
      });
    }
  }

  public emitDeathPop(x: number, y: number) {
    const colors = ['#f59e0b', '#ef4444', '#fbbf24', '#f97316'];
    for (let i = 0; i < 25; i++) {
      const angle = (i / 25) * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 0.6,
        gravity: 0.1
      });
    }
  }

  public emitVictoryConfetti(width: number, height: number) {
    const confettiColors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    for (let i = 0; i < 45; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: -10 - Math.random() * height * 0.4,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 3,
        size: 4 + Math.random() * 5,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        alpha: 1,
        life: 0,
        maxLife: 1.5 + Math.random() * 1.0,
        shape: Math.random() > 0.4 ? 'square' : 'circle',
        gravity: 0.05
      });
    }
  }
}
