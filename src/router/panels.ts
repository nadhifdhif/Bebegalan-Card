import { defineAsyncComponent } from 'vue'

export const panelComponents = {
  settings: defineAsyncComponent(
    () => import('@/views/settings/SettingsView.vue'),
  ),
  'solo-player': defineAsyncComponent(
    () => import('@/views/solo-player/SoloPlayerView.vue'),
  ),
  multiplayer: defineAsyncComponent(
    () => import('@/views/multiplayer/MultiplayerView.vue'),
  ),
} as const

export type PanelName = keyof typeof panelComponents
