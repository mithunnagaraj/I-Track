import path from 'node:path'
import { promises as fs } from 'node:fs'
import { app, ipcMain } from 'electron'
import { MouseController } from './mouse/MouseController'
import { createMainWindow } from './window'
import { CALIBRATION_CHANNELS, MOUSE_CHANNELS, SETTINGS_CHANNELS } from '../shared/ipc-channels'
import type { CalibrationPayload } from '../shared/ipc'

let mainWindow: ReturnType<typeof createMainWindow> | null = null
const mouseController = new MouseController()

const settingsStore = new Map<string, unknown>()
let calibrationData: CalibrationPayload | null = null

const calibrationFilePath = (): string => path.join(app.getPath('userData'), 'calibration.json')

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

  ipcMain.handle(SETTINGS_CHANNELS.GET, (_event, key: string) =>
    settingsStore.has(key) ? settingsStore.get(key) : null
  )
  ipcMain.handle(SETTINGS_CHANNELS.SET, (_event, key: string, value: unknown) => {
    settingsStore.set(key, value)
  })
  ipcMain.handle(SETTINGS_CHANNELS.RESET, () => {
    settingsStore.clear()
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
