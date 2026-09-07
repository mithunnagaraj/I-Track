# Eye-Tracking Desktop App (Windows & Mac)
## Complete Project Plan for GitHub Copilot
## Web-First with Electron Desktop Deployment

---

## 1. PROJECT OVERVIEW

### Vision
Create a web-based eye-tracking application that runs as a native desktop app (Windows .exe and Mac .dmg) with real-time mouse control based on eye gaze.

### Target Platforms
- **Windows 10+** (x64, x86)
- **macOS 10.13+** (Intel & Apple Silicon)
- **Technology:** Electron + React + MediaPipe Web

### Key Features
- Real-time eye gaze detection via webcam
- System mouse cursor control (follows gaze)
- Calibration system (5-9 point)
- Click detection via finger gestures (optional phase 2)
- Settings/preferences
- Debug visualization mode
- Cross-platform installer distribution

### Architecture Overview
```
┌─────────────────────────────────────────────────┐
│         Electron Main Process (Node.js)         │
│  - Window management                            │
│  - System mouse control (robot.js)              │
│  - File I/O for calibration data                │
│  - IPC communication with renderer              │
└─────────────────────────────────────────────────┘
                        ↓ (IPC)
┌─────────────────────────────────────────────────┐
│    Electron Renderer (Chromium Browser)         │
│  ┌───────────────────────────────────────────┐  │
│  │  React Application (Web UI)               │  │
│  │  - Gaze visualization                     │  │
│  │  - Calibration interface                  │  │
│  │  - Settings                               │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  MediaPipe Web (JavaScript)               │  │
│  │  - Face detection                         │  │
│  │  - Eye landmark extraction                │  │
│  │  - Gaze estimation                        │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  WebRTC Camera Access                     │  │
│  │  - getUserMedia()                         │  │
│  │  - Real-time webcam input                 │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 2. TECHNICAL STACK

### Frontend
- **Framework:** React 18+
- **UI Library:** Material-UI (MUI) or Chakra UI
- **State Management:** Zustand or Redux
- **ML Framework:** MediaPipe Tasks Web (eye detection)
- **Styling:** Tailwind CSS or styled-components

### Desktop/Backend
- **Runtime:** Electron 28+ (Chromium-based)
- **Node.js:** v18+
- **Mouse Control:** robot.js or ioctl (cross-platform)
- **IPC:** Electron IPC (main ↔ renderer)
- **File I/O:** Node.js fs + Electron app.getPath()

### Build & Distribution
- **Bundler:** Vite (fast dev, optimized builds)
- **Packager:** electron-builder (Windows & Mac installers)
- **Version Management:** electron-updater (auto-updates)

### Development Tools
- **Package Manager:** npm or yarn
- **Linter:** ESLint
- **Formatter:** Prettier
- **Testing:** Jest + React Testing Library
- **Version Control:** Git

### Dependencies (npm packages)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@mediapipe/tasks-web": "^0.10.0",
    "electron": "^28.0.0",
    "robot.js": "^0.6.0",
    "zustand": "^4.4.0",
    "@mui/material": "^5.14.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "electron-builder": "^24.6.0",
    "@vitejs/plugin-react": "^4.1.0",
    "tailwindcss": "^3.3.0",
    "eslint": "^8.53.0",
    "prettier": "^3.0.0"
  }
}
```

---

## 3. PROJECT STRUCTURE

```
eye-tracking-desktop-app/
│
├── public/
│   ├── favicon.ico
│   ├── index.html
│   └── preload.js                    # Electron preload script
│
├── src/
│   ├── main/
│   │   ├── main.ts                   # Electron main process
│   │   ├── preload.ts                # IPC bridge
│   │   ├── window.ts                 # Window management
│   │   └── mouse/
│   │       ├── MouseController.ts    # System mouse control
│   │       └── robot-wrapper.ts      # Cross-platform mouse wrapper
│   │
│   ├── renderer/
│   │   ├── index.html
│   │   ├── main.tsx                  # React entry point
│   │   ├── App.tsx                   # Root component
│   │   ├── App.css
│   │   │
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── CalibrationPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── DebugPage.tsx
│   │   │   └── styles.ts
│   │   │
│   │   ├── components/
│   │   │   ├── GazeVisualizer.tsx    # Gaze point cursor
│   │   │   ├── CalibrationGrid.tsx   # 5-9 point grid
│   │   │   ├── CameraPreview.tsx     # Webcam feed display
│   │   │   ├── StatusPanel.tsx       # Status indicators
│   │   │   ├── SettingsForm.tsx      # User preferences
│   │   │   └── GazeOverlay.tsx       # Debug visualization
│   │   │
│   │   ├── hooks/
│   │   │   ├── useGazeTracker.ts     # Gaze tracking hook
│   │   │   ├── useCalibration.ts     # Calibration logic hook
│   │   │   ├── useMouseControl.ts    # IPC to mouse control
│   │   │   ├── useCameraStream.ts    # Webcam access
│   │   │   └── useSettings.ts        # Settings persistence
│   │   │
│   │   ├── services/
│   │   │   ├── gazeService.ts        # Gaze calculation logic
│   │   │   ├── calibrationService.ts # Calibration matrix math
│   │   │   ├── storageService.ts     # localStorage + electron storage
│   │   │   └── ipcService.ts         # IPC communication
│   │   │
│   │   ├── ml/
│   │   │   ├── MediaPipeWrapper.ts   # MediaPipe initialization
│   │   │   ├── FaceDetector.ts       # Face landmark detection
│   │   │   ├── EyeGazeEstimator.ts   # Gaze direction calculation
│   │   │   └── types.ts              # ML-related TypeScript types
│   │   │
│   │   ├── store/
│   │   │   └── appStore.ts           # Zustand global state
│   │   │
│   │   ├── types/
│   │   │   ├── gaze.ts               # GazePoint, GazeData types
│   │   │   ├── calibration.ts        # Calibration types
│   │   │   ├── settings.ts           # Settings types
│   │   │   └── ipc.ts                # IPC message types
│   │   │
│   │   └── utils/
│   │       ├── logger.ts             # Console logging
│   │       ├── math.ts               # Vector/matrix calculations
│   │       ├── calibration.ts        # Homography calculations
│   │       └── validation.ts         # Input validation
│   │
│   └── shared/
│       ├── ipc-channels.ts           # IPC channel definitions
│       └── constants.ts              # App-wide constants
│
├── electron-builder-config/
│   ├── build-config.json             # electron-builder config
│   └── icons/
│       ├── icon.png                  # 512x512
│       ├── icon.icns                 # macOS icon
│       └── icon.ico                  # Windows icon
│
├── dist/                             # Build output (ignored)
├── release/                          # Packaged installers (ignored)
│
├── vite.config.ts                    # Vite configuration
├── tsconfig.json                     # TypeScript config
├── .eslintrc.cjs                     # ESLint config
├── .prettierrc                        # Prettier config
├── package.json
├── package-lock.json
│
├── .github/
│   ├── workflows/
│   │   ├── build-windows.yml
│   │   ├── build-mac.yml
│   │   └── release.yml
│   └── ISSUE_TEMPLATE/
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   ├── BUILD.md
│   ├── DEPLOYMENT.md
│   ├── API_REFERENCE.md
│   ├── CALIBRATION_GUIDE.md
│   └── TROUBLESHOOTING.md
│
├── .gitignore
├── README.md
├── LICENSE
└── CHANGELOG.md
```

---

## 4. DETAILED FEATURE BREAKDOWN

### Phase 1: MVP (Weeks 1-3)

#### Feature 1.1: Eye Detection & Gaze Tracking
**Files:** `src/ml/MediaPipeWrapper.ts`, `src/ml/FaceDetector.ts`, `src/ml/EyeGazeEstimator.ts`

**Specification:**
```typescript
// Core gaze tracking interface
interface GazeTracker {
  initialize(canvasElement: HTMLCanvasElement): Promise<void>
  startTracking(): void
  stopTracking(): void
  processFrame(frame: ImageBitmap | HTMLVideoElement): GazePoint | null
  getConfidence(): number
}

// Data structure
interface GazePoint {
  x: number              // 0-1 normalized screen X
  y: number              // 0-1 normalized screen Y
  confidence: number     // 0-1 confidence score
  timestamp: number      // milliseconds
  rawX?: number          // raw before calibration
  rawY?: number
}

// Usage in React
const gazePoint = await tracker.processFrame(videoFrame)
if (gazePoint && gazePoint.confidence > 0.7) {
  // Update gaze visualization
  updateGazeCursor(gazePoint.x, gazePoint.y)
}
```

**What Copilot should generate:**
- MediaPipe FaceLandmarker initialization
- Canvas setup for model inference
- Eye landmark extraction from face mesh
- Iris center calculation
- Gaze vector computation
- Confidence scoring

---

#### Feature 1.2: System Mouse Control (IPC Bridge)
**Files:** `src/main/mouse/MouseController.ts`, `src/main/preload.ts`

**Specification:**
```typescript
// Main process - Electron
interface MouseController {
  moveTo(x: number, y: number): void
  click(button: 'left' | 'right' | 'middle'): void
  doubleClick(): void
  mouseDown(): void
  mouseUp(): void
  getScreenSize(): { width: number; height: number }
}

// IPC channels
const IPC_CHANNELS = {
  MOUSE_MOVE: 'mouse:move',
  MOUSE_CLICK: 'mouse:click',
  GET_SCREEN_SIZE: 'mouse:getScreenSize'
}

// Renderer process - React
// In React hook:
const moveMouseToGaze = async (gazePoint: GazePoint) => {
  const screenSize = await window.api.getScreenSize()
  const screenX = gazePoint.x * screenSize.width
  const screenY = gazePoint.y * screenSize.height
  
  await window.api.moveMouse(screenX, screenY)
}
```

**What Copilot should generate:**
- robot.js wrapper for cross-platform mouse control
- Electron IPC setup (main ↔ renderer)
- Preload script for secure IPC
- Screen size detection (Windows & Mac)
- Mouse movement smoothing
- Click simulation

---

#### Feature 1.3: Calibration System (5-Point)
**Files:** `src/renderer/pages/CalibrationPage.tsx`, `src/renderer/services/calibrationService.ts`

**Specification:**
```typescript
// Calibration flow
interface CalibrationPoint {
  screenX: number        // 0-1 normalized
  screenY: number
  gazeX: number          // raw gaze point
  gazeY: number
  timestamp: number
}

interface CalibrationMatrix {
  h: number[][]          // 3x3 homography matrix
  createdAt: number
  accuracy: number       // 0-100%
}

// Process:
// 1. Show 5 points (corners + center)
// 2. User gazes at each point for 2 seconds
// 3. Record gaze point for each screen point
// 4. Calculate homography transformation
// 5. Apply to future gaze points

const calibrationService = {
  startCalibration(): CalibrationPoint[]
  recordPoint(screenPoint: {x,y}, gazePoint: {x,y}): void
  finishCalibration(): CalibrationMatrix
  applyCalibration(rawGaze: {x,y}, matrix: CalibrationMatrix): {x,y}
  saveCalibration(matrix: CalibrationMatrix): void
  loadCalibration(): CalibrationMatrix | null
}
```

**What Copilot should generate:**
- 5-point calibration UI (React component)
- Homography matrix calculation (OpenCV.js or custom)
- Calibration data persistence (electron storage)
- Accuracy validation
- Recalibration prompts

---

#### Feature 1.4: Real-Time Mouse Cursor Following
**Files:** `src/renderer/components/GazeVisualizer.tsx`, `src/renderer/hooks/useMouseControl.ts`

**Specification:**
```typescript
// React component - Main loop
function useMouseControl() {
  useEffect(() => {
    const animationFrame = setInterval(async () => {
      const gazePoint = gazeTracker.getCurrentGaze()
      
      if (!gazePoint || gazePoint.confidence < MIN_CONFIDENCE) return
      
      // Apply calibration
      const calibrated = calibrationService.applyCalibration(gazePoint)
      
      // Smooth the movement
      const smoothed = smoothGazePoint(calibrated, previousPoint)
      
      // Move system cursor
      await window.api.moveMouse(
        smoothed.x * screenSize.width,
        smoothed.y * screenSize.height
      )
      
      previousPoint = smoothed
    }, 1000 / 30) // 30 FPS
    
    return () => clearInterval(animationFrame)
  }, [])
}

// Smoothing algorithm
function smoothGazePoint(current: Point, previous: Point): Point {
  const alpha = 0.3 // Exponential smoothing factor
  return {
    x: alpha * current.x + (1 - alpha) * previous.x,
    y: alpha * current.y + (1 - alpha) * previous.y
  }
}
```

**What Copilot should generate:**
- Animation frame loop (requestAnimationFrame)
- Gaze smoothing algorithm
- IPC calls to mouse controller
- Confidence-based filtering
- Performance optimization

---

### Phase 2: Enhancement (Weeks 4-5)

#### Feature 2.1: Settings & Preferences
```typescript
interface Settings {
  trackingEnabled: boolean
  mouseSmoothing: number         // 0.1-0.9
  minConfidence: number          // 0.5-0.95
  gazeVisualizerEnabled: boolean
  debugModeEnabled: boolean
  autoCalibrationPrompt: boolean
  calibrationRecency: number     // days
  screenIndex: number            // multi-monitor support
}
```

#### Feature 2.2: Visual Feedback
- Gaze point cursor (red circle)
- Confidence indicator
- FPS counter
- Status panel

#### Feature 2.3: Multi-Monitor Support
- Detect connected monitors
- Allow user to select target monitor
- Handle different DPI scaling

---

### Phase 3: Optimization & Polish (Weeks 6-7)

#### Feature 3.1: Performance
- CPU optimization for ML inference
- GPU acceleration (if available)
- Memory management
- Battery optimization

#### Feature 3.2: Advanced Calibration
- 9-point calibration option
- Per-app calibration profiles
- Calibration accuracy testing

#### Feature 3.3: Auto-Updates
- electron-updater integration
- Version checking
- Silent updates

---

## 5. COMPONENT SPECIFICATIONS

### Main Page Layout
```
┌────────────────────────────────────────────┐
│  Eye Tracking Mouse Controller             │
├────────────────────────────────────────────┤
│                                            │
│  Status:                                   │
│  ✓ Camera: Ready                           │
│  ✓ Tracking: Active                        │
│  📊 Confidence: 92%  | FPS: 30             │
│                                            │
├────────────────────────────────────────────┤
│  [  Start  ]  [ Calibrate ]  [ Settings ]  │
│  [  Stop   ]  [ Reset Cal ] [ Debug On ]   │
└────────────────────────────────────────────┘
```

### Calibration Page Layout
```
┌────────────────────────────────────────────┐
│  5-Point Calibration                       │
├────────────────────────────────────────────┤
│                                            │
│        Look at the red dot                 │
│                                            │
│           [Calibration Point]              │
│                                            │
│  ████████████░░░░░░░░░░░░  3/5             │
│  Hold gaze for 2 seconds...                │
│                                            │
│              [ Cancel ]                    │
└────────────────────────────────────────────┘
```

### Settings Page Layout
```
┌────────────────────────────────────────────┐
│  Settings                                  │
├────────────────────────────────────────────┤
│                                            │
│  Gaze Tracking                             │
│  ☑ Enable Tracking                         │
│  ☑ Debug Visualization                     │
│                                            │
│  Mouse Control                             │
│  Smoothing: [█████████░░░░░] 0.5           │
│  Min Confidence: [███████░░░░░░] 0.75     │
│                                            │
│  Calibration                               │
│  Last Calibrated: 2 days ago               │
│  ☑ Prompt recalibration every 7 days       │
│                                            │
│  [ Save ]  [ Reset to Defaults ]           │
└────────────────────────────────────────────┘
```

---

## 6. IPC COMMUNICATION PROTOCOL

### IPC Channels & Messages
```typescript
// File: src/shared/ipc-channels.ts

// Mouse Control
export const MOUSE_CHANNELS = {
  MOVE: 'mouse:move',              // IPC call: moveMouse(x, y)
  CLICK: 'mouse:click',            // IPC call: click(button)
  DOUBLE_CLICK: 'mouse:doubleClick',
  MOUSE_DOWN: 'mouse:mouseDown',
  MOUSE_UP: 'mouse:mouseUp',
  GET_SCREEN_SIZE: 'mouse:getScreenSize' // IPC invoke
}

// Settings
export const SETTINGS_CHANNELS = {
  GET: 'settings:get',             // Get all settings
  SET: 'settings:set',             // Update setting
  RESET: 'settings:reset'
}

// Calibration
export const CALIBRATION_CHANNELS = {
  SAVE: 'calibration:save',
  LOAD: 'calibration:load',
  DELETE: 'calibration:delete',
  GET_ACCURACY: 'calibration:getAccuracy'
}

// Example IPC call from renderer:
window.api.moveMouse(x: number, y: number): Promise<void>

// Example IPC handler in main:
ipcMain.handle('mouse:move', (event, x, y) => {
  mouseController.moveTo(x, y)
})
```

---

## 7. KEY ALGORITHMS

### Algorithm 1: Gaze Direction Estimation
```typescript
function estimateGazeDirection(
  eyeLandmarks: NormalizedLandmark[],
  faceSize: { width: number; height: number }
): { x: number; y: number; confidence: number } {
  
  // Eye landmarks indices from MediaPipe
  const LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
  const RIGHT_EYE_INDICES = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466]
  
  // Get iris center for each eye
  const leftIrisCenter = getIrisCenter(eyeLandmarks, LEFT_EYE_INDICES)
  const rightIrisCenter = getIrisCenter(eyeLandmarks, RIGHT_EYE_INDICES)
  
  // Get eye bounding boxes
  const leftEyeBBox = getBoundingBox(eyeLandmarks, LEFT_EYE_INDICES)
  const rightEyeBBox = getBoundingBox(eyeLandmarks, RIGHT_EYE_INDICES)
  
  // Normalize iris position within eye (0-1)
  const leftGaze = normalizeIrisInEye(leftIrisCenter, leftEyeBBox)
  const rightGaze = normalizeIrisInEye(rightIrisCenter, rightEyeBBox)
  
  // Average both eyes
  const avgGaze = {
    x: (leftGaze.x + rightGaze.x) / 2,
    y: (leftGaze.y + rightGaze.y) / 2
  }
  
  // Calculate confidence based on iris visibility
  const confidence = calculateConfidence(eyeLandmarks)
  
  return { x: avgGaze.x, y: avgGaze.y, confidence }
}
```

### Algorithm 2: Homography Calibration
```typescript
function computeHomography(
  srcPoints: Point[],  // calibration screen points (normalized 0-1)
  dstPoints: Point[]   // corresponding gaze points (normalized 0-1)
): number[][] {
  
  // Use cv2.findHomography equivalent
  // Input: 5+ point pairs
  // Output: 3x3 homography matrix H
  
  // H transforms raw gaze to screen coordinates
  // transformed = H @ raw_point
  
  // Using least squares solution:
  // Solve: H @ dstPoints = srcPoints
  
  const H = solveLeastSquares(srcPoints, dstPoints)
  return H
}

function applyHomography(
  point: Point,
  H: number[][]
): Point {
  // Transform point: [x, y, 1] @ H
  const [x, y, w] = matmul([point.x, point.y, 1], H)
  return { x: x / w, y: y / w }  // Normalize by w
}
```

### Algorithm 3: Exponential Smoothing
```typescript
function exponentialSmoothing(
  current: Point,
  previous: Point,
  alpha: number = 0.3
): Point {
  return {
    x: alpha * current.x + (1 - alpha) * previous.x,
    y: alpha * current.y + (1 - alpha) * previous.y
  }
}
```

---

## 8. ELECTRON MAIN PROCESS SPECIFICATIONS

### File: `src/main/main.ts`
```typescript
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import isDev from 'electron-is-dev'
import { MouseController } from './mouse/MouseController'

let mainWindow: BrowserWindow | null = null
const mouseController = new MouseController()

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  })

  const startUrl = isDev
    ? 'http://localhost:5173'  // Vite dev server
    : `file://${path.join(__dirname, '../renderer/index.html')}`
  
  mainWindow.loadURL(startUrl)
  
  if (isDev) mainWindow.webContents.openDevTools()
}

// IPC Handlers
ipcMain.handle('mouse:getScreenSize', () => {
  const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize
  return { width, height }
})

ipcMain.on('mouse:move', (event, x: number, y: number) => {
  mouseController.moveTo(x, y)
})

ipcMain.on('mouse:click', (event, button: string) => {
  mouseController.click(button)
})

app.on('ready', createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

### File: `src/main/mouse/MouseController.ts`
```typescript
import robot from 'robot.js'

export class MouseController {
  
  moveTo(x: number, y: number): void {
    // Clamp to screen bounds
    const screenSize = require('electron').screen.getPrimaryDisplay().workAreaSize
    const clampedX = Math.max(0, Math.min(x, screenSize.width))
    const clampedY = Math.max(0, Math.min(y, screenSize.height))
    
    robot.moveMouse(clampedX, clampedY)
  }
  
  click(button: string = 'left'): void {
    robot.mouseClick(button, false)
  }
  
  doubleClick(button: string = 'left'): void {
    robot.mouseClick(button, false)
    robot.mouseClick(button, false)
  }
  
  mouseDown(button: string = 'left'): void {
    robot.mouseToggle('down', button)
  }
  
  mouseUp(button: string = 'left'): void {
    robot.mouseToggle('up', button)
  }
}
```

### File: `src/main/preload.ts`
```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Mouse control
  moveMouse: (x: number, y: number) => 
    ipcRenderer.invoke('mouse:move', x, y),
  
  click: (button: string) => 
    ipcRenderer.invoke('mouse:click', button),
  
  doubleClick: () => 
    ipcRenderer.invoke('mouse:doubleClick'),
  
  getScreenSize: () => 
    ipcRenderer.invoke('mouse:getScreenSize'),
  
  // Settings
  getSetting: (key: string) => 
    ipcRenderer.invoke('settings:get', key),
  
  setSetting: (key: string, value: any) => 
    ipcRenderer.invoke('settings:set', key, value),
  
  // Calibration
  saveCalibration: (data: any) => 
    ipcRenderer.invoke('calibration:save', data),
  
  loadCalibration: () => 
    ipcRenderer.invoke('calibration:load'),
  
  deleteCalibration: () => 
    ipcRenderer.invoke('calibration:delete')
})

declare global {
  interface Window {
    api: typeof window.api
  }
}
```

---

## 9. REACT HOOKS SPECIFICATIONS

### Hook: `useGazeTracker`
```typescript
function useGazeTracker() {
  const [gazePoint, setGazePoint] = useState<GazePoint | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const trackerRef = useRef<GazeTracker | null>(null)
  
  useEffect(() => {
    const initTracker = async () => {
      const tracker = new GazeTracker()
      await tracker.initialize()
      trackerRef.current = tracker
    }
    
    initTracker()
    
    return () => {
      trackerRef.current?.stopTracking()
    }
  }, [])
  
  const startTracking = async () => {
    if (trackerRef.current) {
      trackerRef.current.startTracking()
      setIsTracking(true)
      
      const animationLoop = () => {
        const point = trackerRef.current?.getGazePoint()
        if (point) setGazePoint(point)
        requestAnimationFrame(animationLoop)
      }
      
      animationLoop()
    }
  }
  
  const stopTracking = () => {
    trackerRef.current?.stopTracking()
    setIsTracking(false)
  }
  
  return { gazePoint, isTracking, startTracking, stopTracking }
}
```

### Hook: `useMouseControl`
```typescript
function useMouseControl(gazePoint: GazePoint | null) {
  const [screenSize, setScreenSize] = useState<{width: number, height: number} | null>(null)
  const previousPointRef = useRef<{x: number, y: number}>({x: 0, y: 0})
  
  useEffect(() => {
    window.api.getScreenSize().then(setScreenSize)
  }, [])
  
  useEffect(() => {
    if (!gazePoint || !screenSize) return
    
    // Apply calibration
    const calibration = loadCalibration()
    const calibrated = applyCalibration(gazePoint, calibration)
    
    // Apply smoothing
    const smoothed = exponentialSmoothing(
      calibrated,
      previousPointRef.current,
      0.3
    )
    
    // Move mouse
    window.api.moveMouse(
      smoothed.x * screenSize.width,
      smoothed.y * screenSize.height
    )
    
    previousPointRef.current = smoothed
  }, [gazePoint, screenSize])
}
```

---

## 10. BUILD & DEPLOYMENT CONFIGURATION

### File: `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/renderer',
    target: 'esnext'
  },
  server: {
    port: 5173
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer')
    }
  }
})
```

### File: `build-config.json` (electron-builder)
```json
{
  "appId": "com.eyetracking.app",
  "productName": "Eye Tracking Mouse",
  "files": [
    "dist/**/*",
    "node_modules/**/*",
    "package.json"
  ],
  "directories": {
    "buildResources": "electron-builder-config/icons"
  },
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64", "ia32"]
      }
    ],
    "certificateFile": "path/to/cert.pfx",
    "certificatePassword": "$CERTIFICATE_PASSWORD"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  },
  "mac": {
    "target": [
      "dmg",
      "zip"
    ],
    "category": "public.app-category.utilities",
    "signingIdentity": "Developer ID Application"
  },
  "dmg": {
    "contents": [
      {
        "x": 130,
        "y": 220,
        "type": "file"
      },
      {
        "x": 410,
        "y": 220,
        "type": "link",
        "path": "/Applications"
      }
    ]
  }
}
```

### File: `package.json` (build scripts)
```json
{
  "scripts": {
    "dev": "concurrently \"vite\" \"electron .\"",
    "build": "vite build && electron-builder --publish never",
    "build:win": "vite build && electron-builder --win",
    "build:mac": "vite build && electron-builder --mac",
    "build:all": "vite build && electron-builder --win --mac",
    "release": "vite build && electron-builder --publish always"
  }
}
```

---

## 11. GITHUB COPILOT PROMPTS

### Prompt 1: Project Setup
```
Create an Electron + React + TypeScript project structure for an eye-tracking desktop app.

Requirements:
- Use Vite as bundler (not webpack)
- Separate src/main (Electron) and src/renderer (React)
- TypeScript for both processes
- Proper IPC bridge with contextIsolation: true
- electron-builder configuration for Windows & Mac

Generate:
- Complete package.json with all dependencies
- vite.config.ts with proper configuration
- Electron main.ts with window management
- preload.ts with secure IPC
- tsconfig.json
- .eslintrc configuration
- GitHub Actions workflows for building Windows & Mac installers
```

### Prompt 2: MediaPipe Web Integration
```
Implement MediaPipe Web eye-tracking for gaze estimation:

Requirements:
- Use @mediapipe/tasks-web (vision tasks)
- Detect face landmarks from webcam input
- Extract iris center coordinates
- Calculate gaze direction based on iris position
- Return normalized 0-1 coordinates for screen mapping
- Include confidence scoring (0-1)
- Handle poor lighting and face not detected

Generate:
- MediaPipeWrapper.ts (initialization and setup)
- FaceDetector.ts (face landmark detection)
- EyeGazeEstimator.ts (gaze vector calculation)
- Custom hook useGazeTracker.ts for React integration
- Types file with GazePoint interface
- Error handling and logging

Reference the MediaPipe documentation for v0.10+ tasks-web library
```

### Prompt 3: System Mouse Control
```
Implement cross-platform system mouse control via Electron IPC:

Requirements:
- Use robot.js for mouse control (moveMouse, click)
- Create MouseController.ts in Electron main process
- Expose methods via Electron IPC channels
- Create preload.ts to safely expose IPC to renderer
- Support Windows and macOS
- Include screen boundary clamping
- Handle multiple monitors (future enhancement)

Generate:
- MouseController.ts class with methods: moveTo(), click(), doubleClick()
- IPC channel handlers in main.ts
- preload.ts with window.api interface
- Type definitions for IPC communication
- Integration tests for mouse control
```

### Prompt 4: Calibration System
```
Implement 5-point homography-based gaze calibration:

Logic:
- Display 5 calibration points (corners + center)
- User gazes at each point for 2 seconds
- Record screen point and raw gaze point pairs
- Calculate 3x3 homography transformation matrix
- Save matrix to persistent storage
- Apply matrix to future gaze points

Generate:
- CalibrationManager.ts (core logic)
- CalibrationPage.tsx (5-point UI in React)
- calibrationService.ts (utility functions)
- Homography calculation (using math library or cv.js)
- Storage service for persistent calibration
- Accuracy validation function
- Reset/recalibration functionality

Include algorithm for solving homography: H @ raw = screen
```

### Prompt 5: Mouse Control Integration
```
Implement real-time gaze-to-mouse cursor mapping:

Logic:
- Continuous 30 FPS gaze tracking loop
- Apply calibration matrix to raw gaze points
- Smooth gaze coordinates (exponential filter, alpha=0.3)
- Move system cursor to smoothed screen position
- Filter low-confidence gaze points (< 0.7)
- Clamp to screen boundaries

Generate:
- useMouseControl.ts hook (main integration)
- GazeVisualizer.tsx component (optional cursor overlay)
- Smoothing algorithm implementation
- IPC communication to Electron mouse controller
- Main app loop using requestAnimationFrame
- Performance optimization for 30 FPS target

Integrate with existing useGazeTracker and calibration system
```

### Prompt 6: Settings & UI
```
Create settings page and main dashboard UI:

Layout:
- Main dashboard with status panel
- Start/Stop tracking buttons
- Calibrate button (links to CalibrationPage)
- Settings button (links to SettingsPage)
- Debug visualization toggle
- FPS counter
- Confidence indicator

Settings Page:
- Toggle tracking on/off
- Gaze smoothing slider (0.1-0.9)
- Minimum confidence threshold (0.5-0.95)
- Debug mode toggle
- Recalibration interval setting
- Reset to defaults button

Generate:
- HomePage.tsx with dashboard layout
- SettingsPage.tsx with form controls
- StatusPanel.tsx component
- useSettings.ts hook for localStorage persistence
- Material-UI or Chakra UI components
- Settings validation and saving
- Zustand store for global state management
```

---

## 12. DEVELOPMENT PHASES & TIMELINE

| Phase | Duration | Features | Status |
|-------|----------|----------|--------|
| **Phase 1: MVP** | Weeks 1-3 | Eye detection, gaze tracking, mouse control, calibration | ✅ Done |
| **Phase 2: Enhancement** | Weeks 4-5 | Settings, visual feedback, multi-monitor support | 🟡 In Progress (Settings & UI done, multi-monitor pending) |
| **Phase 3: Polish** | Weeks 6-7 | Performance, auto-updates, advanced calibration | 🔴 |
| **Phase 4: Testing** | Week 8 | QA, bug fixes, documentation | 🔴 |

---

## 13. TESTING STRATEGY

### Unit Tests
```typescript
// Tests for core logic (gaze calculation, calibration, smoothing)
describe('GazeEstimator', () => {
  it('should return normalized gaze coordinates', () => {
    const landmarks = mockFaceLandmarks()
    const gaze = estimateGazeDirection(landmarks, {width: 640, height: 480})
    expect(gaze.x).toBeGreaterThanOrEqual(0)
    expect(gaze.x).toBeLessThanOrEqual(1)
  })
})

describe('CalibrationService', () => {
  it('should apply homography transformation', () => {
    const matrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
    const point = {x: 0.5, y: 0.5}
    const result = applyHomography(point, matrix)
    expect(result.x).toBe(0.5)
  })
})
```

### Integration Tests
- Full gaze tracking pipeline
- Calibration → gaze transformation
- IPC communication (main ↔ renderer)
- Mouse movement accuracy

### Manual Testing Checklist
- [ ] Lighting conditions (bright, dim, harsh shadows)
- [ ] Different face distances (20cm - 100cm)
- [ ] Calibration accuracy at different screen positions
- [ ] Mouse cursor smoothness and responsiveness
- [ ] Multi-monitor setup
- [ ] Windows 10, Windows 11
- [ ] macOS Intel & Apple Silicon
- [ ] Memory and CPU usage during extended sessions

---

## 14. PERFORMANCE TARGETS

| Metric | Target |
|--------|--------|
| Gaze Detection Latency | < 50ms |
| Frame Processing Rate | 30 FPS |
| Mouse Update Rate | 30 Hz |
| Memory Usage | < 200 MB |
| CPU Usage | < 15% (single core) |
| GPU Memory | < 100 MB |
| Startup Time | < 3 seconds |
| Calibration Accuracy | ±2-3% of screen |

---

## 15. DISTRIBUTION & AUTO-UPDATES

### Windows Distribution
```
eye-tracking-app-setup-1.0.0.exe
└─ NSIS installer (one-click install)
   ├─ Install to Program Files
   ├─ Create Start Menu shortcuts
   ├─ Create Desktop shortcut
   └─ Auto-update via electron-updater
```

### macOS Distribution
```
eye-tracking-app-1.0.0.dmg
├─ Drag & drop to Applications
├─ Codesign and notarize (Apple requirements)
└─ Auto-update via electron-updater
```

### Update Server
```
GitHub Releases (free hosting)
├─ Store releases with auto-update metadata
├─ Version checking: latest.yml
└─ electron-updater handles downloading & installing
```

---

## 16. SECURITY CONSIDERATIONS

- ✅ Context isolation enabled (contextIsolation: true)
- ✅ Node integration disabled
- ✅ IPC whitelist via preload.js
- ✅ Code signing for macOS (required)
- ✅ NSIS installer with UAC prompt for Windows
- ✅ No hardcoded credentials
- ✅ Secure storage for calibration data (encrypted)

---

## 17. TROUBLESHOOTING

### Issue 1: Poor Gaze Accuracy
- **Solution:** Recalibrate (lighting changed, camera repositioned)
- **Check:** Confidence > 0.7, face clearly visible

### Issue 2: High CPU Usage
- **Solution:** Reduce frame rate (30 FPS → 15 FPS)
- **Check:** GPU acceleration available

### Issue 3: Crashes on Startup
- **Solution:** Delete cached data: `~/.config/eye-tracking-app` (Linux/Mac) or `%APPDATA%/eye-tracking-app` (Windows)
- **Check:** Latest electron-builder version

### Issue 4: Mouse Won't Move
- **Solution:** Check IPC communication between processes
- **Check:** Electron DevTools console for errors

---

## 18. FUTURE ENHANCEMENTS

### Phase 4+: Advanced Features
1. **Click Detection**
   - Blink detection for single click
   - Double blink for double-click
   - Dwell time for right-click

2. **Gesture Support**
   - Scroll detection (head movement)
   - Drag & drop (gaze + button hold)
   - Keyboard shortcuts integration

3. **Multi-Workspace**
   - Per-app calibration profiles
   - Auto-switch profiles based on active window
   - Heatmap visualization

4. **Mobile Integration**
   - Connect Android/iOS app for remote mouse control
   - Sync calibration across devices

5. **Advanced ML**
   - Custom gaze model training
   - Head pose correction
   - Pupil size tracking

---

## 19. REFERENCE LINKS

- [MediaPipe Web Documentation](https://developers.google.com/mediapipe/solutions/vision)
- [Electron Official Guide](https://www.electronjs.org/docs)
- [Electron Builder](https://www.electron.build/)
- [React Hooks Guide](https://react.dev/reference/react)
- [robot.js API](https://github.com/octalmage/robotjs)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 20. NOTES FOR GITHUB COPILOT

**When prompting Copilot:**

✅ **Good:** "Generate CalibrationPage.tsx that shows 5 calibration points, records gaze data, and calls calibrationService.finishCalibration()"

❌ **Vague:** "Create calibration UI"

**Recommended Workflow:**
1. Start with **Prompt 1** (project setup)
2. Build **Prompt 2** (MediaPipe integration)
3. Add **Prompt 3** (mouse control)
4. Implement **Prompt 4** (calibration)
5. Connect **Prompt 5** (integration)
6. Polish with **Prompt 6** (UI)

**Tip:** Copy this entire markdown into a file, then reference it in each Copilot prompt:
```
I'm following this detailed project plan: [attach file]

[Specific prompt from section 11]
```

This gives Copilot full context for more accurate code generation.

---

# END OF PROJECT PLAN
# Ready for GitHub Copilot Implementation
