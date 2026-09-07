import { Paper, Stack, Typography } from '@mui/material'

interface StatusPanelProps {
  cameraReady: boolean
  trackingActive: boolean
  confidence: number
  fps: number
  hasCalibration?: boolean
}

export const StatusPanel = ({
  cameraReady,
  trackingActive,
  confidence,
  fps,
  hasCalibration
}: StatusPanelProps): JSX.Element => {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Typography variant="body2">Camera: {cameraReady ? 'Ready' : 'Not ready'}</Typography>
        <Typography variant="body2">
          Tracking: {trackingActive ? 'Active (Gaze dot following)' : 'Stopped'}
        </Typography>
        <Typography variant="body2">
          Confidence: {Math.round(confidence * 100)}% | FPS: {fps} | Calibration:{' '}
          {hasCalibration ? 'Calibrated' : 'Default (Uncalibrated)'}
        </Typography>
      </Stack>
    </Paper>
  )
}
