import path from 'node:path'
import { promises as fs } from 'node:fs'
import { app, ipcMain, systemPreferences } from 'electron'
import { MouseController } from './mouse/MouseController'
import { createMainWindow } from './window'
import {
  CALIBRATION_CHANNELS,
  MOUSE_CHANNELS,
  SETTINGS_CHANNELS,
  SYSTEM_CHANNELS
} from '../shared/ipc-channels'
import type { AppSettings, CalibrationPayload } from '../shared/ipc'
import { DEFAULT_SETTINGS } from '../shared/constants'

let mainWindow: ReturnType<typeof createMainWindow> | null = null
const mouseController = new MouseController()

let cachedSettings: AppSettings | null = null
let calibrationData: CalibrationPayload | null = null

const settingsFilePath = (): string => path.join(app.getPath('userData'), 'settings.json')
const calibrationFilePath = (): string => path.join(app.getPath('userData'), 'calibration.json')

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

const getRendererEntry = (): { kind: 'url' | 'file'; value: string } => {
  if (!app.isPackaged) {
    return { kind: 'url', value: process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173' }
  }
  return { kind: 'file', value: path.join(__dirname, '../../renderer/index.html') }
}

const registerIpcHandlers = (): void => {
  ipcMain.handle(MOUSE_CHANNELS.MOVE, (_event, x: number, y: number) => {
    mouseController.moveTo(x, y)
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
  ipcMain.handle(MOUSE_CHANNELS.GET_SCREEN_SIZE, () => mouseController.getScreenSize())

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

  ipcMain.handle(SYSTEM_CHANNELS.CHECK_ACCESSIBILITY, () => {
    if (process.platform !== 'darwin') return true
    return systemPreferences.isTrustedAccessibilityClient(false)
  })
  ipcMain.handle(SYSTEM_CHANNELS.REQUEST_ACCESSIBILITY, () => {
    if (process.platform !== 'darwin') return true
    return systemPreferences.isTrustedAccessibilityClient(true)
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
