import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

import {
  TrackedObject,
  ActivityLogItem,
  AppSettings,
  SystemState,
  RawDetection
} from './types';
import { TrackingEngine } from './utils/tracking';
import { voiceService } from './utils/voice';
import { DemoGenerator } from './utils/demoGenerator';

import { Header } from './components/Header';
import { CameraFeed } from './components/CameraFeed';
import { ObjectMonitor } from './components/ObjectMonitor';
import { ActivityLog } from './components/ActivityLog';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { SettingsModal } from './components/SettingsModal';

const DEFAULT_SETTINGS: AppSettings = {
  detectionSensitivity: 'Medium',
  confidenceThreshold: 0.70,
  voiceEnabled: true,
  voiceLanguage: 'id-ID',
  voiceSpeed: 1.0,
  voicePitch: 1.0,
  voiceCooldownSec: 5,
  motionTrackingEnabled: true,
  showBoundingBox: true,
  showObjectPoint: true,
  showConfidence: true,
  showTrackingId: true,
  showMotionVectors: true,
  cameraFacingMode: 'environment', // Kamera belakang (environment) secara default untuk Android / Mobile
  flipHorizontal: false, // Default false, tapi bisa di-flip untuk kamera belakang maupun depan
  demoMode: false
};

export default function App() {
  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('ai_motion_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        console.warn('Failed parsing settings:', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  // System & Model State
  const [systemState, setSystemState] = useState<SystemState>({
    isCameraOnline: false,
    isAiActive: true,
    isTrackingActive: true,
    isVoiceActive: true,
    fps: 0,
    inferenceTimeMs: 0,
    modelLoaded: false,
    modelError: null,
    cameraError: null,
    activeCount: 0
  });

  // Tracked Objects & Logs
  const [trackedObjects, setTrackedObjects] = useState<TrackedObject[]>([]);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const trackingEngineRef = useRef<TrackingEngine>(new TrackingEngine());
  const demoGeneratorRef = useRef<DemoGenerator>(new DemoGenerator());

  const animationFrameIdRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const frameCounterRef = useRef<number>(0);
  const lastFpsCalcRef = useRef<number>(performance.now());
  const isProcessingFrameRef = useRef<boolean>(false);

  // Save Settings
  const handleUpdateSettings = (newPartial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated: AppSettings = {
        detectionSensitivity: newPartial.detectionSensitivity ?? prev.detectionSensitivity,
        confidenceThreshold: typeof newPartial.confidenceThreshold === 'number' ? newPartial.confidenceThreshold : prev.confidenceThreshold,
        voiceEnabled: typeof newPartial.voiceEnabled === 'boolean' ? newPartial.voiceEnabled : prev.voiceEnabled,
        voiceLanguage: newPartial.voiceLanguage ?? prev.voiceLanguage,
        voiceSpeed: typeof newPartial.voiceSpeed === 'number' ? newPartial.voiceSpeed : prev.voiceSpeed,
        voicePitch: typeof newPartial.voicePitch === 'number' ? newPartial.voicePitch : prev.voicePitch,
        voiceCooldownSec: typeof newPartial.voiceCooldownSec === 'number' ? newPartial.voiceCooldownSec : prev.voiceCooldownSec,
        motionTrackingEnabled: typeof newPartial.motionTrackingEnabled === 'boolean' ? newPartial.motionTrackingEnabled : prev.motionTrackingEnabled,
        showBoundingBox: typeof newPartial.showBoundingBox === 'boolean' ? newPartial.showBoundingBox : prev.showBoundingBox,
        showObjectPoint: typeof newPartial.showObjectPoint === 'boolean' ? newPartial.showObjectPoint : prev.showObjectPoint,
        showConfidence: typeof newPartial.showConfidence === 'boolean' ? newPartial.showConfidence : prev.showConfidence,
        showTrackingId: typeof newPartial.showTrackingId === 'boolean' ? newPartial.showTrackingId : prev.showTrackingId,
        showMotionVectors: typeof newPartial.showMotionVectors === 'boolean' ? newPartial.showMotionVectors : prev.showMotionVectors,
        cameraFacingMode: (newPartial.cameraFacingMode === 'user' || newPartial.cameraFacingMode === 'environment') ? newPartial.cameraFacingMode : prev.cameraFacingMode,
        flipHorizontal: typeof newPartial.flipHorizontal === 'boolean' ? newPartial.flipHorizontal : (newPartial.cameraFacingMode ? newPartial.cameraFacingMode === 'user' : prev.flipHorizontal),
        demoMode: typeof newPartial.demoMode === 'boolean' ? newPartial.demoMode : prev.demoMode
      };
      try {
        localStorage.setItem('ai_motion_settings', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed saving settings:', e instanceof Error ? e.message : String(e));
      }
      return updated;
    });
  };

  // Load TensorFlow COCO-SSD Model
  useEffect(() => {
    let isMounted = true;
    async function initTF() {
      try {
        await tf.ready();
        // Try WebGL backend first
        await tf.setBackend('webgl').catch(() => tf.setBackend('cpu'));

        const model = await cocoSsd.load({
          base: 'lite_mobilenet_v2' // Fast lightweight model for browser
        });

        if (isMounted) {
          modelRef.current = model;
          setSystemState((prev) => ({ ...prev, modelLoaded: true, modelError: null }));
        }
      } catch (err: any) {
        console.error('Failed to load COCO-SSD model:', err);
        if (isMounted) {
          setSystemState((prev) => ({
            ...prev,
            modelLoaded: false,
            modelError: err?.message || 'Gagal memuat model AI'
          }));
        }
      }
    }
    initTF();

    return () => {
      isMounted = false;
    };
  }, []);

  // Stop Camera Helper
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setSystemState((prev) => ({ ...prev, isCameraOnline: false }));
  }, []);

  // Start Camera Helper
  const startCamera = useCallback(async (facingOverride?: 'user' | 'environment') => {
    stopCamera();
    setSystemState((prev) => ({ ...prev, cameraError: null }));

    const targetFacing: 'user' | 'environment' =
      typeof facingOverride === 'string' && (facingOverride === 'user' || facingOverride === 'environment')
        ? facingOverride
        : settings.cameraFacingMode;

    // Disable demo mode when physical camera starts
    handleUpdateSettings({ demoMode: false, cameraFacingMode: targetFacing });

    try {
      let videoConstraints: MediaTrackConstraints = {
        facingMode: { ideal: targetFacing },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      };

      // Query devices to prioritize exact rear camera on Android mobile devices
      if (targetFacing === 'environment' && navigator.mediaDevices?.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          const rearDevice = videoInputs.find((d) =>
            /back|rear|environment|belakang|main|0/i.test(d.label)
          );

          if (rearDevice && rearDevice.deviceId) {
            videoConstraints = {
              deviceId: { exact: rearDevice.deviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            };
          }
        } catch (enumErr) {
          console.warn('Could not enumerate video devices:', enumErr);
        }
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false
        });
      } catch (firstTryErr) {
        // Fallback to basic facingMode constraint
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: targetFacing },
          audio: false
        });
      }

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setSystemState((prev) => ({ ...prev, isCameraOnline: true, cameraError: null }));
    } catch (err: any) {
      console.warn('Camera access error:', err);
      let msg = 'Izin kamera ditolak atau kamera tidak tersedia di perangkat ini.';
      if (err.name === 'NotAllowedError') msg = 'IZIN KAMERA DITOLAK. Silakan berikan izin akses kamera pada browser.';
      else if (err.name === 'NotFoundError') msg = 'KAMERA TIDAK DITEMUKAN pada perangkat ini.';

      setSystemState((prev) => ({
        ...prev,
        isCameraOnline: false,
        cameraError: msg
      }));
    }
  }, [settings.cameraFacingMode, stopCamera]);

  // Switch Camera Facing Mode
  const switchCamera = () => {
    const nextFacing = settings.cameraFacingMode === 'user' ? 'environment' : 'user';
    const nextFlip = nextFacing === 'user';
    handleUpdateSettings({ cameraFacingMode: nextFacing, flipHorizontal: nextFlip });
    startCamera(nextFacing);
  };

  // Toggle Demo Mode
  const toggleDemoMode = () => {
    if (!settings.demoMode) {
      stopCamera();
      handleUpdateSettings({ demoMode: true });
      setSystemState((prev) => ({ ...prev, isCameraOnline: true, cameraError: null }));
    } else {
      handleUpdateSettings({ demoMode: false });
      setSystemState((prev) => ({ ...prev, isCameraOnline: false }));
    }
  };

  // Main Frame Loop
  useEffect(() => {
    let frameId: number;

    const processLoop = async () => {
      const now = performance.now();

      // Measure FPS
      frameCounterRef.current++;
      if (now - lastFpsCalcRef.current >= 1000) {
        const currentFps = Math.round((frameCounterRef.current * 1000) / (now - lastFpsCalcRef.current));
        setSystemState((prev) => ({ ...prev, fps: currentFps }));
        frameCounterRef.current = 0;
        lastFpsCalcRef.current = now;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      let rawDetections: RawDetection[] = [];
      let frameW = 640;
      let frameH = 480;

      if (settings.demoMode && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          frameW = canvas.width || 640;
          frameH = canvas.height || 480;
          rawDetections = demoGeneratorRef.current.drawDemoCanvas(ctx, frameW, frameH);
        }
      } else if (
        systemState.isCameraOnline &&
        video &&
        video.readyState === 4 &&
        modelRef.current &&
        !isProcessingFrameRef.current
      ) {
        frameW = video.videoWidth || 640;
        frameH = video.videoHeight || 480;

        // Perform AI Detection at adaptive intervals (e.g. every 2-3 frames for optimal performance)
        if (frameCounterRef.current % 2 === 0) {
          isProcessingFrameRef.current = true;
          const startTime = performance.now();

          try {
            const predictions = await modelRef.current.detect(video, 10, settings.confidenceThreshold);
            const endTime = performance.now();

            setSystemState((prev) => ({
              ...prev,
              inferenceTimeMs: Math.round(endTime - startTime)
            }));

            rawDetections = predictions.map((p) => ({
              bbox: p.bbox,
              class: p.class,
              score: p.score
            }));
          } catch (err) {
            console.error('Prediction loop error:', err);
          } finally {
            isProcessingFrameRef.current = false;
          }
        }
      }

      // Update Tracking Engine
      if (systemState.isAiActive) {
        const { updatedObjects, events } = trackingEngineRef.current.update(
          rawDetections,
          frameW,
          frameH,
          settings
        );

        setTrackedObjects(updatedObjects);
        setSystemState((prev) => ({ ...prev, activeCount: updatedObjects.length }));

        // Handle Event Notifications & Voice AI
        if (events.length > 0) {
          setLogs((prev) => [...events.reverse(), ...prev].slice(0, 100));

          // Speak important events
          events.forEach((evt) => {
            if (settings.voiceEnabled) {
              const isPriority = evt.eventType === 'EVENT_01_OBJECT_ENTRY' || evt.eventType === 'EVENT_05_APPROACHING';
              voiceService.speakEvent(evt.description, settings, isPriority);
            }
          });
        }
      }

      frameId = requestAnimationFrame(processLoop);
    };

    frameId = requestAnimationFrame(processLoop);
    animationFrameIdRef.current = frameId;

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [systemState.isCameraOnline, systemState.isAiActive, settings]);

  // Clear Logs
  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 flex flex-col">
      {/* Header Bar */}
      <Header
        systemState={systemState}
        voiceEnabled={settings.voiceEnabled}
        onToggleVoice={() => handleUpdateSettings({ voiceEnabled: !settings.voiceEnabled })}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Top Grid: Camera Stage (Main) + Object Monitor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-start">
          {/* Camera Stage Container (8 Columns on Desktop) */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            <CameraFeed
              videoRef={videoRef}
              canvasRef={canvasRef}
              trackedObjects={trackedObjects}
              settings={settings}
              systemState={systemState}
              onStartCamera={startCamera}
              onStopCamera={stopCamera}
              onSwitchCamera={switchCamera}
              onToggleFlipHorizontal={() => handleUpdateSettings({ flipHorizontal: !settings.flipHorizontal })}
              onToggleDemoMode={toggleDemoMode}
              selectedObjectId={selectedObjectId}
              onSelectObject={setSelectedObjectId}
            />
          </div>

          {/* Object Monitor Side Panel (4 Columns on Desktop) */}
          <div className="lg:col-span-4 h-full min-h-[380px]">
            <ObjectMonitor
              trackedObjects={trackedObjects}
              selectedObjectId={selectedObjectId}
              onSelectObject={setSelectedObjectId}
            />
          </div>
        </div>

        {/* Bottom Grid: Activity Log + Analytics & Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-start">
          {/* Activity Log (7 Columns) */}
          <div className="lg:col-span-7 h-full min-h-[320px]">
            <ActivityLog logs={logs} onClearLogs={handleClearLogs} />
          </div>

          {/* Analytics & AI Performance (5 Columns) */}
          <div className="lg:col-span-5 h-full">
            <AnalyticsPanel trackedObjects={trackedObjects} systemState={systemState} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
          <span>AI MOTION OBJECT SENSOR SYSTEM — REALTIME BROWSER MONITORING</span>
        </div>
        <div>Pemrosesan Lokal Client-Side • Tanpa Pengiriman Video Server</div>
      </footer>

      {/* Settings Drawer / Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
