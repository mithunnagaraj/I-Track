import { useState } from 'react'
import { Box, Button, Chip, Divider, Paper, Stack, Typography } from '@mui/material'
import type { DisplayInfo } from '../types/ipc'
import type { GazePoint } from '../types/gaze'

interface GazeOverlayProps {
  enabled: boolean
  gazePoint?: GazePoint | null
  calibratedGaze?: GazePoint | null
  fps?: number
  targetDisplay?: DisplayInfo | null
  onClose?: () => void
}

export const GazeOverlay = ({
  enabled,
  gazePoint,
  calibratedGaze,
  fps = 0,
  targetDisplay,
  onClose
}: GazeOverlayProps): JSX.Element | null => {
  const [minimized, setMinimized] = useState(false)

  if (!enabled) return null

  const displayWidth = targetDisplay?.bounds.width ?? window.innerWidth
  const displayHeight = targetDisplay?.bounds.height ?? window.innerHeight
  const pixelX = Math.round((calibratedGaze?.x ?? 0.5) * displayWidth)
  const pixelY = Math.round((calibratedGaze?.y ?? 0.5) * displayHeight)

  const rawX = gazePoint?.rawX !== undefined ? gazePoint.rawX.toFixed(3) : '---'
  const rawY = gazePoint?.rawY !== undefined ? gazePoint.rawY.toFixed(3) : '---'
  const calX = calibratedGaze?.x !== undefined ? calibratedGaze.x.toFixed(3) : '---'
  const calY = calibratedGaze?.y !== undefined ? calibratedGaze.y.toFixed(3) : '---'

  const yaw = gazePoint?.yaw !== undefined ? gazePoint.yaw.toFixed(2) : '0.00'
  const pitch = gazePoint?.pitch !== undefined ? gazePoint.pitch.toFixed(2) : '0.00'
  const eyeOpen = gazePoint?.eyeOpenness !== undefined ? gazePoint.eyeOpenness.toFixed(2) : '---'
  const isBlinking = gazePoint?.eyeOpenness !== undefined && gazePoint.eyeOpenness < 0.12

  const confidence = Math.round((calibratedGaze?.confidence ?? 0) * 100)

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        width: minimized ? 'auto' : 340,
        borderRadius: 2.5,
        bgcolor: 'rgba(15, 17, 24, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5), 0 0 16px rgba(59, 130, 246, 0.15)',
        p: 2,
        color: '#e2e8f0',
        fontFamily: 'monospace',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      {/* HUD Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: minimized ? 0 : 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: gazePoint ? '#10b981' : '#f59e0b',
              boxShadow: gazePoint ? '0 0 8px #10b981' : '0 0 8px #f59e0b'
            }}
          />
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, color: '#60a5fa' }}>
            DEBUG TELEMETRY HUD
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.5}>
          <Button
            size="small"
            variant="text"
            onClick={() => setMinimized((prev) => !prev)}
            sx={{
              minWidth: 24,
              height: 24,
              p: 0,
              fontSize: '0.75rem',
              color: '#94a3b8',
              '&:hover': { color: '#ffffff' }
            }}
          >
            {minimized ? '▢' : '—'}
          </Button>
          {onClose && (
            <Button
              size="small"
              variant="text"
              onClick={onClose}
              sx={{
                minWidth: 24,
                height: 24,
                p: 0,
                fontSize: '0.75rem',
                color: '#94a3b8',
                '&:hover': { color: '#f87171' }
              }}
            >
              ✕
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Minimized Pill View */}
      {minimized && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            {confidence}% Conf • {fps} FPS
          </Typography>
        </Stack>
      )}

      {/* Expanded Metrics */}
      {!minimized && (
        <Stack spacing={1.5}>
          {/* Coordinates Grid */}
          <Box
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.04)',
              p: 1.25,
              borderRadius: 1.5,
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <Stack spacing={0.75}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Raw Eye Gaze:
                </Typography>
                <Typography variant="caption" sx={{ color: '#f1f5f9', fontWeight: 600 }}>
                  X: {rawX} | Y: {rawY}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Calibrated (0-1):
                </Typography>
                <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 600 }}>
                  X: {calX} | Y: {calY}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Screen Pixels:
                </Typography>
                <Typography variant="caption" sx={{ color: '#a78bfa', fontWeight: 600 }}>
                  {pixelX}px , {pixelY}px
                </Typography>
              </Stack>
            </Stack>
          </Box>

          {/* 3D Facial Pose & Eye State */}
          <Box
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.04)',
              p: 1.25,
              borderRadius: 1.5,
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <Stack spacing={0.75}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Head Yaw / Pitch:
                </Typography>
                <Typography variant="caption" sx={{ color: '#f1f5f9', fontWeight: 600 }}>
                  Yaw: {yaw} | Pitch: {pitch}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Eye Openness:
                </Typography>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Typography variant="caption" sx={{ color: '#f1f5f9', fontWeight: 600 }}>
                    {eyeOpen}
                  </Typography>
                  <Chip
                    size="small"
                    label={isBlinking ? 'Blink' : 'Open'}
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      bgcolor: isBlinking ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: isBlinking ? '#f87171' : '#34d399',
                      border: `1px solid ${isBlinking ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                    }}
                  />
                </Stack>
              </Stack>
            </Stack>
          </Box>

          {/* Display & Target Monitor Info */}
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Target Display:
            </Typography>
            <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
              {targetDisplay ? targetDisplay.name : 'Default Window'}
            </Typography>
          </Stack>
          {targetDisplay && (
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Resolution / DPI:
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                {targetDisplay.bounds.width}×{targetDisplay.bounds.height} @ {targetDisplay.scaleFactor}x
              </Typography>
            </Stack>
          )}

          {/* Confidence & FPS status */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Performance:
            </Typography>
            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
              {fps} FPS • {confidence}% Confidence
            </Typography>
          </Stack>
        </Stack>
      )}
    </Paper>
  )
}

