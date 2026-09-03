import { useEffect, useState } from 'react'

export const useCameraStream = () => {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let createdStream: MediaStream | null = null
    const start = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false
        })
        createdStream = mediaStream
        if (active) setStream(mediaStream)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to access camera')
      }
    }

    void start()
    return () => {
      active = false
      createdStream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return { stream, error }
}
