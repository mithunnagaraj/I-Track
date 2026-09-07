# Gaze Tracking Tuning Guide

All gaze tracking parameters are now centralized in:
**`src/renderer/constants/gazeTrackingConstants.ts`**

## Quick Reference

### File Locations & Where Constants Are Used

| Constant | File | What It Controls |
|----------|------|-----------------|
| `GAZE_GAIN_X` | `EyeGazeEstimator.ts` | Horizontal movement sensitivity (1.8) |
| `GAZE_GAIN_Y` | `EyeGazeEstimator.ts` | Vertical movement sensitivity (1.2) |
| `GAZE_TRACKING_SMOOTHING_WEIGHT` | `useGazeTracker.ts` | How smooth the dot moves (0.12) |
| `GAZE_TRACKING_DEAD_ZONE` | `useGazeTracker.ts` | Jitter threshold (0.002) |
| `GAZE_RANGE_LEARNING_RATE` | `useGazeTracker.ts` | How fast to learn your eye range (0.0005) |
| `GAZE_RANGE_MIN_SPAN` | `useGazeTracker.ts` | Minimum eye movement range (0.15) |
| `GAZE_RANGE_INITIAL_MIN_X/Y` | `useGazeTracker.ts` | Starting point for learning (0.2) |
| `GAZE_RANGE_INITIAL_MAX_X/Y` | `useGazeTracker.ts` | Starting point for learning (0.8) |
| `MOUSE_SMOOTHING_WEIGHT` | `useMouseControl.ts` | Mouse cursor smoothness (0.3) |
| `MOUSE_MOVEMENT_DEAD_ZONE` | `useMouseControl.ts` | Mouse jitter threshold (0.0025) |
| `EYE_OPEN_CONFIDENCE_THRESHOLD` | `EyeGazeEstimator.ts` | Eye closing detection (0.2) |

## How to Make Changes

1. Open `src/renderer/constants/gazeTrackingConstants.ts`
2. Find the constant you want to change
3. Adjust the value
4. Save the file
5. Rebuild: `npm run dev` (hot reload will pick it up)

## Common Tuning Scenarios

### Problem: Dot moves too fast
**Solution:** 
- Decrease `GAZE_GAIN_X` (2.9 → 1.8)
- Decrease `GAZE_GAIN_Y` (1.5 → 1.2)
- OR increase `GAZE_TRACKING_SMOOTHING_WEIGHT` (0.12 → 0.2)

### Problem: Dot is too slow/unresponsive
**Solution:**
- Increase `GAZE_GAIN_X` (1.8 → 2.5)
- Increase `GAZE_GAIN_Y` (1.2 → 1.5)
- OR decrease `GAZE_TRACKING_SMOOTHING_WEIGHT` (0.12 → 0.08)

### Problem: Dot jitters when eyes are still
**Solution:**
- Increase `GAZE_TRACKING_DEAD_ZONE` (0.002 → 0.005)
- OR increase `GAZE_TRACKING_SMOOTHING_WEIGHT` (0.12 → 0.15)

### Problem: Head movement affects tracking too much
**Solution:**
- Decrease `GAZE_GAIN_X` and `GAZE_GAIN_Y` (lower = less sensitive)
- Increase `GAZE_TRACKING_SMOOTHING_WEIGHT` (higher = more stable)

### Problem: Can't calibrate (dot moves too fast)
**Solution:**
- Decrease gains significantly (GAZE_GAIN_X: 1.8 → 1.2)
- Increase smoothing weight (GAZE_TRACKING_SMOOTHING_WEIGHT: 0.12 → 0.18)

### Problem: Range keeps drifting
**Solution:**
- Decrease `GAZE_RANGE_LEARNING_RATE` (0.0005 → 0.0001)

## Parameter Meanings

### Gains (GAZE_GAIN_X/Y)
- Controls how much the iris position amplifies to screen position
- Formula: `screen_value = 0.5 + (iris_value - 0.5) * gain`
- Range: 1.0 (no amplification) to 3.0+ (very sensitive)

### Smoothing Weight (GAZE_TRACKING_SMOOTHING_WEIGHT)
- Controls blend between new and previous position
- Formula: `smoothed = weight * new + (1 - weight) * previous`
- Range: 0.0 (all previous) to 1.0 (all new)
- 0.12 = 12% new, 88% previous = very smooth

### Dead-Zone (GAZE_TRACKING_DEAD_ZONE / MOUSE_MOVEMENT_DEAD_ZONE)
- Minimum movement required to update position
- Smaller = more sensitive to tiny movements = jittery
- Larger = ignores small movements = stable but less responsive
- Typical: 0.002 - 0.005

### Learning Rate (GAZE_RANGE_LEARNING_RATE)
- How fast the system adapts to your eye's natural range
- Formula: `range += (value - range) * learning_rate`
- Smaller = slower but more stable
- Larger = faster but may overshoot
- Typical: 0.0001 - 0.001

## Testing Changes

After changing a constant:

1. **Visual test:** Does the dot feel smooth and responsive?
2. **Calibration test:** Can you complete calibration without moving your head?
3. **Stability test:** Does the dot stay centered when eyes are still?
4. **Responsiveness test:** Does the dot follow your eye movements accurately?

All four should work well for good tracking!
