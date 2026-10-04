import { useState, useEffect, useCallback, useRef } from 'react';

export interface DeviceTiltState {
  rotateX: number; // Pitch in degrees (-18 to +18)
  rotateY: number; // Roll in degrees (-18 to +18)
  glareX: number; // 0 to 100 percentage for specular light
  glareY: number; // 0 to 100 percentage for specular light
  hasSensorData: boolean;
  needsPermission: boolean;
  requestPermission: () => Promise<boolean>;
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  calibrate: () => void;
  // Simulated tilt for desktop testing
  isSimulating: boolean;
  setIsSimulating: (simulating: boolean) => void;
  setSimulatedTilt: (x: number, y: number) => void;
}

// Global shared state & listeners to avoid redundant window event handlers
let globalListenersInitialized = false;
let globalTiltTarget = { rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 };
let globalCurrentTilt = { rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 };
let globalHasSensorData = false;
let globalNeedsPermission = false;
let neutralBeta = 45; // Default resting hand holding angle in degrees
const subscribers = new Set<(state: { rotateX: number; rotateY: number; glareX: number; glareY: number; hasSensor: boolean }) => void>();

function notifySubscribers() {
  subscribers.forEach((sub) =>
    sub({
      rotateX: globalCurrentTilt.rotateX,
      rotateY: globalCurrentTilt.rotateY,
      glareX: globalCurrentTilt.glareX,
      glareY: globalCurrentTilt.glareY,
      hasSensor: globalHasSensorData,
    })
  );
}

// 60FPS physics lerp loop
let rafId: number | null = null;
function startTiltPhysicsLoop() {
  if (rafId !== null) return;

  const loop = () => {
    // Ultra-smooth exponential moving average (lerp) with damped inertia
    const factor = 0.055;
    const dx = globalTiltTarget.rotateX - globalCurrentTilt.rotateX;
    const dy = globalTiltTarget.rotateY - globalCurrentTilt.rotateY;
    const dgX = globalTiltTarget.glareX - globalCurrentTilt.glareX;
    const dgY = globalTiltTarget.glareY - globalCurrentTilt.glareY;

    if (
      Math.abs(dx) > 0.005 ||
      Math.abs(dy) > 0.005 ||
      Math.abs(dgX) > 0.02 ||
      Math.abs(dgY) > 0.02
    ) {
      globalCurrentTilt.rotateX += dx * factor;
      globalCurrentTilt.rotateY += dy * factor;
      globalCurrentTilt.glareX += dgX * factor;
      globalCurrentTilt.glareY += dgY * factor;
      notifySubscribers();
    }

    rafId = requestAnimationFrame(loop);
  };

  rafId = requestAnimationFrame(loop);
}

function handleDeviceOrientation(event: DeviceOrientationEvent) {
  if (event.beta === null && event.gamma === null) return;

  globalHasSensorData = true;

  const rawBeta = event.beta ?? 45; // -180 to 180 (front to back)
  const rawGamma = event.gamma ?? 0; // -90 to 90 (left to right)

  // Calibrate pitch relative to neutral holding angle (~45 deg)
  const deltaBeta = rawBeta - neutralBeta;
  const maxTilt = 7; // Gentle, restrained max tilt angle in degrees

  // Deadzone filter for subtle hand micro-tremors
  const effectiveDeltaBeta = Math.abs(deltaBeta) < 1.2 ? 0 : deltaBeta;
  const effectiveGamma = Math.abs(rawGamma) < 1.2 ? 0 : rawGamma;

  // Gentle, restrained sensitivity multiplier (0.18)
  const targetX = Math.max(-maxTilt, Math.min(maxTilt, -effectiveDeltaBeta * 0.18));
  const targetY = Math.max(-maxTilt, Math.min(maxTilt, effectiveGamma * 0.18));

  // Specular light position
  const targetGlareX = Math.max(0, Math.min(100, 50 + (targetY / maxTilt) * 45));
  const targetGlareY = Math.max(0, Math.min(100, 50 - (targetX / maxTilt) * 45));

  globalTiltTarget = {
    rotateX: targetX,
    rotateY: targetY,
    glareX: targetGlareX,
    glareY: targetGlareY,
  };
}

function initGlobalDeviceOrientation() {
  if (typeof window === 'undefined' || globalListenersInitialized) return;
  globalListenersInitialized = true;

  startTiltPhysicsLoop();

  // Check if iOS DeviceOrientation permission is required
  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
      .requestPermission === 'function'
  ) {
    globalNeedsPermission = true;
  } else {
    // Standard Android / Web listener
    window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
  }
}

export function useDeviceTilt(): DeviceTiltState {
  const [tilt, setTilt] = useState({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
    hasSensorData: globalHasSensorData,
  });

  const [isEnabled, setIsEnabled] = useState(true);
  const [needsPermission, setNeedsPermission] = useState(globalNeedsPermission);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    initGlobalDeviceOrientation();

    const handleUpdate = (data: {
      rotateX: number;
      rotateY: number;
      glareX: number;
      glareY: number;
      hasSensor: boolean;
    }) => {
      if (!isEnabled && !isSimulating) return;
      setTilt({
        rotateX: data.rotateX,
        rotateY: data.rotateY,
        glareX: data.glareX,
        glareY: data.glareY,
        hasSensorData: data.hasSensor,
      });
    };

    subscribers.add(handleUpdate);

    return () => {
      subscribers.delete(handleUpdate);
    };
  }, [isEnabled, isSimulating]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === 'function'
    ) {
      try {
        const response = await (
          DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }
        ).requestPermission();
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
          globalNeedsPermission = false;
          setNeedsPermission(false);
          globalHasSensorData = true;
          return true;
        }
      } catch (err) {
        console.warn('Device orientation permission denied:', err);
      }
    }
    return false;
  }, []);

  const calibrate = useCallback(() => {
    // Sets current orientation as zero
    globalTiltTarget = { rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 };
  }, []);

  const setSimulatedTilt = useCallback((x: number, y: number) => {
    const maxTilt = 7;
    const clampedX = Math.max(-maxTilt, Math.min(maxTilt, x));
    const clampedY = Math.max(-maxTilt, Math.min(maxTilt, y));
    globalTiltTarget = {
      rotateX: clampedX,
      rotateY: clampedY,
      glareX: 50 + (clampedY / maxTilt) * 45,
      glareY: 50 - (clampedX / maxTilt) * 45,
    };
    globalHasSensorData = true;
  }, []);

  return {
    rotateX: isEnabled ? tilt.rotateX : 0,
    rotateY: isEnabled ? tilt.rotateY : 0,
    glareX: isEnabled ? tilt.glareX : 50,
    glareY: isEnabled ? tilt.glareY : 50,
    hasSensorData: tilt.hasSensorData,
    needsPermission,
    requestPermission,
    isEnabled,
    setIsEnabled,
    calibrate,
    isSimulating,
    setIsSimulating,
    setSimulatedTilt,
  };
}
