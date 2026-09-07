import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { CameraPreview } from './components/CameraPreview'
import { GazeVisualizer } from './components/GazeVisualizer'
import { useCalibration } from './hooks/useCalibration'
import { useCameraStream } from './hooks/useCameraStream'
import { useGazeTracker } from './hooks/useGazeTracker'
import { useMouseControl } from './hooks/useMouseControl'
import { useSettings } from './hooks/useSettings'
import { CalibrationPage } from './pages/CalibrationPage'
import { HomePage } from './pages/HomePage'
import { SettingsPage } from './pages/SettingsPage'

type AppView = 'home' | 'calibration' | 'settings'

export const App = (): JSX.Element => {
  const [view, setView] = useState<AppView>('home')
  const [fps, setFps] = useState(0)
  const lastTimestampRef = useRef<number | null>(null)
  const { stream, error: cameraError } = useCameraStream()
  const { settings, updateSettings, resetSettings } = useSettings()
  const calibration = useCalibration()
  const applyCalibration = calibration.apply

  const trackerOptions = useMemo(
    () => ({
      gainX: settings.gazeGainX,
      gainY: settings.gazeGainY,
      invertX: settings.invertX,
      invertY: settings.invertY,
      smoothing: settings.mouseSmoothing,
      baselineX: settings.baselineX,
      baselineY: settings.baselineY,
      headGainX: settings.headGainX,
      headGainY: settings.headGainY
    }),
    [
      settings.gazeGainX,
      settings.gazeGainY,
      settings.invertX,
      settings.invertY,
      settings.mouseSmoothing,
      settings.baselineX,
      settings.baselineY,
      settings.headGainX,
      settings.headGainY
    ]
  )

  const {
    gazePoint,
    isTracking,
    isReady,
    error: trackerError,
    initialize,
    startTracking,
    stopTracking,
    attachVideoElement
  } = useGazeTracker(trackerOptions)

  // Map raw gaze through calibration and apply user-configured alignment offsets
  const calibratedGaze = useMemo(() => {
    if (!gazePoint) return null
    let x = gazePoint.x
    let y = gazePoint.y

    if (calibration.matrix) {
      const mapped = applyCalibration({
        x: gazePoint.rawX ?? gazePoint.x,
        y: gazePoint.rawY ?? gazePoint.y
      })
      x = mapped.x
      y = mapped.y
    }

    const offsetX = settings.offsetX ?? 0
    const offsetY = settings.offsetY ?? 0
    return {
      ...gazePoint,
      x: Math.max(0, Math.min(1, x + offsetX)),
      y: Math.max(0, Math.min(1, y + offsetY))
    }
  }, [applyCalibration, calibration.matrix, gazePoint, settings.offsetX, settings.offsetY])

  // System mouse follows the exact calibrated gaze dot position
  useMouseControl(
    // Keep the OS cursor still while the calibration overlay is sampling gaze.
    // The visual dot remains active, but mouse movement would otherwise fight
    // target selection and make the five samples unreliable.
    isTracking && settings.trackingEnabled && view !== 'calibration',
    calibratedGaze,
    settings.minConfidence,
    settings.mouseSmoothing,
    settings.mouseSpeed
  )

  // One-click center gaze: sets baseline or offsets so current gaze becomes (0.5, 0.5)
  const handleCenterGaze = useCallback(() => {
    if (!gazePoint) return
    if (calibration.matrix) {
      const mapped = applyCalibration({
        x: gazePoint.rawX ?? gazePoint.x,
        y: gazePoint.rawY ?? gazePoint.y
      })
      updateSettings({
        offsetX: Math.round((0.5 - mapped.x) * 100) / 100,
        offsetY: Math.round((0.5 - mapped.y) * 100) / 100
      })
    } else {
      updateSettings({
        baselineX: Math.round((gazePoint.rawX ?? 0.5) * 1000) / 1000,
        baselineY: Math.round((gazePoint.rawY ?? 0.55) * 1000) / 1000,
        offsetX: 0,
        offsetY: 0
      })
    }
  }, [applyCalibration, calibration.matrix, gazePoint, updateSettings])

  const handleClearCalibration = useCallback(async () => {
    await calibration.clear()
    updateSettings({ offsetX: 0, offsetY: 0 })
  }, [calibration, updateSettings])

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    if (!gazePoint) return
    const now = gazePoint.timestamp
    const last = lastTimestampRef.current
    if (typeof last === 'number' && now > last) {
      const nextFps = Math.round(1000 / (now - last))
      setFps(Number.isFinite(nextFps) ? Math.max(0, Math.min(60, nextFps)) : 0)
    }
    lastTimestampRef.current = now
  }, [gazePoint])

  const confidence = calibratedGaze?.confidence ?? 0

  const renderView = () => {
    if (view === 'settings') {
      return (
        <SettingsPage
          settings={settings}
          onUpdateSettings={updateSettings}
          onResetSettings={resetSettings}
          onBack={() => setView('home')}
          onCenterGaze={handleCenterGaze}
          onClearCalibration={handleClearCalibration}
        />
      )
    }

    if (view === 'calibration') {
      return (
        <CalibrationPage
          gazePoint={gazePoint}
          minConfidence={Math.min(settings.minConfidence, 0.35)}
          onCancel={() => setView('home')}
          onComplete={(matrix) => {
            void calibration.save(matrix).then(() => {
              setView('home')
            })
          }}
          onClearCalibration={handleClearCalibration}
        />
      )
    }

    return (
      <HomePage
        cameraReady={stream !== null && isReady}
        trackingActive={isTracking}
        confidence={confidence}
        fps={fps}
        hasCalibration={calibration.matrix !== null}
        onStart={() => {
          void startTracking()
        }}
        onStop={stopTracking}
        onOpenCalibration={() => setView('calibration')}
        onOpenSettings={() => setView('settings')}
        onCenterGaze={handleCenterGaze}
        onClearCalibration={handleClearCalibration}
      />
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        I-Track
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {trackerError ??
          cameraError ??
          (isTracking
            ? gazePoint
              ? 'Tracking active. Move your eyes and the red dot will follow. Use "Center Gaze" if needed.'
              : 'Tracking active, but no face detected. Face the camera directly.'
            : 'Camera ready. Click Start to begin eye tracking.')}
      </Typography>
      <CameraPreview stream={stream} onVideoElement={attachVideoElement} />
      <Box sx={{ mt: 2 }}>{renderView()}</Box>
      <GazeVisualizer
        x={calibratedGaze?.x ?? 0.5}
        y={calibratedGaze?.y ?? 0.5}
        visible={settings.gazeVisualizerEnabled && calibratedGaze !== null}
      />
    </Box>
  )
}
