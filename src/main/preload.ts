import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppSettings,
  CalibrationPayload,
  CalibrationProfilePayload,
  DesktopApi,
  DisplayInfo,
  MouseButton,
  ScreenSize,
  UpdateInfo
} from '../shared/ipc'
import {
  CALIBRATION_CHANNELS,
  MOUSE_CHANNELS,
  PROFILES_CHANNELS,
  SETTINGS_CHANNELS,
  SYSTEM_CHANNELS,
  UPDATER_CHANNELS
} from '../shared/ipc-channels'

const api: DesktopApi = {
  moveMouse: (x: number, y: number, screenIndex?: number) =>
    ipcRenderer.invoke(MOUSE_CHANNELS.MOVE, x, y, screenIndex),
  click: (button: MouseButton) => ipcRenderer.invoke(MOUSE_CHANNELS.CLICK, button),
  doubleClick: () => ipcRenderer.invoke(MOUSE_CHANNELS.DOUBLE_CLICK, 'left'),
  mouseDown: (button: MouseButton) => ipcRenderer.invoke(MOUSE_CHANNELS.MOUSE_DOWN, button),
  mouseUp: (button: MouseButton) => ipcRenderer.invoke(MOUSE_CHANNELS.MOUSE_UP, button),
  getScreenSize: (screenIndex?: number) =>
    ipcRenderer.invoke(MOUSE_CHANNELS.GET_SCREEN_SIZE, screenIndex) as Promise<ScreenSize>,
  getDisplays: () => ipcRenderer.invoke(MOUSE_CHANNELS.GET_DISPLAYS) as Promise<DisplayInfo[]>,
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
  loadProfiles: () =>
    ipcRenderer.invoke(PROFILES_CHANNELS.LOAD_ALL) as Promise<CalibrationProfilePayload[] | null>,
  saveProfiles: (profiles: CalibrationProfilePayload[]) =>
    ipcRenderer.invoke(PROFILES_CHANNELS.SAVE_ALL, profiles),
  checkAccessibility: () =>
    ipcRenderer.invoke(SYSTEM_CHANNELS.CHECK_ACCESSIBILITY) as Promise<boolean>,
  requestAccessibility: () =>
    ipcRenderer.invoke(SYSTEM_CHANNELS.REQUEST_ACCESSIBILITY) as Promise<boolean>,
  // Updater API
  checkForUpdates: () =>
    ipcRenderer.invoke(UPDATER_CHANNELS.CHECK) as Promise<UpdateInfo>,
  downloadUpdate: () =>
    ipcRenderer.invoke(UPDATER_CHANNELS.DOWNLOAD) as Promise<void>,
  quitAndInstallUpdate: () =>
    ipcRenderer.invoke(UPDATER_CHANNELS.INSTALL) as Promise<void>,
  getUpdateStatus: () =>
    ipcRenderer.invoke(UPDATER_CHANNELS.GET_STATUS) as Promise<UpdateInfo>,
  onUpdateStatusChanged: (callback: (info: UpdateInfo) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: UpdateInfo) => callback(info)
    ipcRenderer.on(UPDATER_CHANNELS.STATUS_CHANGED, handler)
    return () => {
      ipcRenderer.removeListener(UPDATER_CHANNELS.STATUS_CHANGED, handler)
    }
  },
  getAppVersion: () => Promise.resolve('0.1.0')
}

contextBridge.exposeInMainWorld('api', api)
