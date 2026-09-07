import { useEffect, useRef } from 'react'
import { ipcService } from '../services/ipcService'
import type { GazePoint } from '../types/gaze'

export const useMouseControl = (
  enabled: boolean,
  gazePoint: GazePoint | null,
  minConfidence = 0.35,
  smoothing = 0.3,
  mouseSpeed = 1.0
): void => {
  const previousRef = useRef<{ x: number; y: number } | null>(null)
  const screenRef = useRef<{ width: number; height: number } | null>(null)
  const latestGazeRef = useRef<GazePoint | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)

  useEffect(() => {
    latestGazeRef.current = gazePoint
  }, [gazePoint])

  useEffect(() => {
    if (!enabled) {
      previousRef.current = null
      return
    }
    let cancelled = false

    const initialize = async () => {
      try {
        const screenSize = await ipcService.getScreenSize()
        if (cancelled) return
        screenRef.current = screenSize
      } catch {
        // Fallback to window dimensions if desktop IPC is mocked/unavailable
        screenRef.current = { width: window.innerWidth, height: window.innerHeight }
      }
    }

    void initialize()

    const tick = async (time: number) => {
      if (cancelled) return
      frameRef.current = window.requestAnimationFrame((nextTime) => {
        void tick(nextTime)
      })

      // Throttle mouse moves to ~30-40 Hz to avoid flooding OS event loop
      if (time - lastTickRef.current < 25) return
      lastTickRef.current = time

      const current = latestGazeRef.current
      const screen = screenRef.current
      if (!current || !screen || current.confidence < minConfidence) return

      // Apply mouse movement speed scaling from center
      const speed = Math.max(0.2, mouseSpeed)
      const scaledX = Math.max(0, Math.min(1, 0.5 + (current.x - 0.5) * speed))
      const scaledY = Math.max(0, Math.min(1, 0.5 + (current.y - 0.5) * speed))

      const previous = previousRef.current ?? { x: scaledX, y: scaledY }
      const smoothWeight = Math.max(0.05, Math.min(0.9, 1 - smoothing))
      const smoothed = {
        x: smoothWeight * scaledX + (1 - smoothWeight) * previous.x,
        y: smoothWeight * scaledY + (1 - smoothWeight) * previous.y
      }

      // Small jitter dead-zone
      const dx = Math.abs(smoothed.x - previous.x)
      const dy = Math.abs(smoothed.y - previous.y)
      const stabilized = {
        x: dx < 0.0015 ? previous.x : smoothed.x,
        y: dy < 0.0015 ? previous.y : smoothed.y
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
  }, [enabled, minConfidence, smoothing, mouseSpeed])
}
