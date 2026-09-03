import path from 'node:path'
import { BrowserWindow } from 'electron'

export const createMainWindow = (): BrowserWindow => {
  const window = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 900,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  return window
}
