import { useCallback, useEffect, useMemo, useState } from 'react'
import { calibrationService } from '../services/calibrationService'
import type { CalibrationMatrix } from '../types/calibration'

export const useCalibration = () => {
  const [matrix, setMatrix] = useState<CalibrationMatrix | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      const loaded = await calibrationService.loadCalibration()
      if (active) setMatrix(loaded)
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const apply = useCallback(
    (point: { x: number; y: number }) => calibrationService.applyCalibration(point, matrix),
    [matrix]
  )

  const save = useCallback(async (next: CalibrationMatrix) => {
    await calibrationService.saveCalibration(next)
    setMatrix(next)
  }, [])

  const clear = useCallback(async () => {
    await calibrationService.deleteCalibration()
    setMatrix(null)
  }, [])

  return useMemo(
    () => ({
      matrix,
      apply,
      save,
      clear
    }),
    [apply, clear, matrix, save]
  )
}
