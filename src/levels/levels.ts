// Hand-crafted 10 Classic Levels for Bumpy Replica
// Grid: 16 columns x 12 rows (Tile size: 48px)

import { LevelDef } from '../engine/Types';

export const LEVELS: LevelDef[] = [
  // ==========================================
  // LEVEL 1: Gentle Bounces (Introduction to Movement & High Jump)
  // ==========================================
  {
    id: 1,
    name: 'Level 1: Gentle Bounces',
    subtitle: 'Learn to Bounce! Hold UP / W to jump higher.',
    gridWidth: 16,
    gridHeight: 12,
    tileSize: 48,
    playerStartX: 2,
    playerStartY: 9,
    exitX: 13,
    exitY: 2,
    timeLimit: 60,
    parTime: 20,
    tiles: [
      // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0 Ceiling
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 1
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1], // 2 Exit platform
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1], // 3
      [1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1], // 4 Step 3
      [1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 5 Step 2
      [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 6 Step 1
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1], // 7 Low ledge
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 8
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 9
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 10 Floor
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]  // 11 Bedrock
    ],
    items: [
      { col: 3, row: 5, type: 'apple' },
      { col: 5, row: 4, type: 'apple' },
      { col: 8, row: 3, type: 'cherry' },
      { col: 10, row: 2, type: 'cherry' },
      { col: 13, row: 6, type: 'donut' },
      { col: 8, row: 9, type: 'apple' }
    ]
  },

  // ==========================================
  // LEVEL 2: The Crumbling Bridge (Fragile Platforms)
  // ==========================================
  {
    id: 2,
    name: 'Level 2: The Crumbling Bridge',
    subtitle: 'Brittle platforms break after bouncing! Keep moving.',
    gridWidth: 16,
    gridHeight: 12,
    tileSize: 48,
    playerStartX: 1,
    playerStartY: 9,
    exitX: 1,
    exitY: 2,
    timeLimit: 60,
    parTime: 25,
    tiles: [
      // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 1
      [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 2 Exit platform at top left
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 3
      [1, 0, 0, 0, 2, 2, 2, 0, 0, 2, 2, 2, 0, 0, 0, 1], // 4 Upper fragile bridge
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1], // 5 High perch
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 6
      [1, 1, 0, 0, 2, 0, 2, 0, 2, 0, 2, 0, 0, 0, 0, 1], // 7 Mid step fragile
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 8
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 9
      [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1], // 10 Floor with gap
      [1, 1, 1, 1, 12, 12, 12, 12, 12, 12, 12, 12, 1, 1, 1, 1] // 11 Spikes in pit!
    ],
    items: [
      { col: 4, row: 6, type: 'banana' },
      { col: 6, row: 6, type: 'banana' },
      { col: 8, row: 6, type: 'banana' },
      { col: 10, row: 6, type: 'banana' },
      { col: 14, row: 4, type: 'diamond' },
      { col: 5, row: 3, type: 'cherry' },
      { col: 10, row: 3, type: 'cherry' }
    ]
  },

  // ==========================================
  // LEVEL 3: Trampoline Tower (Springs & Vertical Climbing)
  // ==========================================
  {
    id: 3,
    name: 'Level 3: Trampoline Tower',
    subtitle: 'Spring pads launch you into the stratosphere!',
    gridWidth: 16,
    gridHeight: 12,
    tileSize: 48,
    playerStartX: 2,
    playerStartY: 9,
    exitX: 8,
    exitY: 1,
    timeLimit: 55,
    parTime: 22,
    tiles: [
      // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0
      [1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1], // 1 Exit top center
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 2
      [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1], // 3 High shelves
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 4
      [1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1], // 5 Mid platforms
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 6
      [1, 0, 0, 1, 0, 0, 0, 4, 4, 0, 0, 0, 1, 0, 0, 1], // 7 Center spring pad
      [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1], // 8
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 9
      [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1], // 10 Floor
      [1, 1, 1, 4, 0, 0, 0, 0, 0, 0, 0, 0, 4, 1, 1, 1]  // 11 Bottom springs
    ],
    items: [
      { col: 1, row: 2, type: 'diamond' },
      { col: 14, row: 2, type: 'diamond' },
      { col: 5, row: 4, type: 'apple' },
      { col: 10, row: 4, type: 'apple' },
      { col: 8, row: 5, type: 'donut' },
      { col: 8, row: 9, type: 'clock' }
    ]
  },

  // ==========================================
  // LEVEL 4: Fire & Water (Extinguishing Hazards)
  // ==========================================
  {
    id: 4,
    name: 'Level 4: Fire & Water',
    subtitle: 'Collect Water Droplets to douse deadly flames!',
    gridWidth: 16,
    gridHeight: 12,
    tileSize: 48,
    playerStartX: 1,
    playerStartY: 9,
    exitX: 14,
    exitY: 9,
    timeLimit: 60,
    parTime: 26,
    tiles: [
      // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 1
      [1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1], // 2 Top shelves
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 3
      [1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1], // 4 Mid shelves
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 5
      [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1], // 6
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 7
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 8
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 9
      [1, 1, 1, 6, 6, 1, 1, 6, 6, 1, 1, 6, 6, 1, 1, 1], // 10 Fire traps!
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]  // 11 Bedrock
    ],
    items: [
      { col: 2, row: 1, type: 'water_drop' },
      { col: 7, row: 1, type: 'water_drop' },
      { col: 13, row: 1, type: 'water_drop' },
      { col: 5, row: 3, type: 'cherry' },
      { col: 10, row: 3, type: 'cherry' },
      { col: 1, row: 5, type: 'banana' },
      { col: 14, row: 5, type: 'banana' },
      { col: 7, row: 8, type: 'diamond' }
    ]
  },

  // ==========================================
  // LEVEL 5: The Sledgehammer (Smashing Barriers)
  // ==========================================
  {
    id: 5,
    name: 'Level 5: Sledgehammer Smash',
    subtitle: 'Grab a hammer to bust through cracked stone blocks!',
    gridWidth: 16,
    gridHeight: 12,
    tileSize: 48,
    playerStartX: 1,
    playerStartY: 9,
    exitX: 14,
    exitY: 2,
    timeLimit: 65,
    parTime: 28,
    tiles: [
      // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1], // 1
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 1, 1, 1], // 2 Exit behind hammer block 12,2
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1], // 3
      [1, 1, 1, 7, 1, 1, 0, 0, 1, 1, 7, 1, 1, 0, 0, 1], // 4 Hammer blocks at 3,4 and 10,4
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 5
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 6
      [1, 0, 0, 1, 1, 7, 1, 1, 7, 1, 1, 0, 0, 0, 0, 1], // 7 Hammer blocks at 5,7 and 8,7
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 8
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 9
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 10
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]  // 11
    ],
    items: [
      { col: 1, row: 3, type: 'hammer' },
      { col: 4, row: 3, type: 'hammer' },
      { col: 11, row: 3, type: 'hammer' },
      { col: 6, row: 6, type: 'donut' },
      { col: 9, row: 6, type: 'donut' },
      { col: 2, row: 3, type: 'apple' },
      { col: 7, row: 3, type: 'diamond' }
    ]
  },

  // ==========================================
  // LEVEL 6: Slippery Caverns (Ice & Momentum)
  // ==========================================
  {
    id: 6,
    name: 'Level 6: Slippery Caverns',
    subtitle: 'Frictionless ice slides! Mind the spike pits.',
    gridWidth: 16,
    gridHeight: 12,
    tileSize: 48,
    playerStartX: 1,
    playerStartY: 2,
    exitX: 14,
    exitY: 9,
    timeLimit: 55,
    parTime: 24,
    tiles: [
      // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 1
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 2 Start
      [1, 1, 5, 5, 5, 5, 0, 0, 0, 0, 5, 5, 5, 5, 1, 1], // 3 Ice platforms
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 4
      [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1], // 5 Center rest
      [1, 0, 0, 5, 5, 5, 0, 0, 0, 0, 5, 5, 5, 0, 0, 1], // 6 Lower ice
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 7
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 8
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 9
      [1, 1, 12, 12, 5, 5, 12, 12, 12, 12, 5, 5, 12, 12, 1, 1], // 10 Spikes & Ice
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]  // 11
    ],
    items: [
      { col: 3, row: 2, type: 'banana' },
      { col: 12, row: 2, type: 'banana' },
      { col: 7, row: 4, type: 'diamond' },
      { col: 4, row: 5, type: 'cherry' },
      { col: 11, row: 5, type: 'cherry' },
      { col: 5, row: 9, type: 'apple' },
      { col: 10, row: 9, type: 'apple' }
    ]
  },

  // ==========================================
  // LEVEL 7: Warp Matrix (Teleport Portals)
  // ==========================================
  {
    id: 7,
    name: 'Level 7: Warp Matrix',
    subtitle: 'Step into glowing portals to traverse distant chambers!',
    gridWidth: 16,
    gridHeight: 12,
    tileSize: 48,
    playerStartX: 1,
    playerStartY: 9,
    exitX: 8,
    exitY: 2,
    timeLimit: 60,
    parTime: 25,
    tiles: [
      // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1], // 1
      [1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1], // 2 Exit center
      [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1], // 3
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1], // 4
      [1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 1], // 5
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 6
      [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1], // 7
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 8
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 9
      [1, 1, 10, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 11, 1, 1], // 10 Portals: A at col 2, B at col 13
      [1, 1, 1, 1, 1, 1, 12, 12, 12, 12, 1, 1, 1, 1, 1, 1]  // 11 Spikes in middle
    ],
    items: [
      { col: 2, row: 2, type: 'diamond' },
      { col: 13, row: 2, type: 'diamond' },
      { col: 2, row: 6, type: 'donut' },
      { col: 13, row: 6, type: 'donut' },
      { col: 6, row: 4, type: 'apple' },
      { col: 9, row: 4, type: 'apple' },
      { col: 7, row: 8, type: 'clock' }
    ]
  },

  // ==========================================
  // LEVEL 8: Conveyor Factory (Moving Belts & Hazards)
  // ==========================================
  {
    id: 8,
    name: 'Level 8: Conveyor Factory',
    subtitle: 'Directional belts propel you left and right!',
    gridWidth: 16,
    gridHeight: 12,
    tileSize: 48,
    playerStartX: 1,
    playerStartY: 2,
    exitX: 14,
    exitY: 2,
    timeLimit: 65,
    parTime: 28,
    tiles: [
      // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 1
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 2
      [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1], // 3 Start & Exit ledges
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 4
      [1, 0, 0, 9, 9, 9, 9, 0, 0, 8, 8, 8, 8, 0, 0, 1], // 5 Top conveyors (Right, Left)
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 6
      [1, 0, 0, 0, 0, 8, 8, 8, 8, 9, 9, 0, 0, 0, 0, 1], // 7 Mid conveyors (Left, Right)
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 8
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 9
      [1, 1, 9, 9, 9, 0, 0, 12, 12, 0, 0, 8, 8, 8, 1, 1], // 10 Floor conveyors
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]  // 11
    ],
    items: [
      { col: 4, row: 4, type: 'apple' },
      { col: 11, row: 4, type: 'apple' },
      { col: 7, row: 6, type: 'donut' },
      { col: 9, row: 6, type: 'donut' },
      { col: 3, row: 9, type: 'cherry' },
      { col: 12, row: 9, type: 'cherry' },
      { col: 7, row: 2, type: 'diamond' }
    ],
    hazards: [
      { type: 'patrol_spike', col: 5, row: 8, minCol: 3, maxCol: 12, speed: 2.2 }
    ]
  },

  // ==========================================
  // LEVEL 9: Lock & Key Citadel (Puzzle Gates & Keys)
  // ==========================================
  {
    id: 9,
    name: 'Level 9: Lock & Key Citadel',
    subtitle: 'Acquire the golden keys to unlock reinforced security gates!',
    gridWidth: 16,
    gridHeight: 12,
    tileSize: 48,
    playerStartX: 1,
    playerStartY: 9,
    exitX: 14,
    exitY: 2,
    timeLimit: 75,
    parTime: 32,
    tiles: [
      // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1], // 1
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 1], // 2 Gate at 11,2 guarding exit
      [1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1], // 3
      [1, 0, 0, 0, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 4 Gate at 4,4
      [1, 0, 0, 0, 1, 1, 1, 6, 6, 1, 1, 1, 0, 0, 0, 1], // 5 Fire trap at 7,5 and 8,5
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 6
      [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1], // 7
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 8
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 9
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 10
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]  // 11
    ],
    items: [
      { col: 2, row: 2, type: 'key' },
      { col: 14, row: 6, type: 'key' },
      { col: 7, row: 2, type: 'water_drop' },
      { col: 8, row: 2, type: 'water_drop' },
      { col: 7, row: 4, type: 'diamond' },
      { col: 8, row: 4, type: 'diamond' },
      { col: 2, row: 6, type: 'donut' },
      { col: 13, row: 9, type: 'apple' }
    ]
  },

  // ==========================================
  // LEVEL 10: Grand Arcade Finale (Master Gauntlet)
  // ==========================================
  {
    id: 10,
    name: 'Level 10: Grand Arcade Finale',
    subtitle: 'The ultimate trial! All mechanics in one glorious puzzle.',
    gridWidth: 16,
    gridHeight: 12,
    tileSize: 48,
    playerStartX: 1,
    playerStartY: 9,
    exitX: 8,
    exitY: 1,
    timeLimit: 80,
    parTime: 36,
    tiles: [
      // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1], // 1 Exit at 8,1
      [1, 0, 0, 0, 0, 0, 0, 1, 7, 1, 0, 0, 0, 0, 0, 1], // 2 Hammer block 8,2 guarding exit!
      [1, 1, 1, 2, 2, 0, 0, 1, 1, 1, 0, 0, 2, 2, 1, 1], // 3 Fragile bridges
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 4
      [1, 0, 0, 5, 5, 1, 0, 0, 0, 0, 1, 5, 5, 0, 0, 1], // 5 Ice perches
      [1, 0, 0, 0, 0, 1, 6, 6, 6, 6, 1, 0, 0, 0, 0, 1], // 6 Fire pit center!
      [1, 1, 4, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 4, 1, 1], // 7 Springs at col 2 and 13
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 8
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 9
      [1, 1, 10, 9, 9, 0, 0, 12, 12, 0, 0, 8, 8, 11, 1, 1], // 10 Portals, Conveyors, Spikes!
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]  // 11
    ],
    items: [
      { col: 1, row: 2, type: 'water_drop' },
      { col: 2, row: 2, type: 'water_drop' },
      { col: 14, row: 2, type: 'hammer' },
      { col: 8, row: 5, type: 'diamond' },
      { col: 4, row: 2, type: 'donut' },
      { col: 11, row: 2, type: 'donut' },
      { col: 4, row: 4, type: 'cherry' },
      { col: 11, row: 4, type: 'cherry' },
      { col: 8, row: 8, type: 'clock' }
    ],
    hazards: [
      { type: 'patrol_spike', col: 7, row: 7, minCol: 5, maxCol: 10, speed: 2.5 }
    ]
  }
];
