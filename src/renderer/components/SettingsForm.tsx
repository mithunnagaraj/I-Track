import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  Paper,
  Slider,
  Stack,
  Switch,
  Typography
} from '@mui/material'
import type { Settings } from '../types/settings'

interface SettingsFormProps {
  settings: Settings
  onChange: (partial: Partial<Settings>) => void
  onReset: () => void
  onCenterGaze?: () => void
  onClearCalibration?: () => void
}

export const SettingsForm = ({
  settings,
  onChange,
  onReset,
  onCenterGaze,
  onClearCalibration
}: SettingsFormProps): JSX.Element => {
  const toSliderValue = (value: number | number[]): number => (Array.isArray(value) ? value[0] : value)

  return (
    <Stack spacing={3}>
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
            label="Enable Eye Tracking"
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
              Horizontal Sensitivity (Gain X): {(settings.gazeGainX ?? 2.0).toFixed(2)}x
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Higher = reaches left/right screen edges with less eye strain
            </Typography>
            <Slider
              min={0.5}
              max={4.0}
              step={0.1}
              value={settings.gazeGainX ?? 2.0}
              onChange={(_event, value) => onChange({ gazeGainX: toSliderValue(value) })}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Vertical Eye Sensitivity (Gain Y): {(settings.gazeGainY ?? 2.2).toFixed(2)}x
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Higher = reaches top/bottom screen edges with less eye strain
            </Typography>
            <Slider
              min={0.5}
              max={5.0}
              step={0.1}
              value={settings.gazeGainY ?? 2.2}
              onChange={(_event, value) => onChange({ gazeGainY: toSliderValue(value) })}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Face Turn Sensitivity (Head Yaw): {(settings.headGainX ?? 1.5).toFixed(2)}x
            </Typography>
            <Typography variant="caption" color="text.secondary">
              How much turning your face left/right moves the cursor
            </Typography>
            <Slider
              min={0.2}
              max={4.0}
              step={0.1}
              value={settings.headGainX ?? 1.5}
              onChange={(_event, value) => onChange({ headGainX: toSliderValue(value) })}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Face Tilt Sensitivity (Head Pitch): {(settings.headGainY ?? 1.5).toFixed(2)}x
            </Typography>
            <Typography variant="caption" color="text.secondary">
              How much tilting your face up/down moves the cursor
            </Typography>
            <Slider
              min={0.2}
              max={4.0}
              step={0.1}
              value={settings.headGainY ?? 1.5}
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

          {onCenterGaze ? (
            <Button variant="contained" color="primary" onClick={onCenterGaze}>
              Center Gaze Right Now
            </Button>
          ) : null}
        </Stack>
      </Paper>

      {/* Management buttons */}
      <Stack direction="row" spacing={2}>
        {onClearCalibration ? (
          <Button variant="outlined" color="warning" onClick={onClearCalibration}>
            Clear Saved Calibration
          </Button>
        ) : null}
        <Button variant="outlined" color="secondary" onClick={onReset}>
          Reset Settings to Defaults
        </Button>
      </Stack>
    </Stack>
  )
}
