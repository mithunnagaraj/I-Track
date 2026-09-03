import { screen } from 'electron'
import type { MouseButton, ScreenSize } from '../../shared/ipc'
import { robotWrapper } from './robot-wrapper'

export class MouseController {
  public getScreenSize(): ScreenSize {
    const primary = screen.getPrimaryDisplay()
    return primary.workAreaSize
  }

  public moveTo(x: number, y: number): void {
    const { width, height } = this.getScreenSize()
    const clampedX = Math.max(0, Math.min(Math.round(x), width - 1))
    const clampedY = Math.max(0, Math.min(Math.round(y), height - 1))
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
