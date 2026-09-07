import { Box, Button, Stack } from '@mui/material'
import { StatusPanel } from '../components/StatusPanel'
import { pageSx } from './styles'

interface HomePageProps {
  cameraReady: boolean
  trackingActive: boolean
  confidence: number
  fps: number
  hasCalibration?: boolean
  onStart: () => void
  onStop: () => void
  onOpenCalibration: () => void
  onOpenSettings: () => void
  onCenterGaze?: () => void
  onClearCalibration?: () => void
}

export const HomePage = ({
  cameraReady,
  trackingActive,
  confidence,
  fps,
  hasCalibration,
  onStart,
  onStop,
  onOpenCalibration,
  onOpenSettings,
  onCenterGaze,
  onClearCalibration
}: HomePageProps): JSX.Element => {
  return (
    <Box sx={pageSx}>
      <StatusPanel
        cameraReady={cameraReady}
        trackingActive={trackingActive}
        confidence={confidence}
        fps={fps}
        hasCalibration={hasCalibration}
      />
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        <Button variant="contained" color="primary" onClick={onStart}>
          {trackingActive ? 'Restart Tracking' : 'Start Tracking'}
        </Button>
        <Button variant="outlined" color="inherit" onClick={onStop}>
          Stop
        </Button>
        <Button variant="outlined" color="secondary" onClick={onOpenCalibration}>
          Calibrate
        </Button>
        {onCenterGaze ? (
          <Button variant="contained" color="success" onClick={onCenterGaze}>
            Center Gaze
          </Button>
        ) : null}
        {hasCalibration && onClearCalibration ? (
          <Button variant="outlined" color="warning" onClick={onClearCalibration}>
            Reset Calibration
          </Button>
        ) : null}
        <Button variant="outlined" onClick={onOpenSettings}>
          Settings
        </Button>
      </Stack>
    </Box>
  )
}
