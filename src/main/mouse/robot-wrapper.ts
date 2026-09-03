import robot from 'robotjs'
import type { MouseButton } from '../../shared/ipc'

export const robotWrapper = {
  moveMouse(x: number, y: number): void {
    robot.moveMouse(x, y)
  },
  click(button: MouseButton): void {
    robot.mouseClick(button, false)
  },
  doubleClick(button: MouseButton): void {
    robot.mouseClick(button, false)
    robot.mouseClick(button, false)
  },
  mouseDown(button: MouseButton): void {
    robot.mouseToggle('down', button)
  },
  mouseUp(button: MouseButton): void {
    robot.mouseToggle('up', button)
  }
}
