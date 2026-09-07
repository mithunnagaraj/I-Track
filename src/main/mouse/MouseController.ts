import { screen } from 'electron'
import type { MouseButton, ScreenSize } from '../../shared/ipc'
import { robotWrapper } from './robot-wrapper'

export class MouseController {
  public getScreenSize(): ScreenSize {
    const primary = screen.getPrimaryDisplay()
    return {
      width: primary.bounds.width,
      height: primary.bounds.height
    }
  }

  public moveTo(x: number, y: number): void {
    const primary = screen.getPrimaryDisplay()
    const { x: originX, y: originY, width, height } = primary.bounds
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
