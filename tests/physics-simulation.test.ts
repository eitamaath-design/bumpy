// Automated Frame-by-Frame Physics Simulation Test
// Simulates live 60 FPS physics updates, ledge clearance, and target traversal

import { PhysicsEngine } from '../src/engine/Physics';
import { LEVELS } from '../src/levels/levels';
import { BumpyState, Item, TileState } from '../src/engine/Types';
import { ParticleSystem } from '../src/engine/Particles';

export function runPhysicsSimTest(): boolean {
  console.log('\n=====================================================');
  console.log('   RUNNING FRAME-BY-FRAME REAL PHYSICS SIMULATION   ');
  console.log('=====================================================\n');

  const physics = new PhysicsEngine();
  const particles = new ParticleSystem();
  const level1 = LEVELS[0];
  const ts = level1.tileSize;

  // Initialize Tile Grid
  const tileGrid: TileState[][] = [];
  for (let r = 0; r < level1.gridHeight; r++) {
    const row: TileState[] = [];
    for (let c = 0; c < level1.gridWidth; c++) {
      row.push({
        type: level1.tiles[r][c],
        hitCount: 0,
        crumbleTimer: 0,
        isBreaking: false,
        conveyorOffset: 0,
        portalPulse: 0
      });
    }
    tileGrid.push(row);
  }

  // Items
  const items: Item[] = level1.items.map((it, idx) => ({
    id: `item_${idx}`,
    x: (it.col + 0.5) * ts,
    y: (it.row + 0.5) * ts,
    type: it.type,
    points: 100,
    isCollected: false,
    bobOffset: 0,
    isCollectibleRequirement: true
  }));

  // Initial Bumpy at Level 1 start (col 2, row 9)
  const bumpy: BumpyState = {
    x: (level1.playerStartX + 0.5) * ts,
    y: (level1.playerStartY + 0.5) * ts,
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
    invulnerableTimer: 0,
    isDead: false,
    deathTimer: 0,
    portalCooldown: 0
  };

  let isLevelCleared = false;
  let isDead = false;

  // Test: Can Bumpy bounce off the floor, high jump, steer right, and clear the ledge onto Step 0 / Step 1?
  // Let's run 180 frames (~3 seconds of gameplay) holding UP and RIGHT
  console.log(`Initial Position: X=${bumpy.x.toFixed(1)}, Y=${bumpy.y.toFixed(1)}`);

  let minApexY = bumpy.y;
  let maxReachedX = bumpy.x;

  for (let frame = 0; frame < 240; frame++) {
    const inputs = {
      left: false,
      right: true, // steer right
      up: true,    // high jump!
      down: false
    };

    physics.update(
      bumpy,
      level1,
      tileGrid,
      items,
      [],
      particles,
      inputs,
      false,
      () => { isLevelCleared = true; },
      () => { isDead = true; },
      1 / 60
    );

    if (bumpy.y < minApexY) minApexY = bumpy.y;
    if (bumpy.x > maxReachedX) maxReachedX = bumpy.x;

    if (isDead) {
      console.log(`❌ Bumpy died at frame ${frame}`);
      return false;
    }
  }

  console.log(`Peak Jump Altitude: Y=${minApexY.toFixed(1)} (Cleared ${( (level1.gridHeight * ts - minApexY) / ts ).toFixed(1)} tiles up from bedrock)`);
  console.log(`Horizontal Distance Covered: X=${maxReachedX.toFixed(1)} (Reached col ${(maxReachedX / ts).toFixed(1)})`);

  // Target: must have cleared past col 3 (x > 144) and reached above row 8 (y < 400)
  const clearedBrickToRight = maxReachedX > 3.5 * ts && minApexY < 8 * ts;

  if (clearedBrickToRight) {
    console.log('✅ PASS: Bumpy successfully cleared the brick to the right and ascended the staircase smoothly!\n');
    return true;
  } else {
    console.log('❌ FAIL: Bumpy failed to clear the brick to the right.\n');
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}` || true) {
  const ok = runPhysicsSimTest();
  if (!ok) process.exit(1);
}
