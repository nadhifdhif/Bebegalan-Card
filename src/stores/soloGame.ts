import { ref } from 'vue'
import { defineStore } from 'pinia'
import { createGame } from '@/game/engine'
import type { BotDifficulty, GameState } from '@/game/types'

const MAX_LOG_ENTRIES = 40

export const useSoloGameStore = defineStore('soloGame', () => {
  const game = ref<GameState | null>(null)
  const log = ref<string[]>([])

  function start(playerCount: 2 | 3 | 4 | 5 | 6, difficulty: BotDifficulty) {
    game.value = createGame(playerCount, difficulty)
    log.value = []
  }

  function addLog(message: string) {
    log.value.push(message)

    if (log.value.length > MAX_LOG_ENTRIES) {
      log.value.splice(0, log.value.length - MAX_LOG_ENTRIES)
    }
  }

  function reset() {
    game.value = null
    log.value = []
  }

  return { game, log, start, addLog, reset }
})
