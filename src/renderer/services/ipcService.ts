import type { CalibrationMatrix } from '../types/calibration'
import type { AppSettings, MouseButton } from '../types/ipc'

export const ipcService = {
  moveMouse(x: number, y: number): Promise<void> {
    if (window.api?.moveMouse) {
      return window.api.moveMouse(x, y)
    }
    return Promise.resolve()
  },
  click(button: MouseButton): Promise<void> {
    if (window.api?.click) {
      return window.api.click(button)
    }
    return Promise.resolve()
  },
  getScreenSize() {
    if (window.api?.getScreenSize) {
      return window.api.getScreenSize()
    }
    return Promise.resolve({ width: window.innerWidth, height: window.innerHeight })
  },
  saveCalibration(matrix: CalibrationMatrix): Promise<void> {
    if (window.api?.saveCalibration) {
      return window.api.saveCalibration(matrix)
    }
    return Promise.resolve()
  },
  loadCalibration(): Promise<CalibrationMatrix | null> {
    if (window.api?.loadCalibration) {
      return window.api.loadCalibration()
    }
    return Promise.resolve(null)
  },
  deleteCalibration(): Promise<void> {
    if (window.api?.deleteCalibration) {
      return window.api.deleteCalibration()
    }
    return Promise.resolve()
  },
  getCalibrationAccuracy(): Promise<number | null> {
    if (window.api?.getCalibrationAccuracy) {
      return window.api.getCalibrationAccuracy()
    }
    return Promise.resolve(null)
  },
  checkAccessibility(): Promise<boolean> {
    if (window.api?.checkAccessibility) {
      return window.api.checkAccessibility()
    }
    return Promise.resolve(true)
  },
  requestAccessibility(): Promise<boolean> {
    if (window.api?.requestAccessibility) {
      return window.api.requestAccessibility()
    }
    return Promise.resolve(true)
  },
  loadSettings(): Promise<AppSettings | null> {
    if (window.api?.loadSettings) {
      return window.api.loadSettings()
    }
    return Promise.resolve(null)
  },
  saveSettings(settings: AppSettings): Promise<void> {
    if (window.api?.saveSettings) {
      return window.api.saveSettings(settings)
    }
    return Promise.resolve()
  },
  resetSettings(): Promise<void> {
    if (window.api?.resetSettings) {
      return window.api.resetSettings()
    }
    return Promise.resolve()
  }
}


