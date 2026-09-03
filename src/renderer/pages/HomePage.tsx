import { Box, Button, Stack } from '@mui/material'
import { StatusPanel } from '../components/StatusPanel'
import { pageSx } from './styles'

interface HomePageProps {
  cameraReady: boolean
  trackingActive: boolean
  confidence: number
  fps: number
  onStart: () => void
  onStop: () => void
  onOpenCalibration: () => void
  onOpenSettings: () => void
}

export const HomePage = ({
  cameraReady,
  trackingActive,
  confidence,
  fps,
  onStart,
  onStop,
  onOpenCalibration,
  onOpenSettings
}: HomePageProps): JSX.Element => {
  return (
    <Box sx={pageSx}>
      <StatusPanel
        cameraReady={cameraReady}
        trackingActive={trackingActive}
        confidence={confidence}
        fps={fps}
      />
      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={onStart}>
          Start
        </Button>
        <Button variant="outlined" onClick={onStop}>
          Stop
        </Button>
        <Button variant="outlined" onClick={onOpenCalibration}>
          Calibrate
        </Button>
        <Button variant="outlined" onClick={onOpenSettings}>
          Settings
        </Button>
      </Stack>
    </Box>
  )
}
