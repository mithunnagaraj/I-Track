import { Box, Chip, LinearProgress, Paper, Stack, Typography } from '@mui/material'

interface StatusPanelProps {
  cameraReady: boolean
  trackingActive: boolean
  confidence: number
  fps: number
  hasCalibration?: boolean
  calibrationAccuracy?: number | null
  calibrationAgeDays?: number | null
  activeDisplayLabel?: string
  activeProfileName?: string
  gridMode?: '5-point' | '9-point'
  gpuAcceleration?: boolean
}

export const StatusPanel = ({
  cameraReady,
  trackingActive,
  confidence,
  fps,
  hasCalibration,
  calibrationAccuracy,
  calibrationAgeDays,
  activeDisplayLabel,
  activeProfileName,
  gridMode = '5-point',
  gpuAcceleration = true
}: StatusPanelProps): JSX.Element => {
  const confidencePct = Math.round(confidence * 100)
  const confidenceColor =
    confidencePct >= 70 ? '#10b981' : confidencePct >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mb: 2.5,
        borderRadius: 2.5,
        border: '1px solid rgba(255, 255, 255, 0.12)',
        bgcolor: 'rgba(24, 26, 32, 0.85)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
      }}
    >
      {/* Top row: Status Chips */}
      <Stack
        direction="row"
        spacing={1.5}
        flexWrap="wrap"
        useFlexGap
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
          {/* Camera Status */}
          <Chip
            size="small"
            label={cameraReady ? 'Camera Ready' : 'Camera Offline'}
            sx={{
              fontWeight: 600,
              bgcolor: cameraReady ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: cameraReady ? '#34d399' : '#f87171',
              border: `1px solid ${cameraReady ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              '& .MuiChip-label': { px: 1.5 }
            }}
          />

          {/* Tracking Status */}
          <Chip
            size="small"
            label={trackingActive ? 'Tracking Active' : 'Tracking Paused'}
            sx={{
              fontWeight: 600,
              bgcolor: trackingActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(148, 163, 184, 0.15)',
              color: trackingActive ? '#60a5fa' : '#94a3b8',
              border: `1px solid ${trackingActive ? 'rgba(59, 130, 246, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`,
              '& .MuiChip-label': { px: 1.5 }
            }}
          />

          {/* Calibration Status */}
          <Chip
            size="small"
            label={
              hasCalibration
                ? `Profile: ${activeProfileName ?? 'Default'} (${gridMode}) • ${calibrationAccuracy ? `${Math.round(calibrationAccuracy)}%` : 'Ready'}${
                    typeof calibrationAgeDays === 'number'
                      ? ` (${calibrationAgeDays === 0 ? 'today' : `${calibrationAgeDays}d ago`})`
                      : ''
                  }`
                : 'Uncalibrated'
            }
            sx={{
              fontWeight: 600,
              bgcolor: hasCalibration ? 'rgba(168, 85, 247, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: hasCalibration ? '#c084fc' : '#fbbf24',
              border: `1px solid ${hasCalibration ? 'rgba(168, 85, 247, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              '& .MuiChip-label': { px: 1.5 }
            }}
          />
        </Stack>

        {/* Right side badges: Hardware GPU, FPS & Active Display */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            label={gpuAcceleration ? '⚡ GPU Accel' : 'CPU Mode'}
            sx={{
              fontWeight: 600,
              bgcolor: gpuAcceleration ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.06)',
              color: gpuAcceleration ? '#38bdf8' : '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          />
          {activeDisplayLabel && (
            <Chip
              size="small"
              label={`🖥️ ${activeDisplayLabel}`}
              sx={{
                fontWeight: 500,
                bgcolor: 'rgba(255, 255, 255, 0.06)',
                color: '#e2e8f0',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            />
          )}
          <Chip
            size="small"
            label={`${fps} FPS`}
            sx={{
              fontWeight: 700,
              fontFamily: 'monospace',
              bgcolor: fps >= 25 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              color: fps >= 25 ? '#34d399' : '#fbbf24',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          />
        </Stack>
      </Stack>

      {/* Bottom row: Confidence gauge */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500, letterSpacing: 0.5 }}>
            GAZE DETECTION CONFIDENCE
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: confidenceColor, fontWeight: 700, fontFamily: 'monospace' }}
          >
            {confidencePct}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={confidencePct}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'rgba(255, 255, 255, 0.08)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor: confidenceColor,
              transition: 'transform 0.2s ease, background-color 0.3s ease'
            }
          }}
        />
      </Box>
    </Paper>
  )
}
