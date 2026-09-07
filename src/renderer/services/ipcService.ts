import type { CalibrationMatrix, CalibrationProfile } from '../types/calibration'
import type { AppSettings, DisplayInfo, MouseButton, ScreenSize, UpdateInfo } from '../types/ipc'

export const ipcService = {
  moveMouse(x: number, y: number, screenIndex = 0): Promise<void> {
    if (window.api?.moveMouse) {
      return window.api.moveMouse(x, y, screenIndex)
    }
    return Promise.resolve()
  },
  click(button: MouseButton): Promise<void> {
    if (window.api?.click) {
      return window.api.click(button)
    }
    return Promise.resolve()
  },
  getScreenSize(screenIndex = 0): Promise<ScreenSize> {
    if (window.api?.getScreenSize) {
      return window.api.getScreenSize(screenIndex)
    }
    return Promise.resolve({ width: window.innerWidth, height: window.innerHeight })
  },
  getDisplays(): Promise<DisplayInfo[]> {
    if (window.api?.getDisplays) {
      return window.api.getDisplays()
    }
    return Promise.resolve([
      {
        id: 1,
        name: 'Primary Display',
        bounds: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
        workArea: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
        scaleFactor: window.devicePixelRatio || 1,
        isPrimary: true
      }
    ])
  },
  saveCalibration(matrix: CalibrationMatrix): Promise<void> {
    if (window.api?.saveCalibration) {
      return window.api.saveCalibration(matrix)
    }
    return Promise.resolve()
  },
  loadCalibration(): Promise<CalibrationMatrix | null> {
    if (window.api?.loadCalibration) {
      return window.api.loadCalibration() as Promise<CalibrationMatrix | null>
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
  loadProfiles(): Promise<CalibrationProfile[] | null> {
    if (window.api?.loadProfiles) {
      return window.api.loadProfiles() as Promise<CalibrationProfile[] | null>
    }
    return Promise.resolve(null)
  },
  saveProfiles(profiles: CalibrationProfile[]): Promise<void> {
    if (window.api?.saveProfiles) {
      return window.api.saveProfiles(profiles)
    }
    return Promise.resolve()
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
  },
  // Updater
  checkForUpdates(): Promise<UpdateInfo> {
    if (window.api?.checkForUpdates) {
      return window.api.checkForUpdates()
    }
    return Promise.resolve({ state: 'not-available', version: '0.1.0' })
  },
  downloadUpdate(): Promise<void> {
    if (window.api?.downloadUpdate) {
      return window.api.downloadUpdate()
    }
    return Promise.resolve()
  },
  quitAndInstallUpdate(): Promise<void> {
    if (window.api?.quitAndInstallUpdate) {
      return window.api.quitAndInstallUpdate()
    }
    return Promise.resolve()
  },
  getUpdateStatus(): Promise<UpdateInfo> {
    if (window.api?.getUpdateStatus) {
      return window.api.getUpdateStatus()
    }
    return Promise.resolve({ state: 'idle', version: '0.1.0' })
  },
  onUpdateStatusChanged(callback: (info: UpdateInfo) => void): () => void {
    if (window.api?.onUpdateStatusChanged) {
      return window.api.onUpdateStatusChanged(callback)
    }
    return () => {}
  }
}
