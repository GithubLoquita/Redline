/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Keyboard, Smartphone, Gamepad2, Zap, ShieldAlert, Award } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="hud-panel-glow w-full max-w-2xl rounded-2xl p-6 md:p-8 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-6">
          <div>
            <h2 className="text-2xl font-bold font-racing text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-[#FF2020] inline-block rounded-xs"></span>
              PILOT BRIEFING
            </h2>
            <p className="text-xs text-[#A3A3A3] font-mono mt-0.5">
              Flight manual and control telemetry
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

        {/* Content */}
        <div className="space-y-6 mb-6">
          {/* Desktop Controls */}
          <div>
            <div className="flex items-center gap-2 text-xs font-racing text-[#FF4545] uppercase tracking-wider mb-3">
              <Keyboard className="w-4 h-4" /> Keyboard Pilot Controls
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              <div className="bg-[#151515] p-3 rounded-xl border border-white/5">
                <span className="text-[#A3A3A3] block mb-1">ACCELERATE</span>
                <span className="bg-[#222] text-[#FF2020] px-2 py-0.5 rounded border border-[#FF2020]/30 font-bold">
                  W / ↑
                </span>
              </div>
              <div className="bg-[#151515] p-3 rounded-xl border border-white/5">
                <span className="text-[#A3A3A3] block mb-1">BRAKE / REV</span>
                <span className="bg-[#222] text-[#FF2020] px-2 py-0.5 rounded border border-[#FF2020]/30 font-bold">
                  S / ↓
                </span>
              </div>
              <div className="bg-[#151515] p-3 rounded-xl border border-white/5">
                <span className="text-[#A3A3A3] block mb-1">STEER LEFT / RIGHT</span>
                <span className="bg-[#222] text-[#FF2020] px-2 py-0.5 rounded border border-[#FF2020]/30 font-bold">
                  A / D / ← →
                </span>
              </div>
              <div className="bg-[#151515] p-3 rounded-xl border border-white/5">
                <span className="text-[#A3A3A3] block mb-1">NITRO BOOST</span>
                <span className="bg-[#222] text-[#FF2020] px-2 py-0.5 rounded border border-[#FF2020]/30 font-bold">
                  SHIFT
                </span>
              </div>
              <div className="bg-[#151515] p-3 rounded-xl border border-white/5">
                <span className="text-[#A3A3A3] block mb-1">DRIFT / HANDBRAKE</span>
                <span className="bg-[#222] text-[#FF2020] px-2 py-0.5 rounded border border-[#FF2020]/30 font-bold">
                  SPACE
                </span>
              </div>
              <div className="bg-[#151515] p-3 rounded-xl border border-white/5">
                <span className="text-[#A3A3A3] block mb-1">CHANGE CAMERA</span>
                <span className="bg-[#222] text-white px-2 py-0.5 rounded border border-white/20 font-bold">
                  C
                </span>
              </div>
              <div className="bg-[#151515] p-3 rounded-xl border border-white/5">
                <span className="text-[#A3A3A3] block mb-1">PAUSE / RESUME</span>
                <span className="bg-[#222] text-white px-2 py-0.5 rounded border border-white/20 font-bold">
                  ESC
                </span>
              </div>
              <div className="bg-[#151515] p-3 rounded-xl border border-white/5">
                <span className="text-[#A3A3A3] block mb-1">QUICK RESTART</span>
                <span className="bg-[#222] text-white px-2 py-0.5 rounded border border-white/20 font-bold">
                  R
                </span>
              </div>
            </div>
          </div>

          {/* Gamepad & Mobile Support */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#151515] p-4 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 text-xs font-racing text-white mb-2">
                <Gamepad2 className="w-4 h-4 text-[#FF2020]" /> Gamepad Controller
              </div>
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                Plug-and-play Xbox, PlayStation, or generic controllers. Left Stick / D-Pad steers, RT/R2 accelerates, LT/L2 brakes, X/LB activates Nitro boost.
              </p>
            </div>

            <div className="bg-[#151515] p-4 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 text-xs font-racing text-white mb-2">
                <Smartphone className="w-4 h-4 text-[#FF2020]" /> Touch Controls
              </div>
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                On mobile devices, touch steering buttons appear on the bottom-left, with gas, brake, and nitro boost pedals on the bottom-right.
              </p>
            </div>
          </div>

          {/* Pro Racing Tips */}
          <div>
            <div className="flex items-center gap-2 text-xs font-racing text-[#FF4545] uppercase tracking-wider mb-3">
              <Award className="w-4 h-4" /> Pro Racing Strategy
            </div>
            <div className="space-y-2.5 text-xs text-[#A3A3A3]">
              <div className="flex items-start gap-2.5 bg-[#111111] p-3 rounded-lg border border-white/5">
                <Zap className="w-4 h-4 text-[#FF2020] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-sans">Near-Miss Bonus & Nitro Refill:</strong>
                  Squeezing past traffic cars closely at speeds above 110 km/h triggers a Near-Miss combo, awarding high multiplier points and immediately refilling 20% of your Nitro reserves!
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-[#111111] p-3 rounded-lg border border-white/5">
                <ShieldAlert className="w-4 h-4 text-[#FF4545] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-sans">Vehicle Integrity & Drift:</strong>
                  High-speed impacts deplete vehicle shield integrity. Tap <kbd className="text-white bg-[#222] px-1 py-0.5 rounded">Space</kbd> into sharp turns to initiate controlled power-drifts and avoid heavier trucks.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-white/10">
          <button
            onClick={() => {
              soundEngine.playUIClick();
              onClose();
            }}
            className="bg-[#FF2020] hover:bg-[#FF3535] px-6 py-2.5 rounded-xl font-racing font-bold text-white text-sm tracking-wider cursor-pointer shadow-[0_0_20px_rgba(255,32,32,0.4)]"
          >
            GOT IT, LET'S RACE
          </button>
        </div>
      </div>
    </div>
  );
};
