import { screen } from 'electron'
import type { DisplayInfo, MouseButton, ScreenSize } from '../../shared/ipc'
import { robotWrapper } from './robot-wrapper'

export class MouseController {
  public getDisplays(): DisplayInfo[] {
    const primaryId = screen.getPrimaryDisplay().id
    return screen.getAllDisplays().map((display, index) => {
      const isPrimary = display.id === primaryId
      const name =
        display.label?.trim() ||
        `Display ${index + 1}${isPrimary ? ' (Primary)' : ''}`
      return {
        id: display.id,
        name,
        bounds: {
          x: display.bounds.x,
          y: display.bounds.y,
          width: display.bounds.width,
          height: display.bounds.height
        },
        workArea: {
          x: display.workArea.x,
          y: display.workArea.y,
          width: display.workArea.width,
          height: display.workArea.height
        },
        scaleFactor: display.scaleFactor,
        isPrimary
      }
    })
  }

  public getScreenSize(screenIndex = 0): ScreenSize {
    const displays = screen.getAllDisplays()
    const target = displays[screenIndex] ?? screen.getPrimaryDisplay()
    return {
      width: target.bounds.width,
      height: target.bounds.height
    }
  }

  public moveTo(x: number, y: number, screenIndex = 0): void {
    const displays = screen.getAllDisplays()
    const target = displays[screenIndex] ?? screen.getPrimaryDisplay()
    const { x: originX, y: originY, width, height } = target.bounds
    const clampedX = Math.max(originX, Math.min(Math.round(originX + x), originX + width - 1))
    const clampedY = Math.max(originY, Math.min(Math.round(originY + y), originY + height - 1))
    robotWrapper.moveMouse(clampedX, clampedY)
  }

  public click(button: MouseButton): void {
    robotWrapper.click(button)
  }

  public doubleClick(button: MouseButton = 'left'): void {
    robotWrapper.doubleClick(button)
  }

  public mouseDown(button: MouseButton = 'left'): void {
    robotWrapper.mouseDown(button)
  }

  public mouseUp(button: MouseButton = 'left'): void {
    robotWrapper.mouseUp(button)
  }
}
