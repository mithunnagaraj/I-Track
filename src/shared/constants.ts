import type { AppSettings } from './ipc'

export const APP_NAME = 'I-Track'

export const DEFAULT_SETTINGS: AppSettings = {
  trackingEnabled: true,
  mouseSmoothing: 0.35,
  minConfidence: 0.45,
  gazeVisualizerEnabled: true,
  debugModeEnabled: false,
  autoCalibrationPrompt: true,
  calibrationRecency: 7,
  screenIndex: 0
}
