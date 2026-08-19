export type PowerUpId = 'earthquake' | 'remove-small' | 'target-remove';

export type PauseReason =
  | 'hidden'
  | 'question'
  | 'gameover'
  | 'theme'
  | 'menu'
  | 'continue'
  | 'help';

export interface SavedBody {
  level: number;
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  angularVelocity: number;
}

export interface SavedGame {
  version: 1;
  themeId: string;
  score: number;
  energy: number;
  currentLevel: number;
  nextLevel: number;
  highestLevel: number;
  geoCorrect: number;
  geoAsked: number;
  bodies: SavedBody[];
  droppedCount: number;
}

export interface GameSnapshot {
  score: number;
  energy: number;
  challengeReady: boolean;
  currentLevel: number;
  nextLevel: number;
  highestLevel: number;
  gameOver: boolean;
  paused: boolean;
  dangerMs: number;
  inDanger: boolean;
  bodyCount: number;
  levels: number[];
  geoCorrect: number;
  geoAsked: number;
}

export interface EngineCallbacks {
  onScore?: (score: number, gained: number, level: number) => void;
  onMerge?: (level: number, x: number, y: number, chain: number) => void;
  onCharge?: (energy: number, ready: boolean) => void;
  onGameOver?: (stats: GameSnapshot) => void;
  onDrop?: (level: number) => void;
  onRemoved?: (level: number, x: number, y: number) => void;
  onDanger?: (inDanger: boolean, dangerMs: number) => void;
  onQueue?: (current: number, next: number) => void;
}

export interface GameBodyFields {
  isDrop: boolean;
  gameLevel: number;
  bornAt: number;
  popping: boolean;
}
