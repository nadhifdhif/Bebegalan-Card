import { reactive, ref } from 'vue'
import { useSoloGameStore } from '@/stores/soloGame'
import {
  checkRank,
  checkWinCondition,
  guessSuit,
  resolveEmptyHand,
  resolveRankMiss,
} from '@/game/engine'
import { pickBotRankChoice, pickBotSuitGuess } from '@/game/bot'
import { cardId, cardLabel, rankLabel, suitLabel } from '@/game/deck'
import type { Card, GameState, PlayerState, Rank, Suit } from '@/game/types'

export interface PendingReveal {
  askerName: string
  rank: Rank
  suit?: Suit
}

export interface PendingSuitChoice {
  targetId: string
  targetName: string
  rank: Rank
  allowOwnSuit: boolean
}

const FLIGHT_MS = 650
// Jeda antar giliran sengaja dibuat 1-2 detik biar perpindahan pemain
// kebaca jelas, tidak bikin bingung waktu bot jalan beruntun.
const BOT_PAUSE_MS = 1500
const CHECK_PAUSE_MS = 500

// Tingkat kesulitan "yahudi": 10% kesempatan menu tebak kembang juga
// menampilkan kembang yang sudah kamu pegang sendiri (padahal mustahil
// lawan pegang kartu yang sama) — biar bisa mancing/nge-bluff.
const OWN_SUIT_BLUFF_CHANCE = 0.1

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
  const pendingSuitChoice = ref<PendingSuitChoice | null>(null)

  let resolvePendingReveal: (() => void) | null = null
  let resolveSuitChoice: ((suit: Suit) => void) | null = null

  // Bot-asks-human pauses here so the reveal reads as "the human checks
  // their own hand" instead of resolving instantly. Used twice per ask:
  // once for the rank-only question, and again (with suit set) once the
  // rank is confirmed and a suit has been guessed.
  function waitForReveal(askerName: string, rank: Rank, suit?: Suit) {
    return new Promise<void>((resolve) => {
      pendingReveal.value = { askerName, rank, suit }
      resolvePendingReveal = resolve
    })
  }

  function confirmReveal() {
    pendingReveal.value = null
    resolvePendingReveal?.()
    resolvePendingReveal = null
  }

  // Human-asks-somebody pauses here once the rank is confirmed to exist,
  // waiting for the human to pick which suit to guess.
  function waitForSuitChoice(targetId: string, targetName: string, rank: Rank) {
    return new Promise<Suit>((resolve) => {
      const allowOwnSuit =
        store.game?.difficulty === 'yahudi' && Math.random() < OWN_SUIT_BLUFF_CHANCE

      pendingSuitChoice.value = { targetId, targetName, rank, allowOwnSuit }
      resolveSuitChoice = resolve
    })
  }

  function chooseSuitForPending(suit: Suit) {
    pendingSuitChoice.value = null
    resolveSuitChoice?.(suit)
    resolveSuitChoice = null
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

  function finishTurnChecks(game: GameState) {
    resolveEmptyHand(game)

    const winCheck = checkWinCondition(game)

    if (winCheck.finished) {
      game.phase = 'finished'
      game.winnerId = winCheck.winnerId
    }
  }

  async function performRankThenSuit(
    askerId: string,
    targetId: string,
    rank: Rank,
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

    if (target.isHuman) {
      await waitForReveal(asker.name, rank)
    } else {
      store.addLog(`${asker.name} mengecek tangan ${target.name}...`)
      await sleep(CHECK_PAUSE_MS)
    }

    let hasRank: boolean | undefined

    try {
      hasRank = checkRank(game, askerId, targetId, rank)
    } catch (error) {
      store.addLog(
        error instanceof Error ? error.message : 'Terjadi kesalahan.',
      )
      return
    }

    store.addLog(
      `${asker.name} tanya kartu ${rankLabel(rank)} ke ${target.name} → ${
        hasRank ? 'ADA' : 'TIDAK ADA'
      }`,
    )

    if (!hasRank) {
      const missResult = resolveRankMiss(game, askerId, targetId, rank)
      const pileRect = rects.getPileRect()
      const toRect = rects.getHandRect(askerId)

      if (missResult.card) {
        store.addLog(`${asker.name} cangkul dari tumpukan.`)

        if (pileRect && toRect) {
          await flyCard(missResult.card, pileRect, toRect, false, asker.isHuman)
        }
      } else {
        store.addLog('Tumpukan cangkulan sudah habis.')
      }

      for (const completedRank of missResult.completedBooks) {
        store.addLog(`${asker.name} melengkapi buku ${rankLabel(completedRank)}!`)
      }

      finishTurnChecks(game)
      return
    }

    let suit: Suit

    if (asker.isHuman) {
      suit = await waitForSuitChoice(target.id, target.name, rank)
    } else {
      suit = pickBotSuitGuess(game, askerId, targetId, rank)
    }

    if (target.isHuman) {
      await waitForReveal(asker.name, rank, suit)
    } else {
      store.addLog(`${asker.name} menebak kembang ${suitLabel(suit)}...`)
      await sleep(CHECK_PAUSE_MS)
    }

    const guessResult = guessSuit(game, askerId, targetId, rank, suit)

    store.addLog(
      `${asker.name} menebak ${cardLabel({ rank, suit })} ke ${target.name} → ${
        guessResult.hit ? 'HIT' : 'MISS'
      }`,
    )

    const fromRect = rects.getHandRect(targetId)
    const toRect = rects.getHandRect(askerId)

    if (guessResult.hit && guessResult.card && fromRect && toRect) {
      const initialFaceUp = target.isHuman
      const finalFaceUp = asker.isHuman
      await flyCard(guessResult.card, fromRect, toRect, initialFaceUp, finalFaceUp)
    } else if (!guessResult.hit && guessResult.card) {
      store.addLog(`${asker.name} cangkul dari tumpukan.`)

      const pileRect = rects.getPileRect()

      if (pileRect && toRect) {
        await flyCard(guessResult.card, pileRect, toRect, false, asker.isHuman)
      }
    } else if (!guessResult.hit && !guessResult.card) {
      store.addLog('Tumpukan cangkulan sudah habis.')
    }

    for (const completedRank of guessResult.completedBooks) {
      store.addLog(`${asker.name} melengkapi buku ${rankLabel(completedRank)}!`)
    }

    finishTurnChecks(game)
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

      const choice = pickBotRankChoice(game, current.id)

      if (!choice) {
        game.currentPlayerIndex =
          (game.currentPlayerIndex + 1) % game.players.length
        await sleep(BOT_PAUSE_MS)
        continue
      }

      await performRankThenSuit(current.id, choice.targetId, choice.rank)
      await sleep(BOT_PAUSE_MS)
    }
  }

  async function humanAskRank(rank: Rank, targetId: string) {
    const game = store.game

    if (isBusy.value || !game || game.phase !== 'playing') {
      return
    }

    if (game.players[game.currentPlayerIndex]?.id !== 'human') {
      return
    }

    isBusy.value = true

    try {
      await performRankThenSuit('human', targetId, rank)
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
    pendingSuitChoice,
    confirmReveal,
    chooseSuitForPending,
    humanAskRank,
  }
}
