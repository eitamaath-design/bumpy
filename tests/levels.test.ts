// Comprehensive Headless Test Suite for Bumpy Replica
// Validates Level Geometry, Reachability, Jump Physics, and Full Game Passability

import { LEVELS } from '../src/levels/levels';
import { LevelDef, TileType } from '../src/engine/Types';

interface TrajectoryResult {
  canReach: boolean;
  requiredBounce: 'normal' | 'high' | 'spring' | 'none';
  apexY: number;
  maxDistance: number;
}

export class LevelVerifier {
  // Physical parameters from PhysicsEngine
  private gravity = 0.38;
  private moveSpeed = 4.2;
  private normalBounceVel = -9.4;
  private highBounceVel = -13.6;
  private springBounceVel = -17.5;
  private tileSize = 48;

  // Maximum jump height in pixels
  private maxNormalHeight = (this.normalBounceVel * this.normalBounceVel) / (2 * this.gravity); // ~116 px (~2.4 tiles)
  private maxHighHeight = (this.highBounceVel * this.highBounceVel) / (2 * this.gravity); // ~243 px (~5.1 tiles)
  private maxSpringHeight = (this.springBounceVel * this.springBounceVel) / (2 * this.gravity); // ~402 px (~8.4 tiles)

  /**
   * Check if a jump from (fromCol, fromRow) can physically land on (toCol, toRow)
   */
  public canJumpBetween(
    fromCol: number,
    fromRow: number,
    toCol: number,
    toRow: number,
    isSpring: boolean = false
  ): TrajectoryResult {
    const dy = (fromRow - toRow) * this.tileSize; // positive = jumping up
    const dx = Math.abs(toCol - fromCol) * this.tileSize;

    // Check maximum vertical reach
    const maxH = isSpring ? this.maxSpringHeight : this.maxHighHeight;
    if (dy > maxH - 6) {
      return { canReach: false, requiredBounce: 'none', apexY: 0, maxDistance: 0 };
    }

    // Determine minimal bounce velocity required
    let v0 = this.normalBounceVel;
    let bounceType: 'normal' | 'high' | 'spring' = 'normal';

    if (isSpring) {
      v0 = this.springBounceVel;
      bounceType = 'spring';
    } else if (dy > this.maxNormalHeight - 6) {
      v0 = this.highBounceVel;
      bounceType = 'high';
    }

    // Calculate flight time: t = (v0 + sqrt(v0^2 + 2*g*dy)) / g
    const discriminant = v0 * v0 - 2 * this.gravity * dy;
    if (discriminant < 0) {
      return { canReach: false, requiredBounce: 'none', apexY: 0, maxDistance: 0 };
    }

    // Time from ground until landing on target platform
    const tFlight = (-v0 + Math.sqrt(discriminant)) / this.gravity;
    const maxHorizontal = tFlight * this.moveSpeed;

    const canReach = dx <= maxHorizontal + 24; // +24px leeway for platform width

    return {
      canReach,
      requiredBounce: canReach ? bounceType : 'none',
      apexY: (v0 * v0) / (2 * this.gravity),
      maxDistance: maxHorizontal
    };
  }

  /**
   * Perform state-space graph reachability verification for a level
   */
  public verifyLevelPassability(level: LevelDef): {
    passed: boolean;
    reachableItems: number;
    totalItems: number;
    exitReachable: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const ts = level.tileSize;

    // 1. Identify all solid / bouncable platforms
    interface Platform {
      col: number;
      row: number;
      type: TileType;
    }

    const platforms: Platform[] = [];
    for (let r = 0; r < level.gridHeight; r++) {
      for (let c = 0; c < level.gridWidth; c++) {
        const t = level.tiles[r][c];
        if (
          t === TileType.SOLID ||
          t === TileType.FRAGILE ||
          t === TileType.FRAGILE_2 ||
          t === TileType.SPRING ||
          t === TileType.ICE ||
          t === TileType.CONVEYOR_LEFT ||
          t === TileType.CONVEYOR_RIGHT ||
          t === TileType.PORTAL_A ||
          t === TileType.PORTAL_B
        ) {
          platforms.push({ col: c, row: r, type: t });
        }
      }
    }

    // 2. Build Adjacency Graph from platforms
    const reachablePlatformIndices = new Set<number>();

    // Find starting platform directly below player start
    let startPlatformIdx = -1;
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (p.col === level.playerStartX && p.row >= level.playerStartY) {
        if (startPlatformIdx === -1 || p.row < platforms[startPlatformIdx].row) {
          startPlatformIdx = i;
        }
      }
    }

    // If exact column not found, find closest platform beneath start
    if (startPlatformIdx === -1) {
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (Math.abs(p.col - level.playerStartX) <= 1 && p.row >= level.playerStartY) {
          startPlatformIdx = i;
          break;
        }
      }
    }

    if (startPlatformIdx === -1) {
      errors.push(`Level ${level.id} (${level.name}): No landing platform found beneath player start (${level.playerStartX}, ${level.playerStartY})`);
      return { passed: false, reachableItems: 0, totalItems: level.items.length, exitReachable: false, errors };
    }

    // 3. BFS traversal to discover all reachable platforms
    const queue: number[] = [startPlatformIdx];
    reachablePlatformIndices.add(startPlatformIdx);

    // Track inventory during simulation
    let waterDrops = 0;
    let hammers = 0;
    let keys = 0;

    // Pre-calculate portals
    const portalAPlats: number[] = [];
    const portalBPlats: number[] = [];
    platforms.forEach((p, idx) => {
      if (p.type === TileType.PORTAL_A) portalAPlats.push(idx);
      if (p.type === TileType.PORTAL_B) portalBPlats.push(idx);
    });

    while (queue.length > 0) {
      const u = queue.shift()!;
      const pu = platforms[u];
      const isSpring = pu.type === TileType.SPRING;

      // Portal warp connections
      if (pu.type === TileType.PORTAL_A) {
        portalBPlats.forEach((v) => {
          if (!reachablePlatformIndices.has(v)) {
            reachablePlatformIndices.add(v);
            queue.push(v);
          }
        });
      }
      if (pu.type === TileType.PORTAL_B) {
        portalAPlats.forEach((v) => {
          if (!reachablePlatformIndices.has(v)) {
            reachablePlatformIndices.add(v);
            queue.push(v);
          }
        });
      }

      // Check jumps to all other platforms
      for (let v = 0; v < platforms.length; v++) {
        if (reachablePlatformIndices.has(v)) continue;
        const pv = platforms[v];

        const jump = this.canJumpBetween(pu.col, pu.row, pv.col, pv.row, isSpring);
        if (jump.canReach) {
          reachablePlatformIndices.add(v);
          queue.push(v);
        }
      }
    }

    // 4. Verify item reachability
    let reachableItemsCount = 0;
    level.items.forEach((item, idx) => {
      let isItemReachable = false;

      // Check if any reachable platform is within jump / collection reach of item
      for (const pIdx of reachablePlatformIndices) {
        const p = platforms[pIdx];
        const jump = this.canJumpBetween(p.col, p.row, item.col, item.row, p.type === TileType.SPRING);
        if (jump.canReach) {
          isItemReachable = true;
          break;
        }
      }

      if (isItemReachable) {
        reachableItemsCount++;
        if (item.type === 'water_drop') waterDrops++;
        if (item.type === 'hammer') hammers++;
        if (item.type === 'key') keys++;
      } else {
        errors.push(`Item #${idx + 1} (${item.type}) at [col ${item.col}, row ${item.row}] is unreachable!`);
      }
    });

    // 5. Verify Exit Door Reachability
    let exitReachable = false;
    for (const pIdx of reachablePlatformIndices) {
      const p = platforms[pIdx];
      // Exit door is at level.exitX, level.exitY
      const jump = this.canJumpBetween(p.col, p.row, level.exitX, level.exitY, p.type === TileType.SPRING);
      if (jump.canReach) {
        exitReachable = true;
        break;
      }
    }

    if (!exitReachable) {
      errors.push(`Exit Door at [col ${level.exitX}, row ${level.exitY}] is unreachable from all platforms!`);
    }

    const passed = reachableItemsCount === level.items.length && exitReachable;
    return {
      passed,
      reachableItems: reachableItemsCount,
      totalItems: level.items.length,
      exitReachable,
      errors
    };
  }
}

// Run Headless Test Suite across all 10 Levels
export function runTestSuite(): boolean {
  console.log('=====================================================');
  console.log('   BUMPY REPLICA: HEADLESS PASSABILITY TEST SUITE   ');
  console.log('=====================================================\n');

  const verifier = new LevelVerifier();
  let allPassed = true;

  LEVELS.forEach((level) => {
    const res = verifier.verifyLevelPassability(level);
    const status = res.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} | Level ${level.id.toString().padStart(2, ' ')}: ${level.name}`);
    console.log(`       Items: ${res.reachableItems}/${res.totalItems} | Exit Reachable: ${res.exitReachable ? 'YES' : 'NO'}`);

    if (!res.passed) {
      allPassed = false;
      res.errors.forEach((err) => console.log(`       ⚠️  ${err}`));
    }
  });

  console.log('\n-----------------------------------------------------');
  if (allPassed) {
    console.log('🎉 ALL 10 LEVELS ARE 100% VERIFIED PASSABLE & CLEARABLE!');
  } else {
    console.log('❌ SOME LEVELS CONTAIN UNREACHABLE ITEMS OR EXITS!');
  }
  console.log('-----------------------------------------------------\n');

  return allPassed;
}

const success = runTestSuite();
if (!success) {
  process.exit(1);
}
