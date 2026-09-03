# I-Track

Electron + React + TypeScript desktop foundation for an eye-tracking app.

## Tech stack

- Electron 28+
- React 18 + Vite 5
- TypeScript
- IPC bridge with `contextIsolation: true`
- `electron-builder` for Windows/macOS packaging

## Getting started

```bash
npm install
npm run dev
```

### MediaPipe model note

The app first tries loading `public/models/face_landmarker.task`, then falls back to the Google-hosted model URL.
If your network blocks the hosted URL, download the face landmarker `.task` model and place it at:

- [public/models/face_landmarker.task](/Users/mithunnagaraj/Desktop/app/I-Track/public/models/face_landmarker.task)

## Build

```bash
npm run build
```

Platform-specific:

```bash
npm run build:win
npm run build:mac
```

## Project structure

- Electron main process: [src/main/](/Users/mithunnagaraj/Desktop/app/I-Track/src/main)
- React renderer: [src/renderer/](/Users/mithunnagaraj/Desktop/app/I-Track/src/renderer)
- Shared contracts: [src/shared/](/Users/mithunnagaraj/Desktop/app/I-Track/src/shared)
- Packager config: [electron-builder-config/](/Users/mithunnagaraj/Desktop/app/I-Track/electron-builder-config)
- Full repo map for follow-up prompts: [REPO_MAP.md](/Users/mithunnagaraj/Desktop/app/I-Track/REPO_MAP.md)
