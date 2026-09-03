import { Button, FormControlLabel, Slider, Stack, Switch, Typography } from '@mui/material'
import type { Settings } from '../types/settings'

interface SettingsFormProps {
  settings: Settings
  onChange: (partial: Partial<Settings>) => void
  onReset: () => void
}

export const SettingsForm = ({ settings, onChange, onReset }: SettingsFormProps): JSX.Element => {
  const toSliderValue = (value: number | number[]): number => (Array.isArray(value) ? value[0] : value)

  return (
    <Stack spacing={2}>
      <FormControlLabel
        control={
          <Switch
            checked={settings.trackingEnabled}
            onChange={(event) => onChange({ trackingEnabled: event.target.checked })}
          />
        }
        label="Enable Tracking"
      />
      <Typography variant="body2">Smoothing: {settings.mouseSmoothing.toFixed(2)}</Typography>
      <Slider
        min={0.1}
        max={0.9}
        step={0.05}
        value={settings.mouseSmoothing}
        onChange={(_event, value) => onChange({ mouseSmoothing: toSliderValue(value) })}
      />
      <Typography variant="body2">Minimum Confidence: {settings.minConfidence.toFixed(2)}</Typography>
      <Slider
        min={0.2}
        max={0.95}
        step={0.05}
        value={settings.minConfidence}
        onChange={(_event, value) => onChange({ minConfidence: toSliderValue(value) })}
      />
      <Button variant="outlined" onClick={onReset}>
        Reset to defaults
      </Button>
    </Stack>
  )
}
