import type { AppSettings } from './ipc'

export const APP_NAME = 'I-Track'

export const DEFAULT_SETTINGS: AppSettings = {
  trackingEnabled: true,
  mouseSmoothing: 0.65,
  minConfidence: 0.3,
  gazeVisualizerEnabled: true,
  debugModeEnabled: false,
  autoCalibrationPrompt: true,
  calibrationRecency: 7,
  screenIndex: 0,
  mouseSpeed: 1.0,
  gazeGainX: 3.0,
  gazeGainY: 2.3,
  offsetX: 0.0,
  offsetY: 0.0,
  baselineX: 0.5,
  baselineY: 0.55,
  headGainX: 0.6,
  headGainY: 1.6,
  invertX: true,
  invertY: false
}
