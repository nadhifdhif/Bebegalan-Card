<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'

type ActivePanel = 'online' | 'solo' | 'settings' | null
type BotDifficulty = 'easy' | 'normal' | 'hard'
type PlayerCount = 2 | 3 | 4 | 5 | 6

const activePanel = ref<ActivePanel>(null)
const isFlipped = ref(false)

const roomCode = ref('')
const botDifficulty = ref<BotDifficulty>('normal')
const totalPlayers = ref<PlayerCount>(2)

const soundEnabled = ref(true)
const animationsEnabled = ref(true)

const notification = ref('')
const roomCodeInput = ref<HTMLInputElement | null>(null)

const playerOptions: PlayerCount[] = [2, 3, 4, 5, 6]

const flipDuration = 720

let notificationTimer: number | undefined
let closePanelTimer: number | undefined

const normalizedRoomCode = computed(() => {
  return roomCode.value.trim().toUpperCase()
})

const botCount = computed(() => {
  return totalPlayers.value - 1
})

const panelTitle = computed(() => {
  switch (activePanel.value) {
    case 'online':
      return 'Online Room'

    case 'solo':
      return 'Solo Offline'

    case 'settings':
      return 'Settings'

    default:
      return ''
  }
})

const panelSuit = computed(() => {
  switch (activePanel.value) {
    case 'online':
      return '♣'

    case 'solo':
      return '♠'

    case 'settings':
      return '♦'

    default:
      return '♠'
  }
})

async function openPanel(
  panel: Exclude<ActivePanel, null>,
) {
  if (closePanelTimer) {
    window.clearTimeout(closePanelTimer)
  }

  activePanel.value = panel

  await nextTick()

  window.requestAnimationFrame(() => {
    isFlipped.value = true
  })

  if (panel === 'online') {
    window.setTimeout(
      () => {
        roomCodeInput.value?.focus()
      },
      animationsEnabled.value ? flipDuration : 0,
    )
  }
}

function closePanel() {
  if (!activePanel.value) {
    return
  }

  isFlipped.value = false

  if (closePanelTimer) {
    window.clearTimeout(closePanelTimer)
  }

  closePanelTimer = window.setTimeout(
    () => {
      activePanel.value = null
    },
    animationsEnabled.value ? flipDuration : 0,
  )
}

function handleOutsideClick() {
  if (isFlipped.value) {
    closePanel()
  }
}

function selectDifficulty(
  difficulty: BotDifficulty,
) {
  botDifficulty.value = difficulty
}

function selectPlayerCount(count: PlayerCount) {
  totalPlayers.value = count
}

function formatRoomCode(event: Event) {
  const input = event.target as HTMLInputElement

  roomCode.value = input.value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8)
}

function showNotification(message: string) {
  notification.value = message

  if (notificationTimer) {
    window.clearTimeout(notificationTimer)
  }

  notificationTimer = window.setTimeout(() => {
    notification.value = ''
  }, 2600)
}

function joinRoom() {
  if (!normalizedRoomCode.value) {
    showNotification(
      'Masukkan kode room terlebih dahulu.',
    )

    roomCodeInput.value?.focus()
    return
  }

  const code = normalizedRoomCode.value

  closePanel()
  showNotification(
    `Room ${code} siap dihubungkan nanti.`,
  )
}

function createRoom() {
  closePanel()

  showNotification(
    'Fitur membuat room akan ditambahkan berikutnya.',
  )
}

function startSolo() {
  const difficultyLabel: Record<
    BotDifficulty,
    string
  > = {
    easy: 'Easy',
    normal: 'Normal',
    hard: 'Hard',
  }

  const selectedDifficulty =
    difficultyLabel[botDifficulty.value]

  const players = totalPlayers.value
  const bots = botCount.value

  closePanel()

  showNotification(
    `${selectedDifficulty} · ${players} pemain · ${bots} ${
      bots === 1 ? 'bot' : 'bots'
    }`,
  )
}

function saveSettings() {
  localStorage.setItem(
    'begalkartu-settings',
    JSON.stringify({
      soundEnabled: soundEnabled.value,
      animationsEnabled: animationsEnabled.value,
    }),
  )

  closePanel()
  showNotification(
    'Pengaturan berhasil disimpan.',
  )
}

function loadSettings() {
  const storedSettings = localStorage.getItem(
    'begalkartu-settings',
  )

  if (!storedSettings) {
    return
  }

  try {
    const parsedSettings = JSON.parse(
      storedSettings,
    ) as {
      soundEnabled?: boolean
      animationsEnabled?: boolean
    }

    if (
      typeof parsedSettings.soundEnabled ===
      'boolean'
    ) {
      soundEnabled.value =
        parsedSettings.soundEnabled
    }

    if (
      typeof parsedSettings.animationsEnabled ===
      'boolean'
    ) {
      animationsEnabled.value =
        parsedSettings.animationsEnabled
    }
  } catch {
    localStorage.removeItem(
      'begalkartu-settings',
    )
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (
    event.key === 'Escape' &&
    isFlipped.value
  ) {
    closePanel()
  }
}

onMounted(() => {
  loadSettings()

  window.addEventListener(
    'keydown',
    handleKeydown,
  )
})

onBeforeUnmount(() => {
  window.removeEventListener(
    'keydown',
    handleKeydown,
  )

  if (notificationTimer) {
    window.clearTimeout(notificationTimer)
  }

  if (closePanelTimer) {
    window.clearTimeout(closePanelTimer)
  }
})
</script>

<template>
  <main
    class="game-shell"
    :class="{
      'panel-active': isFlipped,
      'reduced-motion': !animationsEnabled,
    }"
    @click="handleOutsideClick"
  >
    <div
      class="background-glow background-glow--one"
    ></div>

    <div
      class="background-glow background-glow--two"
    ></div>

    <div class="noise-layer"></div>

    <Transition name="dim">
      <div
        v-if="isFlipped"
        class="panel-dim"
        aria-hidden="true"
      ></div>
    </Transition>

    <div
      class="floating-card floating-card--left"
      aria-hidden="true"
    >
      <span class="card-rank">A</span>
      <span class="card-suit red-suit">
        ♥
      </span>
    </div>

    <div
      class="floating-card floating-card--right"
      aria-hidden="true"
    >
      <span class="card-rank">K</span>
      <span class="card-suit">♠</span>
    </div>

    <div
      class="flip-scene"
      @click.stop
    >
      <div
        class="flip-card"
        :class="{
          'is-flipped': isFlipped,
        }"
      >
        <!-- MAIN MENU -->
        <section
          class="game-card game-card--front flip-face"
          :class="{
            'face-active': !isFlipped,
          }"
          :aria-hidden="isFlipped"
        >
          <div
            class="inner-card-border"
            aria-hidden="true"
          ></div>

          <header class="brand-header">
            <div
              class="brand-badge"
              aria-hidden="true"
            >
              <span>♣</span>
              <span>♦</span>
              <span>♥</span>
              <span>♠</span>
            </div>

            <p class="eyebrow">
              The Indonesian Card Game
            </p>

            <h1>
              BEGAL
              <span>KARTU</span>
            </h1>

            <p class="tagline">
              Tebak kartunya. Rebut kartunya.
              Kuasai meja.
            </p>
          </header>

          <div class="menu-options">
            <button
              class="menu-option"
              type="button"
              @click.stop="
                openPanel('online')
              "
            >
              Online Room
            </button>

            <button
              class="menu-option"
              type="button"
              @click.stop="
                openPanel('solo')
              "
            >
              Solo Offline
            </button>

            <button
              class="menu-option"
              type="button"
              @click.stop="
                openPanel('settings')
              "
            >
              Settings
            </button>
          </div>

          <footer class="menu-footer">
            <span>v0.1.0</span>

            <span class="footer-dot"></span>

            <span>
              Made for tongkrongan
            </span>
          </footer>
        </section>

        <!-- BACK CARD -->
        <section
          class="game-card game-card--back flip-face"
          :class="{
            'face-active': isFlipped,
          }"
          :aria-hidden="!isFlipped"
        >
          <div
            class="inner-card-border"
            aria-hidden="true"
          ></div>

          <div
            class="card-pattern"
            aria-hidden="true"
          ></div>

          <span
            class="corner-mark corner-mark--top"
            aria-hidden="true"
          >
            {{ panelSuit }}
          </span>

          <span
            class="corner-mark corner-mark--bottom"
            aria-hidden="true"
          >
            {{ panelSuit }}
          </span>

          <button
            class="panel-close"
            type="button"
            :aria-label="`Tutup ${panelTitle}`"
            @click.stop="closePanel"
          >
            ×
          </button>

          <div class="back-content">
            <!-- ONLINE ROOM -->
            <div
              v-if="
                activePanel === 'online'
              "
              class="panel-content"
            >
              <header class="panel-header">
                <div
                  class="panel-emblem panel-emblem--online"
                  aria-hidden="true"
                >
                  ♣
                </div>

                <p class="panel-eyebrow">
                  Online Multiplayer
                </p>

                <h2>Online Room</h2>

                <p
                  class="panel-description"
                >
                  Masukkan kode room dari
                  temanmu atau buat room
                  permainan baru.
                </p>
              </header>

              <div class="online-form">
                <label
                  class="input-label"
                  for="room-code"
                >
                  Room Code
                </label>

                <input
                  id="room-code"
                  ref="roomCodeInput"
                  :value="roomCode"
                  class="room-input"
                  type="text"
                  maxlength="8"
                  autocomplete="off"
                  spellcheck="false"
                  placeholder="A7X92B"
                  @input="formatRoomCode"
                  @keyup.enter="joinRoom"
                  @click.stop
                />

                <button
                  class="primary-button"
                  type="button"
                  :disabled="
                    !normalizedRoomCode
                  "
                  @click.stop="joinRoom"
                >
                  Gabung Room
                </button>

                <div
                  class="button-divider"
                >
                  <span>atau</span>
                </div>

                <button
                  class="secondary-button"
                  type="button"
                  @click.stop="createRoom"
                >
                  Buat Room Baru
                </button>
              </div>

              <p class="panel-hint">
                Klik area di luar kartu atau
                tombol × untuk kembali.
              </p>
            </div>

            <!-- SOLO OFFLINE -->
            <div
              v-else-if="
                activePanel === 'solo'
              "
              class="panel-content solo-panel"
            >
              <header
                class="panel-header solo-header"
              >
                <div
                  class="panel-emblem panel-emblem--solo"
                  aria-hidden="true"
                >
                  ♠
                </div>

                <p class="panel-eyebrow">
                  Single Player
                </p>

                <h2>Solo Offline</h2>
              </header>

              <section
                class="solo-section"
              >
                <h3
                  class="solo-section-title"
                >
                  Difficulty
                </h3>

                <div
                  class="difficulty-list"
                >
                  <button
                    class="difficulty-button"
                    :class="{
                      active:
                        botDifficulty ===
                        'easy',
                    }"
                    type="button"
                    :aria-pressed="
                      botDifficulty ===
                      'easy'
                    "
                    @click.stop="
                      selectDifficulty(
                        'easy',
                      )
                    "
                  >
                    Easy
                  </button>

                  <button
                    class="difficulty-button"
                    :class="{
                      active:
                        botDifficulty ===
                        'normal',
                    }"
                    type="button"
                    :aria-pressed="
                      botDifficulty ===
                      'normal'
                    "
                    @click.stop="
                      selectDifficulty(
                        'normal',
                      )
                    "
                  >
                    Normal
                  </button>

                  <button
                    class="difficulty-button"
                    :class="{
                      active:
                        botDifficulty ===
                        'hard',
                    }"
                    type="button"
                    :aria-pressed="
                      botDifficulty ===
                      'hard'
                    "
                    @click.stop="
                      selectDifficulty(
                        'hard',
                      )
                    "
                  >
                    Hard
                  </button>
                </div>
              </section>

              <section
                class="solo-section player-section"
              >
                <h3
                  class="solo-section-title"
                >
                  Total Players
                </h3>

                <div
                  class="player-count-list"
                >
                  <button
                    v-for="
                      count in playerOptions
                    "
                    :key="count"
                    class="player-count-button"
                    :class="{
                      active:
                        totalPlayers ===
                        count,
                    }"
                    type="button"
                    :aria-pressed="
                      totalPlayers ===
                      count
                    "
                    :aria-label="`${count} pemain, termasuk kamu dan ${count - 1} bot`"
                    @click.stop="
                      selectPlayerCount(
                        count,
                      )
                    "
                  >
                    {{ count }}
                  </button>
                </div>

                <div
                  class="match-summary"
                >
                  <span
                    class="summary-group"
                  >
                    <strong>
                      {{ totalPlayers }}
                    </strong>

                    <span>Players</span>
                  </span>

                  <span
                    class="summary-divider"
                    aria-hidden="true"
                  ></span>

                  <span
                    class="summary-group"
                  >
                    <strong>
                      {{ botCount }}
                    </strong>

                    <span>
                      {{
                        botCount === 1
                          ? 'Bot'
                          : 'Bots'
                      }}
                    </span>
                  </span>
                </div>
              </section>

              <button
                class="primary-button solo-start-button"
                type="button"
                @click.stop="startSolo"
              >
                Mulai Permainan
              </button>
            </div>

            <!-- SETTINGS -->
            <div
              v-else-if="
                activePanel ===
                'settings'
              "
              class="panel-content"
            >
              <header class="panel-header">
                <div
                  class="panel-emblem panel-emblem--settings"
                  aria-hidden="true"
                >
                  ♦
                </div>

                <p class="panel-eyebrow">
                  Preferences
                </p>

                <h2>Settings</h2>

                <p
                  class="panel-description"
                >
                  Atur pengalaman bermain
                  sesuai keinginanmu.
                </p>
              </header>

              <div class="settings-list">
                <label
                  class="setting-row"
                  @click.stop
                >
                  <span
                    class="setting-copy"
                  >
                    <strong>
                      Sound Effects
                    </strong>

                    <small>
                      Suara kartu dan tombol
                      permainan
                    </small>
                  </span>

                  <input
                    v-model="
                      soundEnabled
                    "
                    class="toggle-input"
                    type="checkbox"
                  />

                  <span
                    class="toggle-switch"
                  ></span>
                </label>

                <label
                  class="setting-row"
                  @click.stop
                >
                  <span
                    class="setting-copy"
                  >
                    <strong>
                      Animations
                    </strong>

                    <small>
                      Animasi kartu dan
                      perpindahan menu
                    </small>
                  </span>

                  <input
                    v-model="
                      animationsEnabled
                    "
                    class="toggle-input"
                    type="checkbox"
                  />

                  <span
                    class="toggle-switch"
                  ></span>
                </label>
              </div>

              <button
                class="primary-button settings-save-button"
                type="button"
                @click.stop="saveSettings"
              >
                Simpan Pengaturan
              </button>

              <p class="panel-hint">
                Klik area di luar kartu atau
                tombol × untuk kembali.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>

    <Transition name="toast">
      <div
        v-if="notification"
        class="notification"
        role="status"
      >
        <span aria-hidden="true">
          ♠
        </span>

        {{ notification }}
      </div>
    </Transition>
  </main>
</template>

<style scoped>
:global(html),
:global(body),
:global(#app) {
  min-width: 320px;
  min-height: 100%;
  margin: 0;
}

:global(body) {
  overflow: hidden;
}

.game-shell {
  --background: #07110f;
  --card-dark: #071d17;
  --card-light: #173b30;
  --border: rgba(255, 255, 255, 0.1);
  --text: #f8f3e7;
  --muted: #9eafa8;
  --gold: #f5b942;
  --gold-light: #ffdc78;
  --green: #3ddc97;
  --red: #ff646f;

  position: relative;
  display: grid;
  width: 100%;
  height: 100dvh;
  min-height: 600px;
  padding: 20px;
  overflow: hidden;
  color: var(--text);
  place-items: center;
  background:
    radial-gradient(
      circle at top,
      #153b30 0%,
      transparent 38%
    ),
    linear-gradient(
      145deg,
      #06110e 0%,
      #081612 50%,
      #040a08 100%
    );
}

.noise-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.15;
  background-image: repeating-linear-gradient(
    45deg,
    transparent 0,
    transparent 2px,
    rgba(255, 255, 255, 0.015) 2px,
    rgba(255, 255, 255, 0.015) 4px
  );
}

.background-glow {
  position: absolute;
  z-index: 0;
  width: 500px;
  height: 500px;
  pointer-events: none;
  opacity: 0.2;
  border-radius: 999px;
  filter: blur(120px);
}

.background-glow--one {
  top: -240px;
  left: -180px;
  background: var(--green);
}

.background-glow--two {
  right: -220px;
  bottom: -260px;
  background: var(--gold);
}

.panel-dim {
  position: fixed;
  z-index: 2;
  inset: 0;
  pointer-events: none;
  background: rgba(0, 8, 6, 0.58);
}

.flip-scene {
  position: relative;
  z-index: 4;
  width: min(100%, 520px);
  height: min(
    660px,
    calc(100dvh - 40px)
  );
  min-height: 580px;
  perspective: 1800px;
}

.flip-card {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 720ms
    cubic-bezier(
      0.2,
      0.78,
      0.22,
      1
    );
}

.flip-card.is-flipped {
  transform: rotateY(180deg);
}

.flip-face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flip-face.face-active {
  pointer-events: auto;
}

.game-card {
  border: 1px solid var(--border);
  border-radius: 30px;
  box-shadow:
    0 35px 90px
      rgba(0, 0, 0, 0.55),
    inset 0 1px 0
      rgba(255, 255, 255, 0.08);
}

.game-card--front {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 38px;
  transform:
    rotateY(0deg)
    translateZ(1px);
  background: linear-gradient(
    145deg,
    rgba(24, 52, 43, 0.97),
    rgba(7, 20, 16, 0.98)
  );
}

.game-card--back {
  padding: 38px;
  transform:
    rotateY(180deg)
    translateZ(1px);
  background:
    radial-gradient(
      circle at center,
      rgba(39, 98, 77, 0.24),
      transparent 58%
    ),
    linear-gradient(
      145deg,
      var(--card-light),
      var(--card-dark)
    );
}

.inner-card-border {
  position: absolute;
  z-index: 0;
  inset: 10px;
  pointer-events: none;
  border: 1px solid
    rgba(245, 185, 66, 0.13);
  border-radius: 22px;
}

.brand-header {
  position: relative;
  z-index: 1;
  margin-bottom: 34px;
  text-align: center;
}

.brand-badge {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 8px 15px;
  margin-bottom: 16px;
  font-size: 14px;
  border: 1px solid
    rgba(245, 185, 66, 0.3);
  border-radius: 999px;
  background:
    rgba(245, 185, 66, 0.08);
}

.brand-badge span:nth-child(2),
.brand-badge span:nth-child(3) {
  color: var(--red);
}

.eyebrow,
.panel-eyebrow {
  margin: 0 0 8px;
  color: var(--gold);
  font-size: 11px;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.24em;
}

h1 {
  margin: 0;
  font-size: clamp(
    42px,
    8vw,
    66px
  );
  font-weight: 950;
  line-height: 0.95;
  letter-spacing: -0.065em;
  text-shadow:
    0 8px 30px
    rgba(0, 0, 0, 0.4);
}

h1 span {
  display: block;
  color: var(--gold);
  font-size: 0.74em;
  letter-spacing: 0.16em;
}

.tagline {
  max-width: 360px;
  margin: 18px auto 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}

.menu-options {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 12px;
  width: min(100%, 410px);
  margin: 0 auto;
}

.menu-option {
  display: grid;
  width: 100%;
  min-height: 58px;
  padding: 12px 20px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 850;
  text-align: center;
  cursor: pointer;
  border: 1px solid var(--border);
  border-radius: 14px;
  outline: none;
  place-items: center;
  background:
    rgba(255, 255, 255, 0.025);
  transition:
    color 180ms ease,
    transform 180ms ease,
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.menu-option:hover,
.menu-option:focus-visible {
  color: var(--gold);
  border-color:
    rgba(245, 185, 66, 0.6);
  background:
    rgba(245, 185, 66, 0.08);
  box-shadow:
    0 10px 26px
    rgba(0, 0, 0, 0.22);
  transform: translateY(-2px);
}

.menu-footer {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  margin-top: 28px;
  color: #72827c;
  font-size: 11px;
}

.footer-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--gold);
}

/* BACK CARD */

.card-pattern {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.1;
  background-image:
    linear-gradient(
      45deg,
      transparent 46%,
      rgba(245, 185, 66, 0.35)
        47%,
      rgba(245, 185, 66, 0.35)
        49%,
      transparent 50%
    ),
    linear-gradient(
      -45deg,
      transparent 46%,
      rgba(255, 255, 255, 0.2)
        47%,
      rgba(255, 255, 255, 0.2)
        49%,
      transparent 50%
    );
  background-size: 54px 54px;
}

.corner-mark {
  position: absolute;
  z-index: 1;
  color:
    rgba(245, 185, 66, 0.11);
  font-size: 110px;
  line-height: 1;
  pointer-events: none;
}

.corner-mark--top {
  top: 34px;
  left: 30px;
  transform: rotate(-13deg);
}

.corner-mark--bottom {
  right: 30px;
  bottom: 28px;
  color:
    rgba(255, 100, 111, 0.08);
  transform: rotate(167deg);
}

.panel-close {
  position: absolute;
  z-index: 6;
  top: 22px;
  right: 23px;
  display: grid;
  width: 40px;
  height: 40px;
  padding: 0;
  color: var(--muted);
  font-size: 27px;
  line-height: 1;
  cursor: pointer;
  border: 1px solid
    rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  place-items: center;
  background:
    rgba(255, 255, 255, 0.06);
  transition:
    color 180ms ease,
    background 180ms ease,
    transform 180ms ease;
}

.panel-close:hover,
.panel-close:focus-visible {
  color: var(--gold);
  outline: none;
  background:
    rgba(245, 185, 66, 0.11);
  transform: rotate(90deg);
}

.back-content {
  position: relative;
  z-index: 3;
  display: flex;
  height: 100%;
  align-items: center;
}

.panel-content {
  width: 100%;
}

.panel-header {
  margin-bottom: 25px;
}

.panel-emblem {
  display: grid;
  width: 58px;
  height: 58px;
  margin-bottom: 19px;
  color: var(--gold);
  font-size: 25px;
  border: 1px solid
    rgba(245, 185, 66, 0.35);
  border-radius: 17px;
  place-items: center;
  background:
    rgba(245, 185, 66, 0.09);
}

.panel-emblem--solo {
  color: var(--text);
}

.panel-emblem--settings {
  color: var(--red);
}

.panel-header h2 {
  margin: 0;
  font-size: 34px;
  line-height: 1.1;
}

.panel-description {
  max-width: 370px;
  margin: 9px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

/* ONLINE */

.input-label {
  display: block;
  margin-bottom: 8px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.room-input {
  width: 100%;
  min-height: 60px;
  padding: 14px 18px;
  color: var(--text);
  font: inherit;
  font-size: 19px;
  font-weight: 850;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  border: 1px solid var(--border);
  border-radius: 15px;
  outline: none;
  background:
    rgba(0, 0, 0, 0.2);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
}

.room-input::placeholder {
  color:
    rgba(158, 175, 168, 0.43);
}

.room-input:focus {
  border-color: var(--gold);
  background:
    rgba(0, 0, 0, 0.28);
  box-shadow:
    0 0 0 4px
    rgba(245, 185, 66, 0.1);
}

.primary-button,
.secondary-button {
  width: 100%;
  min-height: 55px;
  padding: 14px 18px;
  font: inherit;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  border-radius: 15px;
  transition:
    transform 180ms ease,
    filter 180ms ease,
    border-color 180ms ease,
    background 180ms ease;
}

.primary-button {
  margin-top: 14px;
  color: #172018;
  border: 0;
  background: linear-gradient(
    135deg,
    var(--gold-light),
    var(--gold)
  );
  box-shadow:
    0 14px 30px
    rgba(245, 185, 66, 0.18);
}

.primary-button:hover:not(
    :disabled
  ),
.primary-button:focus-visible:not(
    :disabled
  ) {
  filter: brightness(1.06);
  outline: none;
  transform: translateY(-2px);
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.secondary-button {
  color: var(--text);
  border: 1px solid var(--border);
  background:
    rgba(255, 255, 255, 0.025);
}

.secondary-button:hover,
.secondary-button:focus-visible {
  color: var(--gold);
  border-color:
    rgba(245, 185, 66, 0.48);
  outline: none;
  background:
    rgba(245, 185, 66, 0.07);
  transform: translateY(-2px);
}

.button-divider {
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 13px 0;
  color:
    rgba(158, 175, 168, 0.55);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.button-divider::before,
.button-divider::after {
  flex: 1;
  height: 1px;
  content: '';
  background:
    rgba(255, 255, 255, 0.08);
}

/* SOLO */

.solo-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.solo-header {
  margin-bottom: 22px;
}

.solo-section {
  margin-bottom: 22px;
}

.solo-section-title {
  margin: 0 0 12px;
  color:
    rgba(248, 243, 231, 0.82);
  font-size: 12px;
  font-weight: 900;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

.difficulty-list {
  display: grid;
  grid-template-columns:
    repeat(3, 1fr);
  gap: 11px;
}

.difficulty-button {
  position: relative;
  z-index: 4;
  display: grid;
  width: 100%;
  min-height: 66px;
  padding: 12px 8px;
  color: var(--text);
  font: inherit;
  font-size: 17px;
  font-weight: 950;
  text-align: center;
  cursor: pointer;
  border: 1px solid
    rgba(255, 255, 255, 0.12);
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
    0 7px 0
      rgba(2, 12, 9, 0.92),
    0 12px 20px
      rgba(0, 0, 0, 0.25),
    inset 0 1px 0
      rgba(255, 255, 255, 0.08);
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
  border-color:
    rgba(245, 185, 66, 0.55);
}

.difficulty-button:active {
  box-shadow:
    0 2px 0
      rgba(2, 12, 9, 0.92),
    0 5px 10px
      rgba(0, 0, 0, 0.2),
    inset 0 5px 10px
      rgba(0, 0, 0, 0.25);
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
    0 2px 0
      rgba(2, 12, 9, 0.92),
    0 5px 10px
      rgba(0, 0, 0, 0.2),
    inset 0 5px 11px
      rgba(0, 0, 0, 0.3);
  transform: translateY(5px);
}

.player-section {
  margin-bottom: 4px;
}

.player-count-list {
  position: relative;
  z-index: 4;
  display: grid;
  grid-template-columns:
    repeat(5, 1fr);
  gap: 10px;
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
  font-size: 21px;
  font-weight: 950;
  cursor: pointer;
  border: 1px solid
    rgba(255, 255, 255, 0.12);
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
    0 7px 0
      rgba(2, 12, 9, 0.92),
    0 11px 18px
      rgba(0, 0, 0, 0.24),
    inset 0 1px 0
      rgba(255, 255, 255, 0.09);
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
  border-color:
    rgba(245, 185, 66, 0.55);
}

.player-count-button:active {
  box-shadow:
    0 2px 0
      rgba(2, 12, 9, 0.92),
    0 4px 9px
      rgba(0, 0, 0, 0.2),
    inset 0 5px 10px
      rgba(0, 0, 0, 0.25);
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
    0 2px 0
      rgba(2, 12, 9, 0.92),
    0 5px 10px
      rgba(0, 0, 0, 0.2),
    inset 0 5px 11px
      rgba(120, 71, 0, 0.28);
  transform: translateY(5px);
}

.match-summary {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  margin-top: 16px;
  color: var(--gold);
}

.summary-group {
  display: flex;
  gap: 6px;
  align-items: baseline;
  text-transform: uppercase;
}

.summary-group strong {
  font-size: 22px;
  font-weight: 950;
  line-height: 1;
}

.summary-group span {
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.13em;
}

.summary-divider {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background:
    rgba(245, 185, 66, 0.55);
}

.solo-start-button {
  margin-top: 9px;
}

/* SETTINGS */

.settings-list {
  display: grid;
  gap: 12px;
}

.setting-row {
  position: relative;
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
  min-height: 82px;
  padding: 16px 18px;
  cursor: pointer;
  border: 1px solid var(--border);
  border-radius: 16px;
  background:
    rgba(255, 255, 255, 0.035);
  transition:
    border-color 180ms ease,
    background 180ms ease,
    transform 180ms ease;
}

.setting-row:hover {
  border-color:
    rgba(245, 185, 66, 0.35);
  background:
    rgba(245, 185, 66, 0.055);
  transform: translateY(-1px);
}

.setting-copy {
  display: grid;
  gap: 5px;
}

.setting-copy strong {
  font-size: 14px;
}

.setting-copy small {
  color: var(--muted);
  font-size: 10px;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.toggle-switch {
  position: relative;
  flex: 0 0 auto;
  width: 50px;
  height: 29px;
  border-radius: 999px;
  background: #33433d;
  transition:
    background 180ms ease,
    box-shadow 180ms ease;
}

.toggle-switch::after {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 21px;
  height: 21px;
  content: '';
  border-radius: 50%;
  background: white;
  box-shadow:
    0 3px 8px
    rgba(0, 0, 0, 0.22);
  transition:
    transform 180ms ease;
}

.toggle-input:focus-visible
  + .toggle-switch {
  box-shadow:
    0 0 0 4px
    rgba(245, 185, 66, 0.15);
}

.toggle-input:checked
  + .toggle-switch {
  background: var(--green);
}

.toggle-input:checked
  + .toggle-switch::after {
  transform: translateX(21px);
}

.settings-save-button {
  margin-top: 17px;
}

.panel-hint {
  margin: 17px 0 0;
  color:
    rgba(158, 175, 168, 0.66);
  font-size: 9px;
  text-align: center;
  letter-spacing: 0.02em;
}

/* DECORATIVE CARDS */

.floating-card {
  position: absolute;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: 150px;
  height: 215px;
  padding: 18px;
  color: #121212;
  pointer-events: none;
  border: 5px solid
    rgba(255, 255, 255, 0.42);
  border-radius: 17px;
  background: #f7f0df;
  box-shadow:
    0 25px 60px
    rgba(0, 0, 0, 0.35);
  opacity: 0.16;
  user-select: none;
  transition: opacity 350ms ease;
}

.panel-active .floating-card {
  opacity: 0.06;
}

.floating-card--left {
  top: 12%;
  left: 7%;
  transform: rotate(-19deg);
  animation:
    card-float-left
    6s ease-in-out infinite;
}

.floating-card--right {
  right: 7%;
  bottom: 10%;
  transform: rotate(17deg);
  animation:
    card-float-right
    7s ease-in-out infinite;
}

.card-rank {
  font-size: 38px;
  font-weight: 900;
}

.card-suit {
  margin: auto;
  font-size: 72px;
}

.red-suit {
  color: #d83844;
}

/* TOAST */

.notification {
  position: fixed;
  z-index: 20;
  bottom: 28px;
  left: 50%;
  display: flex;
  gap: 10px;
  align-items: center;
  max-width:
    calc(100% - 30px);
  padding: 13px 18px;
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  border: 1px solid
    rgba(245, 185, 66, 0.3);
  border-radius: 999px;
  background:
    rgba(18, 38, 32, 0.97);
  box-shadow:
    0 20px 45px
    rgba(0, 0, 0, 0.4);
  transform: translateX(-50%);
}

/* TRANSITIONS */

.dim-enter-active,
.dim-leave-active {
  transition: opacity 420ms ease;
}

.dim-enter-from,
.dim-leave-to {
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform:
    translate(-50%, 15px);
}

.reduced-motion *,
.reduced-motion *::before,
.reduced-motion *::after {
  scroll-behavior: auto !important;
  animation-duration:
    0.001ms !important;
  animation-iteration-count:
    1 !important;
  transition-duration:
    0.001ms !important;
}

@keyframes card-float-left {
  0%,
  100% {
    transform:
      translateY(0)
      rotate(-19deg);
  }

  50% {
    transform:
      translateY(-16px)
      rotate(-15deg);
  }
}

@keyframes card-float-right {
  0%,
  100% {
    transform:
      translateY(0)
      rotate(17deg);
  }

  50% {
    transform:
      translateY(14px)
      rotate(13deg);
  }
}

@media (max-width: 760px) {
  .game-shell {
    padding: 14px;
  }

  .flip-scene {
    height: min(
      630px,
      calc(100dvh - 28px)
    );
  }

  .game-card--front,
  .game-card--back {
    padding: 27px 20px;
    border-radius: 24px;
  }

  .floating-card {
    display: none;
  }

  .panel-header h2 {
    font-size: 30px;
  }

  .panel-close {
    top: 18px;
    right: 18px;
  }

  .corner-mark {
    font-size: 90px;
  }
}

@media (max-width: 440px) {
  .game-shell {
    min-height: 560px;
    padding: 8px;
  }

  .flip-scene {
    height: calc(
      100dvh - 16px
    );
    min-height: 550px;
  }

  .brand-header {
    margin-bottom: 26px;
  }

  h1 {
    font-size: 49px;
  }

  .tagline {
    font-size: 12px;
  }

  .menu-option {
    min-height: 50px;
    padding: 10px 14px;
    font-size: 14px;
  }

  .game-card--back {
    padding: 22px 17px;
  }

  .panel-header {
    margin-bottom: 17px;
  }

  .solo-header {
    margin-bottom: 17px;
  }

  .panel-emblem {
    width: 48px;
    height: 48px;
    margin-bottom: 13px;
    font-size: 21px;
  }

  .panel-header h2 {
    font-size: 27px;
  }

  .panel-description {
    font-size: 11px;
  }

  .solo-section {
    margin-bottom: 16px;
  }

  .solo-section-title {
    margin-bottom: 9px;
    font-size: 10px;
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
      0 5px 0
        rgba(2, 12, 9, 0.92),
      0 9px 15px
        rgba(0, 0, 0, 0.22),
      inset 0 1px 0
        rgba(255, 255, 255, 0.08);
  }

  .difficulty-button.active {
    box-shadow:
      0 1px 0
        rgba(2, 12, 9, 0.92),
      0 3px 8px
        rgba(0, 0, 0, 0.2),
      inset 0 5px 10px
        rgba(0, 0, 0, 0.28);
    transform: translateY(4px);
  }

  .player-count-list {
    gap: 7px;
  }

  .player-count-button {
    font-size: 18px;
    border-radius: 10px;
    box-shadow:
      0 5px 0
        rgba(2, 12, 9, 0.92),
      0 8px 14px
        rgba(0, 0, 0, 0.22),
      inset 0 1px 0
        rgba(255, 255, 255, 0.08);
  }

  .player-count-button.active {
    box-shadow:
      0 1px 0
        rgba(2, 12, 9, 0.92),
      0 3px 8px
        rgba(0, 0, 0, 0.2),
      inset 0 5px 10px
        rgba(120, 71, 0, 0.26);
    transform: translateY(4px);
  }

  .match-summary {
    min-height: 31px;
    margin-top: 12px;
  }

  .summary-group strong {
    font-size: 18px;
  }

  .summary-group span {
    font-size: 8px;
  }

  .setting-row {
    min-height: 72px;
    padding: 13px;
  }

  .room-input {
    min-height: 53px;
    font-size: 16px;
  }

  .primary-button,
  .secondary-button {
    min-height: 48px;
  }

  .solo-start-button {
    margin-top: 5px;
  }

  .notification {
    width: max-content;
    max-width:
      calc(100% - 24px);
    font-size: 11px;
    white-space: normal;
  }
}
</style>
