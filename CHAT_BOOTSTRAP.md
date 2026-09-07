# I-Track New Chat Bootstrap (Token-Saving)

Use this in a new chat to avoid full-repo re-reading.

## Current Status (important)

- Prompt 1 scaffold is complete.
- Phase 1 implementation is in progress and partially working:
  - Camera feed works.
  - MediaPipe initializes and gaze dot moves.
  - Stability/range/calibration are still being tuned.

## Read Only These Files First

1. `src/renderer/App.tsx`
2. `src/renderer/hooks/useGazeTracker.ts`
3. `src/renderer/ml/EyeGazeEstimator.ts`
4. `src/renderer/hooks/useMouseControl.ts`
5. `src/renderer/pages/CalibrationPage.tsx`
6. `src/renderer/services/calibrationService.ts`
7. `src/main/main.ts`
8. `src/shared/constants.ts`

Do not scan the entire repo unless needed.

## User Execution Rule

- Do NOT run terminal commands.
- Always give me exact commands to run.
- Wait for my command output before next step.

## Copy-Paste Prompt For New Chat

```text
I am continuing work on I-Track.

Use CHAT_BOOTSTRAP.md as source of truth.
Read only the listed 8 files first (do not scan full repo).

Current issue:
- Gaze is unstable and inconsistent.
- Vertical drift occurs.
- Calibration reliability still needs improvement.
- Need smooth, full-screen cursor-like control from gaze.

Important execution rule:
Do not run terminal commands yourself.
Tell me exactly which command to run, and I will run it and share output.
Wait for my result before proceeding.
```
