import type {
  AccuracyTestResult,
  CalibrationGridMode,
  CalibrationMatrix,
  CalibrationPoint,
  CalibrationProfile,
  VerificationTarget
} from '../types/calibration'
import { ipcService } from './ipcService'
import { storageService } from './storageService'

const STORAGE_KEY = 'i-track.calibration'
const PROFILES_STORAGE_KEY = 'i-track.profiles'

interface Point {
  x: number
  y: number
}

export const CALIBRATION_TARGETS_5POINT: Point[] = [
  { x: 0.15, y: 0.15 },
  { x: 0.85, y: 0.15 },
  { x: 0.5, y: 0.5 },
  { x: 0.15, y: 0.85 },
  { x: 0.85, y: 0.85 }
]

export const TARGET_NAMES_5POINT = [
  '1. Top-Left',
  '2. Top-Right',
  '3. Center Screen',
  '4. Bottom-Left',
  '5. Bottom-Right'
]

export const CALIBRATION_TARGETS_9POINT: Point[] = [
  { x: 0.15, y: 0.15 },
  { x: 0.5, y: 0.15 },
  { x: 0.85, y: 0.15 },
  { x: 0.15, y: 0.5 },
  { x: 0.5, y: 0.5 },
  { x: 0.85, y: 0.5 },
  { x: 0.15, y: 0.85 },
  { x: 0.5, y: 0.85 },
  { x: 0.85, y: 0.85 }
]

export const TARGET_NAMES_9POINT = [
  '1. Top-Left',
  '2. Top-Center',
  '3. Top-Right',
  '4. Middle-Left',
  '5. Center Screen',
  '6. Middle-Right',
  '7. Bottom-Left',
  '8. Bottom-Center',
  '9. Bottom-Right'
]

export const VERIFICATION_TARGETS: Point[] = [
  { x: 0.25, y: 0.25 },
  { x: 0.75, y: 0.25 },
  { x: 0.5, y: 0.5 },
  { x: 0.25, y: 0.75 },
  { x: 0.75, y: 0.75 }
]

export const VERIFICATION_TARGET_NAMES = [
  'Test Target 1 (Upper Left)',
  'Test Target 2 (Upper Right)',
  'Test Target 3 (Center)',
  'Test Target 4 (Lower Left)',
  'Test Target 5 (Lower Right)'
]

export const CALIBRATION_TARGETS = CALIBRATION_TARGETS_5POINT

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
  getTargets(mode: CalibrationGridMode = '5-point'): Point[] {
    return mode === '9-point' ? CALIBRATION_TARGETS_9POINT : CALIBRATION_TARGETS_5POINT
  },
  getTargetNames(mode: CalibrationGridMode = '5-point'): string[] {
    return mode === '9-point' ? TARGET_NAMES_9POINT : TARGET_NAMES_5POINT
  },
  startCalibration(): CalibrationPoint[] {
    return []
  },
  finishCalibration(points: CalibrationPoint[], gridMode: CalibrationGridMode = '5-point'): CalibrationMatrix {
    const h = computeRobustAffineMatrix(points)
    const accuracy = computeAccuracy(points, h)
    return {
      h,
      createdAt: Date.now(),
      accuracy,
      gridMode
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
    await ipcService.saveCalibration(matrix)
  },
  async loadCalibration(): Promise<CalibrationMatrix | null> {
    const fromIpc = await ipcService.loadCalibration()
    if (fromIpc && Array.isArray(fromIpc.h)) {
      storageService.set(STORAGE_KEY, fromIpc)
      return fromIpc
    }
    return storageService.get<CalibrationMatrix>(STORAGE_KEY)
  },
  async deleteCalibration(): Promise<void> {
    storageService.remove(STORAGE_KEY)
    await ipcService.deleteCalibration()
  },

  // Multi-Profile Management
  async listProfiles(): Promise<CalibrationProfile[]> {
    const ipcProfiles = await ipcService.loadProfiles()
    if (ipcProfiles && Array.isArray(ipcProfiles) && ipcProfiles.length > 0) {
      storageService.set(PROFILES_STORAGE_KEY, ipcProfiles)
      return ipcProfiles
    }
    const local = storageService.get<CalibrationProfile[]>(PROFILES_STORAGE_KEY)
    if (local && Array.isArray(local) && local.length > 0) {
      return local
    }
    // If an existing calibration exists, seed the Default profile
    const existing = await this.loadCalibration()
    if (existing) {
      const defaultProfile: CalibrationProfile = {
        id: 'default',
        name: 'Default Profile',
        createdAt: existing.createdAt,
        updatedAt: existing.createdAt,
        gridMode: existing.gridMode ?? '5-point',
        matrix: existing,
        isDefault: true
      }
      const initial = [defaultProfile]
      storageService.set(PROFILES_STORAGE_KEY, initial)
      await ipcService.saveProfiles(initial)
      return initial
    }
    return []
  },

  async saveProfile(profile: CalibrationProfile): Promise<CalibrationProfile[]> {
    const profiles = await this.listProfiles()
    const index = profiles.findIndex((p) => p.id === profile.id)
    let updated: CalibrationProfile[]
    if (index >= 0) {
      updated = profiles.map((p) => (p.id === profile.id ? { ...profile, updatedAt: Date.now() } : p))
    } else {
      updated = [...profiles, { ...profile, createdAt: Date.now(), updatedAt: Date.now() }]
    }
    storageService.set(PROFILES_STORAGE_KEY, updated)
    await ipcService.saveProfiles(updated)
    return updated
  },

  async deleteProfile(id: string): Promise<CalibrationProfile[]> {
    const profiles = await this.listProfiles()
    const updated = profiles.filter((p) => p.id !== id)
    storageService.set(PROFILES_STORAGE_KEY, updated)
    await ipcService.saveProfiles(updated)
    return updated
  },

  // Accuracy Verification Test
  evaluateAccuracy(
    samples: Array<{ targetX: number; targetY: number; gazeX: number; gazeY: number }>,
    screenWidth = 1920,
    screenHeight = 1080
  ): AccuracyTestResult {
    if (samples.length === 0) {
      return {
        accuracyPercentage: 0,
        meanErrorDistance: 1,
        meanErrorPx: 1000,
        targets: [],
        testedAt: Date.now(),
        rating: 'poor'
      }
    }

    const targets: VerificationTarget[] = samples.map((s, idx) => {
      const errDist = Math.hypot(s.gazeX - s.targetX, s.gazeY - s.targetY)
      const dxPx = (s.gazeX - s.targetX) * screenWidth
      const dyPx = (s.gazeY - s.targetY) * screenHeight
      const errPx = Math.hypot(dxPx, dyPx)
      return {
        id: idx + 1,
        name: VERIFICATION_TARGET_NAMES[idx] ?? `Target ${idx + 1}`,
        targetX: s.targetX,
        targetY: s.targetY,
        measuredX: s.gazeX,
        measuredY: s.gazeY,
        errorDistance: errDist,
        errorPx: Math.round(errPx)
      }
    })

    const meanDist = targets.reduce((sum, t) => sum + t.errorDistance, 0) / targets.length
    const meanPx = targets.reduce((sum, t) => sum + (t.errorPx ?? 0), 0) / targets.length
    const accuracyPercentage = Math.round(clamp01(1 - meanDist * 2.5) * 100)

    let rating: AccuracyTestResult['rating'] = 'excellent'
    if (accuracyPercentage < 60) rating = 'poor'
    else if (accuracyPercentage < 75) rating = 'fair'
    else if (accuracyPercentage < 88) rating = 'good'

    return {
      accuracyPercentage,
      meanErrorDistance: Math.round(meanDist * 1000) / 1000,
      meanErrorPx: Math.round(meanPx),
      targets,
      testedAt: Date.now(),
      rating
    }
  }
}

export { computeRobustAffineMatrix as computeHomography, applyHomography }
