/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Volume2, VolumeX, Monitor, Sliders, Eye, RotateCcw } from 'lucide-react';
import { GameSettings } from '../types';
import { resetSettings } from '../utils/storage';
import { soundEngine } from '../audio/soundEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'GRAPHICS' | 'AUDIO' | 'GAMEPLAY' | 'ACCESSIBILITY'>('GRAPHICS');

  if (!isOpen) return null;

  const update = (partial: Partial<GameSettings>) => {
    const updated = { ...settings, ...partial };
    onUpdateSettings(updated);
    soundEngine.applySettings(updated);
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings to default values?')) {
      const def = resetSettings();
      onUpdateSettings(def);
      soundEngine.applySettings(def);
      soundEngine.playUIClick();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="hud-panel-glow w-full max-w-2xl rounded-2xl p-6 md:p-8 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-6">
          <div>
            <h2 className="text-2xl font-bold font-racing text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-[#FF2020] inline-block rounded-xs"></span>
              CONFIGURATION
            </h2>
            <p className="text-xs text-[#A3A3A3] font-mono mt-0.5">
              Customize graphics, audio, physics, and accessibility
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

        {/* Tab Selector */}
        <div className="flex border-b border-white/10 mb-6 gap-2 overflow-x-auto pb-2">
          {(
            [
              { id: 'GRAPHICS', label: 'Graphics', icon: Monitor },
              { id: 'AUDIO', label: 'Audio', icon: Volume2 },
              { id: 'GAMEPLAY', label: 'Gameplay', icon: Sliders },
              { id: 'ACCESSIBILITY', label: 'Accessibility', icon: Eye },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEngine.playUIClick();
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-racing font-semibold tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#FF2020] text-white shadow-[0_0_12px_rgba(255,32,32,0.4)]'
                    : 'text-[#A3A3A3] hover:text-white hover:bg-[#1B1B1B]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6 flex-1 mb-6">
          {activeTab === 'GRAPHICS' && (
            <div className="space-y-5">
              {/* Quality Preset */}
              <div>
                <label className="text-xs font-mono text-[#A3A3A3] block mb-2 uppercase">
                  Rendering Quality Preset
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['LOW', 'MEDIUM', 'HIGH'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => update({ graphicsQuality: q })}
                      className={`py-3 rounded-xl border text-xs font-racing font-bold cursor-pointer transition-all ${
                        settings.graphicsQuality === q
                          ? 'border-[#FF2020] bg-[#1B1B1B] text-white shadow-[0_0_10px_rgba(255,32,32,0.3)]'
                          : 'border-white/10 bg-[#111111] text-[#A3A3A3] hover:border-white/20'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Track Weather & Wet Road Surface */}
              <div>
                <label className="text-xs font-mono text-[#A3A3A3] block mb-2 uppercase">
                  Track Weather & Wet Road Surface
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([
                    { id: 'AUTO_DIFFICULTY', label: 'Dynamic Auto' },
                    { id: 'CLEAR_NIGHT', label: 'Clear Night' },
                    { id: 'RAIN_STORM', label: 'Rain Storm (Wet)' },
                    { id: 'NEON_FOG', label: 'Neon Fog' },
                  ] as const).map((w) => (
                    <button
                      key={w.id}
                      onClick={() => update({ weather: w.id })}
                      className={`py-2.5 px-2 rounded-xl border text-[11px] font-racing font-bold cursor-pointer transition-all text-center ${
                        settings.weather === w.id
                          ? 'border-[#FF2020] bg-[#1B1B1B] text-white shadow-[0_0_10px_rgba(255,32,32,0.3)]'
                          : 'border-white/10 bg-[#111111] text-[#A3A3A3] hover:border-white/20'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#A3A3A3] mt-1.5 font-mono">
                  Rain storms activate wet asphalt shaders, tire spray mist, hydroplaning physics, and lightning flashes.
                </p>
              </div>

              {/* Shadows */}
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <div>
                  <div className="text-sm font-semibold text-white">Dynamic Shadows</div>
                  <div className="text-xs text-[#A3A3A3]">
                    Soft shadows under vehicles and highway structures
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.shadows}
                  onChange={(e) => update({ shadows: e.target.checked })}
                  className="w-5 h-5 accent-[#FF2020] cursor-pointer"
                />
              </div>

              {/* Speed Particles */}
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <div>
                  <div className="text-sm font-semibold text-white">Speed Wind Particles</div>
                  <div className="text-xs text-[#A3A3A3]">
                    High-speed wind streaks and nitro particle exhaust
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.particles}
                  onChange={(e) => update({ particles: e.target.checked })}
                  className="w-5 h-5 accent-[#FF2020] cursor-pointer"
                />
              </div>

              {/* Reduced Motion */}
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <div>
                  <div className="text-sm font-semibold text-white">Reduced Motion</div>
                  <div className="text-xs text-[#A3A3A3]">
                    Disable screen shake during crashes and sharp drifts
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={(e) => update({ reducedMotion: e.target.checked })}
                  className="w-5 h-5 accent-[#FF2020] cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'AUDIO' && (
            <div className="space-y-5">
              {/* Mute Toggle */}
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <div>
                  <div className="text-sm font-semibold text-white">Mute All Audio</div>
                  <div className="text-xs text-[#A3A3A3]">Silences all synthesized sound effects</div>
                </div>
                <button
                  onClick={() => update({ isMuted: !settings.isMuted })}
                  className={`p-2 rounded-lg cursor-pointer transition-all ${
                    settings.isMuted ? 'bg-[#FF2020] text-white' : 'bg-[#1B1B1B] text-[#A3A3A3]'
                  }`}
                >
                  {settings.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>

              {/* Master Volume */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-[#A3A3A3]">MASTER VOLUME</span>
                  <span className="text-white font-bold">
                    {Math.round(settings.masterVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.masterVolume}
                  onChange={(e) => update({ masterVolume: parseFloat(e.target.value) })}
                  className="w-full accent-[#FF2020] cursor-pointer"
                />
              </div>

              {/* Electric Motor Volume */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-[#A3A3A3]">ELECTRIC MOTOR WHINE</span>
                  <span className="text-white font-bold">
                    {Math.round(settings.motorVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.motorVolume}
                  onChange={(e) => update({ motorVolume: parseFloat(e.target.value) })}
                  className="w-full accent-[#FF2020] cursor-pointer"
                />
              </div>

              {/* SFX Volume */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-[#A3A3A3]">SFX (TIRES, NITRO, IMPACT)</span>
                  <span className="text-white font-bold">
                    {Math.round(settings.sfxVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.sfxVolume}
                  onChange={(e) => update({ sfxVolume: parseFloat(e.target.value) })}
                  className="w-full accent-[#FF2020] cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'GAMEPLAY' && (
            <div className="space-y-5">
              {/* Speed Unit */}
              <div>
                <label className="text-xs font-mono text-[#A3A3A3] block mb-2 uppercase">
                  Preferred Speed Display
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['KMH', 'MPH'] as const).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => update({ speedUnit: unit })}
                      className={`py-3 rounded-xl border text-xs font-racing font-bold cursor-pointer transition-all ${
                        settings.speedUnit === unit
                          ? 'border-[#FF2020] bg-[#1B1B1B] text-white shadow-[0_0_10px_rgba(255,32,32,0.3)]'
                          : 'border-white/10 bg-[#111111] text-[#A3A3A3] hover:border-white/20'
                      }`}
                    >
                      {unit === 'KMH' ? 'KM/H (Metric)' : 'MPH (Imperial)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Steering Sensitivity */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-[#A3A3A3]">STEERING SENSITIVITY</span>
                  <span className="text-white font-bold">
                    {Math.round(settings.steeringSensitivity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.8"
                  step="0.05"
                  value={settings.steeringSensitivity}
                  onChange={(e) => update({ steeringSensitivity: parseFloat(e.target.value) })}
                  className="w-full accent-[#FF2020] cursor-pointer"
                />
              </div>

              {/* Traffic Density */}
              <div>
                <label className="text-xs font-mono text-[#A3A3A3] block mb-2 uppercase">
                  Highway Traffic Density
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['LIGHT', 'NORMAL', 'HEAVY'] as const).map((density) => (
                    <button
                      key={density}
                      onClick={() => update({ trafficDensity: density })}
                      className={`py-3 rounded-xl border text-xs font-racing font-bold cursor-pointer transition-all ${
                        settings.trafficDensity === density
                          ? 'border-[#FF2020] bg-[#1B1B1B] text-white shadow-[0_0_10px_rgba(255,32,32,0.3)]'
                          : 'border-white/10 bg-[#111111] text-[#A3A3A3] hover:border-white/20'
                      }`}
                    >
                      {density}
                    </button>
                  ))}
                </div>
              </div>

              {/* Steering Assist */}
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <div>
                  <div className="text-sm font-semibold text-white">High-Speed Stability Assist</div>
                  <div className="text-xs text-[#A3A3A3]">
                    Reduces over-steer twitching at speeds above 250 km/h
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.steeringAssist}
                  onChange={(e) => update({ steeringAssist: e.target.checked })}
                  className="w-5 h-5 accent-[#FF2020] cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'ACCESSIBILITY' && (
            <div className="space-y-5">
              {/* High Contrast HUD */}
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <div>
                  <div className="text-sm font-semibold text-white">High Contrast HUD</div>
                  <div className="text-xs text-[#A3A3A3]">
                    Maximum readability black-and-white borders for HUD gauges
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.highContrastHUD}
                  onChange={(e) => update({ highContrastHUD: e.target.checked })}
                  className="w-5 h-5 accent-[#FF2020] cursor-pointer"
                />
              </div>

              {/* Reduced Motion */}
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <div>
                  <div className="text-sm font-semibold text-white">Motion Reduction</div>
                  <div className="text-xs text-[#A3A3A3]">
                    Eliminate FOV distortion, camera shake, and flashing screen impacts
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={(e) => update({ reducedMotion: e.target.checked })}
                  className="w-5 h-5 accent-[#FF2020] cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-white/10">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-[#A3A3A3] hover:text-[#FF2020] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <button
            onClick={() => {
              soundEngine.playUIClick();
              onClose();
            }}
            className="bg-[#FF2020] hover:bg-[#FF3535] px-6 py-2.5 rounded-xl font-racing font-bold text-white text-sm tracking-wider cursor-pointer shadow-[0_0_20px_rgba(255,32,32,0.4)]"
          >
            SAVE & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
