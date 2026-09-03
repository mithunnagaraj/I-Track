declare module 'robotjs' {
  interface RobotJs {
    moveMouse(x: number, y: number): void
    mouseClick(button?: 'left' | 'right' | 'middle', double?: boolean): void
    mouseToggle(down: 'down' | 'up', button?: 'left' | 'right' | 'middle'): void
  }

  const robot: RobotJs
  export default robot
}
