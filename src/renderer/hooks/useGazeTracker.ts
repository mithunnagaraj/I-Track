import { useCallback, useEffect, useRef, useState } from 'react'
import { estimateGaze } from '../ml/EyeGazeEstimator'
import { FaceDetector } from '../ml/FaceDetector'
import { MediaPipeWrapper } from '../ml/MediaPipeWrapper'
import type { GazePoint } from '../types/gaze'
import { OneEuroFilter2D } from '../utils/OneEuroFilter'

export interface UseGazeTrackerOptions {
  gainX?: number
  gainY?: number
  invertX?: boolean
  invertY?: boolean
  smoothing?: number
  baselineX?: number
  baselineY?: number
  headGainX?: number
  headGainY?: number
}

export const useGazeTracker = (options?: UseGazeTrackerOptions) => {
  const [gazePoint, setGazePoint] = useState<GazePoint | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef(0)
  const detectorRef = useRef<FaceDetector | null>(null)
  const initializationRef = useRef<Promise<void> | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const filterRef = useRef<OneEuroFilter2D>(
    new OneEuroFilter2D({ minCutoff: 0.9, beta: 0.08, dCutoff: 1.0 })
  )
  const optionsRef = useRef<UseGazeTrackerOptions>(options ?? {})

  useEffect(() => {
    optionsRef.current = options ?? {}
    const smoothing = options?.smoothing ?? 0.65
    // Map smoothing (0.1 - 0.95) to minCutoff (higher smoothing = lower cutoff = more stable fixations)
    const minCutoff = Math.max(0.2, (1 - smoothing) * 2.5)
    filterRef.current.setParameters({ minCutoff, beta: 0.08 })
  }, [options])

  const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))

  const initialize = useCallback(async () => {
    if (detectorRef.current) return
    if (initializationRef.current) return initializationRef.current

    const initializeDetector = async () => {
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
    }

    const pendingInitialization = initializeDetector()
    initializationRef.current = pendingInitialization
    try {
      await pendingInitialization
    } finally {
      if (initializationRef.current === pendingInitialization) {
        initializationRef.current = null
      }
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
          const estimated = estimateGaze(detection.landmarks, optionsRef.current)
          if (estimated) {
            const targetX = clamp01(estimated.x)
            const targetY = clamp01(estimated.y)

            // One Euro Filter adaptively filters noise based on eye velocity:
            // High speed (saccades) -> cutoff increases -> zero latency
            // Low speed (fixations) -> cutoff stays low -> rock-solid jitter-free
            const filtered = filterRef.current.filter(targetX, targetY, timestampMs)
            const stabilizedX = clamp01(filtered.x)
            const stabilizedY = clamp01(filtered.y)

            setGazePoint({
              x: stabilizedX,
              y: stabilizedY,
              rawX: estimated.rawX,
              rawY: estimated.rawY,
              confidence: Math.min(1, Math.max(0, estimated.confidence * (detection.confidence ?? 1))),
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
    filterRef.current.reset()
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
    filterRef.current.reset()
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
