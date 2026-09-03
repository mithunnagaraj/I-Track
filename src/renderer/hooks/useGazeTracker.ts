import { useCallback, useEffect, useRef, useState } from 'react'
import { estimateGaze } from '../ml/EyeGazeEstimator'
import { FaceDetector } from '../ml/FaceDetector'
import { MediaPipeWrapper } from '../ml/MediaPipeWrapper'
import type { GazePoint } from '../types/gaze'

export const useGazeTracker = () => {
  const [gazePoint, setGazePoint] = useState<GazePoint | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef(0)
  const detectorRef = useRef<FaceDetector | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const smoothedRef = useRef<{ x: number; y: number } | null>(null)
  const rangeRef = useRef({ minX: 0.2, maxX: 0.8, minY: 0.2, maxY: 0.8 })

  const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))

  const normalizeToRange = (x: number, y: number, shouldAdapt: boolean) => {
    const range = rangeRef.current
    if (shouldAdapt) {
      range.minX = Math.min(range.minX, x)
      range.maxX = Math.max(range.maxX, x)
      range.minY = Math.min(range.minY, y)
      range.maxY = Math.max(range.maxY, y)

      range.minX += (x - range.minX) * 0.002
      range.maxX += (x - range.maxX) * 0.002
      range.minY += (y - range.minY) * 0.002
      range.maxY += (y - range.maxY) * 0.002
    }

    const spanX = Math.max(0.15, range.maxX - range.minX)
    const spanY = Math.max(0.15, range.maxY - range.minY)
    return {
      x: clamp01((x - range.minX) / spanX),
      y: clamp01((y - range.minY) / spanY)
    }
  }

  const initialize = useCallback(async () => {
    if (detectorRef.current) return
    try {
      const detector = new FaceDetector(new MediaPipeWrapper())
      await detector.initialize()
      detectorRef.current = detector
      setIsReady(true)
    } catch (initError) {
      const message =
        initError instanceof Error ? initError.message : 'Failed to initialize MediaPipe face detector.'
      setError(message)
      setIsReady(false)
    }
  }, [])

  const loop = useCallback(() => {
    try {
      const detector = detectorRef.current
      const video = videoRef.current
      if (
        detector &&
        video &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        const timestampMs = Math.max(lastTimestampRef.current + 1, Math.round(performance.now()))
        lastTimestampRef.current = timestampMs
        const detection = detector.detect(video, timestampMs)
        if (detection) {
          const estimated = estimateGaze(detection.landmarks)
          if (estimated) {
            const combinedConfidence = Math.min(
              1,
              Math.max(0, estimated.confidence * detection.confidence)
            )
            if (combinedConfidence < 0.22 || estimated.eyeOpenScore < 0.3) {
              setGazePoint(null)
              setError(null)
              return
            }

            const normalized = normalizeToRange(estimated.x, estimated.y, combinedConfidence > 0.45)
            const previous = smoothedRef.current ?? { x: normalized.x, y: normalized.y }
            const smoothed = {
              x: 0.22 * normalized.x + 0.78 * previous.x,
              y: 0.16 * normalized.y + 0.84 * previous.y
            }
            const dx = Math.abs(smoothed.x - previous.x)
            const dy = Math.abs(smoothed.y - previous.y)
            const stabilized = {
              x: dx < 0.003 ? previous.x : smoothed.x,
              y: dy < 0.006 ? previous.y : smoothed.y
            }
            smoothedRef.current = stabilized
            setGazePoint({
              x: stabilized.x,
              y: stabilized.y,
              rawX: normalized.x,
              rawY: normalized.y,
              confidence: combinedConfidence,
              timestamp: Date.now()
            })
            setError(null)
          } else {
            setGazePoint(null)
          }
        } else {
          setGazePoint(null)
        }
      }
    } catch (detectError) {
      const message =
        detectError instanceof Error
          ? detectError.message
          : 'Face detection failed while processing video frames.'
      setError(message)
      setGazePoint(null)
    } finally {
      frameRef.current = window.requestAnimationFrame(loop)
    }
  }, [])

  const startTracking = useCallback(async () => {
    if (isTracking) return
    if (!detectorRef.current) {
      await initialize()
    }
    if (!detectorRef.current) return
    if (!videoRef.current) {
      setError('Camera video element is not ready yet.')
      return
    }
    lastTimestampRef.current = 0
    smoothedRef.current = null
    rangeRef.current = { minX: 0.2, maxX: 0.8, minY: 0.2, maxY: 0.8 }
    setIsTracking(true)
    frameRef.current = window.requestAnimationFrame(loop)
  }, [initialize, isTracking, loop])

  const stopTracking = useCallback(() => {
    setIsTracking(false)
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    lastTimestampRef.current = 0
    smoothedRef.current = null
    rangeRef.current = { minX: 0.2, maxX: 0.8, minY: 0.2, maxY: 0.8 }
  }, [])

  const attachVideoElement = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video
  }, [])

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
    },
    []
  )

  return { gazePoint, isTracking, isReady, error, initialize, startTracking, stopTracking, attachVideoElement }
}
