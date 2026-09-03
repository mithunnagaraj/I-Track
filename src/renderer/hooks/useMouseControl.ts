import { useEffect, useRef } from 'react'
import { calibrationService } from '../services/calibrationService'
import { ipcService } from '../services/ipcService'
import type { GazePoint } from '../types/gaze'

export const useMouseControl = (
  enabled: boolean,
  gazePoint: GazePoint | null,
  minConfidence = 0.7,
  smoothing = 0.3
): void => {
  const previousRef = useRef<{ x: number; y: number } | null>(null)
  const screenRef = useRef<{ width: number; height: number } | null>(null)
  const latestGazeRef = useRef<GazePoint | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)
  const calibrationRef = useRef<Awaited<ReturnType<typeof calibrationService.loadCalibration>>>(null)

  useEffect(() => {
    latestGazeRef.current = gazePoint
  }, [gazePoint])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    const initialize = async () => {
      const [screenSize, matrix] = await Promise.all([
        ipcService.getScreenSize(),
        calibrationService.loadCalibration()
      ])
      if (cancelled) return
      screenRef.current = screenSize
      calibrationRef.current = matrix
    }

    void initialize()

    const tick = async (time: number) => {
      if (cancelled) return
      frameRef.current = window.requestAnimationFrame((nextTime) => {
        void tick(nextTime)
      })

      if (time - lastTickRef.current < 1000 / 30) return
      lastTickRef.current = time

      const current = latestGazeRef.current
      const screen = screenRef.current
      if (!current || !screen || current.confidence < minConfidence) return

      const calibrated = calibrationService.applyCalibration(
        { x: current.rawX ?? current.x, y: current.rawY ?? current.y },
        calibrationRef.current
      )
      const previous = previousRef.current ?? calibrated
      const smoothed = {
        x: smoothing * calibrated.x + (1 - smoothing) * previous.x,
        y: Math.min(0.2, smoothing) * calibrated.y + (1 - Math.min(0.2, smoothing)) * previous.y
      }
      const stabilized = {
        x: Math.abs(smoothed.x - previous.x) < 0.0025 ? previous.x : smoothed.x,
        y: Math.abs(smoothed.y - previous.y) < 0.004 ? previous.y : smoothed.y
      }

      previousRef.current = stabilized
      await ipcService.moveMouse(stabilized.x * screen.width, stabilized.y * screen.height)
    }

    frameRef.current = window.requestAnimationFrame((time) => {
      void tick(time)
    })

    return () => {
      cancelled = true
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [enabled, minConfidence, smoothing])
}
