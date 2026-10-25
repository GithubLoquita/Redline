/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CameraView, GameMode, GameSettings, NearMissEvent, PlayerStats, VehicleConfig } from './types';
import { VEHICLE_PRESETS } from './game/carBuilder';
import { RacingScene } from './game/racingScene';
import { InputManager } from './utils/inputManager';
import { soundEngine } from './audio/soundEngine';
import {
  loadHighScores,
  loadSelectedCar,
  loadSettings,
  saveHighScore,
  saveSelectedCar,
  saveSettings,
} from './utils/storage';

import { MainMenu } from './components/MainMenu';
import { GarageModal } from './components/GarageModal';
import { GameModeModal } from './components/GameModeModal';
import { SettingsModal } from './components/SettingsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { RacingHUD } from './components/RacingHUD';
import { MobileControls } from './components/MobileControls';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';

export default function App() {
  // Container refs
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<RacingScene | null>(null);
  const inputRef = useRef<InputManager | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // Game state
  const [gameState, setGameState] = useState<'MENU' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'>('MENU');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(() => loadSelectedCar());
  const [customColor, setCustomColor] = useState<string | undefined>(undefined);
  const [gameMode, setGameMode] = useState<GameMode>('ENDLESS');
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [highScores, setHighScores] = useState<Record<string, number>>(() => loadHighScores());

  // Modals
  const [isGarageOpen, setIsGarageOpen] = useState(false);
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Runtime HUD stats
  const [stats, setStats] = useState<PlayerStats>({
    speedKmh: 0,
    distanceMeters: 0,
    score: 0,
    highScore: 0,
    nearMisses: 0,
    nitroPercent: 100,
    healthPercent: 100,
    maxSpeedKmh: 0,
    multiplier: 1.0,
    timeLeft: 60,
    currentCheckpoint: 1,
    comboCount: 0,
  });
  const [playerLaneX, setPlayerLaneX] = useState<number>(0);
  const [cameraView, setCameraView] = useState<CameraView>('CHASE');
  const [nearMissEvents, setNearMissEvents] = useState<NearMissEvent[]>([]);
  const [countdownNum, setCountdownNum] = useState<number | string>(3);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [gameOverReason, setGameOverReason] = useState('VEHICLE INTEGRITY DEPLETED');

  // Active Vehicle Config
  const selectedVehicle =
    VEHICLE_PRESETS.find((v) => v.id === selectedVehicleId) || VEHICLE_PRESETS[0];

  // Initialize Three.js Scene and InputManager once
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new RacingScene(mountRef.current, selectedVehicleId, customColor);
    const input = new InputManager();

    sceneRef.current = scene;
    inputRef.current = input;

    // Apply settings
    scene.applySettings(settings);
    soundEngine.applySettings(settings);

    // Callbacks for near-miss & collisions
    scene.physics.onNearMiss = (evt) => {
      setNearMissEvents((prev) => [...prev.slice(-3), evt]);
      setTimeout(() => {
        setNearMissEvents((prev) => prev.filter((e) => e.id !== evt.id));
      }, 1400);
    };

    scene.physics.onCollision = (damage) => {
      scene.triggerScreenShake(0.65);
    };

    // Hotkey bindings
    input.onPauseToggle = () => {
      setGameState((curr) => {
        if (curr === 'PLAYING') {
          soundEngine.stopAll();
          return 'PAUSED';
        } else if (curr === 'PAUSED') {
          return 'PLAYING';
        }
        return curr;
      });
    };

    input.onRestart = () => {
      setGameState((curr) => {
        if (curr === 'PLAYING' || curr === 'PAUSED' || curr === 'GAMEOVER') {
          startRace();
        }
        return curr;
      });
    };

    input.onCameraToggle = () => {
      setCameraView((curr) => {
        const next: CameraView = curr === 'CHASE' ? 'HOOD' : curr === 'HOOD' ? 'FAR' : 'CHASE';
        if (sceneRef.current) {
          sceneRef.current.cameraView = next;
        }
        return next;
      });
    };

    // Main animation loop
    let animId = 0;
    const clock = clockRef.current;

    const tick = () => {
      const dt = clock.getDelta();

      if (sceneRef.current && inputRef.current) {
        const currentState = gameStateRef.current;

        if (currentState === 'PLAYING') {
          const inputState = inputRef.current.update();
          sceneRef.current.physics.update(
            dt,
            inputState,
            sceneRef.current.playerCar,
            settingsRef.current,
            gameModeRef.current
          );

          // Check GameOver conditions
          const curStats = sceneRef.current.physics.stats;
          const currentMode = gameModeRef.current;

          let isDead = false;
          let reason = '';

          // Health depletion in non-free-drive modes
          if (currentMode !== 'FREE_DRIVE' && curStats.healthPercent <= 0) {
            isDead = true;
            reason = 'CRITICAL IMPACT DAMAGE';
          }

          // Time Attack / Checkpoint time expired
          if (
            (currentMode === 'TIME_ATTACK' || currentMode === 'CHECKPOINT') &&
            curStats.timeLeft <= 0
          ) {
            isDead = true;
            reason = 'TIME EXPIRED';
          }

          if (isDead) {
            soundEngine.stopAll();
            soundEngine.playCollisionSound(1.5);

            const record = saveHighScore(currentMode, curStats.score);
            setIsNewRecord(record);
            setGameOverReason(reason);
            setHighScores(loadHighScores());
            setGameState('GAMEOVER');
          }
        }

        sceneRef.current.update(dt, settingsRef.current);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      input.dispose();
      scene.dispose();
      soundEngine.stopAll();
    };
  }, []);

  // Sync refs so requestAnimationFrame always accesses freshest settings and mode
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const gameModeRef = useRef(gameMode);
  gameModeRef.current = gameMode;

  // Periodic HUD state sync (every ~50ms to keep React overhead low while Three.js renders at 60/120fps)
  useEffect(() => {
    const timer = setInterval(() => {
      if (gameState === 'PLAYING' && sceneRef.current) {
        setStats({ ...sceneRef.current.physics.stats });
        setPlayerLaneX(sceneRef.current.physics.x);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [gameState]);

  // Start Race Sequence (3.. 2.. 1.. GO!)
  const startRace = useCallback(() => {
    soundEngine.init();
    soundEngine.stopAll();

    if (sceneRef.current) {
      sceneRef.current.setupRace(selectedVehicle);
    }

    setGameState('COUNTDOWN');
    setCountdownNum(3);
    soundEngine.playCountdown(false);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count === 0) {
        setCountdownNum('GO!');
        soundEngine.playCountdown(true);
      } else if (count < 0) {
        clearInterval(interval);
        setGameState('PLAYING');
      } else {
        setCountdownNum(count);
        soundEngine.playCountdown(false);
      }
    }, 750);
  }, [selectedVehicle]);

  // Select Vehicle
  const handleSelectVehicle = (id: string, color?: string) => {
    setSelectedVehicleId(id);
    saveSelectedCar(id);
    const config = VEHICLE_PRESETS.find((v) => v.id === id) || VEHICLE_PRESETS[0];

    if (color) {
      setCustomColor(color);
    } else {
      setCustomColor(config.bodyColor);
    }

    if (sceneRef.current) {
      sceneRef.current.setVehicle(id, color || config.bodyColor, config);
    }
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    if (sceneRef.current) {
      sceneRef.current.applySettings(newSettings);
    }
    soundEngine.applySettings(newSettings);
  };

  // Mute Toggle
  const handleToggleMute = () => {
    const updated: GameSettings = { ...settings, isMuted: !settings.isMuted };
    handleUpdateSettings(updated);
  };

  // Camera Toggle
  const handleToggleCamera = () => {
    if (inputRef.current?.onCameraToggle) {
      inputRef.current.onCameraToggle();
    }
  };

  // Return to Menu
  const handleQuitToMenu = () => {
    soundEngine.stopAll();
    if (sceneRef.current) {
      sceneRef.current.setupShowroom();
    }
    setGameState('MENU');
  };

  const activeHighScore = highScores[gameMode] || 0;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#070707] font-sans">
      {/* 1. Dedicated Isolated 3D Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-auto" />

      {/* 2. Main Menu Overlay */}
      {gameState === 'MENU' && (
        <MainMenu
          onStartRace={startRace}
          onOpenGarage={() => setIsGarageOpen(true)}
          onOpenModes={() => setIsModeOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          selectedVehicle={selectedVehicle}
          selectedMode={gameMode}
          highScore={activeHighScore}
        />
      )}

      {/* 3. Countdown Overlay */}
      {gameState === 'COUNTDOWN' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center">
            <div className="text-8xl md:text-9xl font-black italic font-racing text-[#FF2020] drop-shadow-[0_0_35px_rgba(255,32,32,0.8)] animate-scale-pulse">
              {countdownNum}
            </div>
            <div className="text-sm md:text-base font-mono tracking-widest text-[#F5F5F5] uppercase mt-2">
              ENGAGE ELECTRIC TORQUE
            </div>
          </div>
        </div>
      )}

      {/* 4. Active In-Game Racing HUD */}
      {gameState === 'PLAYING' && (
        <>
          <RacingHUD
            stats={stats}
            settings={settings}
            gameMode={gameMode}
            cameraView={cameraView}
            nearMissEvents={nearMissEvents}
            onTogglePause={() => setGameState('PAUSED')}
            onToggleCamera={handleToggleCamera}
            onToggleMute={handleToggleMute}
            playerLaneX={playerLaneX}
          />
          {inputRef.current && <MobileControls inputManager={inputRef.current} />}
        </>
      )}

      {/* 5. Pause Modal */}
      <PauseModal
        isOpen={gameState === 'PAUSED'}
        onResume={() => setGameState('PLAYING')}
        onRestart={startRace}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onQuitToMenu={handleQuitToMenu}
        score={stats.score}
        distanceKm={stats.distanceMeters / 1000}
      />

      {/* 6. Game Over Modal */}
      <GameOverModal
        isOpen={gameState === 'GAMEOVER'}
        stats={stats}
        isNewRecord={isNewRecord}
        onPlayAgain={startRace}
        onReturnToMenu={handleQuitToMenu}
        onOpenGarage={() => {
          handleQuitToMenu();
          setIsGarageOpen(true);
        }}
        reason={gameOverReason}
      />

      {/* 7. Dialog Modals */}
      <GarageModal
        isOpen={isGarageOpen}
        onClose={() => setIsGarageOpen(false)}
        selectedVehicleId={selectedVehicleId}
        onSelectVehicle={handleSelectVehicle}
        currentColor={customColor}
      />

      <GameModeModal
        isOpen={isModeOpen}
        onClose={() => setIsModeOpen(false)}
        selectedMode={gameMode}
        onSelectMode={(mode) => {
          setGameMode(mode);
          setIsModeOpen(false);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
