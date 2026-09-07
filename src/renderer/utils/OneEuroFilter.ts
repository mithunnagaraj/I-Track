/**
 * 1€ (One Euro) Filter
 *
 * An adaptive first-order low-pass filter with velocity-based cutoff frequency.
 * Eliminates jitter during fixations (low eye velocity) while removing lag during saccades (high eye velocity).
 * Reference: Casiez, G., Roussel, N. and Vogel, D. (2012). 1€ Filter: A Simple Speed-based
 * Low-pass Filter for Noisy Input in Human-Computer Interaction. CHI '12.
 */

export class LowPassFilter {
  private y: number | null = null
  private s: number | null = null

  constructor(private alpha: number = 0.5) {}

  filter(value: number, alpha?: number): number {
    if (alpha !== undefined) {
      this.alpha = alpha
    }
    if (this.y === null) {
      this.s = value
      this.y = value
      return value
    }
    const result = this.alpha * value + (1 - this.alpha) * (this.s ?? value)
    this.s = result
    this.y = result
    return result
  }

  lastValue(): number | null {
    return this.y
  }

  reset(): void {
    this.y = null
    this.s = null
  }
}

export interface OneEuroFilterConfig {
  minCutoff?: number // Minimum cutoff frequency (Hz) at low speed (lower = steadier fixations)
  beta?: number      // Speed coefficient (higher = faster adaptation during eye saccades)
  dCutoff?: number   // Cutoff frequency for derivative calculation (Hz)
}

export class OneEuroFilter {
  private xFilter = new LowPassFilter()
  private dxFilter = new LowPassFilter()
  private lastTime: number | null = null

  public minCutoff: number
  public beta: number
  public dCutoff: number

  constructor(config?: OneEuroFilterConfig) {
    this.minCutoff = config?.minCutoff ?? 1.0
    this.beta = config?.beta ?? 0.08
    this.dCutoff = config?.dCutoff ?? 1.0
  }

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff)
    return 1.0 / (1.0 + tau / dt)
  }

  filter(value: number, timestampMs: number): number {
    if (this.lastTime === null) {
      this.lastTime = timestampMs
      return this.xFilter.filter(value)
    }

    const dt = Math.max(0.001, (timestampMs - this.lastTime) / 1000)
    this.lastTime = timestampMs

    // 1. Calculate rate of change
    const prevX = this.xFilter.lastValue() ?? value
    const dx = (value - prevX) / dt

    // 2. Filter rate of change
    const edx = this.dxFilter.filter(dx, this.alpha(this.dCutoff, dt))

    // 3. Adapt cutoff frequency based on velocity magnitude
    const cutoff = this.minCutoff + this.beta * Math.abs(edx)

    // 4. Filter signal
    return this.xFilter.filter(value, this.alpha(cutoff, dt))
  }

  reset(): void {
    this.xFilter.reset()
    this.dxFilter.reset()
    this.lastTime = null
  }
}

export class OneEuroFilter2D {
  private xFilter: OneEuroFilter
  private yFilter: OneEuroFilter

  constructor(config?: OneEuroFilterConfig) {
    this.xFilter = new OneEuroFilter(config)
    this.yFilter = new OneEuroFilter(config)
  }

  filter(x: number, y: number, timestampMs: number): { x: number; y: number } {
    return {
      x: this.xFilter.filter(x, timestampMs),
      y: this.yFilter.filter(y, timestampMs)
    }
  }

  setParameters(config: Partial<OneEuroFilterConfig>): void {
    if (config.minCutoff !== undefined) {
      this.xFilter.minCutoff = config.minCutoff
      this.yFilter.minCutoff = config.minCutoff
    }
    if (config.beta !== undefined) {
      this.xFilter.beta = config.beta
      this.yFilter.beta = config.beta
    }
    if (config.dCutoff !== undefined) {
      this.xFilter.dCutoff = config.dCutoff
      this.yFilter.dCutoff = config.dCutoff
    }
  }

  reset(): void {
    this.xFilter.reset()
    this.yFilter.reset()
  }
}
