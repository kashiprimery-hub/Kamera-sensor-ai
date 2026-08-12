import React from 'react';
import { BarChart3, Cpu, Zap, Activity } from 'lucide-react';
import { TrackedObject, SystemState } from '../types';

interface AnalyticsPanelProps {
  trackedObjects: TrackedObject[];
  systemState: SystemState;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ trackedObjects, systemState }) => {
  // Count by category
  const categories = {
    MANUSIA: trackedObjects.filter((o) => o.category === 'MANUSIA').length,
    HEWAN: trackedObjects.filter((o) => o.category === 'HEWAN').length,
    KENDARAAN: trackedObjects.filter((o) => o.category === 'KENDARAAN').length,
    BENDA: trackedObjects.filter((o) => o.category === 'BENDA').length,
    OBJEK_LAINNYA: trackedObjects.filter((o) => o.category === 'OBJEK_LAINNYA').length
  };

  const total = trackedObjects.length || 1;

  // Motion ratio
  const movingCount = trackedObjects.filter((o) => o.status === 'BERGERAK').length;
  const staticCount = trackedObjects.length - movingCount;

  return (
    <div className="bg-slate-900/90 border border-cyan-500/20 rounded-2xl p-4 flex flex-col shadow-lg backdrop-blur-md text-slate-100">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-200">
            ANALYTICS & AI PERFORMANCE
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        {/* Category Breakdown Bar */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>Kategori Objek</span>
            <span className="text-cyan-400 font-bold">{trackedObjects.length} Total</span>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono">
            <div>
              <div className="flex justify-between text-slate-300 mb-0.5">
                <span>Manusia</span>
                <span>{categories.MANUSIA}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: `${(categories.MANUSIA / total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-0.5">
                <span>Kendaraan</span>
                <span>{categories.KENDARAAN}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${(categories.KENDARAAN / total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-0.5">
                <span>Hewan</span>
                <span>{categories.HEWAN}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${(categories.HEWAN / total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-0.5">
                <span>Benda</span>
                <span>{categories.BENDA}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-400 rounded-full transition-all duration-300"
                  style={{ width: `${(categories.BENDA / total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Motion Activity Meter */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>Indeks Gerakan</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>

          <div className="flex items-center justify-around my-2">
            <div className="text-center">
              <span className="block text-xl font-extrabold text-cyan-400 font-mono">
                {movingCount}
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Bergerak</span>
            </div>

            <div className="h-8 w-px bg-slate-800" />

            <div className="text-center">
              <span className="block text-xl font-extrabold text-slate-400 font-mono">
                {staticCount}
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Diam</span>
            </div>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-cyan-400 h-full transition-all duration-300"
              style={{ width: `${(movingCount / (total || 1)) * 100}%` }}
            />
            <div
              className="bg-slate-600 h-full transition-all duration-300"
              style={{ width: `${(staticCount / (total || 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* AI Performance & Latency */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>Performa Inferensi AI</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>

          <div className="space-y-2 font-mono text-xs my-1">
            <div className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-400">Latensi COCO-SSD:</span>
              <span className="font-bold text-emerald-400">{systemState.inferenceTimeMs} ms</span>
            </div>

            <div className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-400">Akselerasi Engine:</span>
              <span className="font-bold text-cyan-400">WebGL / Canvas</span>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 text-center">
            Pemrosesan realtime langsung di browser
          </div>
        </div>
      </div>
    </div>
  );
};
