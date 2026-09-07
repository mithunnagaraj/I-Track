import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import { APP_VERSION } from '../../shared/constants'
import type { CalibrationProfile } from '../types/calibration'
import type { DisplayInfo, TargetFps, UpdateInfo } from '../types/ipc'
import type { Settings } from '../types/settings'

interface SettingsFormProps {
  settings: Settings
  displays?: DisplayInfo[]
  calibrationAgeDays?: number | null
  profiles?: CalibrationProfile[]
  activeProfile?: CalibrationProfile | null
  updateInfo?: UpdateInfo
  onCheckUpdates?: () => void
  onDownloadUpdate?: () => void
  onInstallUpdate?: () => void
  onSelectProfile?: (profileId: string) => void
  onCreateProfile?: (name: string) => void
  onDeleteProfile?: (profileId: string) => void
  onChange: (partial: Partial<Settings>) => void
  onReset: () => void
  onCenterGaze?: () => void
  onClearCalibration?: () => void
  onRunAccuracyTest?: () => void
}

export const SettingsForm = ({
  settings,
  displays = [],
  calibrationAgeDays,
  profiles = [],
  activeProfile,
  updateInfo,
  onCheckUpdates,
  onDownloadUpdate,
  onInstallUpdate,
  onSelectProfile,
  onCreateProfile,
  onDeleteProfile,
  onChange,
  onReset,
  onCenterGaze,
  onClearCalibration,
  onRunAccuracyTest
}: SettingsFormProps): JSX.Element => {
  const [newProfileOpen, setNewProfileOpen] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')

  const toSliderValue = (value: number | number[]): number => (Array.isArray(value) ? value[0] : value)

  const handleCreateProfileSubmit = () => {
    if (newProfileName.trim() && onCreateProfile) {
      onCreateProfile(newProfileName.trim())
      setNewProfileName('')
      setNewProfileOpen(false)
    }
  }

  return (
    <Stack spacing={3}>
      {/* Calibration Profiles (Feature 3.2) */}
      <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#1e293b' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                Calibration Profiles
              </Typography>
              {activeProfile && (
                <Chip
                  size="small"
                  label={activeProfile.name}
                  color="primary"
                  sx={{ height: 22, fontWeight: 700 }}
                />
              )}
            </Stack>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Create and switch between tailored eye-calibration profiles (e.g. Work, Gaming, Reading).
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => setNewProfileOpen(true)}
            sx={{ fontWeight: 600 }}
          >
            + New Profile
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }} flexWrap="wrap">
          {profiles.length === 0 ? (
            <Box sx={{ p: 2, bgcolor: '#0f172a', borderRadius: 2, width: '100%' }}>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Default Profile active ({settings.calibrationMode ?? '5-point'} mode). Calibrate to customize your profile.
              </Typography>
            </Box>
          ) : (
            profiles.map((prof) => {
              const isSelected = (settings.activeProfileId ?? 'default') === prof.id
              return (
                <Card
                  key={prof.id}
                  variant="outlined"
                  sx={{
                    flex: '1 1 220px',
                    bgcolor: isSelected ? 'rgba(59, 130, 246, 0.15)' : '#0f172a',
                    borderColor: isSelected ? '#3b82f6' : '#334155',
                    borderRadius: 2
                  }}
                >
                  <CardActionArea onClick={() => onSelectProfile && onSelectProfile(prof.id)} sx={{ p: 1.5 }}>
                    <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                          {prof.name}
                        </Typography>
                        {isSelected && <Chip size="small" label="Active" color="primary" sx={{ height: 20 }} />}
                      </Stack>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
                        Accuracy: {Math.round(prof.matrix.accuracy)}% • {prof.gridMode ?? '5-point'}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                  {!prof.isDefault && onDeleteProfile && (
                    <Box sx={{ px: 1.5, pb: 1, textAlign: 'right' }}>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => onDeleteProfile(prof.id)}
                        sx={{ fontSize: '0.7rem', p: 0.2 }}
                      >
                        Delete
                      </Button>
                    </Box>
                  )}
                </Card>
              )
            })
          )}
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
          {onRunAccuracyTest && (
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={onRunAccuracyTest}
              sx={{ fontWeight: 600 }}
            >
              Verify Profile Accuracy (Test Mode)
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Performance & Power Optimization (Feature 3.1) */}
      <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#1e293b' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc', mb: 0.5 }}>
          Performance &amp; Hardware Acceleration
        </Typography>
        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2 }}>
          Optimize MediaPipe neural model execution for high performance or extended battery life.
        </Typography>

        <Stack spacing={2.5}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.gpuAcceleration ?? true}
                onChange={(event) => onChange({ gpuAcceleration: event.target.checked })}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#f8fafc' }}>
                  Hardware GPU Acceleration (WebGL Delegate)
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Uses dedicated GPU shaders for near-zero latency face mesh and iris landmark extraction.
                </Typography>
              </Box>
            }
          />

          <Divider sx={{ borderColor: '#334155' }} />

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#f8fafc', mb: 1 }}>
              Target Frame Rate &amp; Power Mode
            </Typography>
            <FormControl fullWidth size="small" sx={{ maxWidth: 360 }}>
              <InputLabel sx={{ color: '#94a3b8' }}>Power Mode</InputLabel>
              <Select
                value={settings.targetFps ?? 30}
                label="Power Mode"
                onChange={(e) => onChange({ targetFps: e.target.value as TargetFps })}
                sx={{ bgcolor: '#0f172a', color: '#f8fafc', borderRadius: 2 }}
              >
                <MenuItem value={15}>15 FPS — Battery Saver Mode (Low CPU/Power)</MenuItem>
                <MenuItem value={30}>30 FPS — Standard Performance (Recommended)</MenuItem>
                <MenuItem value={60}>60 FPS — Ultra High Precision (Maximum Refresh)</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
              Automatic adaptive background throttling drops to 5 FPS whenever the app is minimized or hidden.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Target Monitor (Multi-Monitor Support) */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
          Target Monitor (Multi-Monitor Support)
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Select which screen your eye gaze controls. High-DPI and multi-display coordinate spaces are
          automatically managed.
        </Typography>

        {displays.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Querying connected displays...
          </Typography>
        ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
            {displays.map((disp, index) => {
              const isSelected = (settings.screenIndex ?? 0) === index
              return (
                <Card
                  key={disp.id}
                  variant="outlined"
                  sx={{
                    flex: '1 1 200px',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'background.paper',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.4)' : 'none'
                  }}
                >
                  <CardActionArea
                    onClick={() => onChange({ screenIndex: index })}
                    sx={{ p: 1.5, height: '100%' }}
                  >
                    <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {disp.name}
                        </Typography>
                        {disp.isPrimary && (
                          <Chip size="small" label="Primary" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                        )}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {disp.bounds.width} × {disp.bounds.height} px
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Scale: {disp.scaleFactor}x • Position: ({disp.bounds.x}, {disp.bounds.y})
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              )
            })}
          </Stack>
        )}
      </Paper>

      {/* Tracking & Display */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          Tracking & Visibility
        </Typography>
        <Stack spacing={1}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.trackingEnabled}
                onChange={(event) => onChange({ trackingEnabled: event.target.checked })}
              />
            }
            label="Enable Eye Tracking & Mouse Movement"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.gazeVisualizerEnabled}
                onChange={(event) => onChange({ gazeVisualizerEnabled: event.target.checked })}
              />
            }
            label="Show Gaze Red Dot Overlay"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.debugModeEnabled}
                onChange={(event) => onChange({ debugModeEnabled: event.target.checked })}
              />
            }
            label="Show Real-Time Debug HUD (Telemetry Overlay)"
          />
        </Stack>
      </Paper>

      {/* Calibration Health & Prompts */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          Calibration & Recalibration Reminders
        </Typography>
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Calibration Status:{' '}
              {typeof calibrationAgeDays === 'number'
                ? calibrationAgeDays === 0
                  ? 'Calibrated Today'
                  : `Calibrated ${calibrationAgeDays} day${calibrationAgeDays === 1 ? '' : 's'} ago`
                : 'Not Yet Calibrated'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Recalibrating periodically maintains sub-pixel eye tracking accuracy across lighting changes.
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={settings.autoCalibrationPrompt ?? true}
                onChange={(event) => onChange({ autoCalibrationPrompt: event.target.checked })}
              />
            }
            label="Prompt For Recalibration When Calibration Is Stale"
          />

          {settings.autoCalibrationPrompt && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Recalibration Interval: {settings.calibrationRecency ?? 7} days
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Days before the dashboard prompts you to run a quick recalibration
              </Typography>
              <Slider
                min={1}
                max={30}
                step={1}
                value={settings.calibrationRecency ?? 7}
                onChange={(_event, value) => onChange({ calibrationRecency: toSliderValue(value) })}
              />
            </Box>
          )}

          <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
            {onCenterGaze && (
              <Button variant="contained" color="primary" onClick={onCenterGaze}>
                Center Gaze Right Now
              </Button>
            )}
            {onClearCalibration && (
              <Button variant="outlined" color="warning" onClick={onClearCalibration}>
                Clear Saved Calibration
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Movement Speed & Sensitivity */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          Mouse Speed & Sensitivity
        </Typography>
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Mouse Movement Speed: {(settings.mouseSpeed ?? 1.0).toFixed(2)}x
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Controls cursor speed across the screen
            </Typography>
            <Slider
              min={0.5}
              max={3.0}
              step={0.1}
              value={settings.mouseSpeed ?? 1.0}
              onChange={(_event, value) => onChange({ mouseSpeed: toSliderValue(value) })}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Horizontal Sensitivity (Gain X): {(settings.gazeGainX ?? 3.0).toFixed(2)}x
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Higher = reaches left/right screen edges with less eye strain
            </Typography>
            <Slider
              min={0.5}
              max={4.0}
              step={0.1}
              value={settings.gazeGainX ?? 3.0}
              onChange={(_event, value) => onChange({ gazeGainX: toSliderValue(value) })}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Vertical Eye Sensitivity (Gain Y): {(settings.gazeGainY ?? 2.3).toFixed(2)}x
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Higher = reaches top/bottom screen edges with less eye strain
            </Typography>
            <Slider
              min={0.5}
              max={5.0}
              step={0.1}
              value={settings.gazeGainY ?? 2.3}
              onChange={(_event, value) => onChange({ gazeGainY: toSliderValue(value) })}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Face Turn Sensitivity (Head Yaw): {(settings.headGainX ?? 0.6).toFixed(2)}x
            </Typography>
            <Typography variant="caption" color="text.secondary">
              How much turning your face left/right moves the cursor
            </Typography>
            <Slider
              min={0.2}
              max={4.0}
              step={0.1}
              value={settings.headGainX ?? 0.6}
              onChange={(_event, value) => onChange({ headGainX: toSliderValue(value) })}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Face Tilt Sensitivity (Head Pitch): {(settings.headGainY ?? 1.6).toFixed(2)}x
            </Typography>
            <Typography variant="caption" color="text.secondary">
              How much tilting your face up/down moves the cursor
            </Typography>
            <Slider
              min={0.2}
              max={4.0}
              step={0.1}
              value={settings.headGainY ?? 1.6}
              onChange={(_event, value) => onChange({ headGainY: toSliderValue(value) })}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Mouse Smoothing: {settings.mouseSmoothing.toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Lower = faster response; Higher = smoother, less jitter
            </Typography>
            <Slider
              min={0.05}
              max={0.8}
              step={0.05}
              value={settings.mouseSmoothing}
              onChange={(_event, value) => onChange({ mouseSmoothing: toSliderValue(value) })}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Minimum Confidence Threshold: {settings.minConfidence.toFixed(2)}
            </Typography>
            <Slider
              min={0.15}
              max={0.8}
              step={0.05}
              value={settings.minConfidence}
              onChange={(_event, value) => onChange({ minConfidence: toSliderValue(value) })}
            />
          </Box>
        </Stack>
      </Paper>

      {/* Axis & Alignment / Offset */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          Gaze Alignment & Direction
        </Typography>
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.invertX ?? true}
                onChange={(event) => onChange({ invertX: event.target.checked })}
              />
            }
            label="Invert Horizontal Axis (Recommended for Webcams)"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.invertY ?? false}
                onChange={(event) => onChange({ invertY: event.target.checked })}
              />
            }
            label="Invert Vertical Axis"
          />

          <Divider sx={{ my: 1 }} />

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Horizontal Nudge (Offset X): {(settings.offsetX ?? 0).toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Shift dot left or right to align with your gaze
            </Typography>
            <Slider
              min={-0.4}
              max={0.4}
              step={0.02}
              value={settings.offsetX ?? 0}
              onChange={(_event, value) => onChange({ offsetX: toSliderValue(value) })}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Vertical Nudge (Offset Y): {(settings.offsetY ?? 0).toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Shift dot up or down to align with your gaze
            </Typography>
            <Slider
              min={-0.4}
              max={0.4}
              step={0.02}
              value={settings.offsetY ?? 0}
              onChange={(_event, value) => onChange({ offsetY: toSliderValue(value) })}
            />
          </Box>
        </Stack>
      </Paper>

      {/* Auto-Updates & Version (Feature 3.3) */}
      <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#1e293b' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc' }}>
              Software Updates
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Current Version: <b>v{APP_VERSION}</b>
            </Typography>
          </Box>
          {onCheckUpdates && (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={onCheckUpdates}
              disabled={updateInfo?.state === 'checking' || updateInfo?.state === 'downloading'}
              startIcon={updateInfo?.state === 'checking' ? <CircularProgress size={14} /> : undefined}
            >
              {updateInfo?.state === 'checking' ? 'Checking...' : 'Check for Updates'}
            </Button>
          )}
        </Stack>

        {updateInfo?.state === 'not-available' && (
          <Alert severity="success" variant="outlined" sx={{ mt: 1.5 }}>
            I-Track is up to date (v{APP_VERSION}). You have the latest release.
          </Alert>
        )}

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
            sx={{ mt: 1.5 }}
          >
            A new update (v{updateInfo.version}) is available!
          </Alert>
        )}

        {updateInfo?.state === 'downloading' && (
          <Alert severity="info" variant="outlined" sx={{ mt: 1.5 }}>
            Downloading update... {updateInfo.progress ?? 0}%
          </Alert>
        )}

        {updateInfo?.state === 'downloaded' && (
          <Alert
            severity="success"
            variant="filled"
            action={
              onInstallUpdate && (
                <Button color="inherit" size="small" variant="outlined" onClick={onInstallUpdate}>
                  Restart &amp; Install
                </Button>
              )
            }
            sx={{ mt: 1.5 }}
          >
            Update downloaded! Restart to complete installation.
          </Alert>
        )}
      </Paper>

      {/* Reset button */}
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" color="secondary" onClick={onReset}>
          Reset Settings to Defaults
        </Button>
      </Stack>

      {/* Dialog for Creating New Profile */}
      <Dialog open={newProfileOpen} onClose={() => setNewProfileOpen(false)}>
        <DialogTitle>Create Calibration Profile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Profile Name (e.g. Gaming, Coding, Night Mode)"
            type="text"
            fullWidth
            variant="outlined"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNewProfileOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleCreateProfileSubmit}
            variant="contained"
            color="primary"
            disabled={!newProfileName.trim()}
          >
            Create &amp; Calibrate
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
