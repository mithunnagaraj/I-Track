import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import {
  calibrationService,
  VERIFICATION_TARGETS,
  VERIFICATION_TARGET_NAMES
} from '../services/calibrationService'
import type { AccuracyTestResult, CalibrationMatrix } from '../types/calibration'
import type { GazePoint } from '../types/gaze'

interface AccuracyTestModalProps {
  open: boolean
  gazePoint: GazePoint | null
  matrix: CalibrationMatrix | null
  onClose: () => void
  onRecalibrate: () => void
}

const SETTLE_DELAY_MS = 400
const MIN_SAMPLES = 10

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

export const AccuracyTestModal = ({
  open,
  gazePoint,
  matrix,
  onClose,
  onRecalibrate
}: AccuracyTestModalProps): JSX.Element => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSettling, setIsSettling] = useState(true)
  const [sampleCount, setSampleCount] = useState(0)
  const [testResult, setTestResult] = useState<AccuracyTestResult | null>(null)
  const [samples, setSamples] = useState<
    Array<{ targetX: number; targetY: number; gazeX: number; gazeY: number }>
  >([])

  const rawBufferRef = useRef<Array<{ x: number; y: number }>>([])
  const settleTimerRef = useRef<number | null>(null)

  const currentTarget = VERIFICATION_TARGETS[currentIndex] ?? VERIFICATION_TARGETS[0]

  // Reset when opened
  useEffect(() => {
    if (open) {
      setCurrentIndex(0)
      setIsSettling(true)
      setSampleCount(0)
      setTestResult(null)
      setSamples([])
      rawBufferRef.current = []
    }
  }, [open])

  // Handle settle delay on index change
  useEffect(() => {
    if (!open || testResult) return
    setIsSettling(true)
    rawBufferRef.current = []
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
  }, [currentIndex, open, testResult])

  // Buffer calibrated gaze samples
  useEffect(() => {
    if (!open || testResult || isSettling || !gazePoint) return

    const calibrated = calibrationService.applyCalibration(
      {
        x: gazePoint.rawX ?? gazePoint.x,
        y: gazePoint.rawY ?? gazePoint.y
      },
      matrix
    )

    rawBufferRef.current.push({ x: calibrated.x, y: calibrated.y })
    if (rawBufferRef.current.length > 25) {
      rawBufferRef.current = rawBufferRef.current.slice(-25)
    }
    setSampleCount(rawBufferRef.current.length)
  }, [gazePoint, isSettling, matrix, open, testResult])

  const captureVerificationPoint = useCallback(() => {
    if (testResult) return

    const recent = rawBufferRef.current.slice(-15)
    if (recent.length < MIN_SAMPLES) return

    const avgX = median(recent.map((p) => p.x))
    const avgY = median(recent.map((p) => p.y))

    const newSample = {
      targetX: currentTarget.x,
      targetY: currentTarget.y,
      gazeX: avgX,
      gazeY: avgY
    }

    const nextSamples = [...samples, newSample]
    setSamples(nextSamples)
    rawBufferRef.current = []
    setSampleCount(0)

    if (currentIndex < VERIFICATION_TARGETS.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      // Evaluate all 5 verification points
      const result = calibrationService.evaluateAccuracy(
        nextSamples,
        window.innerWidth,
        window.innerHeight
      )
      setTestResult(result)
    }
  }, [currentIndex, currentTarget.x, currentTarget.y, samples, testResult])

  // Keybindings (Spacebar to capture, Escape to close)
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        if (!testResult && !isSettling && sampleCount >= MIN_SAMPLES) {
          captureVerificationPoint()
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [captureVerificationPoint, isSettling, onClose, open, sampleCount, testResult])

  if (!open) return <></>

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: '#0b0f19',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3
        }
      }}
    >
      {testResult ? (
        // Results & Diagnostic Report Screen
        <Box sx={{ maxWidth: 840, width: '100%', my: 'auto', p: 3 }}>
          <Paper
            elevation={6}
            sx={{
              p: 4,
              bgcolor: '#1e293b',
              color: '#f8fafc',
              borderRadius: 3,
              border: '1px solid #334155'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Accuracy Test Results
              </Typography>
              <Chip
                label={`${testResult.rating.toUpperCase()} (${testResult.accuracyPercentage}%)`}
                color={
                  testResult.rating === 'excellent'
                    ? 'success'
                    : testResult.rating === 'good'
                      ? 'primary'
                      : testResult.rating === 'fair'
                        ? 'warning'
                        : 'error'
                }
                sx={{ fontWeight: 'bold', fontSize: '1rem', px: 1 }}
              />
            </Stack>

            <Typography variant="body1" sx={{ color: '#cbd5e1', mb: 3 }}>
              Mean Error Offset: <b>{testResult.meanErrorPx ?? 0} px</b> (~
              {Math.round(testResult.meanErrorDistance * 100)}% of screen width).
              {testResult.rating === 'excellent' &&
                ' Your eye tracking profile has exceptional precision across all screen zones!'}
              {testResult.rating === 'good' &&
                ' Tracking precision is good and ready for daily desktop control.'}
              {testResult.rating === 'fair' &&
                ' Tracking has minor drift in certain quadrants. A quick recalibration may improve precision.'}
              {testResult.rating === 'poor' &&
                ' Significant offset detected. Please recalibrate in good lighting while facing the camera.'}
            </Typography>

            {/* Error Vector Table */}
            <TableContainer component={Paper} sx={{ bgcolor: '#0f172a', mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Target Zone</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Target Coord</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Measured Gaze</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Offset (px)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {testResult.targets.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell sx={{ color: '#f8fafc', fontWeight: 600 }}>{t.name}</TableCell>
                      <TableCell sx={{ color: '#94a3b8' }}>
                        {Math.round(t.targetX * 100)}%, {Math.round(t.targetY * 100)}%
                      </TableCell>
                      <TableCell sx={{ color: '#94a3b8' }}>
                        {Math.round(t.measuredX * 100)}%, {Math.round(t.measuredY * 100)}%
                      </TableCell>
                      <TableCell
                        sx={{
                          color:
                            (t.errorPx ?? 0) < 45
                              ? '#10b981'
                              : (t.errorPx ?? 0) < 90
                                ? '#38bdf8'
                                : '#f59e0b',
                          fontWeight: 700
                        }}
                      >
                        {t.errorPx} px
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 2, borderColor: '#334155' }} />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => {
                  setCurrentIndex(0)
                  setIsSettling(true)
                  setSampleCount(0)
                  setTestResult(null)
                  setSamples([])
                }}
              >
                Re-test
              </Button>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => {
                  onClose()
                  onRecalibrate()
                }}
              >
                Recalibrate Profile
              </Button>
              <Button variant="contained" color="primary" onClick={onClose} sx={{ fontWeight: 'bold' }}>
                Done
              </Button>
            </Stack>
          </Paper>
        </Box>
      ) : (
        // Active Target Sampling View
        <>
          <Box sx={{ textAlign: 'center', zIndex: 10, maxWidth: 650 }}>
            <DialogTitle sx={{ p: 0, fontWeight: 800, fontSize: '1.5rem', mb: 0.5 }}>
              Accuracy Verification: {VERIFICATION_TARGET_NAMES[currentIndex]}
            </DialogTitle>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
              Look directly at the yellow verification target. Once the counter reaches 10/10, press{' '}
              <b>[Spacebar]</b>.
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center">
              <Chip
                label={`Target ${currentIndex + 1} of ${VERIFICATION_TARGETS.length} · ${Math.min(sampleCount, MIN_SAMPLES)}/${MIN_SAMPLES} samples`}
                color="secondary"
                size="small"
                sx={{ fontWeight: 600 }}
              />
              {gazePoint ? (
                <Chip
                  label={`Signal: ${Math.round(gazePoint.confidence * 100)}%`}
                  color="success"
                  size="small"
                />
              ) : null}
            </Stack>
          </Box>

          {/* Test Target Reticle */}
          <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
            <Box
              onClick={sampleCount >= MIN_SAMPLES ? captureVerificationPoint : undefined}
              sx={{
                position: 'absolute',
                left: `${currentTarget.x * 100}%`,
                top: `${currentTarget.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 72,
                height: 72,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: sampleCount >= MIN_SAMPLES ? 'pointer' : 'default',
                transition: 'left 0.25s ease-out, top 0.25s ease-out'
              }}
            >
              {/* Outer Glow */}
              <Box
                sx={{
                  position: 'absolute',
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  bgcolor: sampleCount >= MIN_SAMPLES ? 'rgba(16, 185, 129, 0.25)' : 'rgba(234, 179, 8, 0.25)',
                  border: `2px dashed ${sampleCount >= MIN_SAMPLES ? '#10b981' : '#eab308'}`,
                  animation: 'spin 4s linear infinite',
                  '@keyframes spin': {
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }}
              />
              {/* Center Target */}
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  bgcolor: sampleCount >= MIN_SAMPLES ? '#10b981' : '#eab308',
                  boxShadow: `0 0 16px ${sampleCount >= MIN_SAMPLES ? '#10b981' : '#eab308'}`,
                  border: '2.5px solid #ffffff'
                }}
              />
            </Box>
          </DialogContent>

          {/* Footer */}
          <Stack direction="row" spacing={2} sx={{ zIndex: 10 }}>
            <Button
              variant="contained"
              color="secondary"
              disabled={isSettling || sampleCount < MIN_SAMPLES}
              onClick={captureVerificationPoint}
            >
              Capture Test Target (Spacebar)
            </Button>
            <Button variant="outlined" color="inherit" onClick={onClose}>
              Cancel (Esc)
            </Button>
          </Stack>
        </>
      )}
    </Dialog>
  )
}
