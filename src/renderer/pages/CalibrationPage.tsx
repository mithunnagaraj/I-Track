import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { CalibrationGrid } from '../components/CalibrationGrid'
import { CALIBRATION_TARGETS, calibrationService } from '../services/calibrationService'
import type { CalibrationPoint, CalibrationMatrix } from '../types/calibration'
import type { GazePoint } from '../types/gaze'

interface CalibrationPageProps {
  gazePoint: GazePoint | null
  minConfidence: number
  onComplete: (matrix: CalibrationMatrix) => void
  onCancel: () => void
  onClearCalibration?: () => void
}

const TARGET_NAMES = [
  '1. Top-Left',
  '2. Top-Right',
  '3. Center Screen',
  '4. Bottom-Left',
  '5. Bottom-Right'
]

const SETTLE_DELAY_MS = 400

const playBeep = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08) // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.28)
  } catch {
    // Audio failure ignored
  }
}

export const CalibrationPage = ({
  gazePoint,
  minConfidence,
  onComplete,
  onCancel,
  onClearCalibration
}: CalibrationPageProps): JSX.Element => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSettling, setIsSettling] = useState(true)
  const [completedMatrix, setCompletedMatrix] = useState<CalibrationMatrix | null>(null)
  const [error, setError] = useState<string | null>(null)

  const samplesBufferRef = useRef<Array<{ x: number; y: number }>>([])
  const finalizedSamplesRef = useRef<CalibrationPoint[]>([])
  const settleTimerRef = useRef<number | null>(null)

  const currentTarget = CALIBRATION_TARGETS[currentIndex] ?? CALIBRATION_TARGETS[CALIBRATION_TARGETS.length - 1]
  const holdProgress = 0

  // Settle delay on index change so user has time to move eyes to target
  useEffect(() => {
    setIsSettling(true)
    samplesBufferRef.current = []

    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current)
    }

    settleTimerRef.current = window.setTimeout(() => {
      setIsSettling(false)
    }, SETTLE_DELAY_MS)

    return () => {
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current)
      }
    }
  }, [currentIndex])

  const capturePoint = useCallback(() => {
    if (completedMatrix) return

    // Pick average of recent samples, or current gazePoint, or fallback to center
    const recent = samplesBufferRef.current.slice(-10)
    let avgX = 0.5
    let avgY = 0.55

    if (recent.length > 0) {
      avgX = recent.reduce((sum, p) => sum + p.x, 0) / recent.length
      avgY = recent.reduce((sum, p) => sum + p.y, 0) / recent.length
    } else if (gazePoint) {
      avgX = gazePoint.rawX ?? gazePoint.x
      avgY = gazePoint.rawY ?? gazePoint.y
    }

    const sample: CalibrationPoint = {
      screenX: currentTarget.x,
      screenY: currentTarget.y,
      gazeX: avgX,
      gazeY: avgY,
      timestamp: Date.now()
    }

    playBeep()

    const nextSamples = [...finalizedSamplesRef.current, sample]
    finalizedSamplesRef.current = nextSamples
    samplesBufferRef.current = []

    if (currentIndex < CALIBRATION_TARGETS.length - 1) {
      setCurrentIndex((i) => i + 1)
      return
    }

    // All 5 points finished!
    try {
      const matrix = calibrationService.finishCalibration(nextSamples)
      setCompletedMatrix(matrix)
      void calibrationService.saveCalibration(matrix).catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to save calibration.')
      })
    } catch (finishError) {
      setError(
        finishError instanceof Error ? finishError.message : 'Failed to compute calibration matrix.'
      )
    }
  }, [completedMatrix, currentIndex, currentTarget.x, currentTarget.y, gazePoint])

  // Keybindings: Spacebar or Enter to capture instantly; Esc to exit
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        if (completedMatrix) {
          onComplete(completedMatrix)
        } else if (!isSettling) {
          capturePoint()
        }
      } else if (e.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [capturePoint, completedMatrix, isSettling, onCancel, onComplete])

  // Buffer live samples. Capture is deliberately manual: an automatic timer
  // cannot know when the user has actually settled on the visible target.
  useEffect(() => {
    if (completedMatrix || isSettling) return
    const effectiveConfidence = Math.min(minConfidence, 0.25)

    if (!gazePoint || gazePoint.confidence < effectiveConfidence) {
      return
    }

    const rawX = gazePoint.rawX ?? gazePoint.x
    const rawY = gazePoint.rawY ?? gazePoint.y
    samplesBufferRef.current.push({ x: rawX, y: rawY })
    if (samplesBufferRef.current.length > 30) {
      samplesBufferRef.current = samplesBufferRef.current.slice(-30)
    }

  }, [completedMatrix, gazePoint, isSettling, minConfidence])

  // Completion review screen
  if (completedMatrix) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          bgcolor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            maxWidth: 520,
            width: '100%',
            bgcolor: '#1e293b',
            color: '#f8fafc',
            textAlign: 'center',
            borderRadius: 3,
            border: '1px solid #334155'
          }}
        >
          <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 700, mb: 1 }}>
            ✓ Calibration Complete!
          </Typography>
          <Typography variant="h6" sx={{ color: '#94a3b8', mb: 2 }}>
            Accuracy: {Math.round(completedMatrix.accuracy)}%
          </Typography>
          <Typography variant="body1" sx={{ color: '#cbd5e1', mb: 4 }}>
            Your personalized eye profile has been saved. The red dot and mouse cursor will now follow where you look.
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={() => onComplete(completedMatrix)}
              sx={{ fontWeight: 'bold', px: 4 }}
            >
              Start Using I-Track
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="large"
              onClick={() => {
                finalizedSamplesRef.current = []
                samplesBufferRef.current = []
                setCompletedMatrix(null)
                setCurrentIndex(0)
              }}
            >
              Recalibrate
            </Button>
          </Stack>
        </Paper>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        bgcolor: 'rgba(15, 23, 42, 0.97)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 3,
        userSelect: 'none'
      }}
    >
      {/* Header Banner */}
      <Box sx={{ textAlign: 'center', zIndex: 10, maxWidth: 650 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, letterSpacing: -0.5 }}>
          Point {TARGET_NAMES[currentIndex]}
        </Typography>
        <Typography variant="body1" sx={{ color: '#94a3b8', mb: 1 }}>
          Look directly at the target and <b>CLICK IT</b> or press <b>[Spacebar]</b>
        </Typography>

        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
          <Chip
            label={`Target ${currentIndex + 1} of ${CALIBRATION_TARGETS.length}`}
            color="primary"
            size="small"
            sx={{ fontWeight: 600 }}
          />
          {gazePoint ? (
            <Chip
              label={`Eye Signal: ${Math.round(gazePoint.confidence * 100)}%`}
              color={gazePoint.confidence >= 0.3 ? 'success' : 'warning'}
              size="small"
            />
          ) : (
            <Chip label="Looking away or eyes not detected" color="error" size="small" />
          )}
        </Stack>

        {error ? (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        ) : null}
      </Box>

      {/* Target Canvas */}
      <CalibrationGrid
        point={currentTarget}
        progress={holdProgress}
        onTargetClick={capturePoint}
        livePoint={gazePoint}
      />

      {/* Footer controls */}
      <Stack direction="row" spacing={2} sx={{ zIndex: 10 }}>
        <Button
          variant="contained"
          color="secondary"
          size="medium"
          onClick={capturePoint}
          disabled={isSettling}
        >
          Click / Capture Target (Spacebar)
        </Button>
        {onClearCalibration ? (
          <Button
            variant="outlined"
            color="warning"
            onClick={() => {
              onClearCalibration()
              onCancel()
            }}
          >
            Clear Calibration
          </Button>
        ) : null}
        <Button variant="outlined" color="inherit" onClick={onCancel}>
          Cancel (Esc)
        </Button>
      </Stack>
    </Box>
  )
}
