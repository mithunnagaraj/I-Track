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
}

export interface ScreenPoint {
  x: number
  y: number
}
