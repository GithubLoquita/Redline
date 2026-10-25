/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Check, Infinity, Clock, Flag, Compass } from 'lucide-react';
import { GameMode } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface GameModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
}

const MODES: { id: GameMode; title: string; desc: string; icon: any; tag: string }[] = [
  {
    id: 'ENDLESS',
    title: 'ENDLESS TRAFFIC',
    desc: 'Survive on the infinite cyber highway. Thread through traffic at high speed to build near-miss combo multipliers.',
    icon: Infinity,
    tag: 'CLASSIC',
  },
  {
    id: 'TIME_ATTACK',
    title: 'TIME ATTACK',
    desc: '60 seconds on the clock. Every kilometer covered and high-speed drift adds bonus seconds to keep the race alive.',
    icon: Clock,
    tag: 'HIGH INTENSITY',
  },
  {
    id: 'CHECKPOINT',
    title: 'CHECKPOINT RUSH',
    desc: 'Reach overhead highway laser gates before your timer expires. Each checkpoint adds +15 seconds with increasing traffic.',
    icon: Flag,
    tag: 'CHALLENGE',
  },
  {
    id: 'FREE_DRIVE',
    title: 'FREE DRIVE',
    desc: 'Endless scenic cruise across the metropolis without strict timers. Relax, test handling, or enjoy high-speed cruising.',
    icon: Compass,
    tag: 'CRUISE',
  },
];

export const GameModeModal: React.FC<GameModeModalProps> = ({
  isOpen,
  onClose,
  selectedMode,
  onSelectMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="hud-panel-glow w-full max-w-2xl rounded-2xl p-6 md:p-8 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-6">
          <div>
            <h2 className="text-2xl font-bold font-racing text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-[#FF2020] inline-block rounded-xs"></span>
              GAME MODES
            </h2>
            <p className="text-xs text-[#A3A3A3] font-mono mt-0.5">
              Select your racing challenge
            </p>
          </div>
          <button
            onClick={() => {
              soundEngine.playUIClick();
              onClose();
            }}
            className="p-2 rounded-lg bg-[#1B1B1B] hover:bg-[#252525] text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {MODES.map((mode) => {
            const isSelected = mode.id === selectedMode;
            const Icon = mode.icon;

            return (
              <button
                key={mode.id}
                onClick={() => {
                  soundEngine.playUIClick();
                  onSelectMode(mode.id);
                }}
                className={`w-full p-4 rounded-xl text-left transition-all border flex items-start gap-4 cursor-pointer ${
                  isSelected
                    ? 'bg-[#1B1B1B] border-[#FF2020] shadow-[0_0_15px_rgba(255,32,32,0.3)]'
                    : 'bg-[#111111] border-white/10 hover:border-white/30'
                }`}
              >
                <div
                  className={`p-3 rounded-lg ${
                    isSelected ? 'bg-[#FF2020] text-white' : 'bg-[#1B1B1B] text-[#FF2020]'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-racing font-bold text-white text-base">
                      {mode.title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222] text-[#FF4545] border border-[#FF2020]/30">
                      {mode.tag}
                    </span>
                  </div>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed">
                    {mode.desc}
                  </p>
                </div>

                {isSelected && (
                  <div className="p-1 bg-[#FF2020] rounded text-white self-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-4 border-t border-white/10">
          <button
            onClick={() => {
              soundEngine.playUIClick();
              onClose();
            }}
            className="bg-[#FF2020] hover:bg-[#FF3535] px-6 py-2.5 rounded-xl font-racing font-bold text-white text-sm tracking-wider cursor-pointer"
          >
            CONFIRM MODE
          </button>
        </div>
      </div>
    </div>
  );
};
