import { Box, Typography } from '@mui/material'
import { GazeOverlay } from '../components/GazeOverlay'
import { pageSx } from './styles'

export const DebugPage = (): JSX.Element => {
  return (
    <Box sx={pageSx}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        Debug & Telemetry
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Live telemetry HUD displays real-time 3D facial orientation, eye openness, confidence scores, and
        raw vs calibrated screen coordinates.
      </Typography>
      <GazeOverlay enabled />
    </Box>
  )
}
