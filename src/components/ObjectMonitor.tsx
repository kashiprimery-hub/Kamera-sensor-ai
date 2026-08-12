import React from 'react';
import { Shield, Compass, Activity, Eye, Tag } from 'lucide-react';
import { TrackedObject } from '../types';
import { CATEGORY_COLORS } from '../utils/translations';

interface ObjectMonitorProps {
  trackedObjects: TrackedObject[];
  selectedObjectId?: string | null;
  onSelectObject: (id: string | null) => void;
}

export const ObjectMonitor: React.FC<ObjectMonitorProps> = ({
  trackedObjects,
  selectedObjectId,
  onSelectObject
}) => {
  return (
    <div className="bg-slate-900/90 border border-cyan-500/20 rounded-2xl p-4 flex flex-col h-full shadow-lg backdrop-blur-md text-slate-100">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-200">
            OBJECT MONITOR
          </h2>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-mono font-bold">
          <span>JUMLAH:</span>
          <span className="text-cyan-400 font-extrabold">{trackedObjects.length}</span>
        </div>
      </div>

      {/* Object Cards List */}
      <div className="flex-1 overflow-y-auto mt-3 space-y-2.5 pr-1 max-h-[360px] md:max-h-[420px] custom-scrollbar">
        {trackedObjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 gap-2 border border-dashed border-slate-800 rounded-xl p-4">
            <Eye className="w-8 h-8 text-slate-600 animate-pulse" />
            <p className="text-xs font-mono">TIDAK ADA OBJEK TERDETEKSI</p>
            <p className="text-[11px] text-slate-600 max-w-[200px]">
              Arahkan kamera ke area objek untuk memulai deteksi realtime
            </p>
          </div>
        ) : (
          trackedObjects.map((obj) => {
            const isSelected = selectedObjectId === obj.id;
            const badgeStyle = CATEGORY_COLORS[obj.category]?.badge || 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
            const confPercent = Math.round(obj.confidence * 100);

            return (
              <div
                key={obj.id}
                onClick={() => onSelectObject(isSelected ? null : obj.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                {/* Accent top border line */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: obj.color || '#06b6d4' }}
                />

                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: obj.color || '#06b6d4' }}
                    />
                    <h3 className="font-bold text-sm text-slate-100 tracking-wide">
                      {obj.labelIndonesian}
                    </h3>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {obj.id}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeStyle}`}>
                    {obj.category}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 mt-2">
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-500 text-[10px]">Confidence:</span>
                    <span className={`font-bold ${confPercent >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {confPercent}%
                    </span>
                  </div>

                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-500 text-[10px]">Status:</span>
                    <span className={`font-bold ${obj.status === 'BERGERAK' ? 'text-cyan-400' : 'text-slate-400'}`}>
                      {obj.status}
                    </span>
                  </div>
                </div>

                {/* Direction Tag */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-cyan-400" />
                    <span>Arah:</span>
                  </span>
                  <span className="text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                    {obj.direction}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
