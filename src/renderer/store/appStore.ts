import { create } from 'zustand'
import { DEFAULT_SETTINGS } from '../../shared/constants'
import type { GazePoint } from '../types/gaze'
import type { Settings } from '../types/settings'

interface AppState {
  gazePoint: GazePoint | null
  isTracking: boolean
  settings: Settings
  setGazePoint: (gazePoint: GazePoint | null) => void
  setTracking: (isTracking: boolean) => void
  updateSettings: (partial: Partial<Settings>) => void
}

export const useAppStore = create<AppState>((set) => ({
  gazePoint: null,
  isTracking: false,
  settings: DEFAULT_SETTINGS,
  setGazePoint: (gazePoint) => set({ gazePoint }),
  setTracking: (isTracking) => set({ isTracking }),
  updateSettings: (partial) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...partial
      }
    }))
}))
