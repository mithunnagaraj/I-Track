import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_SETTINGS } from '../../shared/constants'
import type { Settings } from '../types/settings'
import { storageService } from '../services/storageService'
import { ipcService } from '../services/ipcService'

const SETTINGS_KEY = 'i-track.settings'

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = storageService.get<Partial<Settings>>(SETTINGS_KEY)
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS
  })

  // Synchronize settings from desktop disk storage on mount
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const persisted = await ipcService.loadSettings()
        if (active && persisted && typeof persisted === 'object') {
          setSettings((prev) => {
            const merged = { ...prev, ...persisted }
            storageService.set(SETTINGS_KEY, merged)
            return merged
          })
        }
      } catch {
        // Desktop IPC unavailable; localStorage remains in effect
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...partial }
      storageService.set(SETTINGS_KEY, next)
      void ipcService.saveSettings(next)
      return next
    })
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    storageService.set(SETTINGS_KEY, DEFAULT_SETTINGS)
    void ipcService.resetSettings()
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
