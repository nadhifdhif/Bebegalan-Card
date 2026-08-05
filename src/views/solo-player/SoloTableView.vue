<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSoloGameStore } from '@/stores/soloGame'
import { useSettingsStore } from '@/stores/settings'
import { useSoloTable } from '@/composables/useSoloTable'
import PlayingCard from '@/components/PlayingCard.vue'
import FlyingCard from '@/components/FlyingCard.vue'
import { SUITS, cardId, rankLabel, suitGlyph, suitLabel } from '@/game/deck'
import type { BotDifficulty, Card, Rank, Suit } from '@/game/types'

const route = useRoute()
const router = useRouter()
const store = useSoloGameStore()
const settingsStore = useSettingsStore()

const pileRef = ref<HTMLElement | null>(null)
const humanHandRef = ref<HTMLElement | null>(null)
const botHandRefs = ref<Record<string, HTMLElement | null>>({})

function setBotHandRef(id: string, el: Element | null) {
  botHandRefs.value[id] = el as HTMLElement | null
}

const { flyingCard, hiddenCardIds, isBusy, humanAsk } = useSoloTable({
  getHandRect(playerId) {
    const el = playerId === 'human' ? humanHandRef.value : botHandRefs.value[playerId]
    return el?.getBoundingClientRect() ?? null
  },
  getPileRect() {
    return pileRef.value?.getBoundingClientRect() ?? null
  },
})

const game = computed(() => store.game)
const human = computed(() => game.value?.players.find((p) => p.id === 'human') ?? null)
const bots = computed(() => game.value?.players.filter((p) => !p.isHuman) ?? [])
const currentPlayer = computed(() =>
  game.value ? game.value.players[game.value.currentPlayerIndex] : null,
)
const isHumanTurn = computed(() => currentPlayer.value?.id === 'human')
const winner = computed(
  () => game.value?.players.find((p) => p.id === game.value?.winnerId) ?? null,
)

const visibleHumanHand = computed(
  () => human.value?.hand.filter((card) => !hiddenCardIds.has(cardId(card))) ?? [],
)

const selectedRank = ref<Rank | null>(null)
const selectedSuit = ref<Suit | null>(null)
const selectedTargetId = ref<string | null>(null)

const availableSuits = computed(() => {
  if (!selectedRank.value || !human.value) {
    return []
  }

  const owned = new Set(
    human.value.hand
      .filter((card) => card.rank === selectedRank.value)
      .map((card) => card.suit),
  )

  return SUITS.filter((suit) => !owned.has(suit))
})

function selectCard(card: Card) {
  if (!isHumanTurn.value || isBusy.value) {
    return
  }

  selectedRank.value = card.rank
  selectedSuit.value = null
  selectedTargetId.value = bots.value.length === 1 ? (bots.value[0]?.id ?? null) : null
}

function clearSelection() {
  selectedRank.value = null
  selectedSuit.value = null
  selectedTargetId.value = null
}

async function confirmAsk() {
  if (!selectedRank.value || !selectedSuit.value || !selectedTargetId.value) {
    return
  }

  const rank = selectedRank.value
  const suit = selectedSuit.value
  const targetId = selectedTargetId.value

  clearSelection()
  await humanAsk(rank, suit, targetId)
}

function leaveTable() {
  store.reset()
  router.push({ name: 'home' })
}

onMounted(() => {
  settingsStore.load()

  const playersRaw = Number(route.query.players)
  const playerCount = [2, 3, 4, 5, 6].includes(playersRaw)
    ? (playersRaw as 2 | 3 | 4 | 5 | 6)
    : 2

  const difficultyRaw = route.query.difficulty
  const difficulty: BotDifficulty =
    difficultyRaw === 'easy' || difficultyRaw === 'hard' ? difficultyRaw : 'normal'

  store.start(playerCount, difficulty)
})
</script>

<template>
  <div
    v-if="game"
    class="table-screen"
    :class="{ 'reduced-motion': !settingsStore.animationsEnabled }"
  >
    <header class="table-topbar">
      <button
        class="leave-button"
        type="button"
        @click="leaveTable"
      >
        × Keluar
      </button>

      <p class="turn-indicator">
        Giliran:
        <strong>{{ currentPlayer?.name ?? '-' }}</strong>
      </p>

      <p class="difficulty-badge">{{ game.difficulty }}</p>
    </header>

    <section class="opponents-row">
      <div
        v-for="bot in bots"
        :key="bot.id"
        class="opponent"
        :class="{ 'is-current': currentPlayer?.id === bot.id }"
      >
        <p class="opponent-name">
          {{ bot.name }}
          <span class="opponent-books">📚 {{ bot.books.length }}</span>
        </p>

        <div
          class="opponent-hand"
          :ref="(el) => setBotHandRef(bot.id, el as Element | null)"
        >
          <TransitionGroup name="card-pop">
            <PlayingCard
              v-for="(card, index) in bot.hand"
              :key="`${bot.id}-${index}`"
              size="sm"
              :face-up="false"
            />
          </TransitionGroup>
        </div>
      </div>
    </section>

    <section class="table-middle">
      <div
        ref="pileRef"
        class="draw-pile"
      >
        <PlayingCard
          v-if="game.drawPile.length > 0"
          :face-up="false"
          size="md"
        />
        <span class="pile-count">{{ game.drawPile.length }} kartu</span>
      </div>

      <ul class="books-board">
        <li
          v-for="player in game.players"
          :key="player.id"
        >
          {{ player.name }}: <strong>{{ player.books.length }}</strong> buku
        </li>
      </ul>
    </section>

    <section class="event-log">
      <p
        v-for="(entry, index) in store.log"
        :key="index"
      >
        {{ entry }}
      </p>
    </section>

    <section class="human-area">
      <div
        ref="humanHandRef"
        class="human-hand"
      >
        <TransitionGroup name="card-pop">
          <PlayingCard
            v-for="card in visibleHumanHand"
            :key="cardId(card)"
            :card="card"
            face-up
            size="md"
            :selected="selectedRank === card.rank"
            :disabled="!isHumanTurn || isBusy"
            @click="selectCard(card)"
          />
        </TransitionGroup>
      </div>

      <div
        v-if="selectedRank"
        class="ask-controls"
      >
        <p class="ask-title">
          Tanya <strong>{{ rankLabel(selectedRank) }}</strong> kembang apa?
        </p>

        <div class="suit-picker">
          <button
            v-for="suit in availableSuits"
            :key="suit"
            type="button"
            class="suit-button"
            :class="{ active: selectedSuit === suit }"
            @click="selectedSuit = suit"
          >
            {{ suitGlyph(suit) }} {{ suitLabel(suit) }}
          </button>
        </div>

        <div
          v-if="bots.length > 1"
          class="target-picker"
        >
          <button
            v-for="bot in bots"
            :key="bot.id"
            type="button"
            class="target-button"
            :class="{ active: selectedTargetId === bot.id }"
            @click="selectedTargetId = bot.id"
          >
            {{ bot.name }}
          </button>
        </div>

        <div class="ask-actions">
          <button
            type="button"
            class="cancel-button"
            @click="clearSelection"
          >
            Batal
          </button>

          <button
            type="button"
            class="ask-button"
            :disabled="!selectedSuit || !selectedTargetId || isBusy"
            @click="confirmAsk"
          >
            Tanya!
          </button>
        </div>
      </div>
    </section>

    <FlyingCard
      v-if="flyingCard"
      :card="flyingCard.card"
      :face-up="flyingCard.faceUp"
      :from="flyingCard.from"
      :to="flyingCard.to"
    />

    <div
      v-if="game.phase === 'finished'"
      class="win-overlay"
    >
      <div class="win-card">
        <p class="win-eyebrow">Permainan selesai</p>
        <h2>{{ winner?.name ?? 'Tidak ada' }} menang!</h2>

        <ul>
          <li
            v-for="player in game.players"
            :key="player.id"
          >
            {{ player.name }} — {{ player.books.length }} buku
          </li>
        </ul>

        <button
          type="button"
          class="primary-button"
          @click="leaveTable"
        >
          Kembali ke Menu
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-screen {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100dvh;
  padding: 16px 20px 24px;
  color: var(--text);
  background:
    radial-gradient(circle at top, #153b30 0%, transparent 42%),
    linear-gradient(145deg, #06110e 0%, #081612 50%, #040a08 100%);
}

.table-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.leave-button {
  padding: 8px 16px;
  color: var(--muted);
  font-weight: 800;
  cursor: pointer;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
}

.leave-button:hover {
  color: var(--gold);
  border-color: rgba(245, 185, 66, 0.5);
}

.turn-indicator {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.turn-indicator strong {
  color: var(--gold);
}

.difficulty-badge {
  margin: 0;
  padding: 4px 12px;
  color: var(--muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border: 1px solid var(--border);
  border-radius: 999px;
}

.opponents-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  justify-content: center;
  padding: 8px 0;
}

.opponent {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border: 1px solid transparent;
  border-radius: 16px;
}

.opponent.is-current {
  border-color: rgba(245, 185, 66, 0.45);
  background: rgba(245, 185, 66, 0.06);
}

.opponent-name {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0;
  font-size: 12px;
  font-weight: 800;
}

.opponent-books {
  color: var(--muted);
  font-weight: 600;
}

.opponent-hand {
  display: flex;
  min-height: 64px;
}

.opponent-hand > * {
  margin-left: -20px;
}

.opponent-hand > *:first-child {
  margin-left: 0;
}

.table-middle {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 6px 0;
}

.draw-pile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.pile-count {
  color: var(--muted);
  font-size: 11px;
}

.books-board {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin: 0;
  padding: 0;
  color: var(--muted);
  font-size: 12px;
  list-style: none;
}

.books-board strong {
  color: var(--gold);
}

.event-log {
  max-height: 90px;
  padding: 8px 14px;
  overflow-y: auto;
  color: var(--muted);
  font-size: 11.5px;
  line-height: 1.7;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.18);
}

.event-log p {
  margin: 0;
}

.human-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  margin-top: auto;
  padding-top: 10px;
}

.human-hand {
  display: flex;
  justify-content: center;
  min-height: 118px;
  padding: 0 20px;
}

.human-hand > * {
  margin-left: -28px;
  cursor: pointer;
}

.human-hand > *:first-child {
  margin-left: 0;
}

.ask-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: min(100%, 420px);
  padding: 14px 18px;
  border: 1px solid rgba(245, 185, 66, 0.35);
  border-radius: 18px;
  background: rgba(7, 29, 23, 0.9);
}

.ask-title {
  margin: 0;
  font-size: 13px;
}

.suit-picker,
.target-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.suit-button,
.target-button {
  padding: 8px 14px;
  color: var(--text);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
}

.suit-button.active,
.target-button.active {
  color: #172018;
  border-color: var(--gold);
  background: linear-gradient(135deg, var(--gold-light), var(--gold));
}

.ask-actions {
  display: flex;
  gap: 10px;
  width: 100%;
}

.cancel-button {
  flex: 1;
  padding: 10px;
  color: var(--muted);
  font-weight: 700;
  cursor: pointer;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: transparent;
}

.ask-button {
  flex: 2;
  padding: 10px;
  color: #172018;
  font-weight: 900;
  cursor: pointer;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--gold-light), var(--gold));
}

.ask-button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.win-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  padding: 20px;
  background: rgba(2, 8, 6, 0.82);
  place-items: center;
}

.win-card {
  display: grid;
  gap: 14px;
  width: min(100%, 360px);
  padding: 30px;
  text-align: center;
  border: 1px solid rgba(245, 185, 66, 0.4);
  border-radius: 24px;
  background: linear-gradient(145deg, var(--card-light), var(--card-dark));
}

.win-eyebrow {
  margin: 0;
  color: var(--gold);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

.win-card h2 {
  margin: 0;
}

.win-card ul {
  margin: 0;
  padding: 0;
  color: var(--muted);
  font-size: 13px;
  list-style: none;
}

.win-card .primary-button {
  width: 100%;
  min-height: 50px;
  margin-top: 8px;
  color: #172018;
  font-weight: 900;
  cursor: pointer;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--gold-light), var(--gold));
}

.card-pop-enter-active,
.card-pop-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.card-pop-enter-from,
.card-pop-leave-to {
  transform: scale(0.6);
  opacity: 0;
}

.card-pop-leave-active {
  position: absolute;
}
</style>
