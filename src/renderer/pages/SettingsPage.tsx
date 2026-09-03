import { Box, Button, Typography } from '@mui/material'
import { SettingsForm } from '../components/SettingsForm'
import { useSettings } from '../hooks/useSettings'
import { pageSx } from './styles'

interface SettingsPageProps {
  onBack: () => void
}

export const SettingsPage = ({ onBack }: SettingsPageProps): JSX.Element => {
  const { settings, updateSettings, resetSettings } = useSettings()
  return (
    <Box sx={pageSx}>
      <Typography variant="h6">Settings</Typography>
      <SettingsForm settings={settings} onChange={updateSettings} onReset={resetSettings} />
      <Button variant="outlined" onClick={onBack}>
        Back
      </Button>
    </Box>
  )
}
