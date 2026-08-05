import type { GameState, PlayerState, Rank, Suit } from './types'
import { SUITS, cardId, shuffle } from './deck'

export interface BotChoice {
  targetId: string
  rank: Rank
  suit: Suit
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

export function pickBotAsk(state: GameState, botId: string): BotChoice | null {
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
    const suit = rank ? pickRandom(missingSuitsForRank(bot, rank)) : undefined
    const target = pickRandom(candidateOpponents)

    if (!rank || !suit || !target) {
      return null
    }

    return { targetId: target.id, rank, suit }
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
    const suits = shuffle(missingSuitsForRank(bot, rank))

    for (const suit of suits) {
      for (const target of targetPriority) {
        const alreadyMissed =
          state.missMemory[target.id]?.includes(cardId({ rank, suit })) ??
          false

        if (!alreadyMissed) {
          return { targetId: target.id, rank, suit }
        }
      }
    }
  }

  const fallbackRank = pickRandom(ranks)
  const fallbackSuit = fallbackRank
    ? pickRandom(missingSuitsForRank(bot, fallbackRank))
    : undefined
  const fallbackTarget = pickRandom(candidateOpponents)

  if (!fallbackRank || !fallbackSuit || !fallbackTarget) {
    return null
  }

  return { targetId: fallbackTarget.id, rank: fallbackRank, suit: fallbackSuit }
}
