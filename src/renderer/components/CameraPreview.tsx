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
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Camera Preview
      </Typography>
      <video ref={ref} autoPlay muted playsInline width={320} height={240} />
    </Box>
  )
}
