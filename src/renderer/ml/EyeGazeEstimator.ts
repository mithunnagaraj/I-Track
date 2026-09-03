import type { NormalizedLandmark } from './types'
import type { GazeEstimate } from './types'

interface Point {
  x: number
  y: number
}

const LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173]
const RIGHT_EYE_INDICES = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398]
const LEFT_IRIS_INDEX = 468
const RIGHT_IRIS_INDEX = 473
const LEFT_EYE_TOP_INDEX = 159
const LEFT_EYE_BOTTOM_INDEX = 145
const LEFT_EYE_LEFT_CORNER = 33
const LEFT_EYE_RIGHT_CORNER = 133
const RIGHT_EYE_TOP_INDEX = 386
const RIGHT_EYE_BOTTOM_INDEX = 374
const RIGHT_EYE_LEFT_CORNER = 362
const RIGHT_EYE_RIGHT_CORNER = 263

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))
const recenterAndAmplify = (value: number, gain: number): number => clamp01(0.5 + (value - 0.5) * gain)

const averagePoint = (points: Point[]): Point => {
  const sum = points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 }
  )
  return { x: sum.x / points.length, y: sum.y / points.length }
}

const eyeBounds = (landmarks: NormalizedLandmark[], indices: number[]) => {
  const points = indices
    .map((index) => landmarks[index])
    .filter((point): point is NormalizedLandmark => point !== undefined)
  if (points.length < 4) return null

  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxY = Math.max(...points.map((point) => point.y))
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY }
}

const normalizedIrisInEye = (iris: Point, bounds: ReturnType<typeof eyeBounds>) => {
  if (!bounds || bounds.width <= 0.0001 || bounds.height <= 0.0001) return null
  return {
    x: clamp01((iris.x - bounds.minX) / bounds.width),
    y: clamp01((iris.y - bounds.minY) / bounds.height)
  }
}

const eyeVisibilityScore = (landmarks: NormalizedLandmark[], indices: number[]): number => {
  const points = indices
    .map((index) => landmarks[index])
    .filter((point): point is NormalizedLandmark => point !== undefined)
  if (points.length === 0) return 0
  const visibilitySum = points.reduce((sum, point) => sum + (point.visibility ?? 1), 0)
  return clamp01(visibilitySum / points.length)
}

const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y)

const eyeOpenRatio = (
  landmarks: NormalizedLandmark[],
  topIndex: number,
  bottomIndex: number,
  leftCornerIndex: number,
  rightCornerIndex: number
): number => {
  const top = landmarks[topIndex]
  const bottom = landmarks[bottomIndex]
  const left = landmarks[leftCornerIndex]
  const right = landmarks[rightCornerIndex]
  if (!top || !bottom || !left || !right) return 0
  const vertical = distance(top, bottom)
  const horizontal = distance(left, right)
  if (horizontal <= 0.0001) return 0
  return vertical / horizontal
}

const faceBounds = (landmarks: NormalizedLandmark[]) => {
  if (landmarks.length === 0) return null
  const minX = Math.min(...landmarks.map((point) => point.x))
  const maxX = Math.max(...landmarks.map((point) => point.x))
  const minY = Math.min(...landmarks.map((point) => point.y))
  const maxY = Math.max(...landmarks.map((point) => point.y))
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY }
}

const normalizedInFace = (
  point: Point,
  bounds: ReturnType<typeof faceBounds>
): { x: number; y: number } | null => {
  if (!bounds || bounds.width <= 0.0001 || bounds.height <= 0.0001) return null
  return {
    x: clamp01((point.x - bounds.minX) / bounds.width),
    y: clamp01((point.y - bounds.minY) / bounds.height)
  }
}

export const estimateGaze = (landmarks: NormalizedLandmark[]): GazeEstimate | null => {
  if (landmarks.length < 399) return null

  const leftBounds = eyeBounds(landmarks, LEFT_EYE_INDICES)
  const rightBounds = eyeBounds(landmarks, RIGHT_EYE_INDICES)
  if (!leftBounds || !rightBounds) return null

  const leftVisibility = eyeVisibilityScore(landmarks, LEFT_EYE_INDICES)
  const rightVisibility = eyeVisibilityScore(landmarks, RIGHT_EYE_INDICES)
  const leftIris = landmarks[LEFT_IRIS_INDEX]
  const rightIris = landmarks[RIGHT_IRIS_INDEX]
  if (!leftIris || !rightIris) return null

  const leftNormalized = normalizedIrisInEye(leftIris, leftBounds)
  const rightNormalized = normalizedIrisInEye(rightIris, rightBounds)
  if (!leftNormalized || !rightNormalized) return null

  const leftOpen = eyeOpenRatio(
    landmarks,
    LEFT_EYE_TOP_INDEX,
    LEFT_EYE_BOTTOM_INDEX,
    LEFT_EYE_LEFT_CORNER,
    LEFT_EYE_RIGHT_CORNER
  )
  const rightOpen = eyeOpenRatio(
    landmarks,
    RIGHT_EYE_TOP_INDEX,
    RIGHT_EYE_BOTTOM_INDEX,
    RIGHT_EYE_LEFT_CORNER,
    RIGHT_EYE_RIGHT_CORNER
  )
  const avgOpen = (leftOpen + rightOpen) / 2
  const minOpen = Math.min(leftOpen, rightOpen)
  const openScore = clamp01((avgOpen - 0.14) / 0.16)
  if (minOpen < 0.11 || openScore < 0.22) return null

  const avg = averagePoint([leftNormalized, rightNormalized])
  const leftCenter = averagePoint(
    LEFT_EYE_INDICES.map((index) => landmarks[index]).filter(
      (point): point is NormalizedLandmark => point !== undefined
    )
  )
  const rightCenter = averagePoint(
    RIGHT_EYE_INDICES.map((index) => landmarks[index]).filter(
      (point): point is NormalizedLandmark => point !== undefined
    )
  )
  const headCenter = normalizedInFace(averagePoint([leftCenter, rightCenter]), faceBounds(landmarks))

  const eyeAgreement =
    1 - Math.min(1, Math.hypot(leftNormalized.x - rightNormalized.x, leftNormalized.y - rightNormalized.y))
  const confidence = clamp01((leftVisibility + rightVisibility) / 2) * clamp01(eyeAgreement) * openScore
  const blended = headCenter
    ? {
        x: clamp01(avg.x * 0.82 + headCenter.x * 0.18),
        y: clamp01(avg.y * 0.8 + headCenter.y * 0.2)
      }
    : avg
  const x = recenterAndAmplify(blended.x, 3.2)
  const y = recenterAndAmplify(blended.y, 1.6)

  return {
    x,
    y,
    rawX: x,
    rawY: y,
    confidence,
    eyeOpenScore: openScore
  }
}
