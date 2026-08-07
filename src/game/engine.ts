import type {
  BotDifficulty,
  Card,
  GameState,
  PlayerState,
  Rank,
  Suit,
} from './types'
import { SUITS, cardId, createDeck, shuffle } from './deck'

const BOT_NAMES = ['Bot Andi', 'Bot Budi', 'Bot Citra', 'Bot Dedi', 'Bot Eka']

export function dealInitialHands(
  players: PlayerState[],
  deck: Card[],
  cardsPerPlayer: number,
): Card[] {
  const pile = [...deck]

  for (let round = 0; round < cardsPerPlayer; round++) {
    for (const player of players) {
      const card = pile.pop()

      if (card) {
        player.hand.push(card)
      }
    }
  }

  return pile
}

export function createGame(
  playerCount: 2 | 3 | 4 | 5 | 6,
  difficulty: BotDifficulty,
): GameState {
  const players: PlayerState[] = [
    { id: 'human', name: 'Kamu', isHuman: true, hand: [], books: [] },
  ]

  for (let i = 1; i < playerCount; i++) {
    players.push({
      id: `bot-${i}`,
      name: BOT_NAMES[i - 1] ?? `Bot ${i}`,
      isHuman: false,
      hand: [],
      books: [],
    })
  }

  const cardsPerPlayer = playerCount === 2 ? 7 : 5
  const deck = shuffle(createDeck())
  const drawPile = dealInitialHands(players, deck, cardsPerPlayer)

  for (const player of players) {
    checkForBooks(player)
  }

  return {
    phase: 'playing',
    players,
    drawPile,
    currentPlayerIndex: 0,
    winnerId: null,
    difficulty,
    missMemory: {},
  }
}

export function checkForBooks(player: PlayerState): Rank[] {
  const completed: Rank[] = []
  const byRank = new Map<Rank, Card[]>()

  for (const card of player.hand) {
    const cards = byRank.get(card.rank) ?? []
    cards.push(card)
    byRank.set(card.rank, cards)
  }

  for (const [rank, cards] of byRank) {
    if (cards.length === 4 && !player.books.includes(rank)) {
      player.hand = player.hand.filter((card) => card.rank !== rank)
      player.books.push(rank)
      completed.push(rank)
    }
  }

  return completed
}

export function canAsk(player: PlayerState, rank: Rank): boolean {
  return player.hand.some((card) => card.rank === rank)
}

export function hasRank(player: PlayerState, rank: Rank): boolean {
  return player.hand.some((card) => card.rank === rank)
}

function recordMiss(state: GameState, targetId: string, id: string): void {
  const known = state.missMemory[targetId] ?? []

  if (!known.includes(id)) {
    state.missMemory[targetId] = [...known, id]
  }
}

/**
 * Phase 1 of an ask: does the target hold this rank at all? Read-only —
 * the actual suit is only guessed afterwards, and only if this is true.
 */
export function checkRank(
  state: GameState,
  askerId: string,
  targetId: string,
  rank: Rank,
): boolean {
  const asker = state.players.find((player) => player.id === askerId)
  const target = state.players.find((player) => player.id === targetId)

  if (!asker || !target) {
    throw new Error('Pemain tidak ditemukan.')
  }

  if (!canAsk(asker, rank)) {
    throw new Error('Kamu cuma boleh menanyakan angka yang kamu pegang.')
  }

  return hasRank(target, rank)
}

export interface RankMissResult {
  card: Card | null
  completedBooks: Rank[]
}

/**
 * The rank doesn't exist in the target's hand at all — straight to
 * cangkul, no suit is ever guessed for this ask.
 */
export function resolveRankMiss(
  state: GameState,
  askerId: string,
  targetId: string,
  rank: Rank,
): RankMissResult {
  const asker = state.players.find((player) => player.id === askerId)

  if (!asker) {
    throw new Error('Pemain tidak ditemukan.')
  }

  for (const suit of SUITS) {
    recordMiss(state, targetId, cardId({ rank, suit }))
  }

  const drawnCard = state.drawPile.pop() ?? null

  if (drawnCard) {
    asker.hand.push(drawnCard)
  }

  state.currentPlayerIndex = nextPlayerIndex(state, state.currentPlayerIndex)

  const completedBooks = checkForBooks(asker)

  return { card: drawnCard, completedBooks }
}

export interface SuitGuessResult {
  hit: boolean
  card: Card | null
  completedBooks: Rank[]
}

/**
 * Phase 2 of an ask, only reachable once checkRank() is true: guess which
 * of the target's suits it is. Exact match is required to actually get
 * the card — otherwise it's a cangkul, same as a rank miss.
 */
export function guessSuit(
  state: GameState,
  askerId: string,
  targetId: string,
  rank: Rank,
  suit: Suit,
): SuitGuessResult {
  const asker = state.players.find((player) => player.id === askerId)
  const target = state.players.find((player) => player.id === targetId)

  if (!asker || !target) {
    throw new Error('Pemain tidak ditemukan.')
  }

  const hitIndex = target.hand.findIndex(
    (card) => card.rank === rank && card.suit === suit,
  )

  if (hitIndex !== -1) {
    const [card] = target.hand.splice(hitIndex, 1)

    if (!card) {
      throw new Error('Kartu tidak ditemukan.')
    }

    asker.hand.push(card)

    const completedBooks = checkForBooks(asker)

    return { hit: true, card, completedBooks }
  }

  recordMiss(state, targetId, cardId({ rank, suit }))

  const drawnCard = state.drawPile.pop() ?? null

  if (drawnCard) {
    asker.hand.push(drawnCard)
  }

  state.currentPlayerIndex = nextPlayerIndex(state, state.currentPlayerIndex)

  const completedBooks = checkForBooks(asker)

  return { hit: false, card: drawnCard, completedBooks }
}

export function nextPlayerIndex(state: GameState, from: number): number {
  return (from + 1) % state.players.length
}

/**
 * A hand can go empty before the draw pile does. Real Bebegalan doesn't
 * define this edge case explicitly: this prototype tops the player back up
 * with one free card from the pile so their turn continues normally. Only
 * when the pile is also empty do they get skipped entirely (they wait out
 * the rest of the game until a winner is decided).
 */
export function resolveEmptyHand(state: GameState): void {
  let guard = 0

  while (guard <= state.players.length) {
    const current = state.players[state.currentPlayerIndex]

    if (!current) {
      return
    }

    if (current.hand.length > 0) {
      return
    }

    if (state.drawPile.length === 0) {
      state.currentPlayerIndex = nextPlayerIndex(
        state,
        state.currentPlayerIndex,
      )
      guard++
      continue
    }

    const drawnCard = state.drawPile.pop()

    if (drawnCard) {
      current.hand.push(drawnCard)
    }

    return
  }
}

export function checkWinCondition(state: GameState): {
  finished: boolean
  winnerId: string | null
} {
  const totalBooks = state.players.reduce(
    (sum, player) => sum + player.books.length,
    0,
  )

  const allCardsBooked = totalBooks === 13
  const pileAndHandsEmpty =
    state.drawPile.length === 0 &&
    state.players.every((player) => player.hand.length === 0)

  if (!allCardsBooked && !pileAndHandsEmpty) {
    return { finished: false, winnerId: null }
  }

  let winner: PlayerState | null = null

  for (const player of state.players) {
    if (!winner || player.books.length > winner.books.length) {
      winner = player
    }
  }

  return { finished: true, winnerId: winner?.id ?? null }
}
