import { reactive, ref } from 'vue'
import { useSoloGameStore } from '@/stores/soloGame'
import { ask, checkWinCondition, resolveEmptyHand } from '@/game/engine'
import { pickBotAsk } from '@/game/bot'
import { cardId, cardLabel } from '@/game/deck'
import type { Card, PlayerState, Rank, Suit } from '@/game/types'

export interface PendingReveal {
  askerName: string
  rank: Rank
  suit: Suit
  willHit: boolean
}

const FLIGHT_MS = 650
const BOT_PAUSE_MS = 550

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export interface HandRectProvider {
  getHandRect(playerId: string): DOMRect | null
  getPileRect(): DOMRect | null
}

interface FlyingCardState {
  card: Card
  faceUp: boolean
  from: DOMRect
  to: DOMRect
}

export function useSoloTable(rects: HandRectProvider) {
  const store = useSoloGameStore()

  const flyingCard = ref<FlyingCardState | null>(null)
  const hiddenCardIds = reactive(new Set<string>())
  const isBusy = ref(false)
  const pendingReveal = ref<PendingReveal | null>(null)

  let resolvePendingReveal: (() => void) | null = null

  function waitForReveal(askerName: string, rank: Rank, suit: Suit) {
    return new Promise<void>((resolve) => {
      const human = store.game?.players.find((player) => player.id === 'human')
      const willHit =
        human?.hand.some((card) => card.rank === rank && card.suit === suit) ?? false

      pendingReveal.value = { askerName, rank, suit, willHit }
      resolvePendingReveal = resolve
    })
  }

  function confirmReveal() {
    pendingReveal.value = null
    resolvePendingReveal?.()
    resolvePendingReveal = null
  }

  function playerById(id: string): PlayerState | undefined {
    return store.game?.players.find((player) => player.id === id)
  }

  async function flyCard(
    card: Card,
    from: DOMRect,
    to: DOMRect,
    initialFaceUp: boolean,
    finalFaceUp: boolean,
  ) {
    const id = cardId(card)
    hiddenCardIds.add(id)
    flyingCard.value = { card, faceUp: initialFaceUp, from, to }

    await sleep(FLIGHT_MS / 2)

    if (flyingCard.value) {
      flyingCard.value.faceUp = finalFaceUp
    }

    await sleep(FLIGHT_MS / 2)

    flyingCard.value = null
    hiddenCardIds.delete(id)
  }

  async function performAsk(
    askerId: string,
    targetId: string,
    rank: Rank,
    suit: Suit,
  ) {
    const game = store.game

    if (!game) {
      return
    }

    const asker = playerById(askerId)
    const target = playerById(targetId)

    if (!asker || !target) {
      return
    }

    const fromRect = rects.getHandRect(targetId)
    const toRect = rects.getHandRect(askerId)

    let result: ReturnType<typeof ask> | undefined

    try {
      result = ask(game, askerId, targetId, rank, suit)
    } catch (error) {
      store.addLog(
        error instanceof Error ? error.message : 'Terjadi kesalahan.',
      )
    }

    if (!result) {
      return
    }

    store.addLog(
      `${asker.name} nanya ${cardLabel({ rank, suit })} ke ${target.name} → ${
        result.hit ? 'HIT' : 'MISS'
      }`,
    )

    if (result.hit && result.card && fromRect && toRect) {
      const initialFaceUp = target.isHuman
      const finalFaceUp = asker.isHuman
      await flyCard(result.card, fromRect, toRect, initialFaceUp, finalFaceUp)
    } else if (!result.hit && result.card) {
      store.addLog(`${asker.name} cangkul dari tumpukan.`)

      const pileRect = rects.getPileRect()

      if (pileRect && toRect) {
        await flyCard(result.card, pileRect, toRect, false, asker.isHuman)
      }
    } else if (!result.hit && !result.card) {
      store.addLog('Tumpukan cangkulan sudah habis.')
    }

    for (const completedRank of result.completedBooks) {
      store.addLog(`${asker.name} melengkapi buku ${completedRank}!`)
    }

    resolveEmptyHand(game)

    const winCheck = checkWinCondition(game)

    if (winCheck.finished) {
      game.phase = 'finished'
      game.winnerId = winCheck.winnerId
    }
  }

  async function runBotTurns() {
    const game = store.game

    if (!game) {
      return
    }

    while (game.phase === 'playing') {
      const current = game.players[game.currentPlayerIndex]

      if (!current || current.isHuman) {
        break
      }

      const choice = pickBotAsk(game, current.id)

      if (!choice) {
        game.currentPlayerIndex =
          (game.currentPlayerIndex + 1) % game.players.length
        await sleep(BOT_PAUSE_MS)
        continue
      }

      if (choice.targetId === 'human') {
        await waitForReveal(current.name, choice.rank, choice.suit)
      }

      await performAsk(current.id, choice.targetId, choice.rank, choice.suit)
      await sleep(BOT_PAUSE_MS)
    }
  }

  async function humanAsk(rank: Rank, suit: Suit, targetId: string) {
    const game = store.game

    if (isBusy.value || !game || game.phase !== 'playing') {
      return
    }

    if (game.players[game.currentPlayerIndex]?.id !== 'human') {
      return
    }

    isBusy.value = true

    try {
      await performAsk('human', targetId, rank, suit)
      await runBotTurns()
    } finally {
      isBusy.value = false
    }
  }

  return {
    flyingCard,
    hiddenCardIds,
    isBusy,
    pendingReveal,
    confirmReveal,
    humanAsk,
  }
}
