export const MOUSE_CHANNELS = {
  MOVE: 'mouse:move',
  CLICK: 'mouse:click',
  DOUBLE_CLICK: 'mouse:doubleClick',
  MOUSE_DOWN: 'mouse:mouseDown',
  MOUSE_UP: 'mouse:mouseUp',
  GET_SCREEN_SIZE: 'mouse:getScreenSize',
  GET_DISPLAYS: 'mouse:getDisplays'
} as const

export const SETTINGS_CHANNELS = {
  GET: 'settings:get',
  SET: 'settings:set',
  RESET: 'settings:reset',
  SAVE_ALL: 'settings:saveAll',
  LOAD_ALL: 'settings:loadAll'
} as const

export const CALIBRATION_CHANNELS = {
  SAVE: 'calibration:save',
  LOAD: 'calibration:load',
  DELETE: 'calibration:delete',
  GET_ACCURACY: 'calibration:getAccuracy'
} as const

export const SYSTEM_CHANNELS = {
  CHECK_ACCESSIBILITY: 'system:checkAccessibility',
  REQUEST_ACCESSIBILITY: 'system:requestAccessibility'
} as const

export const UPDATER_CHANNELS = {
  CHECK: 'updater:check',
  DOWNLOAD: 'updater:download',
  INSTALL: 'updater:install',
  GET_STATUS: 'updater:getStatus',
  STATUS_CHANGED: 'updater:statusChanged'
} as const

export const PROFILES_CHANNELS = {
  LOAD_ALL: 'profiles:loadAll',
  SAVE_ALL: 'profiles:saveAll'
} as const

