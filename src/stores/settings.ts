import { ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'begalkartu-settings'

export const useSettingsStore = defineStore('settings', () => {
  const soundEnabled = ref(true)
  const animationsEnabled = ref(true)

  function load() {
    const storedSettings = localStorage.getItem(STORAGE_KEY)

    if (!storedSettings) {
      return
    }

    try {
      const parsedSettings = JSON.parse(storedSettings) as {
        soundEnabled?: boolean
        animationsEnabled?: boolean
      }

      if (typeof parsedSettings.soundEnabled === 'boolean') {
        soundEnabled.value = parsedSettings.soundEnabled
      }

      if (typeof parsedSettings.animationsEnabled === 'boolean') {
        animationsEnabled.value = parsedSettings.animationsEnabled
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  function save() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        soundEnabled: soundEnabled.value,
        animationsEnabled: animationsEnabled.value,
      }),
    )
  }

  return { soundEnabled, animationsEnabled, load, save }
})
