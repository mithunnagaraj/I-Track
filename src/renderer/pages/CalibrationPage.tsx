import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography
} from '@mui/material'
import { CalibrationGrid } from '../components/CalibrationGrid'
import { AccuracyTestModal } from '../components/AccuracyTestModal'
import { calibrationService } from '../services/calibrationService'
import type { CalibrationGridMode, CalibrationMatrix, CalibrationPoint } from '../types/calibration'
import type { GazePoint } from '../types/gaze'

interface CalibrationPageProps {
  gazePoint: GazePoint | null
  minConfidence: number
  initialMode?: CalibrationGridMode
  profileName?: string
  onComplete: (matrix: CalibrationMatrix) => void
  onCancel: () => void
  onClearCalibration?: () => void
}

const SETTLE_DELAY_MS = 400
const MIN_CAPTURE_SAMPLES = 12

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

const playBeep = () => {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
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
  initialMode = '5-point',
  profileName,
  onComplete,
  onCancel,
  onClearCalibration
}: CalibrationPageProps): JSX.Element => {
  const [gridMode, setGridMode] = useState<CalibrationGridMode>(initialMode)
  const [hasStarted, setHasStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSettling, setIsSettling] = useState(true)
  const [sampleCount, setSampleCount] = useState(0)
  const [completedMatrix, setCompletedMatrix] = useState<CalibrationMatrix | null>(null)
  const [showAccuracyModal, setShowAccuracyModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const targets = useMemo(() => calibrationService.getTargets(gridMode), [gridMode])
  const targetNames = useMemo(() => calibrationService.getTargetNames(gridMode), [gridMode])

  const samplesBufferRef = useRef<Array<{ x: number; y: number }>>([])
  const finalizedSamplesRef = useRef<CalibrationPoint[]>([])
  const settleTimerRef = useRef<number | null>(null)

  const currentTarget = targets[currentIndex] ?? targets[targets.length - 1]
  const holdProgress = Math.min(1, sampleCount / MIN_CAPTURE_SAMPLES)

  // Settle delay on index change so user has time to move eyes to target
  useEffect(() => {
    if (!hasStarted) return
    setIsSettling(true)
    samplesBufferRef.current = []
    setSampleCount(0)

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
  }, [currentIndex, hasStarted])

  const capturePoint = useCallback(() => {
    if (completedMatrix || !hasStarted) return

    const recent = samplesBufferRef.current.slice(-20)
    if (recent.length < MIN_CAPTURE_SAMPLES) {
      setError('Hold your gaze on the target until the eye signal is stable, then capture.')
      return
    }

    // Median sampling rejects brief blinks and saccades better than an average.
    const avgX = median(recent.map((point) => point.x))
    const avgY = median(recent.map((point) => point.y))

    const sample: CalibrationPoint = {
      screenX: currentTarget.x,
      screenY: currentTarget.y,
      gazeX: avgX,
      gazeY: avgY,
      timestamp: Date.now()
    }

    playBeep()
    setError(null)

    const nextSamples = [...finalizedSamplesRef.current, sample]
    finalizedSamplesRef.current = nextSamples
    samplesBufferRef.current = []
    setSampleCount(0)

    if (currentIndex < targets.length - 1) {
      setCurrentIndex((i) => i + 1)
      return
    }

    // All points finished!
    try {
      const matrix = calibrationService.finishCalibration(nextSamples, gridMode)
      setCompletedMatrix(matrix)
      void calibrationService.saveCalibration(matrix).catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to save calibration.')
      })
    } catch (finishError) {
      setError(
        finishError instanceof Error ? finishError.message : 'Failed to compute calibration matrix.'
      )
    }
  }, [completedMatrix, currentIndex, currentTarget.x, currentTarget.y, gridMode, hasStarted, targets.length])

  // Keybindings: Spacebar or Enter to capture instantly; Esc to exit
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        if (!hasStarted) {
          setHasStarted(true)
        } else if (completedMatrix) {
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
  }, [capturePoint, completedMatrix, hasStarted, isSettling, onCancel, onComplete])

  // Buffer live samples.
  useEffect(() => {
    if (!hasStarted || completedMatrix || isSettling) return
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
    setSampleCount(samplesBufferRef.current.length)
  }, [completedMatrix, gazePoint, hasStarted, isSettling, minConfidence])

  // Initial Pre-Calibration Mode Selection Screen
  if (!hasStarted) {
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
            maxWidth: 560,
            width: '100%',
            bgcolor: '#1e293b',
            color: '#f8fafc',
            textAlign: 'center',
            borderRadius: 3,
            border: '1px solid #334155'
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: -0.5 }}>
            Eye Calibration Setup
          </Typography>
          {profileName ? (
            <Chip label={`Profile: ${profileName}`} color="primary" sx={{ mb: 2, fontWeight: 700 }} />
          ) : null}
          <Typography variant="body1" sx={{ color: '#cbd5e1', mb: 3 }}>
            Choose calibration precision level. Look directly at each target circle and press{' '}
            <b>[Spacebar]</b> when you are focused on it.
          </Typography>

          <FormControl component="fieldset" sx={{ mb: 4, width: '100%' }}>
            <RadioGroup
              value={gridMode}
              onChange={(e) => setGridMode(e.target.value as CalibrationGridMode)}
            >
              <Paper
                sx={{
                  p: 2,
                  mb: 1.5,
                  bgcolor: gridMode === '5-point' ? 'rgba(59, 130, 246, 0.15)' : '#0f172a',
                  border: `1.5px solid ${gridMode === '5-point' ? '#3b82f6' : '#334155'}`,
                  borderRadius: 2,
                  cursor: 'pointer'
                }}
                onClick={() => setGridMode('5-point')}
              >
                <FormControlLabel
                  value="5-point"
                  control={<Radio sx={{ color: '#38bdf8', '&.Mui-checked': { color: '#38bdf8' } }} />}
                  label={
                    <Box sx={{ textAlign: 'left', ml: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                        5-Point Calibration (Fast & Comfortable)
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        Samples 4 screen corners and center. Quick calibration ideal for everyday web browsing.
                      </Typography>
                    </Box>
                  }
                />
              </Paper>

              <Paper
                sx={{
                  p: 2,
                  bgcolor: gridMode === '9-point' ? 'rgba(16, 185, 129, 0.15)' : '#0f172a',
                  border: `1.5px solid ${gridMode === '9-point' ? '#10b981' : '#334155'}`,
                  borderRadius: 2,
                  cursor: 'pointer'
                }}
                onClick={() => setGridMode('9-point')}
              >
                <FormControlLabel
                  value="9-point"
                  control={<Radio sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' } }} />}
                  label={
                    <Box sx={{ textAlign: 'left', ml: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                        9-Point Calibration (High Precision 3×3 Grid)
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        Samples 9 points across edges and midpoints. Highest accuracy for precision cursor control.
                      </Typography>
                    </Box>
                  }
                />
              </Paper>
            </RadioGroup>
          </FormControl>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => setHasStarted(true)}
              sx={{ fontWeight: 'bold', px: 4 }}
            >
              Start Calibration (Spacebar)
            </Button>
            <Button variant="outlined" color="inherit" size="large" onClick={onCancel}>
              Cancel (Esc)
            </Button>
          </Stack>
        </Paper>
      </Box>
    )
  }

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
            maxWidth: 540,
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
          <Typography variant="h6" sx={{ color: '#94a3b8', mb: 1 }}>
            Calculated Accuracy: <b>{Math.round(completedMatrix.accuracy)}%</b> ({gridMode})
          </Typography>
          <Typography variant="body1" sx={{ color: '#cbd5e1', mb: 3 }}>
            Your personalized eye profile has been saved. You can start using I-Track or verify your accuracy with test targets.
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center" sx={{ flexWrap: 'wrap', gap: 1.5 }}>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={() => onComplete(completedMatrix)}
              sx={{ fontWeight: 'bold', px: 3 }}
            >
              Start Using I-Track
            </Button>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => setShowAccuracyModal(true)}
              sx={{ fontWeight: 'bold' }}
            >
              Verify Accuracy
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="large"
              onClick={() => {
                finalizedSamplesRef.current = []
                samplesBufferRef.current = []
                setSampleCount(0)
                setCompletedMatrix(null)
                setCurrentIndex(0)
              }}
            >
              Recalibrate
            </Button>
          </Stack>
        </Paper>

        <AccuracyTestModal
          open={showAccuracyModal}
          gazePoint={gazePoint}
          matrix={completedMatrix}
          onClose={() => setShowAccuracyModal(false)}
          onRecalibrate={() => {
            setShowAccuracyModal(false)
            finalizedSamplesRef.current = []
            samplesBufferRef.current = []
            setSampleCount(0)
            setCompletedMatrix(null)
            setCurrentIndex(0)
          }}
        />
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
          Point {targetNames[currentIndex]}
        </Typography>
        <Typography variant="body1" sx={{ color: '#94a3b8', mb: 1 }}>
          Look directly at the target. Press <b>[Spacebar]</b> once the sample counter reaches 12/12.
        </Typography>

        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
          <Chip
            label={`Target ${currentIndex + 1} of ${targets.length} · ${Math.min(sampleCount, MIN_CAPTURE_SAMPLES)}/${MIN_CAPTURE_SAMPLES} samples (${gridMode})`}
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
          disabled={isSettling || sampleCount < MIN_CAPTURE_SAMPLES}
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
