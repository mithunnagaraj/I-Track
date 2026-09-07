import type { NormalizedLandmark } from './types'
import type { GazeEstimate } from './types'
import { GAZE_GAIN_X, GAZE_GAIN_Y } from '../constants/gazeTrackingConstants'

interface Point {
  x: number
  y: number
}

export interface GazeEstimatorOptions {
  gainX?: number
  gainY?: number
  headGainX?: number
  headGainY?: number
  invertX?: boolean
  invertY?: boolean
  baselineX?: number
  baselineY?: number
  baselineYaw?: number
  baselinePitch?: number
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))
const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y)

/**
 * Hybrid Eye Gaze + Head Pose Estimator.
 * Combines iris position within eye canthi with 3D facial orientation (yaw and pitch).
 * Allows users to control cursor through eye gaze, subtle head tilting/turning, or both.
 */
export const estimateGaze = (
  landmarks: NormalizedLandmark[],
  options?: GazeEstimatorOptions
): GazeEstimate | null => {
  if (landmarks.length < 474) return null

  // Fixed Facial Landmarks for Head Pose:
  const noseTip = landmarks[1]
  const forehead = landmarks[10]
  const chin = landmarks[152]
  const leftTragus = landmarks[234] // camera left cheek / ear
  const rightTragus = landmarks[454] // camera right cheek / ear

  // Camera-Left Eye (Subject's right eye):
  const leftOuter = landmarks[33] // lateral canthus (temple, smaller camera X)
  const leftInner = landmarks[133] // medial canthus (nose, larger camera X)
  const leftIris = landmarks[468] // iris center
  const leftTop = landmarks[159] // upper eyelid
  const leftBottom = landmarks[145] // lower eyelid

  // Camera-Right Eye (Subject's left eye):
  const rightOuter = landmarks[263] // lateral canthus (temple, larger camera X)
  const rightInner = landmarks[362] // medial canthus (nose, smaller camera X)
  const rightIris = landmarks[473] // iris center
  const rightTop = landmarks[386] // upper eyelid
  const rightBottom = landmarks[374] // lower eyelid

  if (
    !noseTip || !forehead || !chin || !leftTragus || !rightTragus ||
    !leftOuter || !leftInner || !leftIris || !leftTop || !leftBottom ||
    !rightOuter || !rightInner || !rightIris || !rightTop || !rightBottom
  ) {
    return null
  }

  // 1. Eye openness ratio for blink detection
  const leftCanthiDist = Math.max(0.001, distance(leftOuter, leftInner))
  const rightCanthiDist = Math.max(0.001, distance(rightOuter, rightInner))
  const leftOpen = distance(leftTop, leftBottom) / leftCanthiDist
  const rightOpen = distance(rightTop, rightBottom) / rightCanthiDist
  const avgOpen = (leftOpen + rightOpen) / 2

  if (avgOpen < 0.08) return null

  // 2. Iris in Eye Socket (Eye Gaze)
  // Left eye (camera left): Looking right moves iris toward temple (leftOuter, smaller camera X)
  const leftWidth = Math.max(0.001, Math.abs(leftInner.x - leftOuter.x))
  const leftHeight = Math.max(0.001, Math.abs(leftBottom.y - leftTop.y))
  const leftGazeX = clamp01((leftInner.x - leftIris.x) / leftWidth)
  const leftGazeY = clamp01((leftIris.y - leftTop.y) / leftHeight)

  // Right eye (camera right): Looking right moves iris toward nose (rightInner, smaller camera X)
  const rightWidth = Math.max(0.001, Math.abs(rightOuter.x - rightInner.x))
  const rightHeight = Math.max(0.001, Math.abs(rightBottom.y - rightTop.y))
  const rightGazeX = clamp01((rightOuter.x - rightIris.x) / rightWidth)
  const rightGazeY = clamp01((rightIris.y - rightTop.y) / rightHeight)

  const eyeRawX = (leftGazeX + rightGazeX) / 2
  const eyeRawY = (leftGazeY + rightGazeY) / 2

  // 3. Head Pose Orientation (Yaw & Pitch)
  const faceCenterX = (leftTragus.x + rightTragus.x) / 2
  const faceWidth = Math.max(0.05, Math.abs(rightTragus.x - leftTragus.x))
  // Turning face right moves nose to camera left (smaller X), so faceCenterX - noseTip.x is positive
  const rawYaw = (faceCenterX - noseTip.x) / (faceWidth * 0.22)

  const faceCenterY = (forehead.y + chin.y) / 2
  const faceHeight = Math.max(0.05, Math.abs(chin.y - forehead.y))
  // Tilting face up moves nose up (smaller Y), so noseTip.y - neutral is negative
  const neutralNoseY = faceCenterY - 0.04 * faceHeight
  const rawPitch = (noseTip.y - neutralNoseY) / (faceHeight * 0.18)

  // 4. Fusion of Eye Iris & Head Pose
  const baselineX = options?.baselineX ?? 0.5
  const baselineY = options?.baselineY ?? 0.55
  const baselineYaw = options?.baselineYaw ?? 0.0
  const baselinePitch = options?.baselinePitch ?? 0.0

  const gainX = options?.gainX ?? GAZE_GAIN_X
  const gainY = options?.gainY ?? GAZE_GAIN_Y
  const headGainX = options?.headGainX ?? 1.3
  const headGainY = options?.headGainY ?? 1.3

  // Symmetrical deltas branching out from baseline
  const eyeDeltaX = (eyeRawX - baselineX) * gainX
  const eyeDeltaY = (eyeRawY - baselineY) * gainY
  const headDeltaX = (rawYaw - baselineYaw) * headGainX
  const headDeltaY = (rawPitch - baselinePitch) * headGainY

  let combinedDeltaX = eyeDeltaX + headDeltaX
  let combinedDeltaY = eyeDeltaY + headDeltaY

  // Optional axis flip toggles
  if (options?.invertX !== undefined && !options.invertX) {
    combinedDeltaX = -combinedDeltaX
  }
  if (options?.invertY) {
    combinedDeltaY = -combinedDeltaY
  }

  const x = clamp01(0.5 + combinedDeltaX)
  const y = clamp01(0.5 + combinedDeltaY)

  // Confidence estimation based on face detection and eye visibility
  const agreement = 1 - Math.min(1, Math.hypot(leftGazeX - rightGazeX, leftGazeY - rightGazeY) * 1.5)
  const openConf = Math.min(1, Math.max(0.2, (avgOpen - 0.08) / 0.16))
  const confidence = clamp01(0.6 * openConf + 0.4 * clamp01(agreement))

  // Preserve the uncalibrated iris signal for centering and calibration.  The
  // previous fused-and-clamped value was always centered near 0.5, which made
  // a saved baseline incorrect and could collapse horizontal calibration data.
  const rawX = eyeRawX
  const rawY = eyeRawY

  return {
    x,
    y,
    rawX,
    rawY,
    confidence
  }
}
