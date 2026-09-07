import { Box, Button, Stack, Typography } from '@mui/material'
import { SettingsForm } from '../components/SettingsForm'
import { pageSx } from './styles'
import type { CalibrationProfile } from '../types/calibration'
import type { DisplayInfo, UpdateInfo } from '../types/ipc'
import type { Settings } from '../types/settings'

interface SettingsPageProps {
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
  onUpdateSettings: (partial: Partial<Settings>) => void
  onResetSettings: () => void
  onBack: () => void
  onCenterGaze?: () => void
  onClearCalibration?: () => void
  onRunAccuracyTest?: () => void
}

export const SettingsPage = ({
  settings,
  displays,
  calibrationAgeDays,
  profiles,
  activeProfile,
  updateInfo,
  onCheckUpdates,
  onDownloadUpdate,
  onInstallUpdate,
  onSelectProfile,
  onCreateProfile,
  onDeleteProfile,
  onUpdateSettings,
  onResetSettings,
  onBack,
  onCenterGaze,
  onClearCalibration,
  onRunAccuracyTest
}: SettingsPageProps): JSX.Element => {
  return (
    <Box sx={pageSx}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: -0.5 }}>
          Settings &amp; Preferences
        </Typography>
        <Button variant="outlined" onClick={onBack}>
          ← Back to Dashboard
        </Button>
      </Stack>
      <SettingsForm
        settings={settings}
        displays={displays}
        calibrationAgeDays={calibrationAgeDays}
        profiles={profiles}
        activeProfile={activeProfile}
        updateInfo={updateInfo}
        onCheckUpdates={onCheckUpdates}
        onDownloadUpdate={onDownloadUpdate}
        onInstallUpdate={onInstallUpdate}
        onSelectProfile={onSelectProfile}
        onCreateProfile={onCreateProfile}
        onDeleteProfile={onDeleteProfile}
        onChange={onUpdateSettings}
        onReset={onResetSettings}
        onCenterGaze={onCenterGaze}
        onClearCalibration={onClearCalibration}
        onRunAccuracyTest={onRunAccuracyTest}
      />
      <Box sx={{ mt: 3 }}>
        <Button variant="contained" color="primary" onClick={onBack} sx={{ fontWeight: 'bold' }}>
          Done &amp; Return to Dashboard
        </Button>
      </Box>
    </Box>
  )
}
