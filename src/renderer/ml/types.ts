export interface NormalizedLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

export interface FaceDetectionResult {
  landmarks: NormalizedLandmark[]
  confidence: number
}

export interface GazeEstimate {
  x: number
  y: number
  confidence: number
  rawX: number
  rawY: number
  yaw?: number
  pitch?: number
  eyeOpenness?: number
}
