export type ObjectCategory = 'MANUSIA' | 'HEWAN' | 'KENDARAAN' | 'BENDA' | 'OBJEK_LAINNYA';

export type MotionStatus = 'DIAM' | 'BERGERAK' | 'MEMASUKI_FRAME' | 'KELUAR_FRAME';

export type MotionDirection = 
  | 'BERGERAK KE KIRI'
  | 'BERGERAK KE KANAN'
  | 'BERGERAK KE ATAS'
  | 'BERGERAK KE BAWAH'
  | 'MENDEKATI KAMERA'
  | 'MENJAUHI KAMERA'
  | 'BERGERAK DIAGONAL'
  | 'DIAM'
  | 'ARAH TIDAK TERIDENTIFIKASI';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RawDetection {
  bbox: [number, number, number, number]; // [x, y, width, height]
  class: string;
  score: number;
}

export interface PointHistory {
  x: number;
  y: number;
  area: number;
  timestamp: number;
}

export interface TrackedObject {
  id: string; // e.g. "#001"
  rawClass: string;
  labelIndonesian: string;
  category: ObjectCategory;
  confidence: number; // 0 to 1
  bbox: BoundingBox;
  targetBbox: BoundingBox; // Smooth interpolation target
  center: { x: number; y: number };
  status: MotionStatus;
  direction: MotionDirection;
  speed: number; // relative px/sec
  areaChangeRatio: number;
  history: PointHistory[];
  firstSeen: number;
  lastSeen: number;
  hasBeenSpoken: boolean;
  lastSpokenTimestamp: number;
  lastSpokenDirection?: MotionDirection;
  color: string;
}

export type EventType = 
  | 'EVENT_01_OBJECT_ENTRY'
  | 'EVENT_02_MOTION_START'
  | 'EVENT_03_MOTION_STOP'
  | 'EVENT_04_DIRECTION_CHANGE'
  | 'EVENT_05_APPROACHING'
  | 'EVENT_06_RECEDING'
  | 'EVENT_07_OBJECT_EXIT'
  | 'EVENT_08_NEW_OBJECT'
  | 'EVENT_09_COUNT_CHANGE'
  | 'EVENT_10_CONFIDENCE_CHANGE';

export interface ActivityLogItem {
  id: string;
  timestamp: string; // e.g., "10:28:15"
  rawTimestamp: number;
  eventType: EventType;
  objectId: string;
  objectLabel: string;
  description: string;
  severity?: 'info' | 'warning' | 'alert';
}

export interface AppSettings {
  detectionSensitivity: 'Low' | 'Medium' | 'High';
  confidenceThreshold: number; // 0.3 to 0.95 (default 0.70)
  voiceEnabled: boolean;
  voiceLanguage: string; // default 'id-ID'
  voiceSpeed: number; // 0.8 to 1.2
  voicePitch: number; // 0.8 to 1.2
  voiceCooldownSec: number; // 3 to 15 seconds
  motionTrackingEnabled: boolean;
  showBoundingBox: boolean;
  showObjectPoint: boolean;
  showConfidence: boolean;
  showTrackingId: boolean;
  showMotionVectors: boolean;
  cameraFacingMode: 'user' | 'environment';
  flipHorizontal: boolean;
  demoMode: boolean;
}

export interface SystemState {
  isCameraOnline: boolean;
  isAiActive: boolean;
  isTrackingActive: boolean;
  isVoiceActive: boolean;
  fps: number;
  inferenceTimeMs: number;
  modelLoaded: boolean;
  modelError: string | null;
  cameraError: string | null;
  activeCount: number;
}
