# I-Track Repository Map

Use this file as context when starting a new chat for Prompt 2–6.

## Chat Execution Rule

When using this repo in Copilot chat:

- Do **not** run terminal commands automatically.
- Provide the exact command(s) for me to run locally.
- Wait for my output, then continue based on my results.

## Root

- `package.json` - scripts, dependencies, Electron entry (`dist/main/main.js`)
- `vite.config.ts` - Vite config for renderer (`src/renderer` -> `dist/renderer`)
- `tsconfig.json` - renderer/shared TypeScript config
- `tsconfig.main.json` - Electron main/shared TypeScript config
- `.eslintrc.cjs` / `.prettierrc` - lint/format config
- `README.md` - setup and run instructions
- `REPO_MAP.md` - this map

## Source Layout

### `src/main/` (Electron main process)

- `main.ts` - app bootstrap + IPC handlers
- `preload.ts` - secure API bridge (`window.api`)
- `window.ts` - BrowserWindow creation
- `mouse/MouseController.ts` - screen-aware mouse commands
- `mouse/robot-wrapper.ts` - robotjs wrapper
- `types/robotjs.d.ts` - robotjs type declarations

### `src/shared/` (shared contracts)

- `ipc-channels.ts` - channel name constants
- `ipc.ts` - shared IPC types (`DesktopApi`, settings, calibration, etc.)
- `constants.ts` - app defaults (includes default settings)

### `src/renderer/` (React app)

- `index.html`, `main.tsx`, `App.tsx`, `App.css`
- `vite-env.d.ts` - `window.api` typing

#### UI Pages

- `pages/HomePage.tsx`
- `pages/CalibrationPage.tsx`
- `pages/SettingsPage.tsx`
- `pages/DebugPage.tsx`
- `pages/styles.ts`

#### UI Components

- `components/StatusPanel.tsx`
- `components/GazeVisualizer.tsx`
- `components/CalibrationGrid.tsx`
- `components/CameraPreview.tsx`
- `components/SettingsForm.tsx`
- `components/GazeOverlay.tsx`

#### Hooks

- `hooks/useGazeTracker.ts`
- `hooks/useMouseControl.ts`
- `hooks/useCalibration.ts`
- `hooks/useCameraStream.ts`
- `hooks/useSettings.ts`

#### Services

- `services/ipcService.ts`
- `services/calibrationService.ts`
- `services/gazeService.ts`
- `services/storageService.ts`

#### ML (scaffold placeholders)

- `ml/MediaPipeWrapper.ts`
- `ml/FaceDetector.ts`
- `ml/EyeGazeEstimator.ts`
- `ml/types.ts`

#### State/Types/Utils

- `store/appStore.ts`
- `types/gaze.ts`, `types/calibration.ts`, `types/settings.ts`, `types/ipc.ts`
- `utils/logger.ts`, `utils/math.ts`, `utils/calibration.ts`, `utils/validation.ts`

## Build, Packaging, CI

- `electron-builder-config/build-config.json` - Windows/mac packaging targets
- `.github/workflows/build-windows.yml` - Windows build workflow
- `.github/workflows/build-mac.yml` - macOS build workflow
- `.github/workflows/release.yml` - release build workflow

## Prompt-to-File Map

- **Prompt 2 (MediaPipe):** `src/renderer/ml/*`, `src/renderer/hooks/useGazeTracker.ts`, `src/renderer/types/gaze.ts`
- **Prompt 3 (Mouse IPC):** `src/main/mouse/*`, `src/main/main.ts`, `src/main/preload.ts`, `src/shared/ipc*`
- **Prompt 4 (Calibration):** `src/renderer/pages/CalibrationPage.tsx`, `src/renderer/services/calibrationService.ts`, `src/renderer/hooks/useCalibration.ts`, `src/renderer/utils/calibration.ts`
- **Prompt 5 (Integration):** `src/renderer/hooks/useMouseControl.ts`, `src/renderer/components/GazeVisualizer.tsx`, `src/renderer/App.tsx` + page wiring
- **Prompt 6 (Settings/UI):** `src/renderer/pages/HomePage.tsx`, `src/renderer/pages/SettingsPage.tsx`, `src/renderer/components/StatusPanel.tsx`, `src/renderer/store/appStore.ts`, `src/renderer/hooks/useSettings.ts`
