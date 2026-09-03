import type { CalibrationMatrix } from '../types/calibration'
import type { MouseButton } from '../types/ipc'

export const ipcService = {
  moveMouse(x: number, y: number): Promise<void> {
    return window.api.moveMouse(x, y)
  },
  click(button: MouseButton): Promise<void> {
    return window.api.click(button)
  },
  getScreenSize() {
    return window.api.getScreenSize()
  },
  saveCalibration(matrix: CalibrationMatrix): Promise<void> {
    return window.api.saveCalibration(matrix)
  },
  loadCalibration(): Promise<CalibrationMatrix | null> {
    return window.api.loadCalibration()
  },
  deleteCalibration(): Promise<void> {
    return window.api.deleteCalibration()
  },
  getCalibrationAccuracy(): Promise<number | null> {
    return window.api.getCalibrationAccuracy()
  }
}
