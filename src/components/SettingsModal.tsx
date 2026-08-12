import React from 'react';
import { X, Sliders, Volume2, Eye, ShieldCheck, Play } from 'lucide-react';
import { AppSettings } from '../types';
import { voiceService } from '../utils/voice';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-xl rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold tracking-wide text-slate-100 uppercase font-mono">
              PENGATURAN SENSOR AI
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            id="btn-close-settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 font-sans text-xs custom-scrollbar flex-1">
          {/* Section 1: AI Detection Sensitivity */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>DETEKSI & SENSITIVITAS AI</span>
            </h3>

            {/* Confidence Threshold Slider */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center font-mono">
                <label className="text-slate-300 font-medium">Confidence Threshold:</label>
                <span className="text-cyan-400 font-bold text-sm">
                  {Math.round(settings.confidenceThreshold * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.95"
                step="0.05"
                value={settings.confidenceThreshold}
                onChange={(e) => onUpdateSettings({ confidenceThreshold: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-2"
              />
              <p className="text-[11px] text-slate-500">
                Ambang batas keyakinan minimal objek sebelum ditampilkan dalam radar.
              </p>
            </div>

            {/* Sensitivity Presets */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="block text-slate-300 font-mono font-medium mb-1">
                Sensitivitas Deteksi:
              </label>
              <div className="grid grid-cols-3 gap-2 font-mono">
                {(['Low', 'Medium', 'High'] as const).map((level) => {
                  const isSelected = settings.detectionSensitivity === level;
                  const threshold = level === 'Low' ? 0.8 : level === 'Medium' ? 0.7 : 0.5;

                  return (
                    <button
                      key={level}
                      onClick={() =>
                        onUpdateSettings({
                          detectionSensitivity: level,
                          confidenceThreshold: threshold
                        })
                      }
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-cyan-600 border-cyan-400 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {level === 'Low' ? 'Rendah (80%)' : level === 'Medium' ? 'Sedang (70%)' : 'Tinggi (50%)'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Voice AI Notifications */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <span>NOTIFIKASI SUARA REALTIME</span>
            </h3>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
              {/* Voice Switch */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="block font-medium text-slate-200">Notifikasi Suara AI</span>
                  <span className="text-[11px] text-slate-500">Membacakan objek & arah pergerakan</span>
                </div>
                <button
                  onClick={() => onUpdateSettings({ voiceEnabled: !settings.voiceEnabled })}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    settings.voiceEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                  id="toggle-voice-settings"
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${
                      settings.voiceEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Language Indicator */}
              <div className="flex items-center justify-between font-mono pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400">Bahasa Suara:</span>
                <span className="text-emerald-400 font-bold bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
                  Bahasa Indonesia (id-ID)
                </span>
              </div>

              {/* Voice Speed */}
              <div className="space-y-1 font-mono pt-2 border-t border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Kecepatan Suara:</span>
                  <span className="text-emerald-400 font-bold">{settings.voiceSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.1"
                  value={settings.voiceSpeed}
                  onChange={(e) => onUpdateSettings({ voiceSpeed: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-400 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
              </div>

              {/* Cooldown Timer */}
              <div className="space-y-1 font-mono pt-2 border-t border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Jeda Cooldown Suara:</span>
                  <span className="text-emerald-400 font-bold">{settings.voiceCooldownSec} Detik</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="1"
                  value={settings.voiceCooldownSec}
                  onChange={(e) => onUpdateSettings({ voiceCooldownSec: parseInt(e.target.value) })}
                  className="w-full accent-emerald-400 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
              </div>

              {/* Test Voice Button */}
              <button
                onClick={() => voiceService.testSpeech(settings)}
                className="w-full py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                id="btn-test-voice"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>UJI SUARA NOTIFIKASI</span>
              </button>
            </div>
          </div>

          {/* Section 3: Overlay Visual Options */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>TAMPILAN OVERLAY KAMERA</span>
            </h3>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              {[
                { key: 'showBoundingBox', label: 'Tampilkan Bounding Box' },
                { key: 'showObjectPoint', label: 'Tampilkan Titik Indikator (●)' },
                { key: 'showConfidence', label: 'Tampilkan Persentase Confidence' },
                { key: 'showTrackingId', label: 'Tampilkan ID Tracking (#001)' },
                { key: 'showMotionVectors', label: 'Tampilkan Vektor Jejak Gerakan' }
              ].map(({ key, label }) => {
                const val = !!settings[key as keyof AppSettings];

                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium">{label}</span>
                    <button
                      onClick={() => onUpdateSettings({ [key]: !val })}
                      className={`w-10 h-5 rounded-full transition-all relative ${
                        val ? 'bg-amber-500' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                          val ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
            id="btn-save-settings"
          >
            SIMPAN & TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};
