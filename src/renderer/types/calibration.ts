export type CalibrationGridMode = '5-point' | '9-point'

export interface CalibrationPoint {
  screenX: number
  screenY: number
  gazeX: number
  gazeY: number
  timestamp: number
}

export interface CalibrationMatrix {
  h: number[][]
  createdAt: number
  accuracy: number
  gridMode?: CalibrationGridMode
}

export interface ScreenPoint {
  x: number
  y: number
}

export interface CalibrationProfile {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  gridMode: CalibrationGridMode
  matrix: CalibrationMatrix
  isDefault?: boolean
}

export interface VerificationTarget {
  id: number
  name: string
  targetX: number
  targetY: number
  measuredX: number
  measuredY: number
  errorDistance: number // 0-1 normalized distance
  errorPx?: number
}

export interface AccuracyTestResult {
  accuracyPercentage: number
  meanErrorDistance: number
  meanErrorPx?: number
  targets: VerificationTarget[]
  testedAt: number
  rating: 'excellent' | 'good' | 'fair' | 'poor'
}
