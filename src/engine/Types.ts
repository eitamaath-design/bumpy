export enum TileType {
  EMPTY = 0,
  SOLID = 1,          // Standard solid block
  FRAGILE = 2,        // Crumbles after 1 bounce
  FRAGILE_2 = 3,      // Crumbles after 2 bounces
  SPRING = 4,         // High-velocity trampoline launch
  ICE = 5,            // Frictionless sliding
  FIRE = 6,           // Deadly fire (extinguished by Water Droplet)
  HAMMER_BLOCK = 7,   // Destructible stone block (smashed by Hammer)
  CONVEYOR_LEFT = 8,  // Pushes Bumpy left
  CONVEYOR_RIGHT = 9, // Pushes Bumpy right
  PORTAL_A = 10,      // Teleport pair A <-> B
  PORTAL_B = 11,      // Teleport pair B <-> A
  SPIKES = 12,        // Deadly spikes
  LOCK_GATE = 13,     // Locked gate (unlocked by Key)
  STICKY = 14,        // Honey/glue - kills horizontal speed, dampens bounce
  EXIT_DOOR = 15      // Exit door (spawns/opens when all collectibles are collected)
}

export type ItemType =
  | 'apple'
  | 'banana'
  | 'cherry'
  | 'donut'
  | 'diamond'
  | 'water_drop'
  | 'hammer'
  | 'key'
  | 'clock'
  | 'extra_life';

export interface Item {
  id: string;
  x: number;          // World pixel coordinates (center)
  y: number;
  type: ItemType;
  points: number;
  isCollected: boolean;
  bobOffset: number;  // Visual floating effect
  isCollectibleRequirement: boolean; // Must be collected to open exit door (fruits/candies/diamonds)
}

export interface TileState {
  type: TileType;
  hitCount: number;
  crumbleTimer: number; // For fading / breaking animation
  isBreaking: boolean;
  conveyorOffset: number;
  portalPulse: number;
}

export interface MovingHazard {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  radius: number;
  type: 'patrol_spike' | 'fireball' | 'bouncer';
  phase: number;
}

export interface LevelDef {
  id: number;
  name: string;
  subtitle: string;
  gridWidth: number;   // Standard 16 columns
  gridHeight: number;  // Standard 12 rows
  tileSize: number;    // Usually 48 or 40 px
  playerStartX: number;
  playerStartY: number;
  exitX: number;       // Grid col
  exitY: number;       // Grid row
  tiles: TileType[][]; // [row][col]
  items: { col: number; row: number; type: ItemType }[];
  hazards?: {
    type: 'patrol_spike' | 'fireball' | 'bouncer';
    col: number;
    row: number;
    minCol: number;
    maxCol: number;
    minRow?: number;
    maxRow?: number;
    speed: number;
  }[];
  timeLimit: number; // Seconds
  parTime: number;   // Par time for 3 stars
}

export interface BumpyState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  facing: 1 | -1;
  isGrounded: boolean;
  squashX: number;
  squashY: number;
  blinkTimer: number;
  isBlinking: boolean;
  waterDrops: number;
  hammers: number;
  keys: number;
  invulnerableTimer: number;
  isDead: boolean;
  deathTimer: number;
  portalCooldown: number;
}

export type GameState =
  | 'TITLE'
  | 'LEVEL_SELECT'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_CLEAR'
  | 'GAME_OVER'
  | 'GAME_COMPLETE'
  | 'INSTRUCTIONS';
