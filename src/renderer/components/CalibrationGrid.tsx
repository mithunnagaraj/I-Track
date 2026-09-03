import { Box } from '@mui/material'
import type { ScreenPoint } from '../types/calibration'

interface CalibrationGridProps {
  point: ScreenPoint
}

export const CalibrationGrid = ({ point }: CalibrationGridProps): JSX.Element => {
  return (
    <Box sx={{ position: 'relative', width: '100%', height: 320, border: '1px dashed #555' }}>
      <Box
        sx={{
          position: 'absolute',
          left: `${point.x * 100}%`,
          top: `${point.y * 100}%`,
          width: 20,
          height: 20,
          borderRadius: '50%',
          bgcolor: 'error.main',
          transform: 'translate(-50%, -50%)'
        }}
      />
    </Box>
  )
}
