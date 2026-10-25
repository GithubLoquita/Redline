/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCcw, Home, Trophy, Zap, Gauge, Award } from 'lucide-react';
import { PlayerStats } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface GameOverModalProps {
  isOpen: boolean;
  stats: PlayerStats;
  isNewRecord: boolean;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
  onOpenGarage: () => void;
  reason?: string;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  stats,
  isNewRecord,
  onPlayAgain,
  onReturnToMenu,
  onOpenGarage,
  reason = 'VEHICLE INTEGRITY DEPLETED',
}) => {
  if (!isOpen) return null;

  const handleAction = (cb: () => void) => {
    soundEngine.playUIClick();
    cb();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in pointer-events-auto select-none">
      <div className="hud-panel-glow w-full max-w-lg rounded-2xl p-6 md:p-8 flex flex-col items-center text-center border-t-4 border-t-[#FF2020]">
        {/* Status Header */}
        <div className="text-[11px] font-mono tracking-widest text-[#FF4545] uppercase mb-1 font-semibold">
          {reason}
        </div>
        <h2 className="text-4xl md:text-5xl font-black italic font-racing text-white tracking-widest mb-2">
          RACE OVER
        </h2>

        {/* High Score Celebration Badge */}
        {isNewRecord && (
          <div className="mb-4 bg-gradient-to-r from-[#B00020] via-[#FF2020] to-[#FF4545] px-4 py-1.5 rounded-full flex items-center gap-2 text-white font-racing font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(255,32,32,0.6)] animate-pulse">
            <Trophy className="w-4 h-4 fill-white" />
            NEW PERSONAL RECORD!
          </div>
        )}

        {/* Primary Score Counter */}
        <div className="w-full bg-[#151515] rounded-2xl p-5 border border-white/10 mb-6 flex flex-col items-center">
          <span className="text-[10px] font-mono tracking-widest text-[#A3A3A3] uppercase">
            FINAL TELEMETRY SCORE
          </span>
          <div className="text-4xl md:text-5xl font-black font-racing text-white tracking-wider my-1">
            {stats.score.toLocaleString()}
          </div>
          <span className="text-xs font-mono text-[#FF2020]">
            POINTS ACCUMULATED
          </span>
        </div>

        {/* Breakdown Telemetry Grid */}
        <div className="w-full grid grid-cols-3 gap-3 mb-6 text-left">
          <div className="bg-[#111111] p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-1 text-[10px] font-mono text-[#A3A3A3] mb-1">
              <Award className="w-3 h-3 text-[#FF2020]" /> DISTANCE
            </div>
            <div className="text-lg font-bold font-racing text-white">
              {(stats.distanceMeters / 1000).toFixed(2)}{' '}
              <span className="text-[10px] text-[#A3A3A3]">KM</span>
            </div>
          </div>

          <div className="bg-[#111111] p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-1 text-[10px] font-mono text-[#A3A3A3] mb-1">
              <Gauge className="w-3 h-3 text-[#FF2020]" /> TOP SPEED
            </div>
            <div className="text-lg font-bold font-racing text-white">
              {stats.maxSpeedKmh}{' '}
              <span className="text-[10px] text-[#A3A3A3]">KM/H</span>
            </div>
          </div>

          <div className="bg-[#111111] p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-1 text-[10px] font-mono text-[#A3A3A3] mb-1">
              <Zap className="w-3 h-3 text-[#FF2020]" /> NEAR MISS
            </div>
            <div className="text-lg font-bold font-racing text-white">
              {stats.nearMisses}{' '}
              <span className="text-[10px] text-[#A3A3A3]">X</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          <button
            onClick={() => handleAction(onPlayAgain)}
            className="w-full bg-[#FF2020] hover:bg-[#FF3535] py-4 rounded-xl font-racing font-bold text-base text-white tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(255,32,32,0.5)] active:scale-[0.99] transition-all"
          >
            <RotateCcw className="w-5 h-5 fill-current" />
            PLAY AGAIN (R)
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAction(onOpenGarage)}
              className="bg-[#1B1B1B] hover:bg-[#252525] border border-white/10 hover:border-white/30 py-3 rounded-xl font-racing font-semibold text-xs text-white tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Zap className="w-4 h-4 text-[#FF4545]" />
              TUNING GARAGE
            </button>

            <button
              onClick={() => handleAction(onReturnToMenu)}
              className="bg-[#1B1B1B] hover:bg-[#252525] border border-white/10 hover:border-white/30 py-3 rounded-xl font-racing font-semibold text-xs text-white tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Home className="w-4 h-4 text-[#A3A3A3]" />
              SHOWROOM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
