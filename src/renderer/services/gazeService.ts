import type { GazePoint } from '../types/gaze'

export const isConfidentGaze = (point: GazePoint, minConfidence: number): boolean =>
  point.confidence >= minConfidence

export const clampNormalized = (value: number): number => Math.max(0, Math.min(1, value))
