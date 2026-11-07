// Master Game Coordinator & State Machine for Bumpy Replica

import { BumpyState, GameState, Item, ItemType, LevelDef, MovingHazard, TileState } from './Types';
import { LEVELS } from '../levels/levels';
import { audio } from './Audio';
import { ParticleSystem } from './Particles';
import { PhysicsEngine } from './Physics';
import { GameRenderer } from './Renderer';
import { InputManager } from './Input';

export interface LevelProgress {
  unlocked: boolean;
  highScore: number;
  bestTime: number;
  stars: number;
}

export class BumpyGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState = 'TITLE';

  // Sub-systems
  private physics: PhysicsEngine;
  private renderer: GameRenderer;
  private input: InputManager;
  private particles: ParticleSystem;

  // Game data
  private currentLevelIndex: number = 0;
  private currentLevelDef: LevelDef = LEVELS[0];
  private tileGrid: TileState[][] = [];
  private items: Item[] = [];
  private hazards: MovingHazard[] = [];
  private bumpy!: BumpyState;

  // Session stats
  private score: number = 0;
  private lives: number = 3;
  private timeRemaining: number = 60;
  private isExitOpen: boolean = false;
  private levelClearTimer: number = 0;
  private starsEarned: number = 0;
  private timeBonus: number = 0;

  // Persistence
  private progress: { [levelId: number]: LevelProgress } = {};
  private previousState: GameState = 'TITLE';

  // Input debounces
  private lastPauseState: boolean = false;
  private lastMuteMusicState: boolean = false;
  private lastMuteSoundState: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get 2D context');
    this.ctx = context;

    this.physics = new PhysicsEngine();
    this.renderer = new GameRenderer();
    this.input = new InputManager();
    this.particles = new ParticleSystem();

    this.loadProgress();
    this.setupEventListeners();
    this.initLevel(0);
  }

  private loadProgress() {
    const saved = localStorage.getItem('bumpy_replica_progress');
    if (saved) {
      try {
        this.progress = JSON.parse(saved);
      } catch {
        this.progress = {};
      }
    }
    // Level 1 is always unlocked
    if (!this.progress[1]) {
      this.progress[1] = { unlocked: true, highScore: 0, bestTime: 999, stars: 0 };
    }
  }

  private saveProgress() {
    localStorage.setItem('bumpy_replica_progress', JSON.stringify(this.progress));
  }

  public unlockAllLevels() {
    LEVELS.forEach((lvl) => {
      if (!this.progress[lvl.id]) {
        this.progress[lvl.id] = { unlocked: true, highScore: 0, bestTime: 999, stars: 0 };
      } else {
        this.progress[lvl.id].unlocked = true;
      }
    });
    this.saveProgress();
  }

  private initLevel(levelIndex: number) {
    this.currentLevelIndex = levelIndex;
    const def = LEVELS[levelIndex];
    this.currentLevelDef = def;
    this.timeRemaining = def.timeLimit;
    this.isExitOpen = false;

    // Build Tile Grid
    this.tileGrid = [];
    for (let r = 0; r < def.gridHeight; r++) {
      const row: TileState[] = [];
      for (let c = 0; c < def.gridWidth; c++) {
        row.push({
          type: def.tiles[r][c],
          hitCount: 0,
          crumbleTimer: 0,
          isBreaking: false,
          conveyorOffset: 0,
          portalPulse: 0
        });
      }
      this.tileGrid.push(row);
    }

    // Spawn Items
    this.items = def.items.map((itemDef, idx) => {
      const isReq = ['apple', 'banana', 'cherry', 'donut', 'diamond'].includes(itemDef.type);
      return {
        id: `item_${idx}`,
        x: (itemDef.col + 0.5) * def.tileSize,
        y: (itemDef.row + 0.5) * def.tileSize,
        type: itemDef.type,
        points: this.getItemPoints(itemDef.type),
        isCollected: false,
        bobOffset: idx * 0.8,
        isCollectibleRequirement: isReq
      };
    });

    // Spawn Hazards
    this.hazards = [];
    if (def.hazards) {
      def.hazards.forEach((hDef, idx) => {
        this.hazards.push({
          id: `hazard_${idx}`,
          x: (hDef.col + 0.5) * def.tileSize,
          y: (hDef.row + 0.5) * def.tileSize,
          vx: hDef.speed,
          vy: 0,
          minX: (hDef.minCol + 0.5) * def.tileSize,
          maxX: (hDef.maxCol + 0.5) * def.tileSize,
          minY: 0,
          maxY: 0,
          radius: 12,
          type: hDef.type,
          phase: idx
        });
      });
    }

    // Reset Bumpy
    this.bumpy = {
      x: (def.playerStartX + 0.5) * def.tileSize,
      y: (def.playerStartY + 0.5) * def.tileSize,
      vx: 0,
      vy: 0,
      radius: 15,
      facing: 1,
      isGrounded: false,
      squashX: 1,
      squashY: 1,
      blinkTimer: 2.0,
      isBlinking: false,
      waterDrops: 0,
      hammers: 0,
      keys: 0,
      invulnerableTimer: 0.5,
      isDead: false,
      deathTimer: 0,
      portalCooldown: 0
    };

    this.particles.clear();
  }

  private getItemPoints(type: ItemType): number {
    switch (type) {
      case 'apple': return 100;
      case 'banana': return 150;
      case 'cherry': return 200;
      case 'donut': return 250;
      case 'diamond': return 500;
      case 'clock': return 50;
      case 'water_drop': return 100;
      case 'hammer': return 100;
      case 'key': return 100;
      case 'extra_life': return 500;
    }
  }

  private setupEventListeners() {
    // Click / touch on canvas to interact with UI or start
    this.canvas.addEventListener('pointerdown', (e) => {
      audio.unlockAudio();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      this.handlePointerClick(x, y);
    });
  }

  public getState(): GameState {
    return this.state;
  }

  public handlePointerClick(x: number, y: number) {
    if (this.state === 'TITLE') {
      const w = this.canvas.width;
      // Level Select button on Title: y between 420 and 460
      if (x >= w / 2 - 130 && x <= w / 2 + 130 && y >= 420 && y <= 460) {
        this.openLevelSelect();
        return;
      }
      // How to Play button on Title: y between 475 and 515
      if (x >= w / 2 - 130 && x <= w / 2 + 130 && y >= 475 && y <= 515) {
        this.openInstructions();
        return;
      }
      // Clicking anywhere else starts the game
      this.startNewGame();
    } else if (this.state === 'INSTRUCTIONS') {
      // Clicking "GOT IT! BACK" or anywhere on the instructions screen closes it
      this.closeInstructions();
    } else if (this.state === 'LEVEL_SELECT') {
      this.handleLevelSelectClick(x, y);
    } else if (this.state === 'LEVEL_CLEAR') {
      // Next Level button
      if (this.currentLevelIndex < LEVELS.length - 1) {
        this.initLevel(this.currentLevelIndex + 1);
        this.state = 'PLAYING';
      } else {
        this.state = 'GAME_COMPLETE';
      }
    } else if (this.state === 'GAME_OVER') {
      this.startNewGame();
    } else if (this.state === 'GAME_COMPLETE') {
      this.state = 'TITLE';
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
    }
  }

  public startNewGame() {
    audio.unlockAudio();
    audio.startMusic();
    this.score = 0;
    this.lives = 3;
    this.initLevel(0);
    this.state = 'PLAYING';
  }

  public openLevelSelect() {
    if (this.state !== 'LEVEL_SELECT') {
      this.previousState = this.state;
    }
    this.state = 'LEVEL_SELECT';
  }

  public closeLevelSelect() {
    this.state = this.previousState || 'TITLE';
  }

  public openInstructions() {
    if (this.state !== 'INSTRUCTIONS') {
      this.previousState = this.state;
    }
    this.state = 'INSTRUCTIONS';
  }

  public closeInstructions() {
    this.state = this.previousState || 'TITLE';
  }

  public selectLevel(idx: number) {
    if (idx >= 0 && idx < LEVELS.length) {
      const lvl = LEVELS[idx];
      if (this.progress[lvl.id]?.unlocked) {
        audio.unlockAudio();
        audio.startMusic();
        this.initLevel(idx);
        this.state = 'PLAYING';
      }
    }
  }

  public toggleMuteMusic(): boolean {
    return audio.toggleMusic();
  }

  public toggleMuteSound(): boolean {
    return audio.toggleSound();
  }

  public toggleCrt(): boolean {
    return this.renderer.toggleCrt();
  }

  public setVirtualKey(key: 'left' | 'right' | 'up' | 'down', pressed: boolean) {
    this.input.setVirtualKey(key, pressed);
  }

  // --- Main Game Loop ---

  public update(dt: number) {
    const inputs = this.input.update();

    // Global Key toggles
    if (inputs.pause && !this.lastPauseState) {
      if (this.state === 'INSTRUCTIONS') this.closeInstructions();
      else if (this.state === 'LEVEL_SELECT') this.closeLevelSelect();
      else if (this.state === 'PLAYING') this.state = 'PAUSED';
      else if (this.state === 'PAUSED') this.state = 'PLAYING';
    }
    this.lastPauseState = inputs.pause;

    if (inputs.muteMusic && !this.lastMuteMusicState) {
      this.toggleMuteMusic();
    }
    this.lastMuteMusicState = inputs.muteMusic;

    if (inputs.muteSound && !this.lastMuteSoundState) {
      this.toggleMuteSound();
    }
    this.lastMuteSoundState = inputs.muteSound;

    if (inputs.restart && this.state === 'PLAYING') {
      this.restartCurrentLevel();
    }

    // State Specific Updates
    if (this.state === 'PLAYING') {
      this.updatePlaying(inputs, dt);
    } else if (this.state === 'LEVEL_CLEAR') {
      this.particles.update(dt);
      this.levelClearTimer += dt;
    } else if (this.state === 'TITLE' || this.state === 'GAME_COMPLETE') {
      this.particles.update(dt);
    }
  }

  private updatePlaying(
    inputs: { left: boolean; right: boolean; up: boolean; down: boolean },
    dt: number
  ) {
    // 1. Countdown Timer
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.handlePlayerDeath();
      return;
    }

    // 2. Check if all required items gathered
    const reqItems = this.items.filter((it) => it.isCollectibleRequirement);
    const allReqCollected = reqItems.every((it) => it.isCollected);

    if (!this.isExitOpen && allReqCollected) {
      this.isExitOpen = true;
      audio.playDoorOpen();
      this.particles.emitPickup(
        (this.currentLevelDef.exitX + 0.5) * this.currentLevelDef.tileSize,
        (this.currentLevelDef.exitY + 0.5) * this.currentLevelDef.tileSize,
        'EXIT OPEN!',
        '#facc15'
      );
    }

    // 3. Update Physics & Collision
    this.physics.update(
      this.bumpy,
      this.currentLevelDef,
      this.tileGrid,
      this.items,
      this.hazards,
      this.particles,
      inputs,
      this.isExitOpen,
      () => this.handleLevelClear(),
      () => this.handlePlayerDeath(),
      dt
    );

    // 4. Update Particles
    this.particles.update(dt);
  }

  private handlePlayerDeath() {
    this.lives--;
    if (this.lives <= 0) {
      audio.playGameOver();
      this.state = 'GAME_OVER';
    } else {
      setTimeout(() => {
        this.initLevel(this.currentLevelIndex);
      }, 700);
    }
  }

  private restartCurrentLevel() {
    this.initLevel(this.currentLevelIndex);
  }

  private handleLevelClear() {
    audio.playLevelClear();
    this.state = 'LEVEL_CLEAR';
    this.levelClearTimer = 0;

    // Calculate Stars & Bonuses
    const timeUsed = this.currentLevelDef.timeLimit - this.timeRemaining;
    this.timeBonus = Math.floor(Math.max(0, this.timeRemaining) * 50);
    this.score += this.timeBonus + 1000;

    if (timeUsed <= this.currentLevelDef.parTime) {
      this.starsEarned = 3;
    } else if (timeUsed <= this.currentLevelDef.parTime * 1.5) {
      this.starsEarned = 2;
    } else {
      this.starsEarned = 1;
    }

    // Save Progress
    const lvlId = this.currentLevelDef.id;
    const curProg = this.progress[lvlId] || { unlocked: true, highScore: 0, bestTime: 999, stars: 0 };
    curProg.highScore = Math.max(curProg.highScore, this.score);
    curProg.bestTime = Math.min(curProg.bestTime, Math.round(timeUsed));
    curProg.stars = Math.max(curProg.stars, this.starsEarned);
    this.progress[lvlId] = curProg;

    // Unlock Next Level
    const nextLvlId = lvlId + 1;
    if (nextLvlId <= LEVELS.length) {
      if (!this.progress[nextLvlId]) {
        this.progress[nextLvlId] = { unlocked: true, highScore: 0, bestTime: 999, stars: 0 };
      } else {
        this.progress[nextLvlId].unlocked = true;
      }
    }
    this.saveProgress();

    this.particles.emitVictoryConfetti(this.canvas.width, this.canvas.height);
  }

  // --- Rendering ---

  public render(dt: number) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);

    if (this.state === 'PLAYING' || this.state === 'PAUSED') {
      this.renderer.render(
        this.ctx,
        w,
        h,
        this.bumpy,
        this.currentLevelDef,
        this.tileGrid,
        this.items,
        this.hazards,
        this.particles,
        this.isExitOpen,
        this.score,
        this.lives,
        this.timeRemaining,
        dt
      );

      if (this.state === 'PAUSED') {
        this.renderPauseOverlay(w, h);
      }
    } else if (this.state === 'TITLE') {
      this.renderTitleScreen(w, h);
    } else if (this.state === 'LEVEL_SELECT') {
      this.renderLevelSelectScreen(w, h);
    } else if (this.state === 'LEVEL_CLEAR') {
      this.renderLevelClearScreen(w, h);
    } else if (this.state === 'GAME_OVER') {
      this.renderGameOverScreen(w, h);
    } else if (this.state === 'GAME_COMPLETE') {
      this.renderGameCompleteScreen(w, h);
    } else if (this.state === 'INSTRUCTIONS') {
      this.renderInstructionsScreen(w, h);
    }
  }

  // --- Screens Rendering ---

  private renderTitleScreen(w: number, h: number) {
    // Backdrop
    const grad = this.ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#311042');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);

    // Glowing Neon Title
    this.ctx.save();
    this.ctx.shadowColor = '#facc15';
    this.ctx.shadowBlur = 18;
    this.ctx.font = 'bold 56px "Press Start 2P", monospace, sans-serif';
    this.ctx.fillStyle = '#facc15';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BUMPY', w / 2, 160);
    this.ctx.restore();

    this.ctx.font = 'bold 18px monospace';
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('MODERN ARCADE REPLICA', w / 2, 205);

    // Animated Bouncing Bumpy Preview
    const bounceOffset = Math.abs(Math.sin(performance.now() * 0.005)) * 40;
    const squash = bounceOffset < 4 ? 1.3 : 0.85;
    this.ctx.save();
    this.ctx.translate(w / 2, 290 - bounceOffset);
    this.ctx.scale(squash, 2 - squash);
    // Body
    const bGrad = this.ctx.createRadialGradient(-6, -6, 2, 0, 0, 26);
    bGrad.addColorStop(0, '#fef08a');
    bGrad.addColorStop(0.6, '#facc15');
    bGrad.addColorStop(1, '#d97706');
    this.ctx.fillStyle = bGrad;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 26, 0, Math.PI * 2);
    this.ctx.fill();
    // Eyes
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(-8, -4, 6, 0, Math.PI * 2);
    this.ctx.arc(8, -4, 6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#0f172a';
    this.ctx.beginPath();
    this.ctx.arc(-7, -4, 3, 0, Math.PI * 2);
    this.ctx.arc(9, -4, 3, 0, Math.PI * 2);
    this.ctx.fill();
    // Smile
    this.ctx.strokeStyle = '#78350f';
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.ctx.arc(0, 4, 8, 0.2 * Math.PI, 0.8 * Math.PI);
    this.ctx.stroke();
    this.ctx.restore();

    // Menu Options
    const pulse = Math.sin(performance.now() * 0.006) > 0 ? 1 : 0.6;
    this.ctx.save();
    this.ctx.globalAlpha = pulse;
    this.ctx.font = 'bold 20px monospace';
    this.ctx.fillStyle = '#4ade80';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('▶ CLICK ANYWHERE OR PRESS SPACE TO START ◀', w / 2, 380);
    this.ctx.restore();

    // Secondary buttons
    this.drawButton(w / 2 - 130, 420, 260, 40, 'LEVEL SELECT', '#38bdf8');
    this.drawButton(w / 2 - 130, 475, 260, 40, 'HOW TO PLAY', '#a855f7');

    this.ctx.font = '12px monospace';
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Faithful 10-Level Recreation of Loriciels 1989/1992 Classic', w / 2, 545);

    this.particles.render(this.ctx);
  }

  private renderLevelSelectScreen(w: number, h: number) {
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.font = 'bold 30px monospace';
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SELECT LEVEL', w / 2, 55);

    // Grid of 10 levels (2 rows of 5)
    const btnW = 120;
    const btnH = 95;
    const gapX = 24;
    const gapY = 24;
    const startX = (w - (5 * btnW + 4 * gapX)) / 2;
    const startY = 100;

    for (let i = 0; i < LEVELS.length; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const bx = startX + col * (btnW + gapX);
      const by = startY + row * (btnH + gapY);

      const lvl = LEVELS[i];
      const prog = this.progress[lvl.id];
      const isUnlocked = !!prog?.unlocked;

      // Card frame
      this.ctx.fillStyle = isUnlocked ? '#1e293b' : '#111827';
      this.ctx.fillRect(bx, by, btnW, btnH);
      this.ctx.strokeStyle = isUnlocked ? '#38bdf8' : '#374151';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(bx, by, btnW, btnH);

      // Level number
      this.ctx.font = 'bold 20px monospace';
      this.ctx.fillStyle = isUnlocked ? '#facc15' : '#64748b';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`LVL ${lvl.id}`, bx + btnW / 2, by + 32);

      if (isUnlocked) {
        // Stars
        const stars = prog?.stars || 0;
        let starStr = '';
        for (let s = 0; s < 3; s++) {
          starStr += s < stars ? '★' : '☆';
        }
        this.ctx.font = '16px monospace';
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.fillText(starStr, bx + btnW / 2, by + 58);

        // Best time
        this.ctx.font = '11px monospace';
        this.ctx.fillStyle = '#94a3b8';
        const best = prog?.bestTime && prog.bestTime < 999 ? `${prog.bestTime}s` : '--';
        this.ctx.fillText(`BEST: ${best}`, bx + btnW / 2, by + 80);
      } else {
        // Locked
        this.ctx.font = '14px monospace';
        this.ctx.fillStyle = '#64748b';
        this.ctx.fillText('🔒 LOCKED', bx + btnW / 2, by + 65);
      }
    }

    // Bottom action buttons
    this.drawButton(w / 2 - 200, 385, 180, 42, 'BACK TO TITLE', '#94a3b8');
    this.drawButton(w / 2 + 20, 385, 180, 42, 'UNLOCK ALL 🔓', '#f59e0b');

    this.ctx.font = '12px monospace';
    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Click any unlocked level to play!', w / 2, 470);
  }

  private handleLevelSelectClick(x: number, y: number) {
    const w = this.canvas.width;
    const btnW = 120;
    const btnH = 95;
    const gapX = 24;
    const gapY = 24;
    const startX = (w - (5 * btnW + 4 * gapX)) / 2;
    const startY = 100;

    for (let i = 0; i < LEVELS.length; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const bx = startX + col * (btnW + gapX);
      const by = startY + row * (btnH + gapY);

      if (x >= bx && x <= bx + btnW && y >= by && y <= by + btnH) {
        this.selectLevel(i);
        return;
      }
    }

    // Back to Title button
    if (x >= w / 2 - 200 && x <= w / 2 - 20 && y >= 385 && y <= 427) {
      this.state = 'TITLE';
    }

    // Unlock All button
    if (x >= w / 2 + 20 && x <= w / 2 + 200 && y >= 385 && y <= 427) {
      this.unlockAllLevels();
    }
  }

  private renderLevelClearScreen(w: number, h: number) {
    // Semi-transparent overlay over completed level
    this.renderer.render(
      this.ctx,
      w,
      h,
      this.bumpy,
      this.currentLevelDef,
      this.tileGrid,
      this.items,
      this.hazards,
      this.particles,
      true,
      this.score,
      this.lives,
      this.timeRemaining,
      0
    );

    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    this.ctx.fillRect(w * 0.15, h * 0.15, w * 0.7, h * 0.7);
    this.ctx.strokeStyle = '#facc15';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(w * 0.15, h * 0.15, w * 0.7, h * 0.7);

    // Victory Title
    this.ctx.font = 'bold 32px monospace';
    this.ctx.fillStyle = '#4ade80';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('STAGE CLEARED!', w / 2, h * 0.28);

    // Star Rating
    let starStr = '';
    for (let s = 0; s < 3; s++) {
      starStr += s < this.starsEarned ? '★' : '☆';
    }
    this.ctx.font = 'bold 42px monospace';
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.fillText(starStr, w / 2, h * 0.4);

    // Stats
    this.ctx.font = '16px monospace';
    this.ctx.fillStyle = '#e2e8f0';
    this.ctx.fillText(`Time Bonus: +${this.timeBonus} pts`, w / 2, h * 0.5);
    this.ctx.fillText(`Total Score: ${this.score}`, w / 2, h * 0.57);

    // Next Level Button
    const nextText = this.currentLevelIndex < LEVELS.length - 1 ? 'NEXT STAGE ▶' : 'FINALE ▶';
    this.drawButton(w / 2 - 130, h * 0.67, 260, 45, nextText, '#38bdf8');
  }

  private renderGameOverScreen(w: number, h: number) {
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.font = 'bold 46px monospace';
    this.ctx.fillStyle = '#ef4444';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', w / 2, h * 0.35);

    this.ctx.font = '18px monospace';
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillText(`FINAL SCORE: ${this.score}`, w / 2, h * 0.48);

    this.drawButton(w / 2 - 130, h * 0.6, 260, 45, 'TRY AGAIN ↺', '#38bdf8');
  }

  private renderGameCompleteScreen(w: number, h: number) {
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.font = 'bold 36px monospace';
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('CONGRATULATIONS!', w / 2, 140);

    this.ctx.font = 'bold 22px monospace';
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.fillText('YOU CONQUERED ALL 10 LEVELS!', w / 2, 190);

    this.ctx.font = '18px monospace';
    this.ctx.fillStyle = '#4ade80';
    this.ctx.fillText(`MASTER SCORE: ${this.score}`, w / 2, 270);

    this.drawButton(w / 2 - 130, 360, 260, 45, 'PLAY AGAIN', '#facc15');

    this.particles.render(this.ctx);
  }

  private renderInstructionsScreen(w: number, h: number) {
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.font = 'bold 28px monospace';
    this.ctx.fillStyle = '#facc15';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('HOW TO PLAY BUMPY', w / 2, 45);

    this.ctx.font = '13px monospace';
    this.ctx.fillStyle = '#e2e8f0';
    this.ctx.textAlign = 'left';

    const lines = [
      '• CONTROLS: Arrow Keys or WASD to steer left/right.',
      '• HIGH JUMP: Hold UP / W or SPACE while bouncing to spring high!',
      '• FAST FALL: Hold DOWN / S in the air to dive down.',
      '• OBJECTIVE: Bounce around and collect ALL required fruits & diamonds.',
      '  Once collected, the EXIT DOOR unlocks! Reach it to clear the stage.',
      '• PLATFORM MECHANICS:',
      '  - BRITTLE BLOCKS: Crumble and disappear after 1 or 2 bounces!',
      '  - SPRINGS: Trampolines that launch Bumpy high into the sky.',
      '  - ICE: Zero friction! Sliders glide across slippery frozen ledges.',
      '  - FIRE & WATER: Fire kills on contact! Grab Water Droplets 💧 to douse fire.',
      '  - HAMMERS: Pick up Hammers 🔨 to smash through cracked barrier blocks.',
      '  - KEYS & GATES: Collect Golden Keys 🔑 to unlock security gates.',
      '  - PORTALS: Step into paired vortex portals (A ↔ B) to warp across the stage.',
      '  - SPIKES: Deadly! Avoid at all costs.'
    ];

    lines.forEach((line, idx) => {
      this.ctx.fillText(line, 40, 85 + idx * 28);
    });

    this.drawButton(w / 2 - 100, 505, 200, 40, 'GOT IT! BACK', '#38bdf8');
  }

  private renderPauseOverlay(w: number, h: number) {
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.font = 'bold 40px monospace';
    this.ctx.fillStyle = '#facc15';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', w / 2, h * 0.45);

    this.ctx.font = '16px monospace';
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.fillText('Press P, ESC, or Click to Resume', w / 2, h * 0.55);
  }

  private drawButton(
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    color: string
  ) {
    this.ctx.save();
    this.ctx.fillStyle = '#1e293b';
    this.ctx.fillRect(x, y, w, h);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, w, h);

    this.ctx.font = 'bold 15px monospace';
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x + w / 2, y + h / 2);
    this.ctx.restore();
  }
}
