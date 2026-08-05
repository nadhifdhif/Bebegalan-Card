export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'

export type Rank =
  | 'ace'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'jack'
  | 'queen'
  | 'king'

export interface Card {
  rank: Rank
  suit: Suit
}

export type BotDifficulty = 'easy' | 'normal' | 'hard'

export interface PlayerState {
  id: string
  name: string
  isHuman: boolean
  hand: Card[]
  books: Rank[]
}

export type GamePhase = 'dealing' | 'playing' | 'finished'

export interface GameState {
  phase: GamePhase
  players: PlayerState[]
  drawPile: Card[]
  currentPlayerIndex: number
  winnerId: string | null
  difficulty: BotDifficulty
  /** cardId strings each player is known not to hold, keyed by player id. */
  missMemory: Record<string, string[]>
}

export interface AskResult {
  hit: boolean
  card: Card | null
  drewFromPile: boolean
  completedBooks: Rank[]
}
