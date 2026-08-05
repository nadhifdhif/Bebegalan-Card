import { createRouter, createWebHistory } from 'vue-router'
import GameShellLayout from '@/layouts/GameShellLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    { path: '/', name: 'home', component: GameShellLayout },
    { path: '/settings', name: 'settings', component: GameShellLayout },
    {
      path: '/solo-player',
      name: 'solo-player',
      component: GameShellLayout,
    },
    {
      path: '/multiplayer',
      name: 'multiplayer',
      component: GameShellLayout,
    },
    {
      path: '/play/solo',
      name: 'play-solo',
      component: () => import('@/views/solo-player/SoloTableView.vue'),
    },
  ],
})

export default router
