export interface Point {
  x: number
  y: number
}

export const exponentialSmoothing = (current: Point, previous: Point, alpha = 0.3): Point => ({
  x: alpha * current.x + (1 - alpha) * previous.x,
  y: alpha * current.y + (1 - alpha) * previous.y
})
