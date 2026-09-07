import { useCallback, useEffect, useRef, useState } from 'react'
import { estimateGaze } from '../ml/EyeGazeEstimator'
import { FaceDetector } from '../ml/FaceDetector'
import { MediaPipeWrapper } from '../ml/MediaPipeWrapper'
import type { GazePoint } from '../types/gaze'
import {
  GAZE_TRACKING_SMOOTHING_WEIGHT,
  GAZE_TRACKING_DEAD_ZONE,
  GAZE_RANGE_LEARNING_RATE,
  GAZE_RANGE_MIN_SPAN,
  GAZE_RANGE_INITIAL_MIN_X,
  GAZE_RANGE_INITIAL_MAX_X,
  GAZE_RANGE_INITIAL_MIN_Y,
  GAZE_RANGE_INITIAL_MAX_Y
} from '../constants/gazeTrackingConstants'

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
  const smoothedRef = useRef<{ x: number; y: number } | null>(null)
  const optionsRef = useRef<UseGazeTrackerOptions>(options ?? {})

  useEffect(() => {
    optionsRef.current = options ?? {}
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
            const previous = smoothedRef.current ?? { x: targetX, y: targetY }

            // A modest boost makes deliberate eye movements responsive without
            // turning a head movement into a full-screen jump.
            const dist = Math.hypot(targetX - previous.x, targetY - previous.y)
            // The settings control expresses smoothing (higher = steadier),
            // whereas this interpolation weight expresses responsiveness
            // (higher = faster). Convert once here to keep the UI truthful.
            const smoothingAmount = optionsRef.current.smoothing ?? (1 - GAZE_TRACKING_SMOOTHING_WEIGHT)
            const baseWeight = Math.max(0.08, Math.min(0.7, 1 - smoothingAmount))
            const weight = dist > 0.08 ? Math.min(0.55, baseWeight * 1.3) : baseWeight

            const smoothed = {
              x: weight * targetX + (1 - weight) * previous.x,
              y: weight * targetY + (1 - weight) * previous.y
            }

            // Apply dead-zone: very small micro-movements ignored to prevent twitching
            const dx = Math.abs(smoothed.x - previous.x)
            const dy = Math.abs(smoothed.y - previous.y)
            const stabilized = {
              x: dx < GAZE_TRACKING_DEAD_ZONE ? previous.x : smoothed.x,
              y: dy < GAZE_TRACKING_DEAD_ZONE ? previous.y : smoothed.y
            }
            smoothedRef.current = stabilized

            setGazePoint({
              x: stabilized.x,
              y: stabilized.y,
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
    smoothedRef.current = null
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
