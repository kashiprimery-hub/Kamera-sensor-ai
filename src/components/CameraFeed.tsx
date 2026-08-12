import React, { useEffect, useRef } from 'react';
import { Camera, RefreshCw, AlertTriangle, Play, Pause, Eye, Maximize2, FlipHorizontal } from 'lucide-react';
import { TrackedObject, AppSettings, SystemState } from '../types';

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  trackedObjects: TrackedObject[];
  settings: AppSettings;
  systemState: SystemState;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onSwitchCamera: () => void;
  onToggleFlipHorizontal?: () => void;
  onToggleDemoMode: () => void;
  selectedObjectId?: string | null;
  onSelectObject: (id: string | null) => void;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  videoRef,
  canvasRef,
  trackedObjects,
  settings,
  systemState,
  onStartCamera,
  onStopCamera,
  onSwitchCamera,
  onToggleFlipHorizontal,
  onToggleDemoMode,
  selectedObjectId,
  onSelectObject
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // High performance Canvas overlay rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas display size to video intrinsic resolution
    const video = videoRef.current;
    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isMirrored = !!settings.flipHorizontal && !settings.demoMode;

    // Draw overlay items for each tracked object
    trackedObjects.forEach((obj) => {
      const isSelected = selectedObjectId === obj.id;
      const rawX = obj.bbox.x;
      const rawY = obj.bbox.y;
      const width = obj.bbox.width;
      const height = obj.bbox.height;

      // If camera feed is horizontally mirrored (front camera/user mode), adjust display X coordinate
      const x = isMirrored ? canvas.width - rawX - width : rawX;
      const y = rawY;
      const centerX = x + width / 2;
      const centerY = y + height / 2;

      ctx.save();

      // 1. DRAW BOUNDING BOX (If enabled in settings)
      if (settings.showBoundingBox) {
        ctx.strokeStyle = isSelected ? '#38bdf8' : obj.color || '#06b6d4';
        ctx.lineWidth = isSelected ? 2 : 1.5;
        ctx.setLineDash(isSelected ? [4, 3] : []);
        ctx.strokeRect(x, y, width, height);

        // Bounding box corner accents
        const cornerLen = Math.min(width, height) * 0.15;
        ctx.lineWidth = isSelected ? 2.5 : 2;
        ctx.setLineDash([]);

        // Top Left
        ctx.beginPath();
        ctx.moveTo(x, y + cornerLen);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cornerLen, y);
        ctx.stroke();

        // Top Right
        ctx.beginPath();
        ctx.moveTo(x + width - cornerLen, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + cornerLen);
        ctx.stroke();

        // Bottom Left
        ctx.beginPath();
        ctx.moveTo(x, y + height - cornerLen);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x + cornerLen, y + height);
        ctx.stroke();

        // Bottom Right
        ctx.beginPath();
        ctx.moveTo(x + width - cornerLen, y + height);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x + width, y + height - cornerLen);
        ctx.stroke();

        // Fill background glow
        ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.12)' : `${obj.color}10`;
        ctx.fillRect(x, y, width, height);
      }

      // 2. DRAW MOTION VECTOR TRAIL (If enabled)
      if (settings.showMotionVectors && obj.history.length > 1) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        obj.history.forEach((pt, idx) => {
          const hx = isMirrored ? canvas.width - pt.x : pt.x;
          const hy = pt.y;
          if (idx === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3. DRAW POINT INDICATOR & GLOW (● Titik Indikator Kecil)
      const pointY = Math.max(20, y - 6);
      const pointX = centerX;

      if (settings.showObjectPoint) {
        // Outer pulsing ring (small)
        ctx.beginPath();
        ctx.arc(pointX, pointY, isSelected ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.3)' : 'rgba(6, 182, 212, 0.25)';
        ctx.fill();

        // Core Solid Dot (●)
        ctx.beginPath();
        ctx.arc(pointX, pointY, isSelected ? 3 : 2, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#38bdf8' : '#06b6d4';
        ctx.shadowColor = isSelected ? '#38bdf8' : '#06b6d4';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
      }

      // 4. DRAW OBJECT LABEL & CONFIDENCE HUD (Ukuran ringkas/kecil)
      const confPercent = Math.round(obj.confidence * 100);
      let labelText = `• ${obj.labelIndonesian}`;
      if (settings.showTrackingId) {
        labelText += ` ${obj.id}`;
      }

      ctx.font = 'bold 10px ui-sans-serif, system-ui, sans-serif';
      const labelMetrics = ctx.measureText(labelText);
      const paddingX = 6;
      const boxWidth = labelMetrics.width + paddingX * 2;
      const boxHeight = 18;

      // Position label card above object
      let labelBoxX = pointX - boxWidth / 2;
      let labelBoxY = pointY - boxHeight - 4;

      // Keep inside bounds
      if (labelBoxX < 5) labelBoxX = 5;
      if (labelBoxX + boxWidth > canvas.width - 5) labelBoxX = canvas.width - boxWidth - 5;
      if (labelBoxY < 5) labelBoxY = y + 6;

      // Background pill for label
      ctx.fillStyle = isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = isSelected ? '#38bdf8' : obj.color || '#06b6d4';
      ctx.lineWidth = 1;

      // Rounded rectangle
      ctx.beginPath();
      ctx.roundRect(labelBoxX, labelBoxY, boxWidth, boxHeight, 4);
      ctx.fill();
      ctx.stroke();

      // Label Text
      ctx.fillStyle = isSelected ? '#38bdf8' : '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, labelBoxX + paddingX, labelBoxY + boxHeight / 2);

      // Confidence Tag below label or alongside
      if (settings.showConfidence) {
        const confText = `${confPercent}%`;
        ctx.font = 'bold 9px font-mono, monospace';
        const confMetrics = ctx.measureText(confText);
        const confWidth = confMetrics.width + 8;
        const confHeight = 14;
        const confX = labelBoxX + boxWidth + 3;
        const confY = labelBoxY + 2;

        if (confX + confWidth < canvas.width - 5) {
          ctx.fillStyle = confPercent > 80 ? 'rgba(16, 185, 129, 0.9)' : 'rgba(245, 158, 11, 0.9)';
          ctx.beginPath();
          ctx.roundRect(confX, confY, confWidth, confHeight, 3);
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.fillText(confText, confX + 4, confY + confHeight / 2);
        }
      }

      // Motion Direction Tag (if moving)
      if (obj.status === 'BERGERAK' && obj.direction !== 'DIAM') {
        ctx.font = 'bold 8px ui-sans-serif, system-ui';
        const dirText = obj.direction;
        const dirMetrics = ctx.measureText(dirText);
        const dirWidth = dirMetrics.width + 8;
        const dirHeight = 13;
        const dirX = labelBoxX;
        const dirY = labelBoxY + boxHeight + 3;

        ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
        ctx.beginPath();
        ctx.roundRect(dirX, dirY, dirWidth, dirHeight, 3);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.fillText(dirText, dirX + 4, dirY + dirHeight / 2);
      }

      ctx.restore();
    });
  }, [trackedObjects, settings, selectedObjectId, videoRef, canvasRef]);

  // Fullscreen trigger
  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((err) => console.error(err?.message || 'Fullscreen error'));
      } else {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col group"
      id="camera-container-stage"
    >
      {/* Video Stage Container */}
      <div className="relative w-full aspect-video md:aspect-[16/9] min-h-[300px] md:min-h-[480px] bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* HTML5 Video element */}
        <video
          ref={videoRef}
          className={`w-full h-full object-contain ${
            settings.flipHorizontal && !settings.demoMode ? '-scale-x-100' : ''
          }`}
          playsInline
          muted
          autoPlay
        />

        {/* Realtime Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-auto cursor-crosshair"
          onClick={(e) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
            const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

            const isMirrored = !!settings.flipHorizontal && !settings.demoMode;
            const clickXOnRaw = isMirrored ? canvas.width - clickX : clickX;

            // Check if click is inside any object bounding box
            const clickedObj = trackedObjects.find((obj) => {
              const { x, y, width, height } = obj.bbox;
              return clickXOnRaw >= x && clickXOnRaw <= x + width && clickY >= y && clickY <= y + height;
            });

            onSelectObject(clickedObj ? clickedObj.id : null);
          }}
        />

        {/* HUD Top Corner Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-20">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold backdrop-blur-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE AI STREAM</span>
            </span>

            {settings.demoMode && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold backdrop-blur-md">
                MODU SIMULASI DEMO
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700/60 text-slate-300 text-[10px] font-mono backdrop-blur-md">
              {systemState.fps} FPS
            </span>
          </div>
        </div>

        {/* Loading / Error States Overlay */}
        {!systemState.isCameraOnline && !settings.demoMode && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
            {systemState.cameraError ? (
              <div className="max-w-md bg-rose-950/40 border border-rose-500/40 p-6 rounded-2xl flex flex-col items-center gap-3">
                <AlertTriangle className="w-12 h-12 text-rose-400 animate-bounce" />
                <h3 className="text-lg font-bold text-rose-200">KAMERA TIDAK TERSEDIA</h3>
                <p className="text-xs text-rose-300/80">{systemState.cameraError}</p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <button
                    onClick={() => onStartCamera()}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-lg"
                  >
                    Coba Lagi Akses Kamera
                  </button>
                  <button
                    onClick={() => onToggleDemoMode()}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all"
                  >
                    Gunakan Mode Simulasi Demo
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-300">
                  Akses kamera diperlukan untuk analisis realtime
                </h3>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => onStartCamera()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
                    id="btn-start-camera-main"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>AKTIFKAN KAMERA</span>
                  </button>
                  <button
                    onClick={() => onToggleDemoMode()}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs transition-all flex items-center gap-2"
                    id="btn-demo-mode-main"
                  >
                    <Eye className="w-4 h-4" />
                    <span>UJI COBA SIMULASI DEMO</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Model Loading State Overlay */}
        {!systemState.modelLoaded && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-cyan-500/50 px-4 py-2 rounded-full text-cyan-300 text-xs font-mono flex items-center gap-2.5 shadow-xl z-30">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>MEMUAT MODEL AI VISION (COCO-SSD)...</span>
          </div>
        )}
      </div>

      {/* Embedded Controls Bar Below Video Stage */}
      <div className="bg-slate-900/95 border-t border-slate-800 p-3 md:p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Primary Camera Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {systemState.isCameraOnline ? (
            <button
              onClick={() => onStopCamera()}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all flex items-center gap-2"
              id="btn-stop-camera"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>STOP KAMERA</span>
            </button>
          ) : (
            <button
              onClick={() => onStartCamera()}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex items-center gap-2"
              id="btn-start-camera"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>START KAMERA</span>
            </button>
          )}

          <button
            onClick={() => onSwitchCamera()}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 text-xs font-medium transition-all flex items-center gap-1.5"
            title="Ganti Kamera Depan / Belakang"
            id="btn-switch-camera"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {settings.cameraFacingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}
            </span>
          </button>

          {onToggleFlipHorizontal && (
            <button
              onClick={onToggleFlipHorizontal}
              className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
                settings.flipHorizontal
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-800 border-slate-700/80 text-slate-300 hover:bg-slate-700'
              }`}
              title="Balik Layar Horizontal (Flip Mirror)"
              id="btn-toggle-flip"
            >
              <FlipHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Flip: {settings.flipHorizontal ? 'ON' : 'OFF'}</span>
            </button>
          )}

          <button
            onClick={() => onToggleDemoMode()}
            className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
              settings.demoMode
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-800 border-slate-700/80 text-slate-300 hover:bg-slate-700'
            }`}
            id="btn-toggle-demo"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>{settings.demoMode ? 'Keluar Simulasi' : 'Mode Simulasi'}</span>
          </button>
        </div>

        {/* Secondary Canvas Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 text-xs transition-all"
            title="Tampilan Layar Penuh"
            id="btn-fullscreen"
          >
            <Maximize2 className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
