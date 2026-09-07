import { useEffect, useRef } from 'react'
import { Box, Typography } from '@mui/material'

interface CameraPreviewProps {
  stream: MediaStream | null
  onVideoElement: (video: HTMLVideoElement | null) => void
}

export const CameraPreview = ({ stream, onVideoElement }: CameraPreviewProps): JSX.Element => {
  const ref = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (ref.current !== null) {
      ref.current.srcObject = stream
      onVideoElement(ref.current)
    }
    return () => {
      onVideoElement(null)
    }
  }, [onVideoElement, stream])

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', fontWeight: 600 }}>
        Camera Preview (Selfie View)
      </Typography>
      <Box
        sx={{
          display: 'inline-block',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid #334155',
          bgcolor: '#000',
          lineHeight: 0
        }}
      >
        <video
          ref={ref}
          autoPlay
          muted
          playsInline
          width={320}
          height={240}
          style={{
            transform: 'scaleX(-1)',
            display: 'block'
          }}
        />
      </Box>
    </Box>
  )
}
