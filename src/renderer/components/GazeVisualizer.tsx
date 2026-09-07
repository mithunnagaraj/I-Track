import { Box } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { GAZE_DOT_RENDER_LERP_FACTOR } from '../constants/gazeTrackingConstants'

interface GazeVisualizerProps {
  x: number
  y: number
  visible: boolean
}

export const GazeVisualizer = ({ x, y, visible }: GazeVisualizerProps): JSX.Element | null => {
  // Clamp within viewport
  const clampedX = Math.max(0.01, Math.min(0.99, x))
  const clampedY = Math.max(0.01, Math.min(0.99, y))

  // Render position is interpolated independently of the (irregular) detection
  // frame rate so the dot glides smoothly instead of jumping on each update.
  const [renderPos, setRenderPos] = useState({ x: clampedX, y: clampedY })
  const targetRef = useRef({ x: clampedX, y: clampedY })
  const renderPosRef = useRef(renderPos)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    targetRef.current = { x: clampedX, y: clampedY }
  }, [clampedX, clampedY])

  useEffect(() => {
    const animate = (): void => {
      const target = targetRef.current
      const current = renderPosRef.current
      const dx = target.x - current.x
      const dy = target.y - current.y

      // Snap when close enough to avoid perpetual tiny re-renders
      const next =
        Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001
          ? target
          : {
              x: current.x + dx * GAZE_DOT_RENDER_LERP_FACTOR,
              y: current.y + dy * GAZE_DOT_RENDER_LERP_FACTOR
            }

      if (next !== current) {
        renderPosRef.current = next
        setRenderPos(next)
      }
      frameRef.current = window.requestAnimationFrame(animate)
    }

    frameRef.current = window.requestAnimationFrame(animate)
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  if (!visible) return null

  return (
    <Box
      sx={{
        position: 'fixed',
        left: `${renderPos.x * 100}%`,
        top: `${renderPos.y * 100}%`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Outer subtle guide ring */}
      <Box
        sx={{
          position: 'absolute',
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '1.5px solid rgba(255, 23, 68, 0.5)',
          bgcolor: 'rgba(255, 23, 68, 0.1)'
        }}
      />
      {/* Center glowing gaze dot */}
      <Box
        sx={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          bgcolor: '#ff1744',
          border: '2px solid #ffffff',
          boxShadow: '0 0 12px 3px rgba(255, 23, 68, 0.9)'
        }}
      />
    </Box>
  )
}
