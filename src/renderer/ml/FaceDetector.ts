import type { FaceDetectionResult } from './types'
import { MediaPipeWrapper } from './MediaPipeWrapper'

export class FaceDetector {
  constructor(private readonly mediaPipe: MediaPipeWrapper) {}

  async initialize(): Promise<void> {
    await this.mediaPipe.initialize()
  }

  detect(video: HTMLVideoElement, timestampMs: number): FaceDetectionResult | null {
    return this.mediaPipe.detectFace(video, timestampMs)
  }
}
