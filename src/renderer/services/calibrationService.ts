import type { CalibrationMatrix, CalibrationPoint } from '../types/calibration'
import { storageService } from './storageService'

const STORAGE_KEY = 'i-track.calibration'

interface Point {
  x: number
  y: number
}

export const CALIBRATION_TARGETS: Point[] = [
  { x: 0.1, y: 0.1 },
  { x: 0.9, y: 0.1 },
  { x: 0.5, y: 0.5 },
  { x: 0.1, y: 0.9 },
  { x: 0.9, y: 0.9 }
]

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))

const applyHomography = (x: number, y: number, h: number[][]): { x: number; y: number } => {
  const nx = h[0][0] * x + h[0][1] * y + h[0][2]
  const ny = h[1][0] * x + h[1][1] * y + h[1][2]
  const w = h[2][0] * x + h[2][1] * y + h[2][2]
  if (w === 0) return { x, y }
  return { x: nx / w, y: ny / w }
}

const transpose = (matrix: number[][]): number[][] => {
  const columns = matrix[0].length
  return Array.from({ length: columns }, (_unused, col) => matrix.map((row) => row[col]))
}

const multiply = (a: number[][], b: number[][]): number[][] => {
  const rows = a.length
  const cols = b[0].length
  const inner = b.length
  return Array.from({ length: rows }, (_unusedRow, row) =>
    Array.from({ length: cols }, (_unusedCol, col) => {
      let total = 0
      for (let i = 0; i < inner; i += 1) total += a[row][i] * b[i][col]
      return total
    })
  )
}

const multiplyVector = (matrix: number[][], vector: number[]): number[] =>
  matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0))

const solveLinearSystem = (a: number[][], b: number[]): number[] => {
  const n = a.length
  const augmented = a.map((row, rowIndex) => [...row, b[rowIndex]])

  for (let pivot = 0; pivot < n; pivot += 1) {
    let maxRow = pivot
    for (let row = pivot + 1; row < n; row += 1) {
      if (Math.abs(augmented[row][pivot]) > Math.abs(augmented[maxRow][pivot])) maxRow = row
    }
    ;[augmented[pivot], augmented[maxRow]] = [augmented[maxRow], augmented[pivot]]

    const pivotValue = augmented[pivot][pivot]
    if (Math.abs(pivotValue) < 1e-10) {
      throw new Error('Calibration homography matrix is singular; collect calibration again.')
    }

    for (let col = pivot; col <= n; col += 1) {
      augmented[pivot][col] /= pivotValue
    }

    for (let row = 0; row < n; row += 1) {
      if (row === pivot) continue
      const factor = augmented[row][pivot]
      for (let col = pivot; col <= n; col += 1) {
        augmented[row][col] -= factor * augmented[pivot][col]
      }
    }
  }

  return augmented.map((row) => row[n])
}

const computeHomography = (points: CalibrationPoint[]): number[][] => {
  if (points.length < 4) {
    throw new Error('At least 4 calibration points are required to compute homography.')
  }

  const aRows: number[][] = []
  const bRows: number[] = []

  for (const point of points) {
    const gx = point.gazeX
    const gy = point.gazeY
    const sx = point.screenX
    const sy = point.screenY

    aRows.push([gx, gy, 1, 0, 0, 0, -sx * gx, -sx * gy])
    bRows.push(sx)
    aRows.push([0, 0, 0, gx, gy, 1, -sy * gx, -sy * gy])
    bRows.push(sy)
  }

  const aT = transpose(aRows)
  const normalA = multiply(aT, aRows)
  const normalB = multiplyVector(aT, bRows)
  const h = solveLinearSystem(normalA, normalB)

  return [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], 1]
  ]
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
    const h = computeHomography(points)
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
    if (matrix === null) return raw
    const transformed = applyHomography(raw.x, raw.y, matrix.h)
    return { x: clamp01(transformed.x), y: clamp01(transformed.y) }
  },
  async saveCalibration(matrix: CalibrationMatrix): Promise<void> {
    storageService.set(STORAGE_KEY, matrix)
    await window.api.saveCalibration(matrix)
  },
  async loadCalibration(): Promise<CalibrationMatrix | null> {
    const persisted = await window.api.loadCalibration()
    if (persisted) {
      storageService.set(STORAGE_KEY, persisted)
      return persisted
    }
    return storageService.get<CalibrationMatrix>(STORAGE_KEY)
  },
  async deleteCalibration(): Promise<void> {
    storageService.remove(STORAGE_KEY)
    await window.api.deleteCalibration()
  }
}

export { computeHomography, applyHomography }
