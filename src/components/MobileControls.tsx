/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, Zap, Disc } from 'lucide-react';
import { InputManager } from '../utils/inputManager';

interface MobileControlsProps {
  inputManager: InputManager;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ inputManager }) => {
  // Bind touch handlers that continuously set input state without sticky touches
  const bindTouch = (key: 'steerLeft' | 'steerRight' | 'throttle' | 'brake' | 'nitro' | 'handbrake') => {
    const start = (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      inputManager.setMobileInput(key, true);
    };

    const end = (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      inputManager.setMobileInput(key, false);
    };

    return {
      onTouchStart: start,
      onTouchEnd: end,
      onTouchCancel: end,
      onMouseDown: start,
      onMouseUp: end,
      onMouseLeave: end,
    };
  };

  return (
    <div className="absolute inset-x-0 bottom-6 px-4 flex justify-between items-end pointer-events-none z-20 md:hidden select-none">
      {/* Left Steering Pad */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          {...bindTouch('steerLeft')}
          aria-label="Steer Left"
          className="w-16 h-16 rounded-2xl bg-[#111]/85 border-2 border-white/20 active:border-[#FF2020] active:bg-[#FF2020]/25 flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>

        <button
          {...bindTouch('steerRight')}
          aria-label="Steer Right"
          className="w-16 h-16 rounded-2xl bg-[#111]/85 border-2 border-white/20 active:border-[#FF2020] active:bg-[#FF2020]/25 flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <ArrowRight className="w-8 h-8" />
        </button>

        <button
          {...bindTouch('handbrake')}
          aria-label="Handbrake Drift"
          className="w-12 h-12 rounded-xl bg-[#111]/80 border border-white/20 active:border-[#FF2020] flex items-center justify-center text-[#A3A3A3] active:text-white"
        >
          <Disc className="w-6 h-6" />
        </button>
      </div>

      {/* Right Pedals: Nitro, Brake, Gas */}
      <div className="flex items-end gap-3 pointer-events-auto">
        {/* Nitro Button */}
        <button
          {...bindTouch('nitro')}
          aria-label="Nitro Boost"
          className="w-14 h-14 rounded-2xl bg-[#0088cc]/30 border-2 border-[#00f0ff] active:bg-[#00f0ff] active:text-black flex items-center justify-center text-[#00f0ff] active:scale-95 transition-transform shadow-[0_0_15px_rgba(0,240,255,0.4)]"
        >
          <Zap className="w-7 h-7 fill-current" />
        </button>

        {/* Brake Pedal */}
        <button
          {...bindTouch('brake')}
          aria-label="Brake Pedal"
          className="w-14 h-20 rounded-2xl bg-[#551010]/80 border-2 border-[#FF2020] active:bg-[#FF2020] active:text-white flex flex-col items-center justify-center text-[#FF4545] font-racing font-bold text-xs tracking-wider active:scale-95 transition-transform"
        >
          BRAKE
        </button>

        {/* Gas / Throttle Pedal */}
        <button
          {...bindTouch('throttle')}
          aria-label="Gas Accelerator Pedal"
          className="w-16 h-28 rounded-2xl bg-[#151515]/90 border-2 border-white/40 active:border-[#FF2020] active:bg-gradient-to-t active:from-[#B00020] active:to-[#FF2020] flex flex-col items-center justify-center text-white font-racing font-bold text-sm tracking-wider active:scale-95 transition-transform shadow-lg"
        >
          GAS
        </button>
      </div>
    </div>
  );
};
