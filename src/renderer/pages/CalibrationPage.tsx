import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material'
import { CalibrationGrid } from '../components/CalibrationGrid'
import { CALIBRATION_TARGETS, calibrationService } from '../services/calibrationService'
import type { CalibrationPoint, CalibrationMatrix } from '../types/calibration'
import type { GazePoint } from '../types/gaze'
import { pageSx } from './styles'

interface CalibrationPageProps {
  gazePoint: GazePoint | null
  minConfidence: number
  onComplete: (matrix: CalibrationMatrix) => void
  onCancel: () => void
}

const HOLD_DURATION_MS = 1400
const SAMPLE_GAP_TOLERANCE_MS = 2000
const MIN_SAMPLES_PER_POINT = 6

export const CalibrationPage = ({
  gazePoint,
  minConfidence,
  onComplete,
  onCancel
}: CalibrationPageProps): JSX.Element => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [nowTick, setNowTick] = useState(Date.now())
  const [error, setError] = useState<string | null>(null)
  const completedRef = useRef(false)
  const pointSamplesRef = useRef<Array<{ x: number; y: number }>>([])
  const finalizedSamplesRef = useRef<CalibrationPoint[]>([])
  const lastValidSampleAtRef = useRef<number | null>(null)

  const currentTarget = CALIBRATION_TARGETS[currentIndex] ?? CALIBRATION_TARGETS[CALIBRATION_TARGETS.length - 1]
  const holdProgress = startedAt ? Math.min(1, (nowTick - startedAt) / HOLD_DURATION_MS) : 0

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowTick(Date.now())
    }, 100)
    return () => {
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (completedRef.current) return
    const now = Date.now()

    if (!gazePoint || gazePoint.confidence < minConfidence) {
      if (
        startedAt !== null &&
        lastValidSampleAtRef.current !== null &&
        now - lastValidSampleAtRef.current > SAMPLE_GAP_TOLERANCE_MS
      ) {
        setStartedAt(null)
        pointSamplesRef.current = []
      }
      return
    }

    setError(null)
    lastValidSampleAtRef.current = now
    pointSamplesRef.current.push({
      x: gazePoint.rawX ?? gazePoint.x,
      y: gazePoint.rawY ?? gazePoint.y
    })

    if (startedAt === null) {
      setStartedAt(now)
      pointSamplesRef.current = pointSamplesRef.current.slice(-1)
      return
    }

    if (now - startedAt < HOLD_DURATION_MS || pointSamplesRef.current.length < MIN_SAMPLES_PER_POINT) return

    const avg = pointSamplesRef.current.reduce(
      (acc, sample) => ({ x: acc.x + sample.x, y: acc.y + sample.y }),
      { x: 0, y: 0 }
    )
    const averaged = {
      x: avg.x / pointSamplesRef.current.length,
      y: avg.y / pointSamplesRef.current.length
    }

    const sample: CalibrationPoint = {
      screenX: currentTarget.x,
      screenY: currentTarget.y,
      gazeX: averaged.x,
      gazeY: averaged.y,
      timestamp: now
    }

    const nextSamples = [...finalizedSamplesRef.current, sample]
    finalizedSamplesRef.current = nextSamples
    pointSamplesRef.current = []
    lastValidSampleAtRef.current = null
    setStartedAt(null)

    if (currentIndex < CALIBRATION_TARGETS.length - 1) {
      setCurrentIndex((index) => index + 1)
      return
    }

    try {
      const matrix = calibrationService.finishCalibration(nextSamples)
      completedRef.current = true
      void calibrationService
        .saveCalibration(matrix)
        .then(() => onComplete(matrix))
        .catch((saveError: unknown) => {
          completedRef.current = false
          setError(saveError instanceof Error ? saveError.message : 'Failed to save calibration.')
        })
    } catch (finishError) {
      setError(
        finishError instanceof Error ? finishError.message : 'Failed to compute calibration matrix.'
      )
    }
  }, [currentIndex, currentTarget.x, currentTarget.y, gazePoint, minConfidence, onComplete, startedAt])

  const progressLabel = useMemo(
    () => `${Math.min(currentIndex + 1, CALIBRATION_TARGETS.length)}/${CALIBRATION_TARGETS.length}`,
    [currentIndex]
  )

  return (
    <Box sx={pageSx}>
      <Typography variant="h6">5-Point Calibration</Typography>
      <Typography variant="body2">Look at the red dot and hold your gaze for 2 seconds.</Typography>
      <CalibrationGrid point={currentTarget} />
      <LinearProgress variant="determinate" value={holdProgress * 100} />
      <Typography variant="caption">Point {progressLabel}</Typography>
      {error ? <Typography color="error">{error}</Typography> : null}
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
      </Stack>
    </Box>
  )
}
