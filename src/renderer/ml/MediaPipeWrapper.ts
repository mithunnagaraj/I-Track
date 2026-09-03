import type { FaceDetectionResult, NormalizedLandmark } from './types'

interface FaceLandmarkerLike {
  detectForVideo(
    video: HTMLVideoElement,
    timestampMs: number
  ): {
    faceLandmarks?: Array<Array<{ x: number; y: number; z: number; visibility?: number }>>
    faceBlendshapes?: Array<{ categories?: Array<{ score?: number }> }>
  }
}

interface FilesetResolverLike {
  forVisionTasks(wasmRoot: string): Promise<unknown>
}

interface FaceLandmarkerStaticLike {
  createFromOptions(
    vision: unknown,
    options: Record<string, unknown>
  ): Promise<FaceLandmarkerLike>
}

interface TasksVisionModule {
  FilesetResolver: FilesetResolverLike
  FaceLandmarker: FaceLandmarkerStaticLike
}

const WASM_ROOT_CANDIDATES = [
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm',
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
]
const MODEL_ASSET_CANDIDATES = [
  '/models/face_landmarker.task',
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
]

const toLandmark = (value: { x: number; y: number; z: number; visibility?: number }): NormalizedLandmark => ({
  x: value.x,
  y: value.y,
  z: value.z,
  visibility: value.visibility
})

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))

export class MediaPipeWrapper {
  private initialized = false
  private landmarker: FaceLandmarkerLike | null = null

  async initialize(): Promise<void> {
    if (this.initialized) return

    const module = (await import('@mediapipe/tasks-vision')) as unknown as TasksVisionModule

    let lastError: unknown = null
    for (const wasmRoot of WASM_ROOT_CANDIDATES) {
      for (const modelAssetPath of MODEL_ASSET_CANDIDATES) {
        try {
          const vision = await module.FilesetResolver.forVisionTasks(wasmRoot)
          this.landmarker = await module.FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath },
            runningMode: 'VIDEO',
            numFaces: 1,
            minFaceDetectionConfidence: 0.3,
            minFacePresenceConfidence: 0.3,
            minTrackingConfidence: 0.3,
            outputFaceBlendshapes: true
          })
          this.initialized = true
          return
        } catch (error) {
          lastError = error
        }
      }
    }

    const message =
      lastError instanceof Error
        ? lastError.message
        : `MediaPipe initialization failed: ${String(lastError)}`
    throw new Error(message)
  }

  isReady(): boolean {
    return this.initialized && this.landmarker !== null
  }

  detectFace(video: HTMLVideoElement, timestampMs: number): FaceDetectionResult | null {
    if (!this.landmarker) return null
    const result = this.landmarker.detectForVideo(video, timestampMs)
    const firstFace = result.faceLandmarks?.[0]
    if (!firstFace || firstFace.length === 0) return null

    const blendScore = result.faceBlendshapes?.[0]?.categories?.[0]?.score
    const confidence = typeof blendScore === 'number' ? Math.max(0.5, clamp01(blendScore)) : 0.9
    return {
      landmarks: firstFace.map(toLandmark),
      confidence
    }
  }
}
