import type { CalibrationMatrix, CalibrationPoint } from '../types/calibration'
import { storageService } from './storageService'

const STORAGE_KEY = 'i-track.calibration'

interface Point {
  x: number
  y: number
}

// 5 well-spaced targets comfortable for webcam eye-tracking
export const CALIBRATION_TARGETS: Point[] = [
  { x: 0.15, y: 0.15 },
  { x: 0.85, y: 0.15 },
  { x: 0.5, y: 0.5 },
  { x: 0.15, y: 0.85 },
  { x: 0.85, y: 0.85 }
]

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))

const solve3x3 = (a: number[][], b: number[]): number[] => {
  const n = 3
  const aug = a.map((row, i) => [...row, b[i]])

  for (let p = 0; p < n; p += 1) {
    let maxRow = p
    for (let r = p + 1; r < n; r += 1) {
      if (Math.abs(aug[r][p]) > Math.abs(aug[maxRow][p])) maxRow = r
    }
    ;[aug[p], aug[maxRow]] = [aug[maxRow], aug[p]]

    const pivot = aug[p][p]
    if (Math.abs(pivot) < 1e-12) {
      return [0, 0, 0.5] // fallback
    }

    for (let c = p; c <= n; c += 1) {
      aug[p][c] /= pivot
    }

    for (let r = 0; r < n; r += 1) {
      if (r === p) continue
      const factor = aug[r][p]
      for (let c = p; c <= n; c += 1) {
        aug[r][c] -= factor * aug[p][c]
      }
    }
  }

  return [aug[0][n], aug[1][n], aug[2][n]]
}

/**
 * Robust affine calibration solver with ridge regularization.
 * Maps (gazeX, gazeY) -> (screenX, screenY).
 * Guaranteed to never divide by zero or invert directions.
 */
const computeRobustAffineMatrix = (points: CalibrationPoint[]): number[][] => {
  if (points.length < 3) {
    return [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ]
  }

  // M = [gx, gy, 1]
  // Normal equations: (M^T M + lambda*I) * A = M^T S
  const lambda = 0.001
  const mTm = [
    [lambda, 0, 0],
    [0, lambda, 0],
    [0, 0, lambda]
  ]
  const mTsX = [0, 0, 0]
  const mTsY = [0, 0, 0]

  for (const pt of points) {
    const gx = pt.gazeX
    const gy = pt.gazeY
    const sx = pt.screenX
    const sy = pt.screenY

    mTm[0][0] += gx * gx
    mTm[0][1] += gx * gy
    mTm[0][2] += gx
    mTm[1][0] += gy * gx
    mTm[1][1] += gy * gy
    mTm[1][2] += gy
    mTm[2][0] += gx
    mTm[2][1] += gy
    mTm[2][2] += 1

    mTsX[0] += gx * sx
    mTsX[1] += gy * sx
    mTsX[2] += sx

    mTsY[0] += gx * sy
    mTsY[1] += gy * sy
    mTsY[2] += sy
  }

  const coeffX = solve3x3(mTm, mTsX)
  const coeffY = solve3x3(mTm, mTsY)

  return [
    [coeffX[0], coeffX[1], coeffX[2]],
    [coeffY[0], coeffY[1], coeffY[2]],
    [0, 0, 1]
  ]
}

const applyHomography = (x: number, y: number, h: number[][]): { x: number; y: number } => {
  if (!h || h.length < 3 || !h[0] || !h[1] || !h[2]) return { x, y }
  const nx = h[0][0] * x + h[0][1] * y + h[0][2]
  const ny = h[1][0] * x + h[1][1] * y + h[1][2]
  const w = h[2][0] * x + h[2][1] * y + h[2][2]
  if (Math.abs(w) < 1e-6 || !Number.isFinite(nx) || !Number.isFinite(ny)) {
    return { x, y }
  }
  return { x: nx / w, y: ny / w }
}

const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y)

const computeAccuracy = (points: CalibrationPoint[], h: number[][]): number => {
  if (points.length === 0) return 0
  const meanError =
    points.reduce((sum, point) => {
      const estimated = applyHomography(point.gazeX, point.gazeY, h)
      return sum + distance({ x: estimated.x, y: estimated.y }, { x: point.screenX, y: point.screenY })
    }, 0) / points.length

  return clamp01(1 - meanError) * 100
}

export const calibrationService = {
  startCalibration(): CalibrationPoint[] {
    return []
  },
  finishCalibration(points: CalibrationPoint[]): CalibrationMatrix {
    const h = computeRobustAffineMatrix(points)
    const accuracy = computeAccuracy(points, h)
    return {
      h,
      createdAt: Date.now(),
      accuracy
    }
  },
  applyCalibration(
    raw: { x: number; y: number },
    matrix: CalibrationMatrix | null
  ): { x: number; y: number } {
    if (matrix === null || !matrix.h) return raw
    const transformed = applyHomography(raw.x, raw.y, matrix.h)
    return {
      x: clamp01(Number.isFinite(transformed.x) ? transformed.x : raw.x),
      y: clamp01(Number.isFinite(transformed.y) ? transformed.y : raw.y)
    }
  },
  async saveCalibration(matrix: CalibrationMatrix): Promise<void> {
    storageService.set(STORAGE_KEY, matrix)
    if (window.api?.saveCalibration) {
      await window.api.saveCalibration(matrix)
    }
  },
  async loadCalibration(): Promise<CalibrationMatrix | null> {
    if (window.api?.loadCalibration) {
      const persisted = await window.api.loadCalibration()
      if (persisted && Array.isArray(persisted.h)) {
        storageService.set(STORAGE_KEY, persisted)
        return persisted
      }
    }
    return storageService.get<CalibrationMatrix>(STORAGE_KEY)
  },
  async deleteCalibration(): Promise<void> {
    storageService.remove(STORAGE_KEY)
    if (window.api?.deleteCalibration) {
      await window.api.deleteCalibration()
    }
  }
}

export { computeRobustAffineMatrix as computeHomography, applyHomography }
