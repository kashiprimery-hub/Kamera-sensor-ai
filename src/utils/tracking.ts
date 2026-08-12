import {
  RawDetection,
  TrackedObject,
  ActivityLogItem,
  AppSettings,
  MotionDirection,
  MotionStatus,
  BoundingBox,
  PointHistory
} from '../types';
import { translateClassName, CATEGORY_COLORS } from './translations';

export class TrackingEngine {
  private nextIdNumber: number = 1;
  private trackedObjects: Map<string, TrackedObject> = new Map();
  private maxHistoryLen: number = 15;
  private missingFrameTolerance: number = 10; // Frames before removing object
  private objectMissingFrames: Map<string, number> = new Map();

  // Color generator for bounding boxes
  private getCategoryColor(category: string): string {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]?.stroke || '#06b6d4';
  }

  // Calculate Center Distance
  private calculateDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  // Calculate IoU (Intersection over Union)
  private calculateIoU(boxA: BoundingBox, boxB: BoundingBox): number {
    const xA = Math.max(boxA.x, boxB.x);
    const yA = Math.max(boxA.y, boxB.y);
    const xB = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
    const yB = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    const boxAArea = boxA.width * boxA.height;
    const boxBArea = boxB.width * boxB.height;

    return interArea / (boxAArea + boxBArea - interArea + 1e-6);
  }

  public update(
    rawDetections: RawDetection[],
    frameWidth: number,
    frameHeight: number,
    settings: AppSettings
  ): { updatedObjects: TrackedObject[]; events: ActivityLogItem[] } {
    const now = Date.now();
    const events: ActivityLogItem[] = [];

    // Filter detections by confidence threshold
    const validDetections = rawDetections.filter(
      (d) => d.score >= settings.confidenceThreshold
    );

    const updatedMatchedIds = new Set<string>();

    // Greedy matching for each raw detection
    for (const raw of validDetections) {
      const [x, y, width, height] = raw.bbox;
      const detBox: BoundingBox = { x, y, width, height };
      const detCenter = { x: x + width / 2, y: y + height / 2 };
      const info = translateClassName(raw.class);

      let bestMatchId: string | null = null;
      let bestMatchScore = -1;

      // Search among existing tracked objects
      for (const [id, obj] of this.trackedObjects.entries()) {
        if (updatedMatchedIds.has(id)) continue;

        const iou = this.calculateIoU(detBox, obj.targetBbox);
        const centerDist = this.calculateDistance(detCenter, obj.center);
        const maxDistThreshold = Math.max(frameWidth, frameHeight) * 0.25;

        // Class similarity bonus
        const isSameClass = obj.rawClass.toLowerCase() === raw.class.toLowerCase();

        if (iou > 0.15 || (centerDist < maxDistThreshold && isSameClass)) {
          // Combined similarity metric
          const matchScore = iou * 0.7 + (isSameClass ? 0.3 : 0.0) + (1 - centerDist / maxDistThreshold) * 0.2;
          if (matchScore > bestMatchScore) {
            bestMatchScore = matchScore;
            bestMatchId = id;
          }
        }
      }

      if (bestMatchId && this.trackedObjects.has(bestMatchId)) {
        // MATCH FOUND: Update existing object
        updatedMatchedIds.add(bestMatchId);
        this.objectMissingFrames.set(bestMatchId, 0);

        const obj = this.trackedObjects.get(bestMatchId)!;
        const prevStatus = obj.status;
        const prevDirection = obj.direction;

        // Smooth target box interpolation
        obj.targetBbox = detBox;

        // Update confidence
        if (Math.abs(obj.confidence - raw.score) > 0.15) {
          events.push({
            id: `evt-conf-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toLocaleTimeString('id-ID'),
            rawTimestamp: now,
            eventType: 'EVENT_10_CONFIDENCE_CHANGE',
            objectId: obj.id,
            objectLabel: obj.labelIndonesian,
            description: `Tingkat keyakinan ${obj.labelIndonesian} ${obj.id} berubah menjadi ${Math.round(raw.score * 100)}%`
          });
        }
        obj.confidence = raw.score;
        obj.lastSeen = now;

        // Interpolate position smoothly
        const alpha = 0.35; // Smoothing factor
        obj.bbox.x = obj.bbox.x + alpha * (detBox.x - obj.bbox.x);
        obj.bbox.y = obj.bbox.y + alpha * (detBox.y - obj.bbox.y);
        obj.bbox.width = obj.bbox.width + alpha * (detBox.width - obj.bbox.width);
        obj.bbox.height = obj.bbox.height + alpha * (detBox.height - obj.bbox.height);

        obj.center = {
          x: obj.bbox.x + obj.bbox.width / 2,
          y: obj.bbox.y + obj.bbox.height / 2
        };

        // Record history
        const area = obj.bbox.width * obj.bbox.height;
        obj.history.push({ x: obj.center.x, y: obj.center.y, area, timestamp: now });
        if (obj.history.length > this.maxHistoryLen) {
          obj.history.shift();
        }

        // Analyze Motion & Direction
        const isMirrored = settings.cameraFacingMode === 'user' && !settings.demoMode;
        const motionAnalysis = this.analyzeMotion(obj.history, frameWidth, frameHeight, isMirrored);
        obj.status = motionAnalysis.status;
        obj.direction = motionAnalysis.direction;
        obj.speed = motionAnalysis.speed;
        obj.areaChangeRatio = motionAnalysis.areaChangeRatio;

        // Check motion state changes for Events
        if (prevStatus === 'DIAM' && obj.status === 'BERGERAK') {
          events.push({
            id: `evt-mov-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toLocaleTimeString('id-ID'),
            rawTimestamp: now,
            eventType: 'EVENT_02_MOTION_START',
            objectId: obj.id,
            objectLabel: obj.labelIndonesian,
            description: `${obj.labelIndonesian} ${obj.id} mulai bergerak (${obj.direction})`
          });
        } else if (prevStatus === 'BERGERAK' && obj.status === 'DIAM') {
          events.push({
            id: `evt-stop-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toLocaleTimeString('id-ID'),
            rawTimestamp: now,
            eventType: 'EVENT_03_MOTION_STOP',
            objectId: obj.id,
            objectLabel: obj.labelIndonesian,
            description: `${obj.labelIndonesian} ${obj.id} berhenti bergerak`
          });
        }

        // Direction change event
        if (
          obj.status === 'BERGERAK' &&
          prevDirection !== obj.direction &&
          obj.direction !== 'DIAM' &&
          obj.direction !== 'ARAH TIDAK TERIDENTIFIKASI'
        ) {
          let eventType: ActivityLogItem['eventType'] = 'EVENT_04_DIRECTION_CHANGE';
          if (obj.direction === 'MENDEKATI KAMERA') eventType = 'EVENT_05_APPROACHING';
          else if (obj.direction === 'MENJAUHI KAMERA') eventType = 'EVENT_06_RECEDING';

          events.push({
            id: `evt-dir-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toLocaleTimeString('id-ID'),
            rawTimestamp: now,
            eventType,
            objectId: obj.id,
            objectLabel: obj.labelIndonesian,
            description: `${obj.labelIndonesian} ${obj.id} ${obj.direction.toLowerCase()}`
          });
        }

      } else {
        // NEW OBJECT DETECTED
        const idNumStr = String(this.nextIdNumber++).padStart(3, '0');
        const newId = `${idNumStr}`;
        const color = this.getCategoryColor(info.category);

        const newObj: TrackedObject = {
          id: newId,
          rawClass: raw.class,
          labelIndonesian: info.indonesian,
          category: info.category,
          confidence: raw.score,
          bbox: { ...detBox },
          targetBbox: { ...detBox },
          center: detCenter,
          status: 'MEMASUKI_FRAME',
          direction: 'DIAM',
          speed: 0,
          areaChangeRatio: 0,
          history: [{ x: detCenter.x, y: detCenter.y, area: detBox.width * detBox.height, timestamp: now }],
          firstSeen: now,
          lastSeen: now,
          hasBeenSpoken: false,
          lastSpokenTimestamp: 0,
          color
        };

        this.trackedObjects.set(newId, newObj);
        this.objectMissingFrames.set(newId, 0);
        updatedMatchedIds.add(newId);

        events.push({
          id: `evt-entry-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toLocaleTimeString('id-ID'),
          rawTimestamp: now,
          eventType: 'EVENT_01_OBJECT_ENTRY',
          objectId: newId,
          objectLabel: info.indonesian,
          description: `${info.indonesian} ${newId} terdeteksi masuk ke area kamera (${Math.round(raw.score * 100)}%)`,
          severity: 'info'
        });
      }
    }

    // Handle missing objects (objects not matched in current frame)
    for (const [id, obj] of this.trackedObjects.entries()) {
      if (!updatedMatchedIds.has(id)) {
        const missingCount = (this.objectMissingFrames.get(id) || 0) + 1;
        this.objectMissingFrames.set(id, missingCount);

        if (missingCount > this.missingFrameTolerance) {
          // Object exited
          events.push({
            id: `evt-exit-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toLocaleTimeString('id-ID'),
            rawTimestamp: now,
            eventType: 'EVENT_07_OBJECT_EXIT',
            objectId: id,
            objectLabel: obj.labelIndonesian,
            description: `${obj.labelIndonesian} ${id} telah keluar dari area kamera`
          });

          this.trackedObjects.delete(id);
          this.objectMissingFrames.delete(id);
        }
      }
    }

    const currentTrackedList = Array.from(this.trackedObjects.values());
    return { updatedObjects: currentTrackedList, events };
  }

  private analyzeMotion(
    history: PointHistory[],
    frameW: number,
    frameH: number,
    isMirrored: boolean = false
  ): { status: MotionStatus; direction: MotionDirection; speed: number; areaChangeRatio: number } {
    if (history.length < 3) {
      return { status: 'DIAM', direction: 'DIAM', speed: 0, areaChangeRatio: 0 };
    }

    const first = history[0];
    const last = history[history.length - 1];
    const dt = (last.timestamp - first.timestamp) / 1000 || 0.1;

    let dx = last.x - first.x;
    if (isMirrored) {
      dx = -dx; // Reverse horizontal delta when screen is mirrored
    }
    const dy = last.y - first.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Relative speed (normalized by frame diagonal)
    const diag = Math.sqrt(frameW * frameW + frameH * frameH) || 1000;
    const normDist = dist / diag;
    const speed = normDist / dt; // normalized fraction / sec

    // Area change ratio (depth movement)
    const areaChangeRatio = (last.area - first.area) / (first.area || 1);

    const minMoveThresh = 0.015; // 1.5% of frame diagonal
    let status: MotionStatus = 'DIAM';
    let direction: MotionDirection = 'DIAM';

    if (normDist > minMoveThresh) {
      status = 'BERGERAK';

      // Check depth / approaching / receding first
      if (areaChangeRatio > 0.28) {
        direction = 'MENDEKATI KAMERA';
      } else if (areaChangeRatio < -0.28) {
        direction = 'MENJAUHI KAMERA';
      } else {
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (absX > absY * 1.6) {
          direction = dx > 0 ? 'BERGERAK KE KANAN' : 'BERGERAK KE KIRI';
        } else if (absY > absX * 1.6) {
          direction = dy > 0 ? 'BERGERAK KE BAWAH' : 'BERGERAK KE ATAS';
        } else if (absX > minMoveThresh * diag * 0.5 && absY > minMoveThresh * diag * 0.5) {
          direction = 'BERGERAK DIAGONAL';
        } else {
          direction = 'ARAH TIDAK TERIDENTIFIKASI';
        }
      }
    }

    return { status, direction, speed, areaChangeRatio };
  }

  public reset(): void {
    this.nextIdNumber = 1;
    this.trackedObjects.clear();
    this.objectMissingFrames.clear();
  }
}
