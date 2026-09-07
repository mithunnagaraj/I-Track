export interface GazePoint {
  x: number
  y: number
  confidence: number
  timestamp: number
  rawX?: number
  rawY?: number
  yaw?: number
  pitch?: number
  eyeOpenness?: number
}

export interface GazeData {
  point: GazePoint | null
  fps: number
  isTracking: boolean
}

export interface GazeTracker {
  initialize(): Promise<void>
  startTracking(): Promise<void>
  stopTracking(): void
}
