import type { GameState, PlayerState, Rank, Suit } from './types'
import { SUITS, cardId, shuffle } from './deck'

export interface BotRankChoice {
  targetId: string
  rank: Rank
}

function ownedRanks(player: PlayerState): Rank[] {
  const ranks = new Set<Rank>()

  for (const card of player.hand) {
    ranks.add(card.rank)
  }

  return [...ranks]
}

function missingSuitsForRank(player: PlayerState, rank: Rank): Suit[] {
  const owned = new Set(
    player.hand.filter((card) => card.rank === rank).map((card) => card.suit),
  )

  return SUITS.filter((suit) => !owned.has(suit))
}

function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) {
    return undefined
  }

  return items[Math.floor(Math.random() * items.length)]
}

function unknownSuits(
  state: GameState,
  targetId: string,
  rank: Rank,
  suits: Suit[],
): Suit[] {
  const known = state.missMemory[targetId] ?? []

  return suits.filter((suit) => !known.includes(cardId({ rank, suit })))
}

/**
 * Picks who to ask and which rank — the suit is decided separately by
 * pickBotSuitGuess(), only once checkRank() confirms the rank exists.
 */
export function pickBotRankChoice(
  state: GameState,
  botId: string,
): BotRankChoice | null {
  const bot = state.players.find((player) => player.id === botId)

  if (!bot) {
    return null
  }

  const ranks = ownedRanks(bot)

  if (ranks.length === 0) {
    return null
  }

  const opponents = state.players.filter((player) => player.id !== botId)
  const opponentsWithCards = opponents.filter(
    (player) => player.hand.length > 0,
  )
  const candidateOpponents =
    opponentsWithCards.length > 0 ? opponentsWithCards : opponents

  if (candidateOpponents.length === 0) {
    return null
  }

  if (state.difficulty === 'easy') {
    const rank = pickRandom(ranks)
    const target = pickRandom(candidateOpponents)

    if (!rank || !target) {
      return null
    }

    return { targetId: target.id, rank }
  }

  const rankPriority =
    state.difficulty === 'hard'
      ? [...ranks].sort(
          (a, b) =>
            missingSuitsForRank(bot, a).length -
            missingSuitsForRank(bot, b).length,
        )
      : shuffle(ranks)

  const targetPriority =
    state.difficulty === 'hard'
      ? [...candidateOpponents].sort((a, b) => b.hand.length - a.hand.length)
      : shuffle(candidateOpponents)

  for (const rank of rankPriority) {
    const missingSuits = missingSuitsForRank(bot, rank)

    for (const target of targetPriority) {
      // A rank miss reveals all 4 suits at once, so if every suit we
      // could still guess for this rank is already known-missing on this
      // target, asking again would be a wasted turn.
      if (unknownSuits(state, target.id, rank, missingSuits).length > 0) {
        return { targetId: target.id, rank }
      }
    }
  }

  const fallbackRank = pickRandom(ranks)
  const fallbackTarget = pickRandom(candidateOpponents)

  if (!fallbackRank || !fallbackTarget) {
    return null
  }

  return { targetId: fallbackTarget.id, rank: fallbackRank }
}

/**
 * Called only after checkRank() has confirmed the target holds this
 * rank — picks which suit to guess.
 */
export function pickBotSuitGuess(
  state: GameState,
  botId: string,
  targetId: string,
  rank: Rank,
): Suit {
  const bot = state.players.find((player) => player.id === botId)
  const missingSuits = bot ? missingSuitsForRank(bot, rank) : [...SUITS]
  const candidates = unknownSuits(state, targetId, rank, missingSuits)
  const pool = candidates.length > 0 ? candidates : missingSuits

  return pickRandom(pool) ?? pickRandom(SUITS) ?? 'spades'
}
