/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Zap, Disc } from 'lucide-react';
import { InputManager } from '../utils/inputManager';

interface MobileControlsProps {
  inputManager: InputManager;
  visible?: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ inputManager, visible = true }) => {
  if (!visible) return null;

  // Bind mouse, pointer, and touch handlers with continuous active state
  const bindTouch = (key: 'steerLeft' | 'steerRight' | 'throttle' | 'brake' | 'nitro' | 'handbrake') => {
    const start = (e: React.TouchEvent | React.PointerEvent | React.MouseEvent) => {
      e.preventDefault();
      inputManager.setMobileInput(key, true);
    };

    const end = (e: React.TouchEvent | React.PointerEvent | React.MouseEvent) => {
      e.preventDefault();
      inputManager.setMobileInput(key, false);
    };

    return {
      onTouchStart: start,
      onTouchEnd: end,
      onTouchCancel: end,
      onPointerDown: start,
      onPointerUp: end,
      onPointerCancel: end,
      onMouseDown: start,
      onMouseUp: end,
      onMouseLeave: end,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    };
  };

  return (
    <div className="absolute inset-x-0 bottom-2 sm:bottom-4 px-2 sm:px-6 flex justify-between items-end pointer-events-none z-30 select-none">
      {/* Left Steering Pad: Left, Right & Drift */}
      <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
        <button
          {...bindTouch('steerLeft')}
          aria-label="Steer Left"
          className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-18 rounded-2xl bg-[#111111]/92 border-2 border-white/20 active:border-[#FF2020] active:bg-[#FF2020]/30 flex flex-col items-center justify-center text-white active:scale-95 transition-all touch-none shadow-[0_4px_15px_rgba(0,0,0,0.6)] cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="text-[9px] sm:text-[10px] font-racing font-bold tracking-wider text-[#A3A3A3] mt-0.5">
            LEFT
          </span>
        </button>

        <button
          {...bindTouch('steerRight')}
          aria-label="Steer Right"
          className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-18 rounded-2xl bg-[#111111]/92 border-2 border-white/20 active:border-[#FF2020] active:bg-[#FF2020]/30 flex flex-col items-center justify-center text-white active:scale-95 transition-all touch-none shadow-[0_4px_15px_rgba(0,0,0,0.6)] cursor-pointer"
        >
          <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="text-[9px] sm:text-[10px] font-racing font-bold tracking-wider text-[#A3A3A3] mt-0.5">
            RIGHT
          </span>
        </button>

        <button
          {...bindTouch('handbrake')}
          aria-label="Handbrake Drift"
          className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-[#151515]/85 border border-white/20 active:border-[#FF2020] active:bg-[#FF2020]/20 flex flex-col items-center justify-center text-[#A3A3A3] active:text-white transition-all touch-none cursor-pointer"
        >
          <Disc className="w-5 h-5" />
          <span className="text-[8px] font-mono tracking-wider">DRIFT</span>
        </button>
      </div>

      {/* Right Drive Pedals: Nitro, Back (Reverse/Brake), Forward (Drive/Gas) */}
      <div className="flex items-end gap-2 sm:gap-3 pointer-events-auto">
        {/* Nitro Boost Button */}
        <button
          {...bindTouch('nitro')}
          aria-label="Nitro Turbo Boost"
          className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-[#0088cc]/30 border-2 border-[#00f0ff] active:bg-[#00f0ff] active:text-black flex flex-col items-center justify-center text-[#00f0ff] active:scale-95 transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] touch-none cursor-pointer"
        >
          <Zap className="w-6 h-6 fill-current" />
          <span className="text-[8px] sm:text-[9px] font-racing font-bold tracking-wider mt-0.5">
            NITRO
          </span>
        </button>

        {/* Back / Reverse / Brake Button */}
        <button
          {...bindTouch('brake')}
          aria-label="Back / Reverse / Brake"
          className="w-14 h-18 sm:w-16 sm:h-22 md:w-22 md:h-24 rounded-2xl bg-[#3d0a0a]/90 border-2 border-[#FF2020] active:bg-[#FF2020] active:text-white flex flex-col items-center justify-center text-[#FF4545] font-racing font-bold active:scale-95 transition-all touch-none shadow-[0_0_15px_rgba(255,32,32,0.3)] cursor-pointer"
        >
          <ArrowDown className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
          <span className="text-[10px] sm:text-xs tracking-wider mt-1 font-black">
            BACK
          </span>
          <span className="text-[7px] sm:text-[8px] font-mono opacity-80">
            REVERSE
          </span>
        </button>

        {/* Forward / Drive / Gas Button */}
        <button
          {...bindTouch('throttle')}
          aria-label="Forward / Drive / Accelerate"
          className="w-16 h-22 sm:w-20 sm:h-28 md:w-26 md:h-30 rounded-2xl bg-gradient-to-t from-[#151515] to-[#252525] border-2 border-white/60 active:border-[#FF2020] active:bg-gradient-to-t active:from-[#B00020] active:to-[#FF2020] flex flex-col items-center justify-center text-white font-racing font-black active:scale-95 transition-all shadow-[0_6px_25px_rgba(0,0,0,0.7)] touch-none cursor-pointer"
        >
          <ArrowUp className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3] text-[#FF4545] active:text-white" />
          <span className="text-xs sm:text-sm tracking-widest mt-1">
            FORWARD
          </span>
          <span className="text-[8px] sm:text-[9px] font-mono text-[#00f0ff] active:text-white tracking-wider">
            DRIVE / GAS
          </span>
        </button>
      </div>
    </div>
  );
};
