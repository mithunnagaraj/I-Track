import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Box, Button, Typography } from '@mui/material'
import { AccuracyTestModal } from './components/AccuracyTestModal'
import { CameraPreview } from './components/CameraPreview'
import { GazeOverlay } from './components/GazeOverlay'
import { GazeVisualizer } from './components/GazeVisualizer'
import { useCalibration } from './hooks/useCalibration'
import { useCameraStream } from './hooks/useCameraStream'
import { useGazeTracker } from './hooks/useGazeTracker'
import { useMouseControl } from './hooks/useMouseControl'
import { useSettings } from './hooks/useSettings'
import { calibrationService } from './services/calibrationService'
import { ipcService } from './services/ipcService'
import type { CalibrationProfile } from './types/calibration'
import type { DisplayInfo, UpdateInfo } from './types/ipc'
import { CalibrationPage } from './pages/CalibrationPage'
import { HomePage } from './pages/HomePage'
import { SettingsPage } from './pages/SettingsPage'

type AppView = 'home' | 'calibration' | 'settings'

export const App = (): JSX.Element => {
  const [view, setView] = useState<AppView>('home')
  const [fps, setFps] = useState(0)
  const [hasAccessibility, setHasAccessibility] = useState<boolean>(true)
  const [displays, setDisplays] = useState<DisplayInfo[]>([])
  const [profiles, setProfiles] = useState<CalibrationProfile[]>([])
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({ state: 'idle', version: '0.1.0' })
  const [accuracyModalOpen, setAccuracyModalOpen] = useState(false)

  const lastTimestampRef = useRef<number | null>(null)
  const { stream, error: cameraError } = useCameraStream()
  const { settings, updateSettings, resetSettings } = useSettings()
  const calibration = useCalibration()
  const applyCalibration = calibration.apply

  // Load Calibration Profiles
  const refreshProfiles = useCallback(async () => {
    try {
      const list = await calibrationService.listProfiles()
      setProfiles(list)
    } catch (err) {
      console.warn('Failed to load calibration profiles:', err)
    }
  }, [])

  useEffect(() => {
    void refreshProfiles()
  }, [refreshProfiles])

  // Updater status listener & auto-check on startup
  useEffect(() => {
    const unsubscribe = ipcService.onUpdateStatusChanged((info) => {
      setUpdateInfo(info)
    })
    if (settings.autoCheckUpdates) {
      void ipcService.checkForUpdates().then((info) => {
        setUpdateInfo(info)
      })
    }
    return () => {
      unsubscribe()
    }
  }, [settings.autoCheckUpdates])

  const refreshDisplays = useCallback(async () => {
    try {
      const list = await ipcService.getDisplays()
      setDisplays(list)
    } catch {
      // Fallback handled by ipcService
    }
  }, [])

  useEffect(() => {
    void refreshDisplays()
    window.addEventListener('focus', refreshDisplays)
    return () => {
      window.removeEventListener('focus', refreshDisplays)
    }
  }, [refreshDisplays])

  const activeDisplay = useMemo(() => {
    const idx = settings.screenIndex ?? 0
    return displays[idx] ?? displays[0] ?? null
  }, [displays, settings.screenIndex])

  const activeDisplayLabel = useMemo(() => {
    if (!activeDisplay) return undefined
    return `${activeDisplay.name} (${activeDisplay.bounds.width}×${activeDisplay.bounds.height})`
  }, [activeDisplay])

  const activeProfile = useMemo(() => {
    const id = settings.activeProfileId ?? 'default'
    return profiles.find((p) => p.id === id) ?? profiles[0] ?? null
  }, [profiles, settings.activeProfileId])

  const calibrationAgeDays = useMemo(() => {
    if (!calibration.matrix?.createdAt) return null
    const elapsedMs = Date.now() - calibration.matrix.createdAt
    return Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)))
  }, [calibration.matrix?.createdAt])

  const showCalibrationPrompt = useMemo(() => {
    if (!settings.autoCalibrationPrompt) return false
    if (!calibration.matrix) return true
    if (typeof calibrationAgeDays === 'number' && calibrationAgeDays >= (settings.calibrationRecency ?? 7)) {
      return true
    }
    return false
  }, [calibration.matrix, calibrationAgeDays, settings.autoCalibrationPrompt, settings.calibrationRecency])

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
      headGainY: settings.headGainY,
      targetFps: settings.targetFps,
      gpuAcceleration: settings.gpuAcceleration
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
      settings.headGainY,
      settings.targetFps,
      settings.gpuAcceleration
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
    isTracking && settings.trackingEnabled && view !== 'calibration',
    calibratedGaze,
    settings.minConfidence,
    settings.mouseSmoothing,
    settings.mouseSpeed,
    settings.screenIndex ?? 0
  )

  // Profile selection handler
  const handleSelectProfile = useCallback(
    async (profileId: string) => {
      const target = profiles.find((p) => p.id === profileId)
      if (target) {
        updateSettings({
          activeProfileId: profileId,
          calibrationMode: target.gridMode
        })
        await calibration.save(target.matrix)
      }
    },
    [calibration, profiles, updateSettings]
  )

  // Profile creation handler
  const handleCreateProfile = useCallback(
    async (name: string) => {
      const newId = `profile-${Date.now()}`
      const baseMatrix = calibration.matrix ?? {
        h: [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1]
        ],
        createdAt: Date.now(),
        accuracy: 90,
        gridMode: settings.calibrationMode ?? '5-point'
      }
      const newProfile: CalibrationProfile = {
        id: newId,
        name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        gridMode: settings.calibrationMode ?? '5-point',
        matrix: baseMatrix,
        isDefault: false
      }
      const updated = await calibrationService.saveProfile(newProfile)
      setProfiles(updated)
      updateSettings({ activeProfileId: newId })
      setView('calibration')
    },
    [calibration.matrix, settings.calibrationMode, updateSettings]
  )

  // Profile deletion handler
  const handleDeleteProfile = useCallback(
    async (profileId: string) => {
      const updated = await calibrationService.deleteProfile(profileId)
      setProfiles(updated)
      if (settings.activeProfileId === profileId) {
        const fallback = updated[0]?.id ?? 'default'
        updateSettings({ activeProfileId: fallback })
      }
    },
    [settings.activeProfileId, updateSettings]
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

  const checkAccessibility = useCallback(async () => {
    try {
      const allowed = await ipcService.checkAccessibility()
      setHasAccessibility(allowed)
    } catch {
      setHasAccessibility(true)
    }
  }, [])

  useEffect(() => {
    void checkAccessibility()
    window.addEventListener('focus', checkAccessibility)
    return () => {
      window.removeEventListener('focus', checkAccessibility)
    }
  }, [checkAccessibility])

  const handleRequestAccessibility = useCallback(async () => {
    await ipcService.requestAccessibility()
    window.setTimeout(() => {
      void checkAccessibility()
    }, 1500)
  }, [checkAccessibility])

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
          displays={displays}
          calibrationAgeDays={calibrationAgeDays}
          profiles={profiles}
          activeProfile={activeProfile}
          updateInfo={updateInfo}
          onCheckUpdates={() => {
            void ipcService.checkForUpdates().then((info) => setUpdateInfo(info))
          }}
          onDownloadUpdate={() => {
            void ipcService.downloadUpdate()
          }}
          onInstallUpdate={() => {
            void ipcService.quitAndInstallUpdate()
          }}
          onSelectProfile={handleSelectProfile}
          onCreateProfile={handleCreateProfile}
          onDeleteProfile={handleDeleteProfile}
          onUpdateSettings={updateSettings}
          onResetSettings={resetSettings}
          onBack={() => setView('home')}
          onCenterGaze={handleCenterGaze}
          onClearCalibration={handleClearCalibration}
          onRunAccuracyTest={() => setAccuracyModalOpen(true)}
        />
      )
    }

    if (view === 'calibration') {
      return (
        <CalibrationPage
          gazePoint={gazePoint}
          minConfidence={Math.min(settings.minConfidence, 0.35)}
          initialMode={settings.calibrationMode ?? '5-point'}
          profileName={activeProfile?.name}
          onCancel={() => setView('home')}
          onComplete={(matrix) => {
            void calibration.save(matrix).then(async () => {
              // Update active profile matrix if one exists
              if (activeProfile) {
                await calibrationService.saveProfile({
                  ...activeProfile,
                  matrix,
                  gridMode: matrix.gridMode ?? settings.calibrationMode ?? '5-point',
                  updatedAt: Date.now()
                })
                await refreshProfiles()
              }
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
        calibrationAccuracy={calibration.matrix?.accuracy ?? null}
        calibrationAgeDays={calibrationAgeDays}
        activeDisplayLabel={activeDisplayLabel}
        activeProfileName={activeProfile?.name ?? 'Default'}
        profiles={profiles}
        activeProfileId={settings.activeProfileId ?? 'default'}
        gridMode={settings.calibrationMode ?? '5-point'}
        gpuAcceleration={settings.gpuAcceleration ?? true}
        updateInfo={updateInfo}
        showCalibrationPrompt={showCalibrationPrompt}
        debugModeEnabled={settings.debugModeEnabled}
        onStart={() => {
          void startTracking()
        }}
        onStop={stopTracking}
        onOpenCalibration={() => setView('calibration')}
        onOpenSettings={() => setView('settings')}
        onOpenAccuracyTest={() => setAccuracyModalOpen(true)}
        onSelectProfile={handleSelectProfile}
        onToggleDebug={() => updateSettings({ debugModeEnabled: !settings.debugModeEnabled })}
        onCenterGaze={handleCenterGaze}
        onClearCalibration={handleClearCalibration}
        onDownloadUpdate={() => {
          void ipcService.downloadUpdate()
        }}
        onInstallUpdate={() => {
          void ipcService.quitAndInstallUpdate()
        }}
      />
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
        I-Track
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        {trackerError ??
          cameraError ??
          (isTracking
            ? gazePoint
              ? 'Tracking active. Move your eyes and the red dot will follow. Use "Center Gaze" if needed.'
              : 'Tracking active, but no face detected. Face the camera directly.'
            : 'Camera ready. Click Start to begin eye tracking.')}
      </Typography>
      {!hasAccessibility && (
        <Alert
          severity="warning"
          variant="filled"
          action={
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              onClick={handleRequestAccessibility}
              sx={{ fontWeight: 'bold' }}
            >
              Open System Settings
            </Button>
          }
          sx={{ mb: 2 }}
        >
          macOS Accessibility Permission Required: System mouse control is disabled until permission is
          granted in System Settings &gt; Privacy &amp; Security &gt; Accessibility.
        </Alert>
      )}
      <CameraPreview stream={stream} onVideoElement={attachVideoElement} />
      <Box sx={{ mt: 2 }}>{renderView()}</Box>
      <GazeVisualizer
        x={calibratedGaze?.x ?? 0.5}
        y={calibratedGaze?.y ?? 0.5}
        visible={view !== 'calibration' && settings.gazeVisualizerEnabled && calibratedGaze !== null}
      />
      <GazeOverlay
        enabled={Boolean(settings.debugModeEnabled && view !== 'calibration')}
        gazePoint={gazePoint}
        calibratedGaze={calibratedGaze}
        fps={fps}
        targetDisplay={activeDisplay}
        onClose={() => updateSettings({ debugModeEnabled: false })}
      />

      <AccuracyTestModal
        open={accuracyModalOpen}
        gazePoint={gazePoint}
        matrix={calibration.matrix}
        onClose={() => setAccuracyModalOpen(false)}
        onRecalibrate={() => {
          setAccuracyModalOpen(false)
          setView('calibration')
        }}
      />
    </Box>
  )
}
