/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Shield, Settings, HelpCircle, Compass, Trophy, Zap } from 'lucide-react';
import { GameMode, VehicleConfig } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface MainMenuProps {
  onStartRace: () => void;
  onOpenGarage: () => void;
  onOpenModes: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
  selectedVehicle: VehicleConfig;
  selectedMode: GameMode;
  highScore: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartRace,
  onOpenGarage,
  onOpenModes,
  onOpenSettings,
  onOpenHowToPlay,
  selectedVehicle,
  selectedMode,
  highScore,
}) => {
  const getModeLabel = (mode: GameMode) => {
    switch (mode) {
      case 'ENDLESS': return 'Endless Traffic';
      case 'TIME_ATTACK': return 'Time Attack (60s)';
      case 'CHECKPOINT': return 'Checkpoint Rush';
      case 'FREE_DRIVE': return 'Free Drive Cruise';
    }
  };

  const handleAction = (cb: () => void) => {
    soundEngine.init();
    soundEngine.playUIClick();
    cb();
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 md:p-10 z-10">
      {/* Top Bar: Title & High Score */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 bg-[#FF2020] rounded-sm"></span>
            <span className="text-xs uppercase tracking-[0.25em] text-[#FF4545] font-semibold">
              ANIX SOFTWARE TECHNOLOGY
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-wider font-racing text-white drop-shadow-[0_2px_15px_rgba(255,32,32,0.4)]">
            RED<span className="text-[#FF2020]">LINE</span>
          </h1>
          <p className="text-xs md:text-sm text-[#A3A3A3] tracking-widest font-mono uppercase mt-0.5">
            Electric Racing Experience
          </p>
        </div>

        {/* High Score Badge */}
        <div className="hud-panel rounded-lg px-5 py-2.5 border-l-4 border-l-[#FF2020] flex items-center gap-3 pointer-events-auto">
          <Trophy className="w-5 h-5 text-[#FF2020]" />
          <div>
            <div className="text-[10px] tracking-wider uppercase text-[#A3A3A3]">RECORD SCORE</div>
            <div className="text-lg md:text-xl font-bold font-racing text-white">
              {highScore.toLocaleString()} <span className="text-xs text-[#FF2020]">PTS</span>
            </div>
          </div>
        </div>
      </header>

      {/* Center 3D Showroom is 100% unobstructed */}

      {/* Bottom Control Dock */}
      <footer className="w-full flex flex-col md:flex-row justify-between items-end gap-6 pointer-events-auto">
        {/* Selected Vehicle Spec Pill */}
        <div className="hud-panel rounded-xl p-4 w-full md:w-80 border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#A3A3A3]">
              Active Machine
            </span>
            <span className="text-[10px] bg-[#FF2020]/20 text-[#FF4545] border border-[#FF2020]/40 px-2 py-0.5 rounded font-mono">
              {getModeLabel(selectedMode)}
            </span>
          </div>

          <div className="text-lg font-bold font-racing text-white truncate">
            {selectedVehicle.name}
          </div>
          <div className="text-xs text-[#A3A3A3] mb-3 truncate">
            {selectedVehicle.subtitle}
          </div>

          {/* Quick Stats */}
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-[#A3A3A3]">
              <span>TOP SPEED</span>
              <span className="text-white font-bold">{selectedVehicle.topSpeed} KM/H</span>
            </div>
            <div className="w-full bg-[#1B1B1B] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#B00020] to-[#FF2020] h-full rounded-full"
                style={{ width: `${(selectedVehicle.topSpeed / 420) * 100}%` }}
              />
            </div>

            <div className="flex justify-between text-[#A3A3A3]">
              <span>ACCELERATION</span>
              <span className="text-white font-bold">{selectedVehicle.acceleration}%</span>
            </div>
            <div className="w-full bg-[#1B1B1B] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#B00020] to-[#FF2020] h-full rounded-full"
                style={{ width: `${selectedVehicle.acceleration}%` }}
              />
            </div>
          </div>
        </div>

        {/* Menu Actions */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
          {/* Secondary Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:flex gap-2">
            <button
              onClick={() => handleAction(onOpenGarage)}
              className="hud-panel hover:border-[#FF2020] hover:bg-[#1B1B1B] transition-all px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-racing font-semibold text-white tracking-wider cursor-pointer"
            >
              <Zap className="w-4 h-4 text-[#FF2020]" />
              GARAGE
            </button>

            <button
              onClick={() => handleAction(onOpenModes)}
              className="hud-panel hover:border-[#FF2020] hover:bg-[#1B1B1B] transition-all px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-racing font-semibold text-white tracking-wider cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#FF2020]" />
              MODES
            </button>

            <button
              onClick={() => handleAction(onOpenSettings)}
              className="hud-panel hover:border-[#FF2020] hover:bg-[#1B1B1B] transition-all px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-racing font-semibold text-white tracking-wider cursor-pointer"
            >
              <Settings className="w-4 h-4 text-[#FF2020]" />
              SETTINGS
            </button>

            <button
              onClick={() => handleAction(onOpenHowToPlay)}
              className="hud-panel hover:border-[#FF2020] hover:bg-[#1B1B1B] transition-all px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-racing font-semibold text-white tracking-wider cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-[#FF2020]" />
              CONTROLS
            </button>
          </div>

          {/* Primary Start Race Button */}
          <button
            onClick={() => handleAction(onStartRace)}
            className="group relative bg-[#FF2020] hover:bg-[#FF3535] active:scale-[0.98] transition-all px-8 py-4 rounded-xl flex items-center justify-center gap-3 font-racing font-bold text-base md:text-lg tracking-widest text-white shadow-[0_0_30px_rgba(255,32,32,0.5)] cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            START RACE
          </button>
        </div>
      </footer>
    </div>
  );
};
