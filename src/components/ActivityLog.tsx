import React, { useState } from 'react';
import { History, Trash2, Download, Search, Filter } from 'lucide-react';
import { ActivityLogItem } from '../types';

interface ActivityLogProps {
  logs: ActivityLogItem[];
  onClearLogs: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs, onClearLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.objectLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.objectId.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === 'ALL') return matchesSearch;
    if (filterType === 'ENTRY') return matchesSearch && log.eventType === 'EVENT_01_OBJECT_ENTRY';
    if (filterType === 'MOTION') return matchesSearch && (log.eventType === 'EVENT_02_MOTION_START' || log.eventType === 'EVENT_04_DIRECTION_CHANGE');
    if (filterType === 'EXIT') return matchesSearch && log.eventType === 'EVENT_07_OBJECT_EXIT';
    return matchesSearch;
  });

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Waktu,Event,ID Objek,Label,Deskripsi\n' +
      logs.map((e) => `"${e.timestamp}","${e.eventType}","${e.objectId}","${e.objectLabel}","${e.description}"`).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AI_Motion_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/90 border border-cyan-500/20 rounded-2xl p-4 flex flex-col h-full shadow-lg backdrop-blur-md text-slate-100">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-200">
            ACTIVITY LOG
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono font-bold text-slate-400">
            {logs.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition-all disabled:opacity-40 flex items-center gap-1"
            title="Export CSV"
            id="btn-export-log"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-mono transition-all disabled:opacity-40 flex items-center gap-1"
            id="btn-clear-log"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>CLEAR LOG</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-2 my-2.5">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Cari log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-[10px] font-mono">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-2 py-0.5 rounded transition-all ${filterType === 'ALL' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'}`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterType('ENTRY')}
            className={`px-2 py-0.5 rounded transition-all ${filterType === 'ENTRY' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'}`}
          >
            Masuk
          </button>
          <button
            onClick={() => setFilterType('MOTION')}
            className={`px-2 py-0.5 rounded transition-all ${filterType === 'MOTION' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'}`}
          >
            Gerakan
          </button>
        </div>
      </div>

      {/* Activity Log Stream */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[300px] md:max-h-[380px] custom-scrollbar font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-600 text-xs border border-dashed border-slate-800 rounded-xl">
            Belum ada log aktivitas tercatat
          </div>
        ) : (
          filteredLogs.map((log) => {
            let eventBadgeColor = 'bg-slate-800 text-slate-300';
            if (log.eventType === 'EVENT_01_OBJECT_ENTRY') eventBadgeColor = 'bg-emerald-950 text-emerald-400 border border-emerald-800/60';
            else if (log.eventType === 'EVENT_02_MOTION_START' || log.eventType === 'EVENT_04_DIRECTION_CHANGE') eventBadgeColor = 'bg-cyan-950 text-cyan-400 border border-cyan-800/60';
            else if (log.eventType === 'EVENT_07_OBJECT_EXIT') eventBadgeColor = 'bg-rose-950 text-rose-400 border border-rose-800/60';

            return (
              <div
                key={log.id}
                className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex items-start gap-2 text-[11px] leading-relaxed"
              >
                <span className="text-slate-500 font-bold shrink-0">{log.timestamp}</span>
                <div className="flex-1">
                  <span className={`inline-block px-1.5 py-0.2 mr-1.5 rounded text-[9px] font-bold ${eventBadgeColor}`}>
                    {log.objectLabel} {log.objectId}
                  </span>
                  <span className="text-slate-300">{log.description}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
