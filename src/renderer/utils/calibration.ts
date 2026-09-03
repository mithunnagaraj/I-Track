import type { CalibrationMatrix } from '../types/calibration'

export const identityCalibration = (): CalibrationMatrix => ({
  h: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ],
  createdAt: Date.now(),
  accuracy: 0
})
