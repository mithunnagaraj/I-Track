import { Box, Button, Typography } from '@mui/material'
import { SettingsForm } from '../components/SettingsForm'
import { pageSx } from './styles'
import type { Settings } from '../types/settings'

interface SettingsPageProps {
  settings: Settings
  onUpdateSettings: (partial: Partial<Settings>) => void
  onResetSettings: () => void
  onBack: () => void
  onCenterGaze?: () => void
  onClearCalibration?: () => void
}

export const SettingsPage = ({
  settings,
  onUpdateSettings,
  onResetSettings,
  onBack,
  onCenterGaze,
  onClearCalibration
}: SettingsPageProps): JSX.Element => {
  return (
    <Box sx={pageSx}>
      <Typography variant="h6">Settings</Typography>
      <SettingsForm
        settings={settings}
        onChange={onUpdateSettings}
        onReset={onResetSettings}
        onCenterGaze={onCenterGaze}
        onClearCalibration={onClearCalibration}
      />
      <Button variant="outlined" onClick={onBack}>
        Back
      </Button>
    </Box>
  )
}
