/**
 * Gaze Tracking Constants & Tuning Parameters
 * 
 * These values control the sensitivity and smoothness of eye tracking.
 * Adjust these to fine-tune the behavior without changing core logic.
 */

// ============================================================================
// EYE GAZE ESTIMATION (EyeGazeEstimator.ts)
// ============================================================================

/** Amplification gain for X-axis (horizontal eye movement)
 *  Higher = more responsive to eye movement, more susceptible to noise
 *  Lower = slower but smoother movement
 *  Recommended range: 1.5 - 3.0
 *  Current: 1.5 (moderate, responsive)
 */
export const GAZE_GAIN_X = 1.5

/** Amplification gain for Y-axis (vertical eye movement)
 *  Higher = more responsive to eye movement, more susceptible to noise
 *  Lower = slower but smoother movement
 *  Recommended range: 1.0 - 2.0
 *  Current: 1.0 (conservative, stable)
 */
export const GAZE_GAIN_Y = 1.0

// ============================================================================
// GAZE TRACKER SMOOTHING (useGazeTracker.ts)
// ============================================================================

/** Smoothing weight for gaze tracking (0.0 to 1.0)
 *  Blends new raw value with previous smoothed value
 *  Formula: smoothed = weight * new_value + (1 - weight) * previous_value
 *  Higher (e.g., 0.5) = more responsive but noisier
 *  Lower (e.g., 0.1) = smoother but slower
 *  Current: 0.25 (responsive, 75% stays on previous value)
 */
export const GAZE_TRACKING_SMOOTHING_WEIGHT = 0.25

/** Dead-zone threshold for gaze tracking (0.0 to 1.0)
 *  If movement delta is smaller than this, ignore it (treat as jitter)
 *  Helps prevent the dot from twitching at rest
 *  Current: 0.001 (very lenient, catches most movements)
 */
export const GAZE_TRACKING_DEAD_ZONE = 0.001

/** Adaptive range learning rate (0.0 to 1.0)
 *  How fast the system learns your eye's natural movement range
 *  Formula: range += (value - range) * learning_rate
 *  Higher (e.g., 0.01) = learns quickly but may drift with noise
 *  Lower (e.g., 0.0001) = learns slowly but very stable
 *  Current: 0.0005 (very conservative, slow learning)
 */
export const GAZE_RANGE_LEARNING_RATE = 0.0005

/** Minimum span for X and Y ranges (0.0 to 1.0)
 *  Prevents the tracking range from becoming too small
 *  If range narrows below this, pad it to this minimum
 *  Current: 0.15 (allows 15% of screen range)
 */
export const GAZE_RANGE_MIN_SPAN = 0.15

/** Initial minimum X range (0.0 to 1.0)
 *  Starting point for adaptive range learning on X-axis
 *  User's actual gaze range may expand beyond this
 *  Current: 0.2 (assume eyes can reach 20% from left edge)
 */
export const GAZE_RANGE_INITIAL_MIN_X = 0.2

/** Initial maximum X range (0.0 to 1.0)
 *  Starting point for adaptive range learning on X-axis
 *  Current: 0.8 (assume eyes can reach 80% from left edge)
 */
export const GAZE_RANGE_INITIAL_MAX_X = 0.8

/** Initial minimum Y range (0.0 to 1.0)
 *  Starting point for adaptive range learning on Y-axis
 *  Current: 0.2 (assume eyes can reach 20% from top edge)
 */
export const GAZE_RANGE_INITIAL_MIN_Y = 0.2

/** Initial maximum Y range (0.0 to 1.0)
 *  Starting point for adaptive range learning on Y-axis
 *  Current: 0.8 (assume eyes can reach 80% from top edge)
 */
export const GAZE_RANGE_INITIAL_MAX_Y = 0.8

// ============================================================================
// GAZE DOT RENDERING (GazeVisualizer.tsx)
// ============================================================================

/** Per-frame interpolation factor for the on-screen gaze dot (0.0 to 1.0)
 *  Each animation frame, the rendered dot moves this fraction of the way
 *  toward the latest tracked point, independent of detection frame rate.
 *  Higher = snappier and responsive (now that One Euro Filter handles stability)
 *  Lower = smoother/glidier but more perceived lag
 *  Current: 0.55 (responsive, tight tracking)
 */
export const GAZE_DOT_RENDER_LERP_FACTOR = 0.55


// ============================================================================
// MOUSE CONTROL SMOOTHING (useMouseControl.ts)
// ============================================================================

/** Smoothing weight for mouse cursor movement (0.0 to 1.0)
 *  Applied AFTER calibration, before moving mouse
 *  Similar to GAZE_TRACKING_SMOOTHING_WEIGHT but for final cursor output
 *  Higher = more responsive cursor, more jitter
 *  Lower = smoother cursor, more lag
 *  Default value: 0.3 (from useMouseControl prop)
 */
export const MOUSE_SMOOTHING_WEIGHT = 0.3

/** Dead-zone threshold for mouse movement (0.0 to 1.0)
 *  If calibrated movement delta is smaller than this, don't move mouse
 *  Prevents cursor from drifting when eyes are still
 *  Current: 0.0025 (very small, nearly all movements applied)
 */
export const MOUSE_MOVEMENT_DEAD_ZONE = 0.0025

// ============================================================================
// EYE STATE DETECTION (EyeGazeEstimator.ts)
// ============================================================================

/** Eye open ratio threshold for gaze validity (0.0 to 1.0)
 *  When you close your eyes, the vertical eye opening shrinks
 *  If openScore < this threshold, gaze is filtered out
 *  Current: 0.2 (require at least 20% eye opening)
 */
export const EYE_OPEN_CONFIDENCE_THRESHOLD = 0.2

/** Minimum eye-agreement score (0.0 to 1.0)
 *  Both eyes should agree on gaze direction
 *  Lower = more tolerant of left-right eye disagreement
 *  Current: Used indirectly in confidence calculation
 */
export const EYE_AGREEMENT_WEIGHT = 1.0 // Multiplier for agreement in confidence

// ============================================================================
// TIPS FOR TUNING:
// ============================================================================
// 1. Too fast? Decrease GAZE_GAIN_X/Y or increase GAZE_TRACKING_SMOOTHING_WEIGHT
// 2. Too slow? Increase GAZE_GAIN_X/Y or decrease GAZE_TRACKING_SMOOTHING_WEIGHT
// 3. Dot jittery? Increase GAZE_TRACKING_DEAD_ZONE or GAZE_TRACKING_SMOOTHING_WEIGHT
// 4. Head movement sensitive? Decrease GAZE_GAIN_X/Y
// 5. Can't calibrate? Slow down dot (adjust gains/smoothing first)
// 6. Range drifting? Decrease GAZE_RANGE_LEARNING_RATE
