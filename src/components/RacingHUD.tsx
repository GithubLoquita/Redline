/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Pause, Volume2, VolumeX, Camera, Zap, Shield, Trophy, Flame } from 'lucide-react';
import { CameraView, GameMode, GameSettings, NearMissEvent, PlayerStats } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface RacingHUDProps {
  stats: PlayerStats;
  settings: GameSettings;
  gameMode: GameMode;
  cameraView: CameraView;
  nearMissEvents: NearMissEvent[];
  onTogglePause: () => void;
  onToggleCamera: () => void;
  onToggleMute: () => void;
  playerLaneX: number;
}

export const RacingHUD: React.FC<RacingHUDProps> = ({
  stats,
  settings,
  gameMode,
  cameraView,
  nearMissEvents,
  onTogglePause,
  onToggleCamera,
  onToggleMute,
  playerLaneX,
}) => {
  const displaySpeed =
    settings.speedUnit === 'MPH'
      ? Math.round(stats.speedKmh * 0.621371)
      : stats.speedKmh;
  const speedUnitText = settings.speedUnit === 'MPH' ? 'MPH' : 'KM/H';

  // Power RPM simulation based on speed (0 to 14,000 RPM)
  const simulatedRpm = Math.min(14000, Math.round(stats.speedKmh * 38 + 800));
  const rpmPercent = Math.min(100, (simulatedRpm / 14000) * 100);

  const getModeTitle = () => {
    switch (gameMode) {
      case 'ENDLESS': return 'ENDLESS TRAFFIC';
      case 'TIME_ATTACK': return 'TIME ATTACK';
      case 'CHECKPOINT': return `CHECKPOINT #${stats.currentCheckpoint}`;
      case 'FREE_DRIVE': return 'FREE DRIVE';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 z-10 select-none">
      {/* Top Header: Telemetry & Controls */}
      <div className="flex justify-between items-start w-full">
        {/* Left: Mode, Score & Multiplier */}
        <div className="flex flex-col gap-2">
          <div className="hud-panel rounded-xl px-4 py-2 border-l-4 border-l-[#FF2020] inline-flex items-center gap-3">
            <div>
              <div className="text-[10px] font-mono tracking-widest text-[#FF4545] font-semibold">
                {getModeTitle()}
              </div>
              <div className="text-xl md:text-2xl font-black font-racing text-white tracking-wider">
                {stats.score.toLocaleString()}{' '}
                <span className="text-xs font-mono text-[#A3A3A3]">PTS</span>
              </div>
            </div>

            {stats.multiplier > 1.0 && (
              <div className="bg-[#FF2020] px-2 py-1 rounded text-xs font-racing font-bold text-white flex items-center gap-1 shadow-[0_0_10px_rgba(255,32,32,0.6)]">
                <Flame className="w-3.5 h-3.5 fill-white" />
                x{stats.multiplier.toFixed(1)}
              </div>
            )}
          </div>

          {/* Distance Covered */}
          <div className="hud-panel rounded-lg px-3 py-1.5 self-start text-xs font-mono text-[#A3A3A3]">
            DISTANCE:{' '}
            <span className="text-white font-bold">
              {(stats.distanceMeters / 1000).toFixed(2)} KM
            </span>
          </div>
        </div>

        {/* Center: Countdown Timer (for Time Attack & Checkpoint modes) */}
        {(gameMode === 'TIME_ATTACK' || gameMode === 'CHECKPOINT') && (
          <div className="hud-panel rounded-xl px-5 py-2.5 flex flex-col items-center border border-[#FF2020]/40">
            <span className="text-[10px] font-mono text-[#A3A3A3] tracking-widest uppercase">
              TIME REMAINING
            </span>
            <span
              className={`text-2xl md:text-3xl font-black font-racing tracking-wider ${
                stats.timeLeft < 10 ? 'text-[#FF2020] animate-bounce' : 'text-white'
              }`}
            >
              {stats.timeLeft.toFixed(1)}s
            </span>
          </div>
        )}

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Camera View Switcher */}
          <button
            onClick={onToggleCamera}
            title={`Current View: ${cameraView} (Press C)`}
            className="hud-panel hover:bg-[#1B1B1B] text-white p-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
          >
            <Camera className="w-4 h-4 text-[#FF2020]" />
            <span className="hidden sm:inline">{cameraView}</span>
          </button>

          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            title={settings.isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="hud-panel hover:bg-[#1B1B1B] text-white p-2.5 rounded-xl transition-colors cursor-pointer"
          >
            {settings.isMuted ? (
              <VolumeX className="w-4 h-4 text-[#FF4545]" />
            ) : (
              <Volume2 className="w-4 h-4 text-white" />
            )}
          </button>

          {/* Pause Button */}
          <button
            onClick={onTogglePause}
            title="Pause Race (Esc)"
            className="hud-panel hover:border-[#FF2020] hover:bg-[#1B1B1B] text-white p-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <Pause className="w-4 h-4 text-[#FF2020]" />
          </button>
        </div>
      </div>

      {/* Center Event Notifications (Near Misses, Combos) */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
        {nearMissEvents.map((evt) => (
          <div
            key={evt.id}
            className="hud-panel rounded-full px-5 py-2 border border-[#FF2020] text-center font-racing font-extrabold text-sm md:text-base text-white shadow-[0_0_20px_rgba(255,32,32,0.5)] animate-bounce"
          >
            <span className="text-[#FF2020]">⚡ </span>
            {evt.text}
          </div>
        ))}
      </div>

      {/* Bottom Center: Futuristic Instrument Cluster */}
      <div className="w-full flex justify-between items-end gap-4">
        {/* Left Gauges: Shield Health & Nitro */}
        <div className="hud-panel rounded-2xl p-4 w-44 md:w-56 space-y-3 pointer-events-auto">
          {/* Shield Integrity */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-1">
              <span className="flex items-center gap-1.5 text-[#A3A3A3]">
                <Shield className="w-3.5 h-3.5 text-[#FF2020]" /> SHIELD
              </span>
              <span
                className={`font-bold ${
                  stats.healthPercent < 30 ? 'text-[#FF2020]' : 'text-white'
                }`}
              >
                {Math.round(stats.healthPercent)}%
              </span>
            </div>
            <div className="w-full bg-[#1B1B1B] h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  stats.healthPercent < 30
                    ? 'bg-[#FF2020]'
                    : 'bg-gradient-to-r from-[#B00020] to-[#FF4545]'
                }`}
                style={{ width: `${stats.healthPercent}%` }}
              />
            </div>
          </div>

          {/* Nitro Energy */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-1">
              <span className="flex items-center gap-1.5 text-[#A3A3A3]">
                <Zap className="w-3.5 h-3.5 text-[#00E5FF]" /> NITRO
              </span>
              <span className="font-bold text-[#00E5FF]">
                {Math.round(stats.nitroPercent)}%
              </span>
            </div>
            <div className="w-full bg-[#1B1B1B] h-2.5 rounded-full overflow-hidden border border-[#00E5FF]/20">
              <div
                className="h-full bg-gradient-to-r from-[#0088cc] to-[#00f0ff] transition-all duration-75 shadow-[0_0_10px_rgba(0,229,255,0.5)]"
                style={{ width: `${stats.nitroPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Main Digital Speedometer */}
        <div className="hud-panel-glow rounded-3xl px-8 py-4 flex flex-col items-center min-w-[200px] md:min-w-[250px] border-t-2 border-t-[#FF2020]">
          {/* RPM Arc Bar */}
          <div className="w-full max-w-[180px] bg-[#1B1B1B] h-1.5 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-75 ${
                rpmPercent > 85
                  ? 'bg-[#FF2020]'
                  : 'bg-gradient-to-r from-emerald-500 via-amber-400 to-[#FF2020]'
              }`}
              style={{ width: `${rpmPercent}%` }}
            />
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-5xl md:text-7xl font-black font-racing italic tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,32,32,0.3)]">
              {displaySpeed}
            </span>
            <span className="text-xs md:text-sm font-racing font-bold text-[#FF2020] tracking-wider">
              {speedUnitText}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono text-[#A3A3A3] mt-1">
            <span>RPM: {simulatedRpm.toLocaleString()}</span>
            <span>TOP: {stats.maxSpeedKmh} KM/H</span>
          </div>
        </div>

        {/* Right: Lane Position Radar */}
        <div className="hud-panel rounded-2xl p-4 w-36 md:w-44 flex flex-col items-center">
          <div className="text-[10px] font-mono text-[#A3A3A3] uppercase tracking-wider mb-2">
            Highway Radar
          </div>
          {/* 4 Lanes Visualizer */}
          <div className="w-full h-14 bg-[#151515] rounded-xl border border-white/10 relative flex justify-between p-1.5 overflow-hidden">
            {/* Lane Dividers */}
            <div className="absolute inset-y-0 left-1/4 w-[1px] border-r border-dashed border-white/20"></div>
            <div className="absolute inset-y-0 left-2/4 w-[1px] border-r border-dashed border-white/20"></div>
            <div className="absolute inset-y-0 left-3/4 w-[1px] border-r border-dashed border-white/20"></div>

            {/* Player Car Dot */}
            <div
              className="absolute bottom-2 w-3.5 h-6 bg-[#FF2020] rounded-xs shadow-[0_0_8px_#FF2020] transition-all duration-75 -translate-x-1/2"
              style={{
                left: `${Math.max(12, Math.min(88, ((playerLaneX + 7.2) / 14.4) * 100))}%`,
              }}
            />
          </div>
          <div className="text-[9px] font-mono text-[#A3A3A3] mt-1">
            NEAR MISS: <span className="text-white font-bold">{stats.nearMisses}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
