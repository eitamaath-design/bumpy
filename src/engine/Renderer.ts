// High-Polish Canvas 2D Renderer for Bumpy Modern Replica

import { BumpyState, Item, LevelDef, MovingHazard, TileState, TileType } from './Types';
import { ParticleSystem } from './Particles';

export class GameRenderer {
  private scanlinesEnabled: boolean = true;
  private animTimer: number = 0;

  constructor() {
    this.scanlinesEnabled = localStorage.getItem('bumpy_crt_filter') !== 'false';
  }

  public toggleCrt(): boolean {
    this.scanlinesEnabled = !this.scanlinesEnabled;
    localStorage.setItem('bumpy_crt_filter', String(this.scanlinesEnabled));
    return this.scanlinesEnabled;
  }

  public isCrtOn(): boolean {
    return this.scanlinesEnabled;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bumpy: BumpyState,
    level: LevelDef,
    tileGrid: TileState[][],
    items: Item[],
    hazards: MovingHazard[],
    particles: ParticleSystem,
    isExitOpen: boolean,
    score: number,
    lives: number,
    timeRemaining: number,
    dt: number
  ) {
    this.animTimer += dt;

    // 1. Background
    this.renderBackground(ctx, width, height, level.id);

    // 2. Render Tiles
    this.renderTiles(ctx, level, tileGrid, isExitOpen);

    // 3. Render Items
    this.renderItems(ctx, items);

    // 4. Render Moving Hazards
    this.renderHazards(ctx, hazards);

    // 5. Render Bumpy Character
    this.renderBumpy(ctx, bumpy);

    // 6. Render Particle Effects & Popups
    particles.render(ctx);

    // 7. Render HUD Overlay
    this.renderHUD(ctx, width, level, items, bumpy, score, lives, timeRemaining, isExitOpen);

    // 8. Render CRT Scanlines / Vignette (if enabled)
    if (this.scanlinesEnabled) {
      this.renderCRT(ctx, width, height);
    }
  }

  private renderBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    levelId: number
  ) {
    // Dynamic themed gradients based on level
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    if (levelId <= 3) {
      // Courtyard / Circus blue-violet night
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
    } else if (levelId <= 5) {
      // Magma / Quarry warm dark dusk
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(1, '#3b1212');
    } else if (levelId <= 7) {
      // Arctic / Cyber neon
      grad.addColorStop(0, '#022c22');
      grad.addColorStop(1, '#082f49');
    } else {
      // Final Citadel deep arcade purple
      grad.addColorStop(0, '#180828');
      grad.addColorStop(1, '#2e1065');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle background grid
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 48;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderTiles(
    ctx: CanvasRenderingContext2D,
    level: LevelDef,
    tileGrid: TileState[][],
    isExitOpen: boolean
  ) {
    const ts = level.tileSize;

    for (let r = 0; r < level.gridHeight; r++) {
      for (let c = 0; c < level.gridWidth; c++) {
        const tile = tileGrid[r][c];
        if (tile.type === TileType.EMPTY) continue;

        const x = c * ts;
        const y = r * ts;

        ctx.save();
        switch (tile.type) {
          case TileType.SOLID:
            this.drawSolidBlock(ctx, x, y, ts);
            break;
          case TileType.FRAGILE:
          case TileType.FRAGILE_2:
            this.drawFragileBlock(ctx, x, y, ts, tile.hitCount);
            break;
          case TileType.SPRING:
            this.drawSpringBlock(ctx, x, y, ts);
            break;
          case TileType.ICE:
            this.drawIceBlock(ctx, x, y, ts);
            break;
          case TileType.FIRE:
            this.drawFireBlock(ctx, x, y, ts);
            break;
          case TileType.HAMMER_BLOCK:
            this.drawHammerBlock(ctx, x, y, ts);
            break;
          case TileType.CONVEYOR_LEFT:
            this.drawConveyorBlock(ctx, x, y, ts, -1);
            break;
          case TileType.CONVEYOR_RIGHT:
            this.drawConveyorBlock(ctx, x, y, ts, 1);
            break;
          case TileType.PORTAL_A:
            this.drawPortalBlock(ctx, x, y, ts, '#a855f7', 'A');
            break;
          case TileType.PORTAL_B:
            this.drawPortalBlock(ctx, x, y, ts, '#38bdf8', 'B');
            break;
          case TileType.SPIKES:
            this.drawSpikeBlock(ctx, x, y, ts);
            break;
          case TileType.LOCK_GATE:
            this.drawLockGate(ctx, x, y, ts);
            break;
          case TileType.STICKY:
            this.drawStickyBlock(ctx, x, y, ts);
            break;
        }
        ctx.restore();
      }
    }

    // Draw Exit Door
    const exitX = level.exitX * ts;
    const exitY = level.exitY * ts;
    this.drawExitDoor(ctx, exitX, exitY, ts, isExitOpen);
  }

  // --- Tile Renderers ---

  private drawSolidBlock(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
    // 3D beveled retro arcade brick
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(x, y, s, s);

    ctx.fillStyle = '#60a5fa'; // Highlight top/left
    ctx.fillRect(x, y, s, 4);
    ctx.fillRect(x, y, 4, s);

    ctx.fillStyle = '#1d4ed8'; // Shadow bottom/right
    ctx.fillRect(x, y + s - 4, s, 4);
    ctx.fillRect(x + s - 4, y, 4, s);

    // Inner panel
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(x + 5, y + 5, s - 10, s - 10);

    // Brick mortar lines
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 8, y + 8, s - 16, s - 16);
  }

  private drawFragileBlock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    s: number,
    hitCount: number
  ) {
    // Cracked earthen platform
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(x, y, s, s);

    ctx.fillStyle = '#d6d3d1';
    ctx.fillRect(x, y, s, 3);
    ctx.fillStyle = '#78716c';
    ctx.fillRect(x, y + s - 4, s, 4);

    // Cracks
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = hitCount > 0 ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 4);
    ctx.lineTo(x + s * 0.45, y + s * 0.5);
    ctx.lineTo(x + s * 0.35, y + s * 0.85);
    ctx.moveTo(x + s * 0.45, y + s * 0.5);
    ctx.lineTo(x + s * 0.8, y + s * 0.35);
    ctx.lineTo(x + s - 6, y + s * 0.7);
    ctx.stroke();
  }

  private drawSpringBlock(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
    // Solid base
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x, y + s - 12, s, 12);
    ctx.fillStyle = '#f87171';
    ctx.fillRect(x, y + s - 12, s, 3);

    // Coiled spring
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + s - 12);
    ctx.lineTo(x + s - 10, y + s - 18);
    ctx.lineTo(x + 10, y + s - 24);
    ctx.lineTo(x + s - 10, y + s - 30);
    ctx.lineTo(x + 12, y + 8);
    ctx.stroke();

    // Top bouncy pad
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + 4, y + 4, s - 8, 8);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 4, y + 4, s - 8, 2);
  }

  private drawIceBlock(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
    // Translucent glistening ice
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x, y, s, s);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(x, y, s, 4);

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x, y + s - 4, s, 4);

    // Diagonal crystalline shine
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + s - 8);
    ctx.lineTo(x + s - 8, y + 6);
    ctx.moveTo(x + 18, y + s - 6);
    ctx.lineTo(x + s - 6, y + 18);
    ctx.stroke();
  }

  private drawFireBlock(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
    // Hearth base
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(x, y + s - 14, s, 14);

    // Animated dancing flames
    const flameCount = 4;
    const flameW = s / flameCount;
    for (let i = 0; i < flameCount; i++) {
      const fx = x + i * flameW;
      const flicker = Math.sin(this.animTimer * 10 + i * 2.2) * 6;
      const flameH = 22 + flicker;

      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(fx, y + s - 14);
      ctx.quadraticCurveTo(fx + flameW / 2, y + s - 14 - flameH * 1.2, fx + flameW / 2, y + s - 14 - flameH);
      ctx.quadraticCurveTo(fx + flameW, y + s - 14 - flameH * 1.2, fx + flameW, y + s - 14);
      ctx.closePath();
      ctx.fill();

      // Yellow core
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(fx + 3, y + s - 14);
      ctx.quadraticCurveTo(fx + flameW / 2, y + s - 14 - flameH * 0.8, fx + flameW / 2, y + s - 14 - flameH * 0.7);
      ctx.quadraticCurveTo(fx + flameW - 3, y + s - 14 - flameH * 0.8, fx + flameW - 3, y + s - 14);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawHammerBlock(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
    // Heavy cracked stone marked with hammer icon
    ctx.fillStyle = '#57534e';
    ctx.fillRect(x, y, s, s);

    ctx.fillStyle = '#78716c';
    ctx.fillRect(x, y, s, 4);
    ctx.fillStyle = '#292524';
    ctx.fillRect(x, y + s - 4, s, 4);

    // Hammer emblem
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    // Handle
    ctx.beginPath();
    ctx.moveTo(x + 12, y + s - 12);
    ctx.lineTo(x + s - 16, y + 16);
    ctx.stroke();
    // Head
    ctx.fillStyle = '#fb923c';
    ctx.fillRect(x + s - 24, y + 10, 16, 10);
  }

  private drawConveyorBlock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    s: number,
    dir: number
  ) {
    ctx.fillStyle = '#334155';
    ctx.fillRect(x, y, s, s);

    ctx.fillStyle = '#475569';
    ctx.fillRect(x, y, s, 6);

    // Rolling chevron arrows
    const offset = (this.animTimer * 40 * dir) % 16;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;

    for (let cx = x - 16; cx < x + s + 16; cx += 16) {
      const arrowX = cx + offset;
      if (arrowX > x + 4 && arrowX < x + s - 4) {
        ctx.beginPath();
        if (dir > 0) {
          ctx.moveTo(arrowX - 4, y + 10);
          ctx.lineTo(arrowX + 2, y + 15);
          ctx.lineTo(arrowX - 4, y + 20);
        } else {
          ctx.moveTo(arrowX + 4, y + 10);
          ctx.lineTo(arrowX - 2, y + 15);
          ctx.lineTo(arrowX + 4, y + 20);
        }
        ctx.stroke();
      }
    }
  }

  private drawPortalBlock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    s: number,
    color: string,
    label: string
  ) {
    // Portal Base
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(x, y, s, s);

    // Glowing swirling ring
    const cx = x + s / 2;
    const cy = y + s / 2;
    const pulse = Math.sin(this.animTimer * 5) * 3;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.animTimer * 2 * (label === 'A' ? 1 : -1));

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.35 + pulse, s * 0.22 + pulse * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Center Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy);
  }

  private drawSpikeBlock(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y + s - 6, s, 6);

    const spikeCount = 3;
    const sw = s / spikeCount;
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1;

    for (let i = 0; i < spikeCount; i++) {
      const sx = x + i * sw;
      ctx.beginPath();
      ctx.moveTo(sx, y + s - 6);
      ctx.lineTo(sx + sw / 2, y + 8);
      ctx.lineTo(sx + sw, y + s - 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  private drawLockGate(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
    // Metal gate bars
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, s, s);

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    for (let bx = x + 8; bx < x + s; bx += 10) {
      ctx.beginPath();
      ctx.moveTo(bx, y);
      ctx.lineTo(bx, y + s);
      ctx.stroke();
    }

    // Golden padlock
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x + s / 2 - 8, y + s / 2 - 4, 16, 14);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x + s / 2, y + s / 2 - 4, 6, Math.PI, 0);
    ctx.stroke();
  }

  private drawStickyBlock(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x, y, s, s);

    ctx.fillStyle = '#d97706';
    ctx.fillRect(x, y, s, 6);

    // Honey bubbles
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(x + 12, y + 14, 3, 0, Math.PI * 2);
    ctx.arc(x + 28, y + 22, 4, 0, Math.PI * 2);
    ctx.arc(x + 38, y + 12, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawExitDoor(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    s: number,
    isOpen: boolean
  ) {
    ctx.save();
    if (isOpen) {
      // Golden open portal
      const glow = Math.sin(this.animTimer * 6) * 8 + 12;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = glow;

      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(x + 4, y - 10, s - 8, s + 10);

      // Swirling golden light
      const grad = ctx.createLinearGradient(x, y, x, y + s);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#f59e0b');
      grad.addColorStop(1, '#d97706');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x + s / 2, y + 10, (s - 14) / 2, Math.PI, 0);
      ctx.lineTo(x + s - 7, y + s);
      ctx.lineTo(x + 7, y + s);
      ctx.closePath();
      ctx.fill();

      // "EXIT" sign
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EXIT!', x + s / 2, y - 14);
    } else {
      // Locked iron vault door
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(x + s / 2, y + 10, (s - 14) / 2, Math.PI, 0);
      ctx.lineTo(x + s - 7, y + s);
      ctx.lineTo(x + 7, y + s);
      ctx.closePath();
      ctx.fill();

      // Chains / Padlock
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 8);
      ctx.lineTo(x + s - 8, y + s - 8);
      ctx.moveTo(x + s - 8, y + 8);
      ctx.lineTo(x + 8, y + s - 8);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LOCKED', x + s / 2, y - 14);
    }
    ctx.restore();
  }

  // --- Items Rendering ---

  private renderItems(ctx: CanvasRenderingContext2D, items: Item[]) {
    for (const item of items) {
      if (item.isCollected) continue;

      const bobY = Math.sin(this.animTimer * 4 + item.bobOffset) * 4;
      const x = item.x;
      const y = item.y + bobY;

      ctx.save();
      ctx.translate(x, y);

      switch (item.type) {
        case 'apple':
          this.drawApple(ctx);
          break;
        case 'banana':
          this.drawBanana(ctx);
          break;
        case 'cherry':
          this.drawCherry(ctx);
          break;
        case 'donut':
          this.drawDonut(ctx);
          break;
        case 'diamond':
          this.drawDiamond(ctx);
          break;
        case 'water_drop':
          this.drawWaterDrop(ctx);
          break;
        case 'hammer':
          this.drawHammerItem(ctx);
          break;
        case 'key':
          this.drawKey(ctx);
          break;
        case 'clock':
          this.drawClock(ctx);
          break;
        case 'extra_life':
          this.drawHeart(ctx);
          break;
      }
      ctx.restore();
    }
  }

  private drawApple(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 2, 10, 0, Math.PI * 2);
    ctx.fill();
    // Highlight
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(-3, -2, 3, 0, Math.PI * 2);
    ctx.fill();
    // Stem & Leaf
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(2, -12);
    ctx.stroke();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(4, -10, 4, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBanana(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-2, 0, 10, -Math.PI / 3, Math.PI / 2.5);
    ctx.stroke();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(-2, 0, 10, -Math.PI / 4, Math.PI / 3);
    ctx.stroke();
  }

  private drawCherry(ctx: CanvasRenderingContext2D) {
    // Cherry 1
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(-5, 4, 6, 0, Math.PI * 2);
    ctx.fill();
    // Cherry 2
    ctx.beginPath();
    ctx.arc(5, 5, 6, 0, Math.PI * 2);
    ctx.fill();

    // Stems joined
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.quadraticCurveTo(-2, -8, 2, -10);
    ctx.moveTo(5, 1);
    ctx.quadraticCurveTo(3, -7, 2, -10);
    ctx.stroke();
  }

  private drawDonut(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    // Pink Icing
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Center hole
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Sprinkles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, -3, 2, 2);
    ctx.fillRect(3, -4, 2, 2);
    ctx.fillRect(-2, 4, 2, 2);
  }

  private drawDiamond(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(9, -3);
    ctx.lineTo(0, 11);
    ctx.lineTo(-9, -3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(4, -3);
    ctx.lineTo(0, 11);
    ctx.closePath();
    ctx.fill();
  }

  private drawWaterDrop(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.quadraticCurveTo(9, 2, 0, 10);
    ctx.quadraticCurveTo(-9, 2, 0, -11);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.arc(-2, 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawHammerItem(ctx: CanvasRenderingContext2D) {
    // Handle
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-6, 8);
    ctx.lineTo(6, -6);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(1, -11, 11, 7);
  }

  private drawKey(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    // Ring
    ctx.beginPath();
    ctx.arc(-4, -4, 5, 0, Math.PI * 2);
    ctx.stroke();
    // Stem
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(9, 9);
    ctx.lineTo(7, 11);
    ctx.moveTo(6, 6);
    ctx.lineTo(8, 8);
    ctx.stroke();
  }

  private drawClock(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Clock hands
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -5);
    ctx.moveTo(0, 0);
    ctx.lineTo(4, 0);
    ctx.stroke();
  }

  private drawHeart(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(0, 3);
    ctx.bezierCurveTo(-7, -5, -9, 3, 0, 9);
    ctx.bezierCurveTo(9, 3, 7, -5, 0, 3);
    ctx.fill();
  }

  // --- Moving Hazards ---

  private renderHazards(ctx: CanvasRenderingContext2D, hazards: MovingHazard[]) {
    for (const h of hazards) {
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.phase);

      // Spiked naval mine
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.arc(0, 0, h.radius - 3, 0, Math.PI * 2);
      ctx.fill();

      // Sharp radiating spikes
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * (h.radius - 4), Math.sin(angle) * (h.radius - 4));
        ctx.lineTo(Math.cos(angle) * (h.radius + 4), Math.sin(angle) * (h.radius + 4));
        ctx.stroke();
      }

      // Red center eye
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // --- Bumpy Character Rendering ---

  private renderBumpy(ctx: CanvasRenderingContext2D, bumpy: BumpyState) {
    if (bumpy.isDead && bumpy.deathTimer > 0.6) return;

    ctx.save();
    ctx.translate(bumpy.x, bumpy.y);
    ctx.scale(bumpy.squashX, bumpy.squashY);

    // Invulnerability blink
    if (bumpy.invulnerableTimer > 0 && Math.floor(bumpy.invulnerableTimer * 10) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Protective Water Aura (if holding water drops)
    if (bumpy.waterDrops > 0) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, bumpy.radius + 6 + Math.sin(this.animTimer * 8) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Main Bouncy Ball Body (Radial 3D Lighting)
    const bodyGrad = ctx.createRadialGradient(
      -bumpy.radius * 0.3,
      -bumpy.radius * 0.3,
      2,
      0,
      0,
      bumpy.radius
    );
    bodyGrad.addColorStop(0, '#fef08a'); // Bright yellow top highlight
    bodyGrad.addColorStop(0.5, '#facc15'); // Vivid gold body
    bodyGrad.addColorStop(1, '#d97706'); // Deep amber shadow
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, bumpy.radius, 0, Math.PI * 2);
    ctx.fill();

    // Expressive Eyes
    const eyeOffsetX = bumpy.facing * 4;
    const eyeSpacing = 6;
    const eyeY = -3;

    if (bumpy.isBlinking) {
      // Closed blinking slits
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(eyeOffsetX - eyeSpacing - 3, eyeY);
      ctx.lineTo(eyeOffsetX - eyeSpacing + 3, eyeY);
      ctx.moveTo(eyeOffsetX + eyeSpacing - 3, eyeY);
      ctx.lineTo(eyeOffsetX + eyeSpacing + 3, eyeY);
      ctx.stroke();
    } else {
      // Big cartoon eyes
      ctx.fillStyle = '#ffffff';
      // Left eye
      ctx.beginPath();
      ctx.ellipse(eyeOffsetX - eyeSpacing, eyeY, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Right eye
      ctx.beginPath();
      ctx.ellipse(eyeOffsetX + eyeSpacing, eyeY, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupils looking in direction
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(eyeOffsetX - eyeSpacing + bumpy.facing * 1.5, eyeY, 2.2, 0, Math.PI * 2);
      ctx.arc(eyeOffsetX + eyeSpacing + bumpy.facing * 1.5, eyeY, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Eye catch reflection
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eyeOffsetX - eyeSpacing + bumpy.facing * 1.5 - 0.8, eyeY - 1, 0.9, 0, Math.PI * 2);
      ctx.arc(eyeOffsetX + eyeSpacing + bumpy.facing * 1.5 - 0.8, eyeY - 1, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cheerful Smile
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (bumpy.vy < -5) {
      // Open joyful 'O' mouth on high jump!
      ctx.fillStyle = '#991b1b';
      ctx.ellipse(eyeOffsetX, 6, 3.5, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Big open grin
      ctx.arc(eyeOffsetX, 4, 5, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }

    // Rosy Cheeks
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.beginPath();
    ctx.arc(eyeOffsetX - 10, 4, 2.5, 0, Math.PI * 2);
    ctx.arc(eyeOffsetX + 10, 4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- HUD Rendering ---

  private renderHUD(
    ctx: CanvasRenderingContext2D,
    width: number,
    level: LevelDef,
    items: Item[],
    bumpy: BumpyState,
    score: number,
    lives: number,
    timeRemaining: number,
    isExitOpen: boolean
  ) {
    ctx.save();
    // Top HUD Bar Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, width, 44);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 44);
    ctx.lineTo(width, 44);
    ctx.stroke();

    ctx.font = 'bold 13px "Courier New", monospace';

    // 1. Level Name (Left)
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.fillText(`${level.name}`, 14, 18);

    // Subtitle / instructions tip
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(level.subtitle, 14, 34);

    // 2. Score & Lives (Middle)
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${score.toString().padStart(6, '0')}`, width * 0.45, 18);

    // Lives as small yellow circles
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`LIVES: `, width * 0.45 - 20, 34);
    for (let i = 0; i < lives; i++) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(width * 0.45 + 10 + i * 14, 30, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Collectibles / Exit Status
    const reqItems = items.filter((it) => it.isCollectibleRequirement);
    const remainingReq = reqItems.filter((it) => !it.isCollected).length;

    if (isExitOpen) {
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('DOOR UNLOCKED! REACH EXIT!', width * 0.72, 18);
    } else {
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`ITEMS: ${reqItems.length - remainingReq}/${reqItems.length}`, width * 0.72, 18);
    }

    // Inventory badges (Water / Hammer / Key)
    let invStr = '';
    if (bumpy.waterDrops > 0) invStr += `💧x${bumpy.waterDrops} `;
    if (bumpy.hammers > 0) invStr += `🔨x${bumpy.hammers} `;
    if (bumpy.keys > 0) invStr += `🔑x${bumpy.keys} `;
    if (invStr) {
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(invStr, width * 0.72, 34);
    }

    // 4. Time Remaining (Right)
    const timeFormatted = Math.max(0, Math.ceil(timeRemaining));
    ctx.textAlign = 'right';
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = timeRemaining <= 10 ? '#ef4444' : '#38bdf8';
    ctx.fillText(`TIME: ${timeFormatted}s`, width - 16, 26);

    ctx.restore();
  }

  // --- CRT Scanline Simulation ---

  private renderCRT(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let y = 0; y < height; y += 3) {
      ctx.fillRect(0, y, width, 1);
    }

    // Subtle edge vignette
    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      height * 0.45,
      width / 2,
      height / 2,
      height * 0.8
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }
}
