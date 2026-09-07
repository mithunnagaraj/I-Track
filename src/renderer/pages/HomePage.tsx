import {
  Alert,
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material'
import { StatusPanel } from '../components/StatusPanel'
import { pageSx } from './styles'
import type { CalibrationGridMode, CalibrationProfile } from '../types/calibration'
import type { UpdateInfo } from '../types/ipc'

interface HomePageProps {
  cameraReady: boolean
  trackingActive: boolean
  confidence: number
  fps: number
  hasCalibration?: boolean
  calibrationAccuracy?: number | null
  calibrationAgeDays?: number | null
  activeDisplayLabel?: string
  activeProfileName?: string
  profiles?: CalibrationProfile[]
  activeProfileId?: string
  gridMode?: CalibrationGridMode
  gpuAcceleration?: boolean
  updateInfo?: UpdateInfo
  showCalibrationPrompt?: boolean
  debugModeEnabled?: boolean
  onStart: () => void
  onStop: () => void
  onOpenCalibration: () => void
  onOpenSettings: () => void
  onOpenAccuracyTest?: () => void
  onSelectProfile?: (profileId: string) => void
  onToggleDebug?: () => void
  onCenterGaze?: () => void
  onClearCalibration?: () => void
  onDownloadUpdate?: () => void
  onInstallUpdate?: () => void
}

export const HomePage = ({
  cameraReady,
  trackingActive,
  confidence,
  fps,
  hasCalibration,
  calibrationAccuracy,
  calibrationAgeDays,
  activeDisplayLabel,
  activeProfileName,
  profiles = [],
  activeProfileId = 'default',
  gridMode = '5-point',
  gpuAcceleration = true,
  updateInfo,
  showCalibrationPrompt,
  debugModeEnabled,
  onStart,
  onStop,
  onOpenCalibration,
  onOpenSettings,
  onOpenAccuracyTest,
  onSelectProfile,
  onToggleDebug,
  onCenterGaze,
  onClearCalibration,
  onDownloadUpdate,
  onInstallUpdate
}: HomePageProps): JSX.Element => {
  return (
    <Box sx={pageSx}>
      {/* Update Available Banner (Feature 3.3) */}
      {updateInfo?.state === 'available' && (
        <Alert
          severity="info"
          variant="filled"
          action={
            onDownloadUpdate && (
              <Button color="inherit" size="small" variant="outlined" onClick={onDownloadUpdate}>
                Download v{updateInfo.version}
              </Button>
            )
          }
          sx={{ mb: 2, borderRadius: 2 }}
        >
          🚀 A new version (v{updateInfo.version}) of I-Track is ready to download!
        </Alert>
      )}

      {updateInfo?.state === 'downloaded' && (
        <Alert
          severity="success"
          variant="filled"
          action={
            onInstallUpdate && (
              <Button color="inherit" size="small" variant="outlined" onClick={onInstallUpdate}>
                Restart Now
              </Button>
            )
          }
          sx={{ mb: 2, borderRadius: 2 }}
        >
          ✓ Update ready! Restart I-Track to apply new features and optimizations.
        </Alert>
      )}

      {/* Auto-Calibration Stale / Missing Reminder Alert */}
      {showCalibrationPrompt && (
        <Alert
          severity="info"
          variant="filled"
          action={
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              onClick={onOpenCalibration}
              sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
            >
              Calibrate Now
            </Button>
          }
          sx={{ mb: 2.5, borderRadius: 2 }}
        >
          {hasCalibration
            ? `Calibration Reminder: Your calibration profile is ${
                typeof calibrationAgeDays === 'number' ? `${calibrationAgeDays} days` : 'several days'
              } old. Running a quick recalibration will refresh gaze precision.`
            : 'Get Started: Complete a quick calibration to map your gaze accurately to your screen.'}
        </Alert>
      )}

      {/* Visual Status Dashboard */}
      <StatusPanel
        cameraReady={cameraReady}
        trackingActive={trackingActive}
        confidence={confidence}
        fps={fps}
        hasCalibration={hasCalibration}
        calibrationAccuracy={calibrationAccuracy}
        calibrationAgeDays={calibrationAgeDays}
        activeDisplayLabel={activeDisplayLabel}
        activeProfileName={activeProfileName}
        gridMode={gridMode}
        gpuAcceleration={gpuAcceleration}
      />

      {/* Profile quick selector & actions */}
      {profiles.length > 1 && onSelectProfile && (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
            Active Profile:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={activeProfileId}
              onChange={(e) => onSelectProfile(e.target.value)}
              sx={{ bgcolor: '#1e293b', color: '#f8fafc', borderRadius: 2, height: 36 }}
            >
              {profiles.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} ({Math.round(p.matrix.accuracy)}%)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      )}

      {/* Action Toolbar */}
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap alignItems="center">
        <Button
          variant="contained"
          color={trackingActive ? 'primary' : 'success'}
          onClick={onStart}
          sx={{ px: 2.5, fontWeight: 600 }}
        >
          {trackingActive ? 'Restart Tracking' : '▶ Start Tracking'}
        </Button>
        <Button variant="outlined" color="inherit" onClick={onStop}>
          ⏹ Stop
        </Button>
        <Button variant="contained" color="secondary" onClick={onOpenCalibration} sx={{ fontWeight: 600 }}>
          🎯 Calibrate ({gridMode})
        </Button>
        {hasCalibration && onOpenAccuracyTest && (
          <Button variant="outlined" color="secondary" onClick={onOpenAccuracyTest} sx={{ fontWeight: 600 }}>
            Verify Accuracy
          </Button>
        )}
        {onCenterGaze && (
          <Button variant="outlined" color="primary" onClick={onCenterGaze}>
            Center Gaze
          </Button>
        )}
        {hasCalibration && onClearCalibration && (
          <Button variant="outlined" color="warning" onClick={onClearCalibration}>
            Reset Calibration
          </Button>
        )}
        {onToggleDebug && (
          <Button
            variant={debugModeEnabled ? 'contained' : 'outlined'}
            color={debugModeEnabled ? 'info' : 'inherit'}
            onClick={onToggleDebug}
          >
            {debugModeEnabled ? 'HUD Telemetry: ON' : 'HUD Telemetry: OFF'}
          </Button>
        )}
        <Button variant="outlined" onClick={onOpenSettings}>
          ⚙ Settings
        </Button>
      </Stack>
    </Box>
  )
}
