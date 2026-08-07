<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

type BotDifficulty = 'easy' | 'normal' | 'hard'
type PlayerCount = 2 | 3 | 4 | 5 | 6

const router = useRouter()

const botDifficulty = ref<BotDifficulty>('normal')
const totalPlayers = ref<PlayerCount>(2)

const playerOptions: PlayerCount[] = [2, 3, 4, 5, 6]

function selectDifficulty(difficulty: BotDifficulty) {
  botDifficulty.value = difficulty
}

function selectPlayerCount(count: PlayerCount) {
  totalPlayers.value = count
}

function startSolo() {
  router.push({
    name: 'play-solo',
    query: {
      difficulty: botDifficulty.value,
      players: String(totalPlayers.value),
    },
  })
}
</script>

<template>
  <div class="panel-content solo-panel">
    <header class="panel-header solo-header">
      <div
        class="panel-emblem panel-emblem--solo"
        aria-hidden="true"
      >
        ♠
      </div>

      <h2>Solo Begal</h2>
    </header>

    <section class="solo-section">
      <h3 class="solo-section-title">Tingkat Kesulitan</h3>

      <div class="difficulty-list">
        <button
          class="difficulty-button"
          :class="{ active: botDifficulty === 'easy' }"
          type="button"
          :aria-pressed="botDifficulty === 'easy'"
          @click.stop="selectDifficulty('easy')"
        >
          Sepele
        </button>

        <button
          class="difficulty-button"
          :class="{ active: botDifficulty === 'normal' }"
          type="button"
          :aria-pressed="botDifficulty === 'normal'"
          @click.stop="selectDifficulty('normal')"
        >
          Lumayan
        </button>

        <button
          class="difficulty-button"
          :class="{ active: botDifficulty === 'hard' }"
          type="button"
          :aria-pressed="botDifficulty === 'hard'"
          @click.stop="selectDifficulty('hard')"
        >
          Yahudi
        </button>
      </div>
    </section>

    <section class="solo-section player-section">
      <h3 class="solo-section-title">Jumlah Pelaku Begal Kartu</h3>

      <div class="player-count-list">
        <button
          v-for="count in playerOptions"
          :key="count"
          class="player-count-button"
          :class="{ active: totalPlayers === count }"
          type="button"
          :aria-pressed="totalPlayers === count"
          :aria-label="`${count} pemain, termasuk kamu dan ${count - 1} bot`"
          @click.stop="selectPlayerCount(count)"
        >
          {{ count }}
        </button>
      </div>
    </section>

    <button
      class="primary-button solo-start-button"
      type="button"
      @click.stop="startSolo"
    >
      BEGAL!
    </button>
  </div>
</template>

<style scoped>
.solo-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.solo-header {
  margin-bottom: 16px;
}

.solo-section {
  margin-bottom: 17px;
}

.solo-section-title {
  margin: 0 0 10px;
  color: rgba(248, 243, 231, 0.94);
  font-size: 14px;
  font-weight: 950;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.difficulty-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.difficulty-button {
  position: relative;
  z-index: 4;
  display: grid;
  width: 100%;
  min-height: 52px;
  padding: 9px 6px;
  color: var(--text);
  font: inherit;
  font-size: 14px;
  font-weight: 950;
  text-align: center;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 15px;
  outline: none;
  place-items: center;
  pointer-events: auto;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.075),
    rgba(255, 255, 255, 0.025)
  );
  box-shadow:
    0 7px 0 rgba(2, 12, 9, 0.92),
    0 12px 20px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transform: translateY(0);
  transition:
    color 150ms ease,
    border-color 150ms ease,
    background 150ms ease,
    box-shadow 150ms ease,
    transform 150ms ease;
}

.difficulty-button:hover,
.difficulty-button:focus-visible {
  color: var(--gold);
  border-color: rgba(245, 185, 66, 0.55);
}

.difficulty-button:active {
  box-shadow:
    0 2px 0 rgba(2, 12, 9, 0.92),
    0 5px 10px rgba(0, 0, 0, 0.2),
    inset 0 5px 10px rgba(0, 0, 0, 0.25);
  transform: translateY(5px);
}

.difficulty-button.active {
  color: var(--gold);
  border-color: var(--gold);
  background: linear-gradient(
    180deg,
    rgba(245, 185, 66, 0.16),
    rgba(245, 185, 66, 0.07)
  );
  box-shadow:
    0 2px 0 rgba(2, 12, 9, 0.92),
    0 5px 10px rgba(0, 0, 0, 0.2),
    inset 0 5px 11px rgba(0, 0, 0, 0.3);
  transform: translateY(5px);
}

.player-section {
  margin-bottom: 0;
}

.player-count-list {
  position: relative;
  z-index: 4;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.player-count-button {
  position: relative;
  z-index: 5;
  display: grid;
  width: 100%;
  aspect-ratio: 1;
  min-width: 0;
  padding: 0;
  color: var(--text);
  font: inherit;
  font-size: 18px;
  font-weight: 950;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  outline: none;
  place-items: center;
  pointer-events: auto;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.085),
    rgba(255, 255, 255, 0.025)
  );
  box-shadow:
    0 7px 0 rgba(2, 12, 9, 0.92),
    0 11px 18px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.09);
  transform: translateY(0);
  transition:
    color 150ms ease,
    border-color 150ms ease,
    background 150ms ease,
    box-shadow 150ms ease,
    transform 150ms ease;
}

.player-count-button:hover,
.player-count-button:focus-visible {
  color: var(--gold);
  border-color: rgba(245, 185, 66, 0.55);
}

.player-count-button:active {
  box-shadow:
    0 2px 0 rgba(2, 12, 9, 0.92),
    0 4px 9px rgba(0, 0, 0, 0.2),
    inset 0 5px 10px rgba(0, 0, 0, 0.25);
  transform: translateY(5px);
}

.player-count-button.active {
  color: #172018;
  border-color: var(--gold);
  background: linear-gradient(
    145deg,
    var(--gold-light),
    var(--gold)
  );
  box-shadow:
    0 2px 0 rgba(2, 12, 9, 0.92),
    0 5px 10px rgba(0, 0, 0, 0.2),
    inset 0 5px 11px rgba(120, 71, 0, 0.28);
  transform: translateY(5px);
}

.solo-start-button {
  margin-top: 16px;
}

@media (max-width: 440px) {
  .solo-header {
    margin-bottom: 17px;
  }

  .solo-section {
    margin-bottom: 18px;
  }

  .solo-section-title {
    margin-bottom: 11px;
    font-size: 13px;
    letter-spacing: 0.1em;
  }

  .difficulty-list {
    gap: 7px;
  }

  .difficulty-button {
    min-height: 54px;
    padding: 8px 4px;
    font-size: 14px;
    border-radius: 11px;
    box-shadow:
      0 5px 0 rgba(2, 12, 9, 0.92),
      0 9px 15px rgba(0, 0, 0, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .difficulty-button.active {
    box-shadow:
      0 1px 0 rgba(2, 12, 9, 0.92),
      0 3px 8px rgba(0, 0, 0, 0.2),
      inset 0 5px 10px rgba(0, 0, 0, 0.28);
    transform: translateY(4px);
  }

  .player-count-list {
    gap: 7px;
  }

  .player-count-button {
    font-size: 18px;
    border-radius: 10px;
    box-shadow:
      0 5px 0 rgba(2, 12, 9, 0.92),
      0 8px 14px rgba(0, 0, 0, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .player-count-button.active {
    box-shadow:
      0 1px 0 rgba(2, 12, 9, 0.92),
      0 3px 8px rgba(0, 0, 0, 0.2),
      inset 0 5px 10px rgba(120, 71, 0, 0.26);
    transform: translateY(4px);
  }

  .solo-start-button {
    margin-top: 18px;
  }
}
</style>
