// Physics, Bouncing Dynamics & Collision Resolution for Bumpy

import { BumpyState, Item, LevelDef, MovingHazard, TileState, TileType } from './Types';
import { audio } from './Audio';
import { ParticleSystem } from './Particles';

export class PhysicsEngine {
  private gravity: number = 0.38;
  private maxFallSpeed: number = 10.0;
  private moveSpeed: number = 4.2;
  private iceSpeedMultiplier: number = 1.35;
  private normalBounceVel: number = -9.4;
  private highBounceVel: number = -13.6;
  private springBounceVel: number = -17.5;

  public update(
    bumpy: BumpyState,
    level: LevelDef,
    tileGrid: TileState[][],
    items: Item[],
    hazards: MovingHazard[],
    particles: ParticleSystem,
    inputs: { left: boolean; right: boolean; up: boolean; down: boolean },
    isExitOpen: boolean,
    onLevelClear: () => void,
    onPlayerDeath: () => void,
    dt: number
  ) {
    if (bumpy.isDead) {
      bumpy.deathTimer += dt;
      bumpy.squashX = 0.5 + Math.sin(bumpy.deathTimer * 20) * 0.2;
      bumpy.squashY = 0.5 + Math.cos(bumpy.deathTimer * 20) * 0.2;
      return;
    }

    if (bumpy.invulnerableTimer > 0) {
      bumpy.invulnerableTimer -= dt;
    }
    if (bumpy.portalCooldown > 0) {
      bumpy.portalCooldown -= dt;
    }

    // 1. Horizontal Input & Acceleration
    let targetVx = 0;
    if (inputs.left) {
      targetVx = -this.moveSpeed;
      bumpy.facing = -1;
    } else if (inputs.right) {
      targetVx = this.moveSpeed;
      bumpy.facing = 1;
    }

    // Check if on ice
    const curCol = Math.floor(bumpy.x / level.tileSize);
    const belowRow = Math.floor((bumpy.y + bumpy.radius + 2) / level.tileSize);
    let isOnIce = false;
    let conveyorPush = 0;

    if (belowRow >= 0 && belowRow < level.gridHeight && curCol >= 0 && curCol < level.gridWidth) {
      const tileBelow = tileGrid[belowRow][curCol];
      if (tileBelow.type === TileType.ICE) {
        isOnIce = true;
      } else if (tileBelow.type === TileType.CONVEYOR_LEFT) {
        conveyorPush = -2.2;
      } else if (tileBelow.type === TileType.CONVEYOR_RIGHT) {
        conveyorPush = 2.2;
      }
    }

    if (isOnIce) {
      // Very low friction sliding
      if (targetVx !== 0) {
        bumpy.vx += (targetVx * this.iceSpeedMultiplier - bumpy.vx) * 0.08;
      } else {
        bumpy.vx *= 0.985; // Gently glide
      }
    } else {
      // Standard responsive ground/air control
      bumpy.vx += (targetVx - bumpy.vx) * 0.28;
    }

    bumpy.vx += conveyorPush * 0.15;

    // 2. Vertical Movement & Gravity
    if (inputs.down && bumpy.vy > 0) {
      bumpy.vy += this.gravity * 2.2; // Fast fall / dive
    } else {
      bumpy.vy += this.gravity;
    }

    // High bounce boost if player presses / holds UP while rising
    if (inputs.up && bumpy.vy < 0 && bumpy.vy > this.highBounceVel) {
      bumpy.vy = this.highBounceVel;
      bumpy.squashX = 0.75;
      bumpy.squashY = 1.35;
    }

    if (bumpy.vy > this.maxFallSpeed) {
      bumpy.vy = this.maxFallSpeed;
    }

    // 3. Move X and resolve wall collisions
    bumpy.x += bumpy.vx;
    this.resolveHorizontalCollisions(bumpy, level, tileGrid, particles);

    // 4. Move Y and resolve vertical / bounce collisions
    bumpy.y += bumpy.vy;
    this.resolveVerticalCollisions(bumpy, level, tileGrid, particles, inputs.up, onPlayerDeath);

    // 5. Screen Boundary Clamp
    const minX = level.tileSize + bumpy.radius;
    const maxX = (level.gridWidth - 1) * level.tileSize - bumpy.radius;
    if (bumpy.x < minX) {
      bumpy.x = minX;
      bumpy.vx = Math.abs(bumpy.vx) * 0.5;
    } else if (bumpy.x > maxX) {
      bumpy.x = maxX;
      bumpy.vx = -Math.abs(bumpy.vx) * 0.5;
    }

    // 6. Smooth Squash & Stretch Return
    bumpy.squashX += (1 - bumpy.squashX) * 0.16;
    bumpy.squashY += (1 - bumpy.squashY) * 0.16;

    // 7. Update Blinking timer
    bumpy.blinkTimer -= dt;
    if (bumpy.blinkTimer <= 0) {
      bumpy.isBlinking = !bumpy.isBlinking;
      bumpy.blinkTimer = bumpy.isBlinking ? 0.12 : 2.5 + Math.random() * 2;
    }

    // 8. Items Collection
    for (const item of items) {
      if (item.isCollected) continue;
      const dx = bumpy.x - item.x;
      const dy = bumpy.y - item.y;
      const dist = Math.hypot(dx, dy);
      if (dist < bumpy.radius + 14) {
        item.isCollected = true;
        this.applyItemEffect(bumpy, item, particles);
      }
    }

    // 9. Hazard Updates & Collisions
    for (const h of hazards) {
      h.phase += dt * 3;
      h.x += h.vx;
      h.y += h.vy;

      if (h.x <= h.minX) {
        h.x = h.minX;
        h.vx = Math.abs(h.vx);
      } else if (h.x >= h.maxX) {
        h.x = h.maxX;
        h.vx = -Math.abs(h.vx);
      }

      // Check collision with Bumpy
      if (!bumpy.isDead && bumpy.invulnerableTimer <= 0) {
        const dist = Math.hypot(bumpy.x - h.x, bumpy.y - h.y);
        if (dist < bumpy.radius + h.radius) {
          this.triggerDeath(bumpy, particles, onPlayerDeath);
          return;
        }
      }
    }

    // 10. Exit Door Collision
    if (isExitOpen && !bumpy.isDead) {
      const exitPixelX = (level.exitX + 0.5) * level.tileSize;
      const exitPixelY = (level.exitY + 0.5) * level.tileSize;
      const distToExit = Math.hypot(bumpy.x - exitPixelX, bumpy.y - exitPixelY);
      if (distToExit < bumpy.radius + 16) {
        onLevelClear();
      }
    }
  }

  private resolveHorizontalCollisions(
    bumpy: BumpyState,
    level: LevelDef,
    tileGrid: TileState[][],
    particles: ParticleSystem
  ) {
    const ts = level.tileSize;
    const leftCol = Math.floor((bumpy.x - bumpy.radius) / ts);
    const rightCol = Math.floor((bumpy.x + bumpy.radius) / ts);
    const topRow = Math.floor((bumpy.y - bumpy.radius * 0.7) / ts);
    const bottomRow = Math.floor((bumpy.y + bumpy.radius * 0.7) / ts);

    for (let r = topRow; r <= bottomRow; r++) {
      for (let c = leftCol; c <= rightCol; c++) {
        if (r < 0 || r >= level.gridHeight || c < 0 || c >= level.gridWidth) continue;
        const tile = tileGrid[r][c];
        if (this.isSolidTile(tile.type)) {
          // Ledge corner tolerance: if Bumpy's bottom is near the top of the tile, don't rebound horizontally
          const tileTopY = r * ts;
          const feetY = bumpy.y + bumpy.radius;
          if (feetY - tileTopY < 14 && bumpy.vy < 3) {
            continue; // Allow cresting the ledge smoothly
          }

          // Check Hammer interaction
          if (tile.type === TileType.HAMMER_BLOCK && bumpy.hammers > 0) {
            bumpy.hammers--;
            tile.type = TileType.EMPTY;
            audio.playHammerSmash();
            particles.emitHammerHit(c * ts, r * ts, ts);
            continue;
          }
          // Check Lock Gate interaction
          if (tile.type === TileType.LOCK_GATE && bumpy.keys > 0) {
            bumpy.keys--;
            tile.type = TileType.EMPTY;
            audio.playUnlock();
            particles.emitPickup((c + 0.5) * ts, (r + 0.5) * ts, 'UNLOCKED!', '#38bdf8');
            continue;
          }

          if (bumpy.vx > 0) {
            // Colliding into wall on right
            bumpy.x = c * ts - bumpy.radius;
            bumpy.vx = 0; // Seamless wall-hugging so player can crest ledges
          } else if (bumpy.vx < 0) {
            // Colliding into wall on left
            bumpy.x = (c + 1) * ts + bumpy.radius;
            bumpy.vx = 0;
          }
        }
      }
    }
  }

  private resolveVerticalCollisions(
    bumpy: BumpyState,
    level: LevelDef,
    tileGrid: TileState[][],
    particles: ParticleSystem,
    isHoldingUp: boolean,
    onPlayerDeath: () => void
  ) {
    const ts = level.tileSize;
    const leftCol = Math.floor((bumpy.x - bumpy.radius * 0.6) / ts);
    const rightCol = Math.floor((bumpy.x + bumpy.radius * 0.6) / ts);

    // 1. Ceiling Collision (Moving Upward)
    if (bumpy.vy < 0) {
      const topRow = Math.floor((bumpy.y - bumpy.radius) / ts);
      if (topRow >= 0 && topRow < level.gridHeight) {
        for (let c = leftCol; c <= rightCol; c++) {
          if (c < 0 || c >= level.gridWidth) continue;
          const tile = tileGrid[topRow][c];
          if (this.isSolidTile(tile.type)) {
            // Check hammer smash from below
            if (tile.type === TileType.HAMMER_BLOCK && bumpy.hammers > 0) {
              bumpy.hammers--;
              tile.type = TileType.EMPTY;
              audio.playHammerSmash();
              particles.emitHammerHit(c * ts, topRow * ts, ts);
            } else {
              bumpy.y = (topRow + 1) * ts + bumpy.radius;
              bumpy.vy = Math.abs(bumpy.vy) * 0.3; // Bonk down
              bumpy.squashX = 1.2;
              bumpy.squashY = 0.8;
            }
            break;
          }
        }
      }
    }

    // 2. Floor Collision & Continuous Bouncing (Moving Downward)
    if (bumpy.vy >= 0) {
      const bottomRow = Math.floor((bumpy.y + bumpy.radius) / ts);
      if (bottomRow >= 0 && bottomRow < level.gridHeight) {
        for (let c = leftCol; c <= rightCol; c++) {
          if (c < 0 || c >= level.gridWidth) continue;
          const tile = tileGrid[bottomRow][c];

          // Spikes check
          if (tile.type === TileType.SPIKES) {
            this.triggerDeath(bumpy, particles, onPlayerDeath);
            return;
          }

          // Fire check
          if (tile.type === TileType.FIRE) {
            if (bumpy.waterDrops > 0) {
              // Extinguish!
              bumpy.waterDrops--;
              tile.type = TileType.SOLID;
              audio.playExtinguish();
              particles.emitExtinguish(c * ts, bottomRow * ts, ts);
              // Now execute normal bounce off safe solid
            } else {
              this.triggerDeath(bumpy, particles, onPlayerDeath);
              return;
            }
          }

          if (this.isBouncableTile(tile.type)) {
            // Align to surface
            bumpy.y = bottomRow * ts - bumpy.radius;

            // Handle Fragile Tiles
            if (tile.type === TileType.FRAGILE) {
              tile.hitCount++;
              tile.type = TileType.EMPTY;
              audio.playBreak();
              particles.emitCrumble(c * ts, bottomRow * ts, ts);
            } else if (tile.type === TileType.FRAGILE_2) {
              tile.hitCount++;
              if (tile.hitCount >= 2) {
                tile.type = TileType.EMPTY;
                audio.playBreak();
                particles.emitCrumble(c * ts, bottomRow * ts, ts);
              }
            }

            // Determine Bounce Velocity
            if (tile.type === TileType.SPRING) {
              bumpy.vy = this.springBounceVel;
              audio.playSpring();
              bumpy.squashX = 0.65;
              bumpy.squashY = 1.45;
              particles.emitBounceDust(bumpy.x, bumpy.y + bumpy.radius);
            } else if (tile.type === TileType.STICKY) {
              bumpy.vy = -4.0; // Weak bounce
              bumpy.vx = 0;
              audio.playBounce(false);
              bumpy.squashX = 1.3;
              bumpy.squashY = 0.7;
            } else {
              // Standard or High Bounce
              if (isHoldingUp) {
                bumpy.vy = this.highBounceVel;
                audio.playBounce(true);
                bumpy.squashX = 0.75;
                bumpy.squashY = 1.35;
              } else {
                bumpy.vy = this.normalBounceVel;
                audio.playBounce(false);
                bumpy.squashX = 1.25;
                bumpy.squashY = 0.75;
              }
              particles.emitBounceDust(bumpy.x, bumpy.y + bumpy.radius);
            }

            // Handle Teleporter tiles
            if (
              (tile.type === TileType.PORTAL_A || tile.type === TileType.PORTAL_B) &&
              bumpy.portalCooldown <= 0
            ) {
              this.teleportBumpy(bumpy, tile.type, level, tileGrid, particles);
            }

            break;
          }
        }
      }
    }
  }

  private teleportBumpy(
    bumpy: BumpyState,
    sourceType: TileType,
    level: LevelDef,
    tileGrid: TileState[][],
    particles: ParticleSystem
  ) {
    const targetType = sourceType === TileType.PORTAL_A ? TileType.PORTAL_B : TileType.PORTAL_A;
    const ts = level.tileSize;

    for (let r = 0; r < level.gridHeight; r++) {
      for (let c = 0; c < level.gridWidth; c++) {
        if (tileGrid[r][c].type === targetType) {
          particles.emitPortalWhoosh(bumpy.x, bumpy.y);
          bumpy.x = (c + 0.5) * ts;
          bumpy.y = r * ts - bumpy.radius - 4;
          bumpy.vy = -6.0;
          bumpy.portalCooldown = 0.6;
          audio.playTeleport();
          particles.emitPortalWhoosh(bumpy.x, bumpy.y);
          return;
        }
      }
    }
  }

  private isSolidTile(type: TileType): boolean {
    return (
      type === TileType.SOLID ||
      type === TileType.FRAGILE ||
      type === TileType.FRAGILE_2 ||
      type === TileType.SPRING ||
      type === TileType.ICE ||
      type === TileType.HAMMER_BLOCK ||
      type === TileType.CONVEYOR_LEFT ||
      type === TileType.CONVEYOR_RIGHT ||
      type === TileType.LOCK_GATE ||
      type === TileType.STICKY ||
      type === TileType.PORTAL_A ||
      type === TileType.PORTAL_B
    );
  }

  private isBouncableTile(type: TileType): boolean {
    return (
      type === TileType.SOLID ||
      type === TileType.FRAGILE ||
      type === TileType.FRAGILE_2 ||
      type === TileType.SPRING ||
      type === TileType.ICE ||
      type === TileType.CONVEYOR_LEFT ||
      type === TileType.CONVEYOR_RIGHT ||
      type === TileType.STICKY ||
      type === TileType.PORTAL_A ||
      type === TileType.PORTAL_B
    );
  }

  private applyItemEffect(bumpy: BumpyState, item: Item, particles: ParticleSystem) {
    audio.playPickup(item.type);

    let popupText = `+${item.points}`;
    let popupColor = '#facc15';

    switch (item.type) {
      case 'water_drop':
        bumpy.waterDrops++;
        popupText = '+1 WATER';
        popupColor = '#38bdf8';
        break;
      case 'hammer':
        bumpy.hammers++;
        popupText = '+1 HAMMER';
        popupColor = '#f97316';
        break;
      case 'key':
        bumpy.keys++;
        popupText = 'KEY!';
        popupColor = '#fbbf24';
        break;
      case 'clock':
        popupText = '+15s TIME';
        popupColor = '#34d399';
        break;
      case 'diamond':
        popupColor = '#60a5fa';
        break;
      case 'extra_life':
        popupText = '+1 LIFE!';
        popupColor = '#ec4899';
        break;
    }

    particles.emitPickup(item.x, item.y, popupText, popupColor);
  }

  private triggerDeath(bumpy: BumpyState, particles: ParticleSystem, onPlayerDeath: () => void) {
    if (bumpy.isDead) return;
    bumpy.isDead = true;
    bumpy.deathTimer = 0;
    audio.playDeath();
    particles.emitDeathPop(bumpy.x, bumpy.y);
    onPlayerDeath();
  }
}
