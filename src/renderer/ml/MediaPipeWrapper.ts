import type { FaceDetectionResult, NormalizedLandmark } from './types'

interface FaceLandmarkerLike {
  detectForVideo(
    video: HTMLVideoElement,
    timestampMs: number
  ): {
    faceLandmarks?: Array<Array<{ x: number; y: number; z: number; visibility?: number }>>
    faceBlendshapes?: Array<{ categories?: Array<{ score?: number }> }>
  }
  close?(): void
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

const CDN_WASM_ROOT = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
const CDN_MODEL_ASSET_PATH =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

const getLocalAssetPaths = (): { wasmRoot: string; modelAssetPath: string } => {
  const isHttp = typeof window !== 'undefined' && window.location.protocol.startsWith('http')
  const baseUrl = isHttp ? window.location.origin : '.'
  return {
    wasmRoot: `${baseUrl}/wasm`,
    modelAssetPath: `${baseUrl}/models/face_landmarker.task`
  }
}

const toLandmark = (value: { x: number; y: number; z: number; visibility?: number }): NormalizedLandmark => ({
  x: value.x,
  y: value.y,
  z: value.z,
  visibility: value.visibility
})

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))

export interface MediaPipeInitOptions {
  gpuAcceleration?: boolean
}

export class MediaPipeWrapper {
  private initialized = false
  private landmarker: FaceLandmarkerLike | null = null
  private currentGpuSetting: boolean = true

  async initialize(options?: MediaPipeInitOptions): Promise<void> {
    const useGpu = options?.gpuAcceleration ?? true
    if (this.initialized && this.currentGpuSetting === useGpu && this.landmarker !== null) {
      return
    }

    this.dispose()
    this.currentGpuSetting = useGpu

    const module = (await import('@mediapipe/tasks-vision')) as unknown as TasksVisionModule
    const localPaths = getLocalAssetPaths()
    const delegate = useGpu ? 'GPU' : 'CPU'

    try {
      // Attempt to load offline local assets first (instant startup, no network required)
      const vision = await module.FilesetResolver.forVisionTasks(localPaths.wasmRoot)
      try {
        this.landmarker = await module.FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: localPaths.modelAssetPath,
            delegate
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.3,
          minFacePresenceConfidence: 0.3,
          minTrackingConfidence: 0.3,
          outputFaceBlendshapes: true
        })
        console.log(`[MediaPipeWrapper] Initialized offline local assets with ${delegate} delegate.`)
      } catch (delegateErr) {
        if (delegate === 'GPU') {
          console.warn('[MediaPipeWrapper] GPU delegate unavailable. Falling back to CPU...', delegateErr)
          this.landmarker = await module.FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: localPaths.modelAssetPath,
              delegate: 'CPU'
            },
            runningMode: 'VIDEO',
            numFaces: 1,
            minFaceDetectionConfidence: 0.3,
            minFacePresenceConfidence: 0.3,
            minTrackingConfidence: 0.3,
            outputFaceBlendshapes: true
          })
        } else {
          throw delegateErr
        }
      }
    } catch (offlineErr) {
      console.warn(
        '[MediaPipeWrapper] Offline assets unavailable or failed to load. Falling back to CDN...',
        offlineErr
      )
      const vision = await module.FilesetResolver.forVisionTasks(CDN_WASM_ROOT)
      this.landmarker = await module.FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: CDN_MODEL_ASSET_PATH,
          delegate: useGpu ? 'GPU' : 'CPU'
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.3,
        minFacePresenceConfidence: 0.3,
        minTrackingConfidence: 0.3,
        outputFaceBlendshapes: true
      })
      console.log(`[MediaPipeWrapper] Initialized using remote CDN assets with ${useGpu ? 'GPU' : 'CPU'} delegate.`)
    }

    this.initialized = true
  }

  dispose(): void {
    if (this.landmarker && typeof this.landmarker.close === 'function') {
      try {
        this.landmarker.close()
      } catch (err) {
        console.warn('[MediaPipeWrapper] Error closing landmarker:', err)
      }
    }
    this.landmarker = null
    this.initialized = false
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
