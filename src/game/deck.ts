import type { Card, Rank, Suit } from './types'

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']

export const RANKS: Rank[] = [
  'ace',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'jack',
  'queen',
  'king',
]

const SUIT_LABELS: Record<Suit, string> = {
  hearts: 'Hati',
  diamonds: 'Tempe',
  clubs: 'Keriting',
  spades: 'Sekop',
}

const SUIT_GLYPHS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
}

const RANK_LABELS: Record<Rank, string> = {
  ace: 'As',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  jack: 'Jack',
  queen: 'Queen',
  king: 'King',
}

export function suitLabel(suit: Suit): string {
  return SUIT_LABELS[suit]
}

export function suitGlyph(suit: Suit): string {
  return SUIT_GLYPHS[suit]
}

export function rankLabel(rank: Rank): string {
  return RANK_LABELS[rank]
}

export function cardLabel(card: Card): string {
  return `${rankLabel(card.rank)} ${suitLabel(card.suit)}`
}

export function cardId(card: Card): string {
  return `${card.rank}_of_${card.suit}`
}

export function createDeck(): Card[] {
  const deck: Card[] = []

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit })
    }
  }

  return deck
}

export function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items]

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = shuffled[i]
    const b = shuffled[j]

    if (a === undefined || b === undefined) {
      continue
    }

    shuffled[i] = b
    shuffled[j] = a
  }

  return shuffled
}

const cardImages = import.meta.glob<{ default: string }>(
  '../assets/cards/*.png',
  { eager: true },
)

export function cardImageUrl(card: Card): string {
  const key = `../assets/cards/${cardId(card)}.png`
  const mod = cardImages[key]

  if (!mod) {
    throw new Error(`Tidak ada aset kartu untuk ${cardId(card)}`)
  }

  return mod.default
}
