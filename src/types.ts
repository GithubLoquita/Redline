/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'MENU' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type GameMode = 'ENDLESS' | 'TIME_ATTACK' | 'CHECKPOINT' | 'FREE_DRIVE';

export type CameraView = 'CHASE' | 'HOOD' | 'FAR';

export interface VehicleConfig {
  id: string;
  name: string;
  subtitle: string;
  acceleration: number; // 0-100%
  topSpeed: number; // km/h
  handling: number; // 0-100%
  nitroCapacity: number; // seconds
  bodyColor: string;
  accentColor: string;
  description: string;
  locked?: boolean;
}

export type WeatherType = 'CLEAR_NIGHT' | 'RAIN_STORM' | 'NEON_FOG' | 'AUTO_DIFFICULTY';

export interface GameSettings {
  graphicsQuality: 'LOW' | 'MEDIUM' | 'HIGH';
  speedUnit: 'KMH' | 'MPH';
  steeringSensitivity: number; // 0.5 - 2.0
  steeringAssist: boolean;
  trafficDensity: 'LIGHT' | 'NORMAL' | 'HEAVY';
  weather: WeatherType;
  shadows: boolean;
  particles: boolean;
  reducedMotion: boolean;
  highContrastHUD: boolean;
  masterVolume: number; // 0.0 - 1.0
  sfxVolume: number; // 0.0 - 1.0
  motorVolume: number; // 0.0 - 1.0
  isMuted: boolean;
}

export interface PlayerStats {
  speedKmh: number;
  distanceMeters: number;
  score: number;
  highScore: number;
  nearMisses: number;
  nitroPercent: number;
  healthPercent: number;
  maxSpeedKmh: number;
  multiplier: number;
  timeLeft: number; // For Time Attack / Checkpoint
  currentCheckpoint: number;
  comboCount: number;
}

export interface TrafficCar {
  id: number;
  mesh: any; // THREE.Group
  type: 'sedan' | 'suv' | 'truck' | 'sport';
  lane: number;
  x: number;
  z: number;
  speed: number;
  width: number;
  length: number;
  targetLane: number;
  laneChangeProgress: number;
  color: string;
  isDespawned?: boolean;
}

export interface NearMissEvent {
  id: string;
  text: string;
  points: number;
  time: number;
}
