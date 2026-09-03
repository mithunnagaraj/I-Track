import { Box } from '@mui/material'

interface GazeVisualizerProps {
  x: number
  y: number
  visible: boolean
}

export const GazeVisualizer = ({ x, y, visible }: GazeVisualizerProps): JSX.Element | null => {
  if (!visible) return null
  return (
    <Box
      sx={{
        position: 'fixed',
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: 'translate(-50%, -50%)',
        width: 12,
        height: 12,
        borderRadius: '50%',
        bgcolor: 'error.main',
        pointerEvents: 'none',
        zIndex: 9999
      }}
    />
  )
}
