import React from 'react';
import { Camera, Cpu, Activity, Volume2, VolumeX, Settings as SettingsIcon, ShieldCheck } from 'lucide-react';
import { SystemState } from '../types';

interface HeaderProps {
  systemState: SystemState;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  systemState,
  voiceEnabled,
  onToggleVoice,
  onOpenSettings
}) => {
  return (
    <header className="bg-slate-900/90 border-b border-cyan-500/20 backdrop-blur-md sticky top-0 z-40 px-4 py-3 text-slate-100">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                AI MOTION OBJECT SENSOR
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                v2.5 PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Realtime Computer Vision & Object Motion Detector</span>
            </p>
          </div>
        </div>

        {/* Status Indicators & Quick Controls */}
        <div className="flex items-center flex-wrap gap-2 md:gap-3 text-xs font-mono">
          {/* Camera Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <Camera className={`w-3.5 h-3.5 ${systemState.isCameraOnline ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span className="text-slate-400 hidden sm:inline">CAMERA:</span>
            <span className={`font-bold ${systemState.isCameraOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
              ● {systemState.isCameraOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          {/* AI Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <Cpu className={`w-3.5 h-3.5 ${systemState.isAiActive ? 'text-cyan-400' : 'text-amber-400'}`} />
            <span className="text-slate-400 hidden sm:inline">AI ENGINE:</span>
            <span className={`font-bold ${systemState.isAiActive ? 'text-cyan-400' : 'text-amber-400'}`}>
              ● {systemState.isAiActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>

          {/* FPS Meter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">FPS:</span>
            <span className="font-bold text-indigo-300">{systemState.fps}</span>
          </div>

          {/* Object Count Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
            <span className="text-slate-300 font-sans">OBJEK:</span>
            <span className="font-extrabold text-sm text-cyan-400">{systemState.activeCount}</span>
          </div>

          {/* Voice Quick Toggle */}
          <button
            onClick={onToggleVoice}
            className={`p-2 rounded-lg border transition-all ${
              voiceEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
            title={voiceEnabled ? 'Suara AI: ON' : 'Suara AI: OFF'}
            id="btn-voice-toggle-header"
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-all flex items-center gap-1.5"
            id="btn-open-settings"
          >
            <SettingsIcon className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline font-sans">Pengaturan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
