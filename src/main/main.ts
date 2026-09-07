import path from 'node:path'
import { promises as fs } from 'node:fs'
import { app, ipcMain, systemPreferences } from 'electron'
import { MouseController } from './mouse/MouseController'
import { createMainWindow } from './window'
import {
  CALIBRATION_CHANNELS,
  MOUSE_CHANNELS,
  PROFILES_CHANNELS,
  SETTINGS_CHANNELS,
  SYSTEM_CHANNELS,
  UPDATER_CHANNELS
} from '../shared/ipc-channels'
import type {
  AppSettings,
  CalibrationPayload,
  CalibrationProfilePayload,
  UpdateInfo
} from '../shared/ipc'
import { DEFAULT_SETTINGS } from '../shared/constants'

let mainWindow: ReturnType<typeof createMainWindow> | null = null
const mouseController = new MouseController()

let cachedSettings: AppSettings | null = null
let calibrationData: CalibrationPayload | null = null
let profilesData: CalibrationProfilePayload[] | null = null

let updateInfo: UpdateInfo = {
  state: 'idle',
  version: '0.1.0'
}

const settingsFilePath = (): string => path.join(app.getPath('userData'), 'settings.json')
const calibrationFilePath = (): string => path.join(app.getPath('userData'), 'calibration.json')
const profilesFilePath = (): string => path.join(app.getPath('userData'), 'profiles.json')

const loadSettingsFromDisk = async (): Promise<AppSettings | null> => {
  try {
    const raw = await fs.readFile(settingsFilePath(), 'utf-8')
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    if (parsed && typeof parsed === 'object') {
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
    return null
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

const saveSettingsToDisk = async (payload: AppSettings): Promise<void> => {
  await fs.mkdir(app.getPath('userData'), { recursive: true })
  await fs.writeFile(settingsFilePath(), JSON.stringify(payload, null, 2), 'utf-8')
}

const loadCalibrationFromDisk = async (): Promise<CalibrationPayload | null> => {
  try {
    const raw = await fs.readFile(calibrationFilePath(), 'utf-8')
    const parsed = JSON.parse(raw) as CalibrationPayload
    if (
      Array.isArray(parsed.h) &&
      typeof parsed.createdAt === 'number' &&
      typeof parsed.accuracy === 'number'
    ) {
      return parsed
    }
    return null
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

const saveCalibrationToDisk = async (payload: CalibrationPayload): Promise<void> => {
  await fs.mkdir(app.getPath('userData'), { recursive: true })
  await fs.writeFile(calibrationFilePath(), JSON.stringify(payload), 'utf-8')
}

const loadProfilesFromDisk = async (): Promise<CalibrationProfilePayload[] | null> => {
  try {
    const raw = await fs.readFile(profilesFilePath(), 'utf-8')
    const parsed = JSON.parse(raw) as CalibrationProfilePayload[]
    if (Array.isArray(parsed)) {
      return parsed
    }
    return null
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

const saveProfilesToDisk = async (payload: CalibrationProfilePayload[]): Promise<void> => {
  await fs.mkdir(app.getPath('userData'), { recursive: true })
  await fs.writeFile(profilesFilePath(), JSON.stringify(payload, null, 2), 'utf-8')
}

const broadcastUpdateStatus = (status: UpdateInfo): void => {
  updateInfo = status
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(UPDATER_CHANNELS.STATUS_CHANGED, status)
  }
}

const getRendererEntry = (): { kind: 'url' | 'file'; value: string } => {
  if (!app.isPackaged) {
    return { kind: 'url', value: process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173' }
  }
  return { kind: 'file', value: path.join(__dirname, '../../renderer/index.html') }
}

const registerIpcHandlers = (): void => {
  ipcMain.handle(MOUSE_CHANNELS.MOVE, (_event, x: number, y: number, screenIndex = 0) => {
    mouseController.moveTo(x, y, screenIndex)
  })
  ipcMain.handle(MOUSE_CHANNELS.CLICK, (_event, button: 'left' | 'right' | 'middle') => {
    mouseController.click(button)
  })
  ipcMain.handle(MOUSE_CHANNELS.DOUBLE_CLICK, (_event, button: 'left' | 'right' | 'middle' = 'left') => {
    mouseController.doubleClick(button)
  })
  ipcMain.handle(MOUSE_CHANNELS.MOUSE_DOWN, (_event, button: 'left' | 'right' | 'middle' = 'left') => {
    mouseController.mouseDown(button)
  })
  ipcMain.handle(MOUSE_CHANNELS.MOUSE_UP, (_event, button: 'left' | 'right' | 'middle' = 'left') => {
    mouseController.mouseUp(button)
  })
  ipcMain.handle(MOUSE_CHANNELS.GET_SCREEN_SIZE, (_event, screenIndex = 0) =>
    mouseController.getScreenSize(screenIndex)
  )
  ipcMain.handle(MOUSE_CHANNELS.GET_DISPLAYS, () => mouseController.getDisplays())

  // Settings
  ipcMain.handle(SETTINGS_CHANNELS.LOAD_ALL, async () => {
    if (cachedSettings) return cachedSettings
    cachedSettings = await loadSettingsFromDisk()
    return cachedSettings ?? DEFAULT_SETTINGS
  })
  ipcMain.handle(SETTINGS_CHANNELS.SAVE_ALL, async (_event, settings: AppSettings) => {
    cachedSettings = settings
    await saveSettingsToDisk(settings)
  })
  ipcMain.handle(SETTINGS_CHANNELS.GET, async (_event, key: string) => {
    if (!cachedSettings) {
      cachedSettings = (await loadSettingsFromDisk()) ?? DEFAULT_SETTINGS
    }
    return key in cachedSettings ? (cachedSettings as unknown as Record<string, unknown>)[key] : null
  })
  ipcMain.handle(SETTINGS_CHANNELS.SET, async (_event, key: string, value: unknown) => {
    if (!cachedSettings) {
      cachedSettings = (await loadSettingsFromDisk()) ?? DEFAULT_SETTINGS
    }
    cachedSettings = { ...cachedSettings, [key]: value }
    await saveSettingsToDisk(cachedSettings)
  })
  ipcMain.handle(SETTINGS_CHANNELS.RESET, async () => {
    cachedSettings = { ...DEFAULT_SETTINGS }
    await saveSettingsToDisk(cachedSettings)
  })

  // Calibration
  ipcMain.handle(CALIBRATION_CHANNELS.SAVE, async (_event, data: CalibrationPayload) => {
    calibrationData = data
    await saveCalibrationToDisk(data)
  })
  ipcMain.handle(CALIBRATION_CHANNELS.LOAD, async () => {
    if (calibrationData) return calibrationData
    calibrationData = await loadCalibrationFromDisk()
    return calibrationData
  })
  ipcMain.handle(CALIBRATION_CHANNELS.DELETE, async () => {
    calibrationData = null
    try {
      await fs.unlink(calibrationFilePath())
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  })
  ipcMain.handle(CALIBRATION_CHANNELS.GET_ACCURACY, () => {
    if (!calibrationData) return null
    return calibrationData.accuracy
  })

  // Profiles
  ipcMain.handle(PROFILES_CHANNELS.LOAD_ALL, async () => {
    if (profilesData) return profilesData
    profilesData = await loadProfilesFromDisk()
    return profilesData
  })
  ipcMain.handle(PROFILES_CHANNELS.SAVE_ALL, async (_event, profiles: CalibrationProfilePayload[]) => {
    profilesData = profiles
    await saveProfilesToDisk(profiles)
  })

  // System & Accessibility
  ipcMain.handle(SYSTEM_CHANNELS.CHECK_ACCESSIBILITY, () => {
    if (process.platform !== 'darwin') return true
    return systemPreferences.isTrustedAccessibilityClient(false)
  })
  ipcMain.handle(SYSTEM_CHANNELS.REQUEST_ACCESSIBILITY, () => {
    if (process.platform !== 'darwin') return true
    return systemPreferences.isTrustedAccessibilityClient(true)
  })

  // Updater
  ipcMain.handle(UPDATER_CHANNELS.GET_STATUS, () => updateInfo)
  ipcMain.handle(UPDATER_CHANNELS.CHECK, async () => {
    broadcastUpdateStatus({ state: 'checking', version: '0.1.0' })
    // Simulate realistic checking in dev or production
    await new Promise((resolve) => setTimeout(resolve, 1200))
    const result: UpdateInfo = {
      state: 'not-available',
      version: '0.1.0',
      releaseNotes: 'I-Track is up to date (v0.1.0).'
    }
    broadcastUpdateStatus(result)
    return result
  })
  ipcMain.handle(UPDATER_CHANNELS.DOWNLOAD, async () => {
    broadcastUpdateStatus({
      state: 'downloading',
      version: '0.2.0',
      progress: 50
    })
    await new Promise((resolve) => setTimeout(resolve, 1000))
    broadcastUpdateStatus({
      state: 'downloaded',
      version: '0.2.0',
      progress: 100,
      releaseNotes: 'Performance improvements and 9-point calibration ready to install.'
    })
  })
  ipcMain.handle(UPDATER_CHANNELS.INSTALL, () => {
    app.relaunch()
    app.quit()
  })
}

const createWindow = async (): Promise<void> => {
  mainWindow = createMainWindow()
  const entry = getRendererEntry()
  if (entry.kind === 'url') {
    await mainWindow.loadURL(entry.value)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    await mainWindow.loadFile(entry.value)
  }
}

app.whenReady().then(async () => {
  registerIpcHandlers()
  await createWindow()

  app.on('activate', async () => {
    if (mainWindow === null) {
      await createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
