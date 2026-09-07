export type MouseButton = 'left' | 'right' | 'middle'

export interface ScreenSize {
  width: number
  height: number
}

export interface CalibrationPayload {
  h: number[][]
  createdAt: number
  accuracy: number
  gridMode?: '5-point' | '9-point'
}

export interface CalibrationProfilePayload {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  gridMode: '5-point' | '9-point'
  matrix: CalibrationPayload
  isDefault?: boolean
}

export type TargetFps = 15 | 30 | 60

export interface AppSettings {
  trackingEnabled: boolean
  mouseSmoothing: number
  minConfidence: number
  gazeVisualizerEnabled: boolean
  debugModeEnabled: boolean
  autoCalibrationPrompt: boolean
  calibrationRecency: number
  screenIndex: number
  mouseSpeed: number
  gazeGainX: number
  gazeGainY: number
  offsetX: number
  offsetY: number
  baselineX: number
  baselineY: number
  headGainX: number
  headGainY: number
  invertX: boolean
  invertY: boolean
  // Phase 3 performance & profile settings
  targetFps: TargetFps
  gpuAcceleration: boolean
  calibrationMode: '5-point' | '9-point'
  activeProfileId: string
  autoCheckUpdates: boolean
}

export interface DisplayBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface DisplayInfo {
  id: number
  name: string
  bounds: DisplayBounds
  workArea: DisplayBounds
  scaleFactor: number
  isPrimary: boolean
}

export type UpdateState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export interface UpdateInfo {
  state: UpdateState
  version?: string
  releaseDate?: string
  releaseNotes?: string
  progress?: number // 0-100
  bytesPerSecond?: number
  totalBytes?: number
  transferredBytes?: number
  error?: string
}

export interface DesktopApi {
  moveMouse: (x: number, y: number, screenIndex?: number) => Promise<void>
  click: (button: MouseButton) => Promise<void>
  doubleClick: () => Promise<void>
  mouseDown: (button: MouseButton) => Promise<void>
  mouseUp: (button: MouseButton) => Promise<void>
  getScreenSize: (screenIndex?: number) => Promise<ScreenSize>
  getDisplays: () => Promise<DisplayInfo[]>
  getSetting: <T>(key: string) => Promise<T | null>
  setSetting: <T>(key: string, value: T) => Promise<void>
  loadSettings: () => Promise<AppSettings | null>
  saveSettings: (settings: AppSettings) => Promise<void>
  resetSettings: () => Promise<void>
  saveCalibration: (data: CalibrationPayload) => Promise<void>
  loadCalibration: () => Promise<CalibrationPayload | null>
  deleteCalibration: () => Promise<void>
  getCalibrationAccuracy: () => Promise<number | null>
  loadProfiles: () => Promise<CalibrationProfilePayload[] | null>
  saveProfiles: (profiles: CalibrationProfilePayload[]) => Promise<void>
  checkAccessibility: () => Promise<boolean>
  requestAccessibility: () => Promise<boolean>
  // Updater API
  checkForUpdates: () => Promise<UpdateInfo>
  downloadUpdate: () => Promise<void>
  quitAndInstallUpdate: () => Promise<void>
  getUpdateStatus: () => Promise<UpdateInfo>
  onUpdateStatusChanged: (callback: (info: UpdateInfo) => void) => () => void
  getAppVersion: () => Promise<string>
}
