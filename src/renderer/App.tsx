import { useEffect, useMemo, useRef, useState } from 'react'
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
  const { settings } = useSettings()
  const calibration = useCalibration()
  const applyCalibration = calibration.apply
  const {
    gazePoint,
    isTracking,
    isReady,
    error: trackerError,
    initialize,
    startTracking,
    stopTracking,
    attachVideoElement
  } = useGazeTracker()

  const calibratedGaze = useMemo(() => {
    if (!gazePoint) return null
    const mapped = applyCalibration({
      x: gazePoint.rawX ?? gazePoint.x,
      y: gazePoint.rawY ?? gazePoint.y
    })
    return {
      ...gazePoint,
      x: mapped.x,
      y: mapped.y
    }
  }, [applyCalibration, gazePoint])

  useMouseControl(
    isTracking && settings.trackingEnabled,
    gazePoint,
    settings.minConfidence,
    settings.mouseSmoothing
  )

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
      return <SettingsPage onBack={() => setView('home')} />
    }

    if (view === 'calibration') {
      return (
        <CalibrationPage
          gazePoint={gazePoint}
          minConfidence={Math.min(settings.minConfidence, 0.2)}
          onCancel={() => setView('home')}
          onComplete={() => {
            setView('home')
          }}
        />
      )
    }

    return (
      <HomePage
        cameraReady={stream !== null && isReady}
        trackingActive={isTracking}
        confidence={confidence}
        fps={fps}
        onStart={() => {
          void startTracking()
        }}
        onStop={stopTracking}
        onOpenCalibration={() => setView('calibration')}
        onOpenSettings={() => setView('settings')}
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
              ? 'Tracking active. Move your eyes/head and the red dot should follow.'
              : 'Tracking active, but no face landmarks yet. Face the camera and improve lighting.'
            : 'Camera ready. Click Start to begin gaze tracking.')}
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
