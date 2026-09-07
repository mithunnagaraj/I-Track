import { Box, CircularProgress, Typography } from '@mui/material'
import type { ScreenPoint } from '../types/calibration'

interface CalibrationGridProps {
  point: ScreenPoint
  progress?: number
  onTargetClick?: () => void
  livePoint?: { x: number; y: number } | null
}

export const CalibrationGrid = ({
  point,
  progress = 0,
  onTargetClick,
  livePoint
}: CalibrationGridProps): JSX.Element => {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none'
      }}
    >
      {/* Target Dot */}
      <Box
        onClick={onTargetClick}
        sx={{
          position: 'absolute',
          left: `${point.x * 100}%`,
          top: `${point.y * 100}%`,
          transform: 'translate(-50%, -50%)',
          width: 84,
          height: 84,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          cursor: 'pointer',
          transition: 'left 0.25s ease-out, top 0.25s ease-out'
        }}
      >
        {/* Animated circular progress ring */}
        <CircularProgress
          variant="determinate"
          value={Math.max(5, progress * 100)}
          size={68}
          thickness={4.5}
          sx={{
            color: progress > 0.1 ? '#10b981' : '#f43f5e',
            position: 'absolute'
          }}
        />

        {/* Pulsing ring */}
        <Box
          sx={{
            position: 'absolute',
            width: 46,
            height: 46,
            borderRadius: '50%',
            bgcolor: 'rgba(244, 63, 94, 0.2)',
            animation: 'pulse 1.4s infinite ease-in-out',
            '@keyframes pulse': {
              '0%': { transform: 'scale(0.8)', opacity: 0.8 },
              '50%': { transform: 'scale(1.25)', opacity: 0.3 },
              '100%': { transform: 'scale(0.8)', opacity: 0.8 }
            }
          }}
        />

        {/* Center Target Dot */}
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: '#e11d48',
            boxShadow: '0 0 20px 4px rgba(225, 29, 72, 0.9)',
            border: '2.5px solid #ffffff',
            zIndex: 2
          }}
        />

        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            bottom: -22,
            whiteSpace: 'nowrap',
            fontWeight: 600,
            fontSize: '0.75rem',
            color: '#cbd5e1',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)'
          }}
        >
          Click or Space
        </Typography>
      </Box>

      {/* Live detected gaze reticle during calibration so user knows tracking is active */}
      {livePoint ? (
        <Box
          sx={{
            position: 'absolute',
            left: `${Math.max(0.02, Math.min(0.98, livePoint.x)) * 100}%`,
            top: `${Math.max(0.02, Math.min(0.98, livePoint.y)) * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: '2px solid rgba(56, 189, 248, 0.8)',
            bgcolor: 'rgba(56, 189, 248, 0.25)',
            boxShadow: '0 0 10px rgba(56, 189, 248, 0.6)',
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'left 0.05s linear, top 0.05s linear'
          }}
        />
      ) : null}
    </Box>
  )
}
