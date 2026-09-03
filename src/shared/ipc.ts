export type MouseButton = 'left' | 'right' | 'middle'

export interface ScreenSize {
  width: number
  height: number
}

export interface CalibrationPayload {
  h: number[][]
  createdAt: number
  accuracy: number
}

export interface AppSettings {
  trackingEnabled: boolean
  mouseSmoothing: number
  minConfidence: number
  gazeVisualizerEnabled: boolean
  debugModeEnabled: boolean
  autoCalibrationPrompt: boolean
  calibrationRecency: number
  screenIndex: number
}

export interface DesktopApi {
  moveMouse: (x: number, y: number) => Promise<void>
  click: (button: MouseButton) => Promise<void>
  doubleClick: () => Promise<void>
  mouseDown: (button: MouseButton) => Promise<void>
  mouseUp: (button: MouseButton) => Promise<void>
  getScreenSize: () => Promise<ScreenSize>
  getSetting: <T>(key: string) => Promise<T | null>
  setSetting: <T>(key: string, value: T) => Promise<void>
  resetSettings: () => Promise<void>
  saveCalibration: (data: CalibrationPayload) => Promise<void>
  loadCalibration: () => Promise<CalibrationPayload | null>
  deleteCalibration: () => Promise<void>
  getCalibrationAccuracy: () => Promise<number | null>
}
