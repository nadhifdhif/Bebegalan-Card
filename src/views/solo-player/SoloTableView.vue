<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSoloGameStore } from '@/stores/soloGame'
import { useSettingsStore } from '@/stores/settings'
import { useSoloTable } from '@/composables/useSoloTable'
import PlayingCard from '@/components/PlayingCard.vue'
import FlyingCard from '@/components/FlyingCard.vue'
import { SUITS, cardId, rankLabel, suitGlyph, suitLabel } from '@/game/deck'
import type { BotDifficulty, Card, Rank } from '@/game/types'

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

const {
  flyingCard,
  hiddenCardIds,
  isBusy,
  pendingReveal,
  pendingSuitChoice,
  confirmReveal,
  chooseSuitForPending,
  humanAskRank,
} = useSoloTable({
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
const targetableBots = computed(() => bots.value.filter((bot) => bot.hand.length > 0))
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

// Bagian belakang tiap buku selalu lengkap 4 kembang, jadi cukup 1 kartu
// representatif (sekop) per rank untuk ditampilkan sebagai "chip" visual.
function bookChip(rank: Rank): Card {
  return { rank, suit: 'spades' }
}

// Chat bubble sekilas, bukan riwayat yang bisa di-scroll — supaya tidak
// jadi contekan (bisa dibaca ulang) buat lawan "hard" atau nanti online.
const bubbleText = ref<string | null>(null)
let bubbleTimer: number | undefined

watch(
  () => store.log.length,
  () => {
    const latest = store.log[store.log.length - 1]

    if (!latest) {
      return
    }

    bubbleText.value = latest

    if (bubbleTimer) {
      window.clearTimeout(bubbleTimer)
    }

    bubbleTimer = window.setTimeout(() => {
      bubbleText.value = null
    }, 2400)
  },
)

onBeforeUnmount(() => {
  if (bubbleTimer) {
    window.clearTimeout(bubbleTimer)
  }
})

// Urutan menanya: lawan dulu, baru kartu (angka), baru kembang. Kalau cuma
// ada 1 lawan yang masih punya kartu, langsung dianggap terpilih otomatis.
const selectedTargetId = ref<string | null>(null)
const selectedRank = ref<Rank | null>(null)

const effectiveTargetId = computed(() => {
  if (selectedTargetId.value) {
    return selectedTargetId.value
  }

  return targetableBots.value.length === 1 ? (targetableBots.value[0]?.id ?? null) : null
})

const selectedTarget = computed(
  () => bots.value.find((bot) => bot.id === effectiveTargetId.value) ?? null,
)

const needsTargetPick = computed(() => targetableBots.value.length > 1)

// Kembang yang boleh ditebak saat rank sudah dikonfirmasi ada di tangan
// lawan — kembang yang sudah kita pegang sendiri tidak mungkin dipegang
// lawan juga (satu kartu cuma ada satu di seluruh dek).
const pendingAvailableSuits = computed(() => {
  if (!pendingSuitChoice.value || !human.value) {
    return []
  }

  const owned = new Set(
    human.value.hand
      .filter((card) => card.rank === pendingSuitChoice.value?.rank)
      .map((card) => card.suit),
  )

  return SUITS.filter((suit) => !owned.has(suit))
})

function selectTarget(botId: string) {
  if (!isHumanTurn.value || isBusy.value || selectedRank.value) {
    return
  }

  const bot = bots.value.find((candidate) => candidate.id === botId)

  if (!bot || bot.hand.length === 0) {
    return
  }

  selectedTargetId.value = botId
}

function selectCard(card: Card) {
  if (!isHumanTurn.value || isBusy.value || !effectiveTargetId.value) {
    return
  }

  selectedRank.value = card.rank
}

function clearSelection() {
  selectedTargetId.value = null
  selectedRank.value = null
}

async function submitRankAsk() {
  if (!effectiveTargetId.value || !selectedRank.value || isBusy.value) {
    return
  }

  const targetId = effectiveTargetId.value
  const rank = selectedRank.value

  clearSelection()
  await humanAskRank(rank, targetId)
}

function leaveTable() {
  store.reset()
  router.push({ name: 'home' })
}

onMounted(() => {
  settingsStore.load()

  const playersRaw = Number(route.query.players)
  const playerCount = [2, 3, 4, 5, 6].includes(playersRaw) ? (playersRaw as 2 | 3 | 4 | 5 | 6) : 2

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
      <button class="leave-button" type="button" @click="leaveTable">× Keluar</button>

      <p class="turn-indicator">
        Giliran:
        <strong>{{ currentPlayer?.name ?? '-' }}</strong>
        <span v-if="isHumanTurn && needsTargetPick && !selectedTargetId" class="turn-hint">
          — pilih lawan yang mau ditanya
        </span>
      </p>

      <p class="difficulty-badge">{{ game.difficulty }}</p>
    </header>

    <section class="opponents-row">
      <button
        v-for="bot in bots"
        :key="bot.id"
        type="button"
        class="opponent"
        :class="{
          'is-current': currentPlayer?.id === bot.id,
          'is-out': bot.hand.length === 0,
          'is-targetable': isHumanTurn && !isBusy && !selectedRank && bot.hand.length > 0,
          'is-selected-target': effectiveTargetId === bot.id,
        }"
        :disabled="!isHumanTurn || isBusy || !!selectedRank || bot.hand.length === 0"
        @click="selectTarget(bot.id)"
      >
        <p class="opponent-name">{{ bot.name }}</p>

        <div class="opponent-hand" :ref="(el) => setBotHandRef(bot.id, el as Element | null)">
          <TransitionGroup name="card-pop">
            <PlayingCard
              v-for="(card, index) in bot.hand"
              :key="`${bot.id}-${index}`"
              size="sm"
              :face-up="false"
            />
          </TransitionGroup>

          <span v-if="bot.hand.length === 0" class="opponent-out-label"> Habis </span>
        </div>
      </button>
    </section>

    <section class="table-middle">
      <div ref="pileRef" class="draw-pile">
        <PlayingCard v-if="game.drawPile.length > 0" :face-up="false" size="md" />
        <span class="pile-count">{{ game.drawPile.length }} kartu</span>
      </div>

      <div class="books-board">
        <div v-for="player in game.players" :key="player.id" class="books-row">
          <span class="books-row-name">{{ player.name }}</span>

          <div class="books-row-cards">
            <PlayingCard
              v-for="(rank, index) in player.books"
              :key="`${player.id}-book-${index}`"
              size="md"
              face-up
              :card="bookChip(rank)"
            />
            <span v-if="player.books.length === 0" class="books-row-empty"> — </span>
          </div>
        </div>
      </div>
    </section>

    <section class="bubble-slot">
      <Transition name="bubble">
        <p v-if="bubbleText" :key="bubbleText" class="chat-bubble">
          {{ bubbleText }}
        </p>
      </Transition>
    </section>

    <section class="human-area">
      <div ref="humanHandRef" class="human-hand">
        <TransitionGroup name="card-pop">
          <PlayingCard
            v-for="card in visibleHumanHand"
            :key="cardId(card)"
            :card="card"
            face-up
            size="lg"
            :selected="selectedRank === card.rank"
            :disabled="!isHumanTurn || isBusy || !effectiveTargetId"
            @click="selectCard(card)"
          />
        </TransitionGroup>
      </div>

      <div v-if="pendingSuitChoice" class="ask-controls">
        <p class="ask-breadcrumb">
          <strong>{{ pendingSuitChoice.targetName }}</strong> punya kartu
          <strong>{{ rankLabel(pendingSuitChoice.rank) }}</strong> — tebak kembangnya:
        </p>

        <div class="suit-picker">
          <button
            v-for="suit in pendingAvailableSuits"
            :key="suit"
            type="button"
            class="suit-button"
            @click="chooseSuitForPending(suit)"
          >
            {{ suitGlyph(suit) }} {{ suitLabel(suit) }}
          </button>
        </div>
      </div>

      <div v-else-if="effectiveTargetId" class="ask-controls">
        <p class="ask-breadcrumb">
          Menanya <strong>{{ selectedTarget?.name }}</strong>
          <template v-if="selectedRank">
            → apakah punya <strong>{{ rankLabel(selectedRank) }}</strong
            >?
          </template>
          <template v-else> — pilih kartu di tangan untuk ditanyakan </template>
        </p>

        <button
          v-if="selectedRank"
          type="button"
          class="ask-submit"
          :disabled="isBusy"
          @click="submitRankAsk"
        >
          Tanya
        </button>

        <button type="button" class="cancel-button" @click="clearSelection">Batal</button>
      </div>
    </section>

    <FlyingCard
      v-if="flyingCard"
      :card="flyingCard.card"
      :face-up="flyingCard.faceUp"
      :from="flyingCard.from"
      :to="flyingCard.to"
    />

    <div v-if="pendingReveal" class="reveal-overlay">
      <div class="reveal-card">
        <p class="reveal-eyebrow">
          {{ pendingReveal.askerName }} {{ pendingReveal.suit ? 'menebak' : 'bertanya' }}
        </p>
        <p v-if="!pendingReveal.suit" class="reveal-question">
          Apakah kamu punya kartu
          <strong>{{ rankLabel(pendingReveal.rank) }}</strong>
          ?
        </p>
        <p v-else class="reveal-question">
          Apakah kartumu benar
          <strong> {{ rankLabel(pendingReveal.rank) }} {{ suitLabel(pendingReveal.suit) }} </strong>
          ?
        </p>

        <button type="button" class="primary-button" @click="confirmReveal">Cek</button>
      </div>
    </div>

    <div v-if="game.phase === 'finished'" class="win-overlay">
      <div class="win-card">
        <p class="win-eyebrow">Permainan selesai</p>
        <h2>{{ winner?.name ?? 'Tidak ada' }} menang!</h2>

        <ul>
          <li v-for="player in game.players" :key="player.id">
            {{ player.name }} — {{ player.books.length }} buku
          </li>
        </ul>

        <button type="button" class="primary-button" @click="leaveTable">Kembali ke Menu</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-screen {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  gap: 4px;
  height: 100dvh;
  padding: 6px 10px 8px;
  overflow-y: auto;
  color: var(--text);
  font-size: 11px;
  line-height: 1.25;
  background:
    radial-gradient(circle at top, #153b30 0%, transparent 42%),
    linear-gradient(145deg, #06110e 0%, #081612 50%, #040a08 100%);
}

.table-topbar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.leave-button {
  padding: 3px 10px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 800;
  line-height: 1.4;
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
  font-size: 10.5px;
}

.turn-indicator strong {
  color: var(--gold);
}

.turn-hint {
  color: var(--muted);
  font-style: italic;
}

.difficulty-badge {
  margin: 0;
  padding: 2px 8px;
  color: var(--muted);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border: 1px solid var(--border);
  border-radius: 999px;
}

.opponents-row {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.opponent {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 3px 6px;
  color: inherit;
  font: inherit;
  line-height: 1.2;
  cursor: default;
  border: 1px solid transparent;
  border-radius: 10px;
  background: none;
}

.opponent.is-current {
  border-color: rgba(245, 185, 66, 0.45);
  background: rgba(245, 185, 66, 0.06);
}

.opponent.is-targetable {
  cursor: pointer;
}

.opponent.is-targetable:hover {
  border-color: rgba(245, 185, 66, 0.3);
  background: rgba(245, 185, 66, 0.04);
}

.opponent.is-selected-target {
  border-color: var(--gold);
  background: rgba(245, 185, 66, 0.1);
}

.opponent.is-out {
  opacity: 0.45;
}

.opponent:disabled {
  cursor: default;
}

.opponent-name {
  margin: 0;
  font-size: 9.5px;
  font-weight: 800;
}

.opponent-hand {
  position: relative;
  display: flex;
  min-height: 16px;
}

.opponent-hand > * {
  margin-left: calc(var(--card-w, 26px) * -0.4);
}

.opponent-hand > *:first-child {
  margin-left: 0;
}

.opponent-out-label {
  color: var(--muted);
  font-size: 9px;
  font-style: italic;
}

.table-middle {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  gap: 10px;
}

.draw-pile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.pile-count {
  color: var(--muted);
  font-size: 9px;
}

.books-board {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 110px;
}

.books-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

.books-row-name {
  flex: 0 0 auto;
  min-width: 42px;
  color: var(--muted);
  font-size: 9px;
  font-weight: 700;
}

.books-row-cards {
  display: flex;
  align-items: center;
  min-height: 12px;
}

.books-row-cards > * {
  margin-left: calc(var(--card-w, 14px) * -0.3);
}

.books-row-cards > *:first-child {
  margin-left: 0;
}

.books-row-empty {
  color: var(--muted);
  font-size: 9px;
  opacity: 0.6;
}

.bubble-slot {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-height: 18px;
}

.chat-bubble {
  margin: 0;
  padding: 4px 12px;
  max-width: 92%;
  color: var(--text);
  font-size: 9.5px;
  text-align: center;
  border: 1px solid rgba(245, 185, 66, 0.3);
  border-radius: 999px;
  background: rgba(18, 38, 32, 0.92);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
}

.bubble-enter-active,
.bubble-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.bubble-enter-from,
.bubble-leave-to {
  transform: translateY(6px);
  opacity: 0;
}

.human-area {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.human-hand {
  display: flex;
  justify-content: center;
  min-height: 48px;
  padding: 0 10px;
}

.human-hand > * {
  margin-left: calc(var(--card-w, 44px) * -0.38);
  cursor: pointer;
}

.human-hand > *:first-child {
  margin-left: 0;
}

.ask-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  width: min(100%, 300px);
  padding: 6px 10px;
  border: 1px solid rgba(245, 185, 66, 0.35);
  border-radius: 12px;
  background: rgba(7, 29, 23, 0.9);
}

.ask-breadcrumb {
  margin: 0;
  font-size: 10px;
  text-align: center;
}

.ask-breadcrumb strong {
  color: var(--gold);
}

.suit-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.suit-button {
  padding: 4px 9px;
  color: var(--text);
  font-size: 9.5px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
}

.suit-button:hover {
  color: #172018;
  border-color: var(--gold);
  background: linear-gradient(135deg, var(--gold-light), var(--gold));
}

.ask-submit {
  width: 100%;
  padding: 6px;
  color: #172018;
  font-size: 10.5px;
  font-weight: 800;
  cursor: pointer;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--gold-light), var(--gold));
}

.ask-submit:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.cancel-button {
  width: 100%;
  padding: 5px;
  color: var(--muted);
  font-size: 9.5px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: transparent;
}

.reveal-overlay {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: grid;
  padding: 20px;
  background: rgba(2, 8, 6, 0.7);
  place-items: center;
}

.reveal-card {
  display: grid;
  gap: 10px;
  width: min(100%, 320px);
  padding: 22px;
  text-align: center;
  border: 1px solid rgba(245, 185, 66, 0.4);
  border-radius: 20px;
  background: linear-gradient(145deg, var(--card-light), var(--card-dark));
}

.reveal-eyebrow {
  margin: 0;
  color: var(--gold);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

.reveal-question {
  margin: 0;
  font-size: 14px;
}

.reveal-question strong {
  color: var(--gold);
}

.reveal-card .primary-button {
  min-height: 46px;
  margin-top: 4px;
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
  gap: 12px;
  width: min(100%, 320px);
  padding: 24px;
  text-align: center;
  border: 1px solid rgba(245, 185, 66, 0.4);
  border-radius: 20px;
  background: linear-gradient(145deg, var(--card-light), var(--card-dark));
}

.win-eyebrow {
  margin: 0;
  color: var(--gold);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

.win-card h2 {
  margin: 0;
  font-size: 20px;
}

.win-card ul {
  margin: 0;
  padding: 0;
  color: var(--muted);
  font-size: 11px;
  list-style: none;
}

.win-card .primary-button {
  width: 100%;
  min-height: 44px;
  margin-top: 6px;
  color: #172018;
  font-weight: 900;
  cursor: pointer;
  border: 0;
  border-radius: 12px;
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

@media (max-width: 480px) {
  .opponents-row {
    gap: 4px;
  }

  .opponent {
    padding: 2px 4px;
  }

  .books-board {
    min-width: 0;
  }
}
</style>
