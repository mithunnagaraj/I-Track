const fs = require('node:fs')
const path = require('node:path')
const https = require('node:https')

const ROOT_DIR = path.resolve(__dirname, '..')
const WASM_SRC_DIR = path.join(ROOT_DIR, 'node_modules/@mediapipe/tasks-vision/wasm')
const PUBLIC_WASM_DIR = path.join(ROOT_DIR, 'public/wasm')
const PUBLIC_MODELS_DIR = path.join(ROOT_DIR, 'public/models')
const MODEL_DEST = path.join(PUBLIC_MODELS_DIR, 'face_landmarker.task')

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

const copyWasmFiles = () => {
  if (!fs.existsSync(WASM_SRC_DIR)) {
    console.warn(`[setup-models] WASM source directory not found: ${WASM_SRC_DIR}`)
    return
  }

  fs.mkdirSync(PUBLIC_WASM_DIR, { recursive: true })
  const files = fs.readdirSync(WASM_SRC_DIR)
  let copiedCount = 0

  for (const file of files) {
    if (file.endsWith('.js') || file.endsWith('.wasm')) {
      const srcFile = path.join(WASM_SRC_DIR, file)
      const destFile = path.join(PUBLIC_WASM_DIR, file)
      fs.copyFileSync(srcFile, destFile)
      copiedCount++
    }
  }

  console.log(`[setup-models] Copied ${copiedCount} WASM assets to public/wasm/`)
}

const downloadFile = (url, dest) =>
  new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    const tempDest = `${dest}.download`
    const file = fs.createWriteStream(tempDest)

    const request = (targetUrl) => {
      https
        .get(targetUrl, (response) => {
          if (
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            request(response.headers.location)
            return
          }

          if (response.statusCode !== 200) {
            file.close()
            fs.unlink(tempDest, () => {})
            reject(
              new Error(
                `Failed to download ${targetUrl}, status code: ${response.statusCode}`
              )
            )
            return
          }

          const totalBytes = parseInt(response.headers['content-length'] || '0', 10)
          let receivedBytes = 0

          response.on('data', (chunk) => {
            receivedBytes += chunk.length
            if (totalBytes > 0) {
              const percent = ((receivedBytes / totalBytes) * 100).toFixed(1)
              process.stdout.write(
                `\r[setup-models] Downloading face_landmarker.task: ${percent}% (${(
                  receivedBytes /
                  (1024 * 1024)
                ).toFixed(1)}MB)`
              )
            }
          })

          response.pipe(file)

          file.on('finish', () => {
            file.close(() => {
              fs.renameSync(tempDest, dest)
              console.log('\n[setup-models] Model download completed successfully.')
              resolve()
            })
          })
        })
        .on('error', (err) => {
          file.close()
          fs.unlink(tempDest, () => {})
          reject(err)
        })
    }

    request(url)
  })

const main = async () => {
  console.log('[setup-models] Setting up offline MediaPipe assets...')
  copyWasmFiles()

  if (fs.existsSync(MODEL_DEST) && fs.statSync(MODEL_DEST).size > 1000000) {
    console.log('[setup-models] face_landmarker.task already exists in public/models/')
    return
  }

  console.log('[setup-models] Downloading face_landmarker.task (~29MB)...')
  try {
    await downloadFile(MODEL_URL, MODEL_DEST)
  } catch (error) {
    console.error('[setup-models] Error downloading model:', error.message)
    console.warn(
      '[setup-models] The application will fall back to CDN if the local model file is absent.'
    )
  }
}

main()
