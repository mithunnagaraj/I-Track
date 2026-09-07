import { useEffect, useRef } from 'react'
import { ipcService } from '../services/ipcService'
import type { GazePoint } from '../types/gaze'

export const useMouseControl = (
  enabled: boolean,
  gazePoint: GazePoint | null,
  minConfidence = 0.35,
  smoothing = 0.3,
  mouseSpeed = 1.0,
  screenIndex = 0
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

    const updateScreenDimensions = async () => {
      try {
        const screenSize = await ipcService.getScreenSize(screenIndex)
        if (cancelled) return
        screenRef.current = screenSize
      } catch {
        // Fallback to window dimensions if desktop IPC is mocked/unavailable
        screenRef.current = { width: window.innerWidth, height: window.innerHeight }
      }
    }

    void updateScreenDimensions()

    const onFocus = () => {
      void updateScreenDimensions()
    }
    window.addEventListener('focus', onFocus)

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
      const targetX = Math.max(0, Math.min(1, 0.5 + (current.x - 0.5) * speed))
      const targetY = Math.max(0, Math.min(1, 0.5 + (current.y - 0.5) * speed))

      const previous = previousRef.current ?? { x: targetX, y: targetY }

      // Skip redundant OS mouse events if movement is imperceptibly small
      const dx = Math.abs(targetX - previous.x)
      const dy = Math.abs(targetY - previous.y)
      if (previousRef.current !== null && dx < 0.0008 && dy < 0.0008) {
        return
      }

      previousRef.current = { x: targetX, y: targetY }
      await ipcService.moveMouse(targetX * screen.width, targetY * screen.height, screenIndex)
    }

    frameRef.current = window.requestAnimationFrame((time) => {
      void tick(time)
    })

    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [enabled, minConfidence, smoothing, mouseSpeed, screenIndex])
}
