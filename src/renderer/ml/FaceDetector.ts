import type { FaceDetectionResult } from './types'
import { MediaPipeWrapper, type MediaPipeInitOptions } from './MediaPipeWrapper'

export class FaceDetector {
  constructor(private readonly mediaPipe: MediaPipeWrapper) {}

  async initialize(options?: MediaPipeInitOptions): Promise<void> {
    await this.mediaPipe.initialize(options)
  }

  dispose(): void {
    this.mediaPipe.dispose()
  }

  detect(video: HTMLVideoElement, timestampMs: number): FaceDetectionResult | null {
    return this.mediaPipe.detectFace(video, timestampMs)
  }
}
