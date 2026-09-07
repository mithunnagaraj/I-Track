import { useCallback, useMemo, useState } from 'react'
import { DEFAULT_SETTINGS } from '../../shared/constants'
import type { Settings } from '../types/settings'
import { storageService } from '../services/storageService'

const SETTINGS_KEY = 'i-track.settings'

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = storageService.get<Partial<Settings>>(SETTINGS_KEY)
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS
  })

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...partial }
      storageService.set(SETTINGS_KEY, next)
      return next
    })
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    storageService.set(SETTINGS_KEY, DEFAULT_SETTINGS)
  }, [])

  return useMemo(
    () => ({
      settings,
      updateSettings,
      resetSettings
    }),
    [settings, updateSettings, resetSettings]
  )
}
