/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Check, Gauge, Zap, Crosshair, BatteryCharging } from 'lucide-react';
import { VehicleConfig } from '../types';
import { VEHICLE_PRESETS } from '../game/carBuilder';
import { soundEngine } from '../audio/soundEngine';

interface GarageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVehicleId: string;
  onSelectVehicle: (id: string, color?: string) => void;
  currentColor?: string;
}

const COLOR_SWATCHES = [
  { name: 'Apex Crimson', hex: '#FF2020' },
  { name: 'Obsidian Black', hex: '#0E0E10' },
  { name: 'Liquid Silver', hex: '#C8CDD0' },
  { name: 'Electric Cyan', hex: '#00E5FF' },
  { name: 'Stealth Matte', hex: '#1E2024' },
  { name: 'Sunburst Gold', hex: '#FFB800' },
];

export const GarageModal: React.FC<GarageModalProps> = ({
  isOpen,
  onClose,
  selectedVehicleId,
  onSelectVehicle,
  currentColor,
}) => {
  if (!isOpen) return null;

  const currentVehicle =
    VEHICLE_PRESETS.find((v) => v.id === selectedVehicleId) || VEHICLE_PRESETS[0];

  const handleCarClick = (id: string) => {
    soundEngine.playUIClick();
    onSelectVehicle(id, currentColor);
  };

  const handleColorClick = (hex: string) => {
    soundEngine.playUIClick();
    onSelectVehicle(selectedVehicleId, hex);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="hud-panel-glow w-full max-w-3xl rounded-2xl p-6 md:p-8 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-6">
          <div>
            <h2 className="text-2xl font-bold font-racing text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-[#FF2020] inline-block rounded-xs"></span>
              VEHICLE SHOWROOM
            </h2>
            <p className="text-xs text-[#A3A3A3] font-mono mt-0.5">
              Select and configure your electric hypercar
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

        {/* Vehicle Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {VEHICLE_PRESETS.map((vehicle) => {
            const isSelected = vehicle.id === selectedVehicleId;
            return (
              <button
                key={vehicle.id}
                onClick={() => handleCarClick(vehicle.id)}
                className={`p-4 rounded-xl text-left transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#1B1B1B] border-[#FF2020] shadow-[0_0_15px_rgba(255,32,32,0.3)]'
                    : 'bg-[#111111] border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono uppercase text-[#A3A3A3]">
                    ANIX SPEC
                  </span>
                  {isSelected && (
                    <span className="p-0.5 bg-[#FF2020] rounded text-white">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <div className="font-racing font-bold text-white text-base truncate">
                  {vehicle.name}
                </div>
                <div className="text-[11px] text-[#A3A3A3] mb-3 truncate">
                  {vehicle.subtitle}
                </div>
                <div className="text-xs font-mono text-[#FF4545] font-semibold">
                  {vehicle.topSpeed} KM/H MAX
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Specs for Active Vehicle */}
        <div className="bg-[#151515] rounded-xl p-5 border border-white/5 mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs font-mono text-[#FF4545] uppercase tracking-wider">
                Vehicle Telemetry
              </div>
              <h3 className="text-xl font-bold font-racing text-white">
                {currentVehicle.name}
              </h3>
            </div>
            <p className="text-xs text-[#A3A3A3] max-w-sm hidden sm:block text-right">
              {currentVehicle.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="flex items-center gap-1.5 text-[#A3A3A3]">
                  <Gauge className="w-3.5 h-3.5 text-[#FF2020]" /> TOP SPEED
                </span>
                <span className="text-white font-bold">{currentVehicle.topSpeed} KM/H</span>
              </div>
              <div className="w-full bg-[#111] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#B00020] to-[#FF2020] h-full"
                  style={{ width: `${(currentVehicle.topSpeed / 420) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="flex items-center gap-1.5 text-[#A3A3A3]">
                  <Zap className="w-3.5 h-3.5 text-[#FF2020]" /> ACCELERATION
                </span>
                <span className="text-white font-bold">{currentVehicle.acceleration}%</span>
              </div>
              <div className="w-full bg-[#111] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#B00020] to-[#FF2020] h-full"
                  style={{ width: `${currentVehicle.acceleration}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="flex items-center gap-1.5 text-[#A3A3A3]">
                  <Crosshair className="w-3.5 h-3.5 text-[#FF2020]" /> HANDLING & DRIFT
                </span>
                <span className="text-white font-bold">{currentVehicle.handling}%</span>
              </div>
              <div className="w-full bg-[#111] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#B00020] to-[#FF2020] h-full"
                  style={{ width: `${currentVehicle.handling}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="flex items-center gap-1.5 text-[#A3A3A3]">
                  <BatteryCharging className="w-3.5 h-3.5 text-[#FF2020]" /> NITRO CAPACITY
                </span>
                <span className="text-white font-bold">{currentVehicle.nitroCapacity} SEC</span>
              </div>
              <div className="w-full bg-[#111] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#B00020] to-[#FF2020] h-full"
                  style={{ width: `${(currentVehicle.nitroCapacity / 8) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Paint Swatches */}
        <div className="mb-6">
          <div className="text-xs font-mono text-[#A3A3A3] uppercase tracking-wider mb-3">
            Custom Finish & Paint
          </div>
          <div className="flex flex-wrap gap-3">
            {COLOR_SWATCHES.map((swatch) => {
              const active = (currentColor || currentVehicle.bodyColor) === swatch.hex;
              return (
                <button
                  key={swatch.hex}
                  onClick={() => handleColorClick(swatch.hex)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                    active
                      ? 'border-[#FF2020] bg-[#1B1B1B] shadow-[0_0_10px_rgba(255,32,32,0.3)]'
                      : 'border-white/10 bg-[#111111] hover:border-white/30'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-white/20 inline-block"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <span className="text-xs font-mono text-white">{swatch.name}</span>
                </button>
              );
            })}
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
            CONFIRM SELECTION
          </button>
        </div>
      </div>
    </div>
  );
};
