import { Box, Typography } from '@mui/material'

interface GazeOverlayProps {
  enabled: boolean
}

export const GazeOverlay = ({ enabled }: GazeOverlayProps): JSX.Element | null => {
  if (!enabled) return null
  return (
    <Box sx={{ p: 1, border: '1px solid #444', borderRadius: 1 }}>
      <Typography variant="caption">Debug overlay enabled</Typography>
    </Box>
  )
}
