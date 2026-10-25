/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Settings, Home } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onQuitToMenu: () => void;
  score: number;
  distanceKm: number;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onOpenSettings,
  onQuitToMenu,
  score,
  distanceKm,
}) => {
  if (!isOpen) return null;

  const handleAction = (cb: () => void) => {
    soundEngine.playUIClick();
    cb();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="hud-panel-glow w-full max-w-md rounded-2xl p-6 md:p-8 flex flex-col items-center text-center">
        <span className="w-12 h-1 bg-[#FF2020] rounded-full mb-4"></span>
        <h2 className="text-3xl font-black font-racing text-white tracking-widest mb-1">
          RACE PAUSED
        </h2>
        <p className="text-xs font-mono text-[#A3A3A3] mb-6">
          Press ESC to resume telemetry
        </p>

        {/* Current Run Progress */}
        <div className="w-full bg-[#151515] rounded-xl p-4 border border-white/5 grid grid-cols-2 gap-4 mb-6 text-left">
          <div>
            <div className="text-[10px] font-mono text-[#A3A3A3] uppercase">Current Score</div>
            <div className="text-xl font-bold font-racing text-white">
              {score.toLocaleString()} <span className="text-xs text-[#FF2020]">PTS</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#A3A3A3] uppercase">Distance</div>
            <div className="text-xl font-bold font-racing text-white">
              {distanceKm.toFixed(2)} <span className="text-xs text-[#A3A3A3]">KM</span>
            </div>
          </div>
        </div>

        {/* Menu Buttons */}
        <div className="w-full space-y-2.5">
          <button
            onClick={() => handleAction(onResume)}
            className="w-full bg-[#FF2020] hover:bg-[#FF3535] py-3.5 rounded-xl font-racing font-bold text-white tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,32,32,0.4)]"
          >
            <Play className="w-4 h-4 fill-white" />
            RESUME (ESC)
          </button>

          <button
            onClick={() => handleAction(onRestart)}
            className="w-full bg-[#1B1B1B] hover:bg-[#252525] border border-white/10 hover:border-white/30 py-3 rounded-xl font-racing font-semibold text-white tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-[#FF4545]" />
            RESTART RACE (R)
          </button>

          <button
            onClick={() => handleAction(onOpenSettings)}
            className="w-full bg-[#1B1B1B] hover:bg-[#252525] border border-white/10 hover:border-white/30 py-3 rounded-xl font-racing font-semibold text-white tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Settings className="w-4 h-4 text-[#A3A3A3]" />
            SETTINGS
          </button>

          <button
            onClick={() => handleAction(onQuitToMenu)}
            className="w-full bg-[#111111] hover:bg-[#181818] border border-white/5 py-3 rounded-xl font-racing font-semibold text-[#A3A3A3] hover:text-white tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Home className="w-4 h-4" />
            RETURN TO SHOWROOM
          </button>
        </div>
      </div>
    </div>
  );
};
