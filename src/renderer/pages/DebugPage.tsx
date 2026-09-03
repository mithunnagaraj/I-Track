import { Box, Typography } from '@mui/material'
import { GazeOverlay } from '../components/GazeOverlay'
import { pageSx } from './styles'

export const DebugPage = (): JSX.Element => {
  return (
    <Box sx={pageSx}>
      <Typography variant="h6">Debug</Typography>
      <GazeOverlay enabled />
    </Box>
  )
}
