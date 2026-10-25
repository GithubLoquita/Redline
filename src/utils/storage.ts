/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameSettings } from '../types';

const SETTINGS_KEY = 'redline_settings_v1';
const HIGHSCORES_KEY = 'redline_highscores_v1';
const SELECTED_CAR_KEY = 'redline_selected_car_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: 'HIGH',
  speedUnit: 'KMH',
  steeringSensitivity: 1.0,
  steeringAssist: true,
  trafficDensity: 'NORMAL',
  weather: 'AUTO_DIFFICULTY',
  shadows: true,
  particles: true,
  reducedMotion: false,
  highContrastHUD: false,
  masterVolume: 0.8,
  sfxVolume: 0.8,
  motorVolume: 0.7,
  isMuted: false,
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Could not load settings from LocalStorage', err);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Could not save settings to LocalStorage', err);
  }
}

export function resetSettings(): GameSettings {
  saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export function loadHighScores(): Record<string, number> {
  try {
    const raw = localStorage.getItem(HIGHSCORES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not load high scores', err);
  }
  return {
    ENDLESS: 0,
    TIME_ATTACK: 0,
    CHECKPOINT: 0,
    FREE_DRIVE: 0,
  };
}

export function saveHighScore(mode: string, score: number): boolean {
  try {
    const scores = loadHighScores();
    const prev = scores[mode] || 0;
    if (score > prev) {
      scores[mode] = Math.floor(score);
      localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(scores));
      return true; // New record!
    }
  } catch (err) {
    console.warn('Could not save high score', err);
  }
  return false;
}

export function loadSelectedCar(): string {
  try {
    return localStorage.getItem(SELECTED_CAR_KEY) || 'hyperion';
  } catch {
    return 'hyperion';
  }
}

export function saveSelectedCar(carId: string): void {
  try {
    localStorage.setItem(SELECTED_CAR_KEY, carId);
  } catch (err) {
    console.warn('Could not save selected car', err);
  }
}
