import { contextBridge, ipcRenderer } from 'electron'
import type { AppSettings, CalibrationPayload, DesktopApi, MouseButton, ScreenSize } from '../shared/ipc'
import { CALIBRATION_CHANNELS, MOUSE_CHANNELS, SETTINGS_CHANNELS, SYSTEM_CHANNELS } from '../shared/ipc-channels'

const api: DesktopApi = {
  moveMouse: (x: number, y: number) => ipcRenderer.invoke(MOUSE_CHANNELS.MOVE, x, y),
  click: (button: MouseButton) => ipcRenderer.invoke(MOUSE_CHANNELS.CLICK, button),
  doubleClick: () => ipcRenderer.invoke(MOUSE_CHANNELS.DOUBLE_CLICK, 'left'),
  mouseDown: (button: MouseButton) => ipcRenderer.invoke(MOUSE_CHANNELS.MOUSE_DOWN, button),
  mouseUp: (button: MouseButton) => ipcRenderer.invoke(MOUSE_CHANNELS.MOUSE_UP, button),
  getScreenSize: () => ipcRenderer.invoke(MOUSE_CHANNELS.GET_SCREEN_SIZE) as Promise<ScreenSize>,
  getSetting: <T>(key: string) => ipcRenderer.invoke(SETTINGS_CHANNELS.GET, key) as Promise<T | null>,
  setSetting: <T>(key: string, value: T) => ipcRenderer.invoke(SETTINGS_CHANNELS.SET, key, value),
  loadSettings: () => ipcRenderer.invoke(SETTINGS_CHANNELS.LOAD_ALL) as Promise<AppSettings | null>,
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke(SETTINGS_CHANNELS.SAVE_ALL, settings),
  resetSettings: () => ipcRenderer.invoke(SETTINGS_CHANNELS.RESET),
  saveCalibration: (data: CalibrationPayload) => ipcRenderer.invoke(CALIBRATION_CHANNELS.SAVE, data),
  loadCalibration: () =>
    ipcRenderer.invoke(CALIBRATION_CHANNELS.LOAD) as Promise<CalibrationPayload | null>,
  deleteCalibration: () => ipcRenderer.invoke(CALIBRATION_CHANNELS.DELETE),
  getCalibrationAccuracy: () =>
    ipcRenderer.invoke(CALIBRATION_CHANNELS.GET_ACCURACY) as Promise<number | null>,
  checkAccessibility: () =>
    ipcRenderer.invoke(SYSTEM_CHANNELS.CHECK_ACCESSIBILITY) as Promise<boolean>,
  requestAccessibility: () =>
    ipcRenderer.invoke(SYSTEM_CHANNELS.REQUEST_ACCESSIBILITY) as Promise<boolean>
}

contextBridge.exposeInMainWorld('api', api)
