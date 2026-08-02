<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type MenuPanel = 'online' | 'solo' | null
type BotDifficulty = 'easy' | 'normal' | 'hard'

const activePanel = ref<MenuPanel>(null)
const settingsOpen = ref(false)

const roomCode = ref('')
const soundEnabled = ref(true)
const animationsEnabled = ref(true)
const botDifficulty = ref<BotDifficulty>('normal')

const notification = ref('')
let notificationTimer: number | undefined

const normalizedRoomCode = computed(() => {
  return roomCode.value.trim().toUpperCase()
})

function openPanel(panel: MenuPanel) {
  settingsOpen.value = false
  activePanel.value = panel
}

function closePanel() {
  activePanel.value = null
}

function openSettings() {
  activePanel.value = null
  settingsOpen.value = true
}

function closeSettings() {
  settingsOpen.value = false
}

function handleOutsideClick() {
  if (settingsOpen.value) {
    closeSettings()
  }
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
  }, 2500)
}

function joinRoom() {
  if (!normalizedRoomCode.value) {
    showNotification('Masukkan kode room terlebih dahulu.')
    return
  }

  closePanel()
  showNotification(`Room ${normalizedRoomCode.value} siap dihubungkan nanti.`)
}

function startSolo() {
  closePanel()
  showNotification(`Mode bot ${botDifficulty.value} segera disiapkan.`)
}

function saveSettings() {
  closeSettings()
  showNotification('Pengaturan berhasil disimpan.')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') {
    return
  }

  if (settingsOpen.value) {
    closeSettings()
    return
  }

  if (activePanel.value) {
    closePanel()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)

  if (notificationTimer) {
    window.clearTimeout(notificationTimer)
  }
})
</script>

<template>
  <main
    class="game-shell"
    :class="{
      'reduced-motion': !animationsEnabled,
      'settings-active': settingsOpen,
    }"
    @click="handleOutsideClick"
  >
    <div class="background-glow background-glow--one"></div>
    <div class="background-glow background-glow--two"></div>
    <div class="noise-layer"></div>

    <div
      v-if="settingsOpen"
      class="settings-dim"
      aria-hidden="true"
    ></div>

    <div class="floating-card floating-card--left" aria-hidden="true">
      <span class="card-rank">A</span>
      <span class="card-suit red-suit">♥</span>
    </div>

    <div class="floating-card floating-card--right" aria-hidden="true">
      <span class="card-rank">K</span>
      <span class="card-suit">♠</span>
    </div>

    <div class="flip-scene" @click.stop>
      <div
        class="flip-card"
        :class="{ 'is-flipped': settingsOpen }"
      >
        <!-- Sisi depan -->
        <section
          class="main-menu flip-face flip-face--front"
          :aria-hidden="settingsOpen"
        >
          <header class="brand-header">
            <div class="brand-badge">
              <span>♣</span>
              <span>♦</span>
              <span>♥</span>
              <span>♠</span>
            </div>

            <p class="eyebrow">The Indonesian Card Game</p>

            <h1>
              BEGAL
              <span>KARTU</span>
            </h1>

            <p class="tagline">
              Tebak kartunya. Rebut kartunya. Kuasai meja.
            </p>
          </header>

          <div class="menu-options">
            <button
              class="menu-option"
              type="button"
              @click="openPanel('online')"
            >
              Online Room
            </button>

            <button
              class="menu-option"
              type="button"
              @click="openPanel('solo')"
            >
              Solo Offline
            </button>

            <button
              class="menu-option"
              type="button"
              @click="openSettings"
            >
              Settings
            </button>
          </div>

          <footer class="menu-footer">
            <span>v0.1.0</span>
            <span class="footer-dot"></span>
            <span>Made for tongkrongan</span>
          </footer>
        </section>

        <!-- Sisi belakang: Settings -->
        <section
          class="settings-card flip-face flip-face--back"
          :aria-hidden="!settingsOpen"
        >
          <div class="card-pattern" aria-hidden="true"></div>

          <span
            class="corner-suit corner-suit--top"
            aria-hidden="true"
          >
            ♠
          </span>

          <span
            class="corner-suit corner-suit--bottom"
            aria-hidden="true"
          >
            ♥
          </span>

          <button
            class="settings-close"
            type="button"
            aria-label="Kembali ke menu utama"
            @click="closeSettings"
          >
            ×
          </button>

          <div class="settings-content">
            <header class="settings-header">
              <div class="settings-emblem" aria-hidden="true">
                <span>♣</span>
                <span>♦</span>
              </div>

              <p class="settings-eyebrow">Preferences</p>
              <h2>Settings</h2>

              <p class="settings-description">
                Atur pengalaman bermain sesuai keinginanmu.
              </p>
            </header>

            <div class="settings-list">
              <label class="setting-row">
                <span class="setting-copy">
                  <strong>Sound Effects</strong>
                  <small>Suara kartu dan tombol</small>
                </span>

                <input
                  v-model="soundEnabled"
                  class="toggle-input"
                  type="checkbox"
                />

                <span class="toggle-switch"></span>
              </label>

              <label class="setting-row">
                <span class="setting-copy">
                  <strong>Animations</strong>
                  <small>Animasi kartu dan menu</small>
                </span>

                <input
                  v-model="animationsEnabled"
                  class="toggle-input"
                  type="checkbox"
                />

                <span class="toggle-switch"></span>
              </label>
            </div>

            <button
              class="save-settings-button"
              type="button"
              @click="saveSettings"
            >
              Simpan Pengaturan
            </button>

            <p class="settings-hint">
              Klik area di luar kartu atau tombol × untuk kembali.
            </p>
          </div>
        </section>
      </div>
    </div>

    <!-- Online Room -->
    <Transition name="modal">
      <div
        v-if="activePanel === 'online'"
        class="modal-backdrop"
        @click.self="closePanel"
      >
        <section class="modal-card">
          <button
            class="modal-close"
            type="button"
            aria-label="Tutup"
            @click="closePanel"
          >
            ×
          </button>

          <div class="modal-symbol" aria-hidden="true">
            ♣
          </div>

          <p class="modal-eyebrow">Online Multiplayer</p>
          <h2>Gabung ke Room</h2>

          <p class="modal-description">
            Masukkan kode yang dibagikan oleh pembuat room.
          </p>

          <label class="input-label" for="room-code">
            Room Code
          </label>

          <input
            id="room-code"
            :value="roomCode"
            class="room-input"
            type="text"
            maxlength="8"
            autocomplete="off"
            placeholder="CONTOH: A7X92B"
            @input="formatRoomCode"
            @keyup.enter="joinRoom"
          />

          <button
            class="primary-button"
            type="button"
            :disabled="!normalizedRoomCode"
            @click="joinRoom"
          >
            Gabung Room
          </button>

          <button
            class="secondary-button"
            type="button"
            @click="
              showNotification(
                'Fitur membuat room akan ditambahkan berikutnya.',
              )
            "
          >
            Buat Room Baru
          </button>
        </section>
      </div>
    </Transition>

    <!-- Solo Offline -->
    <Transition name="modal">
      <div
        v-if="activePanel === 'solo'"
        class="modal-backdrop"
        @click.self="closePanel"
      >
        <section class="modal-card">
          <button
            class="modal-close"
            type="button"
            aria-label="Tutup"
            @click="closePanel"
          >
            ×
          </button>

          <div class="modal-symbol" aria-hidden="true">
            ♠
          </div>

          <p class="modal-eyebrow">Solo Offline</p>
          <h2>Lawan Pemain Bot</h2>

          <p class="modal-description">
            Pilih tingkat kesulitan untuk sesi latihan.
          </p>

          <div class="difficulty-list">
            <button
              class="difficulty-button"
              :class="{ active: botDifficulty === 'easy' }"
              type="button"
              @click="botDifficulty = 'easy'"
            >
              <strong>Easy</strong>
              <small>Bot bermain santai</small>
            </button>

            <button
              class="difficulty-button"
              :class="{ active: botDifficulty === 'normal' }"
              type="button"
              @click="botDifficulty = 'normal'"
            >
              <strong>Normal</strong>
              <small>Permainan seimbang</small>
            </button>

            <button
              class="difficulty-button"
              :class="{ active: botDifficulty === 'hard' }"
              type="button"
              @click="botDifficulty = 'hard'"
            >
              <strong>Hard</strong>
              <small>Bot tidak kenal ampun</small>
            </button>
          </div>

          <button
            class="primary-button"
            type="button"
            @click="startSolo"
          >
            Mulai Permainan
          </button>
        </section>
      </div>
    </Transition>

    <Transition name="toast">
      <div
        v-if="notification"
        class="notification"
        role="status"
      >
        <span aria-hidden="true">♠</span>
        {{ notification }}
      </div>
    </Transition>
  </main>
</template>

<style scoped>
.game-shell {
  --background: #07110f;
  --border: rgba(255, 255, 255, 0.1);
  --text: #f8f3e7;
  --muted: #9eafa8;
  --gold: #f5b942;
  --gold-light: #ffd879;
  --green: #3ddc97;
  --red: #ff646f;

  position: relative;
  display: grid;
  min-height: 100vh;
  padding: 28px 20px;
  overflow: hidden;
  color: var(--text);
  place-items: center;
  background:
    radial-gradient(circle at top, #153b30 0%, transparent 38%),
    linear-gradient(145deg, #06110e 0%, #081612 50%, #040a08 100%);
}

.noise-layer {
  position: absolute;
  inset: 0;
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

.settings-dim {
  position: fixed;
  z-index: 2;
  inset: 0;
  pointer-events: none;
  background: rgba(0, 7, 5, 0.46);
  animation: dim-in 450ms ease both;
}

.flip-scene {
  position: relative;
  z-index: 3;
  width: min(100%, 520px);
  min-height: 660px;
  perspective: 1800px;
}

.flip-card {
  position: relative;
  width: 100%;
  min-height: 660px;
  transform-style: preserve-3d;
  transition: transform 720ms cubic-bezier(0.2, 0.78, 0.22, 1);
}

.flip-card.is-flipped {
  transform: rotateY(180deg);
}

.flip-face {
  position: absolute;
  inset: 0;
  min-height: 660px;
  overflow: hidden;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flip-face--back {
  transform: rotateY(180deg);
}

.main-menu,
.settings-card {
  border: 1px solid var(--border);
  border-radius: 30px;
  box-shadow:
    0 35px 90px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.main-menu {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 38px;
  background: linear-gradient(
    145deg,
    rgba(24, 52, 43, 0.96),
    rgba(7, 20, 16, 0.97)
  );
}

.main-menu::before,
.settings-card::before {
  position: absolute;
  inset: 10px;
  pointer-events: none;
  content: '';
  border: 1px solid rgba(245, 185, 66, 0.13);
  border-radius: 22px;
}

.brand-header {
  position: relative;
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
  border: 1px solid rgba(245, 185, 66, 0.3);
  border-radius: 999px;
  background: rgba(245, 185, 66, 0.08);
}

.brand-badge span:nth-child(2),
.brand-badge span:nth-child(3) {
  color: var(--red);
}

.eyebrow,
.modal-eyebrow,
.settings-eyebrow {
  margin: 0 0 8px;
  color: var(--gold);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.24em;
}

h1 {
  margin: 0;
  font-size: clamp(42px, 8vw, 66px);
  font-weight: 950;
  line-height: 0.95;
  letter-spacing: -0.065em;
  text-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
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
  background: rgba(255, 255, 255, 0.025);
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
  border-color: rgba(245, 185, 66, 0.6);
  background: rgba(245, 185, 66, 0.08);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.22);
  transform: translateY(-2px);
}

.menu-footer {
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

/* Settings card */

.settings-card {
  display: flex;
  align-items: center;
  padding: 38px;
  background:
    radial-gradient(
      circle at center,
      rgba(31, 80, 63, 0.3),
      transparent 55%
    ),
    linear-gradient(145deg, #173a30, #071c16);
}

.card-pattern {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.12;
  background-image:
    radial-gradient(
      circle at 20px 20px,
      rgba(245, 185, 66, 0.65) 2px,
      transparent 2.5px
    ),
    radial-gradient(
      circle at 60px 60px,
      rgba(255, 255, 255, 0.4) 2px,
      transparent 2.5px
    );
  background-size: 80px 80px;
}

.corner-suit {
  position: absolute;
  z-index: 1;
  color: rgba(245, 185, 66, 0.14);
  font-size: 115px;
  line-height: 1;
  pointer-events: none;
}

.corner-suit--top {
  top: 40px;
  left: 32px;
  transform: rotate(-12deg);
}

.corner-suit--bottom {
  right: 34px;
  bottom: 32px;
  color: rgba(255, 100, 111, 0.1);
  transform: rotate(14deg);
}

.settings-content {
  position: relative;
  z-index: 2;
  width: 100%;
}

.settings-header {
  margin-bottom: 28px;
}

.settings-emblem {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  margin-bottom: 20px;
  color: var(--gold);
  font-size: 19px;
  border: 1px solid rgba(245, 185, 66, 0.35);
  border-radius: 17px;
  background: rgba(245, 185, 66, 0.09);
}

.settings-emblem span:last-child {
  color: var(--red);
}

.settings-header h2 {
  margin: 0;
  font-size: 34px;
}

.settings-description {
  margin: 9px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.settings-close {
  position: absolute;
  z-index: 5;
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
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  place-items: center;
  background: rgba(255, 255, 255, 0.06);
  transition:
    color 180ms ease,
    background 180ms ease,
    transform 180ms ease;
}

.settings-close:hover {
  color: var(--gold);
  background: rgba(245, 185, 66, 0.1);
  transform: rotate(90deg);
}

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
  background: rgba(255, 255, 255, 0.035);
  transition:
    border-color 180ms ease,
    background 180ms ease;
}

.setting-row:hover {
  border-color: rgba(245, 185, 66, 0.35);
  background: rgba(245, 185, 66, 0.055);
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
  font-size: 11px;
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
  transition: background 180ms ease;
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
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.22);
  transition: transform 180ms ease;
}

.toggle-input:checked + .toggle-switch {
  background: var(--green);
}

.toggle-input:checked + .toggle-switch::after {
  transform: translateX(21px);
}

.save-settings-button {
  width: 100%;
  min-height: 56px;
  padding: 14px 18px;
  margin-top: 17px;
  color: #172018;
  font: inherit;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  border: 0;
  border-radius: 15px;
  background: linear-gradient(
    135deg,
    var(--gold-light),
    var(--gold)
  );
  box-shadow: 0 14px 30px rgba(245, 185, 66, 0.18);
  transition:
    filter 180ms ease,
    transform 180ms ease,
    box-shadow 180ms ease;
}

.save-settings-button:hover {
  filter: brightness(1.06);
  box-shadow: 0 16px 34px rgba(245, 185, 66, 0.25);
  transform: translateY(-2px);
}

.settings-hint {
  margin: 18px 0 0;
  color: rgba(158, 175, 168, 0.7);
  font-size: 10px;
  text-align: center;
}

/* Decorative cards */

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
  border: 5px solid rgba(255, 255, 255, 0.42);
  border-radius: 17px;
  background: #f7f0df;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
  opacity: 0.16;
  user-select: none;
  transition: opacity 350ms ease;
}

.settings-active .floating-card {
  opacity: 0.07;
}

.floating-card--left {
  top: 12%;
  left: 7%;
  transform: rotate(-19deg);
  animation: card-float-left 6s ease-in-out infinite;
}

.floating-card--right {
  right: 7%;
  bottom: 10%;
  transform: rotate(17deg);
  animation: card-float-right 7s ease-in-out infinite;
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

/* Modal online dan solo */

.modal-backdrop {
  position: fixed;
  z-index: 10;
  display: grid;
  inset: 0;
  padding: 20px;
  place-items: center;
  background: rgba(2, 8, 6, 0.78);
  backdrop-filter: blur(10px);
}

.modal-card {
  position: relative;
  width: min(100%, 430px);
  padding: 32px;
  border: 1px solid var(--border);
  border-radius: 26px;
  background: linear-gradient(
    145deg,
    rgba(29, 58, 49, 0.99),
    rgba(8, 23, 18, 0.99)
  );
  box-shadow: 0 35px 90px rgba(0, 0, 0, 0.65);
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 16px;
  display: grid;
  width: 36px;
  height: 36px;
  padding: 0;
  color: var(--muted);
  font-size: 25px;
  cursor: pointer;
  border: 0;
  border-radius: 50%;
  place-items: center;
  background: rgba(255, 255, 255, 0.06);
}

.modal-close:hover {
  color: var(--text);
  background: rgba(255, 255, 255, 0.12);
}

.modal-symbol {
  display: grid;
  width: 58px;
  height: 58px;
  margin-bottom: 18px;
  color: var(--gold);
  font-size: 27px;
  border: 1px solid rgba(245, 185, 66, 0.26);
  border-radius: 18px;
  place-items: center;
  background: rgba(245, 185, 66, 0.09);
}

.modal-card h2 {
  margin: 0;
  font-size: 29px;
}

.modal-description {
  margin: 9px 0 25px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.55;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.room-input {
  width: 100%;
  padding: 16px;
  color: var(--text);
  font: inherit;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.15em;
  border: 1px solid var(--border);
  border-radius: 14px;
  outline: none;
  background: rgba(0, 0, 0, 0.2);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.room-input:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 4px rgba(245, 185, 66, 0.1);
}

.primary-button,
.secondary-button {
  width: 100%;
  padding: 15px 18px;
  margin-top: 14px;
  font: inherit;
  font-weight: 850;
  cursor: pointer;
  border-radius: 14px;
}

.primary-button {
  color: #182015;
  border: 0;
  background: linear-gradient(
    135deg,
    var(--gold-light),
    var(--gold)
  );
  box-shadow: 0 12px 28px rgba(245, 185, 66, 0.18);
}

.primary-button:hover:not(:disabled) {
  filter: brightness(1.07);
  transform: translateY(-1px);
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.secondary-button {
  color: var(--text);
  border: 1px solid var(--border);
  background: transparent;
}

.secondary-button:hover {
  background: rgba(255, 255, 255, 0.06);
}

.difficulty-list {
  display: grid;
  gap: 10px;
}

.difficulty-button {
  display: grid;
  gap: 4px;
  padding: 14px 16px;
  color: var(--text);
  text-align: left;
  cursor: pointer;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  transition:
    border-color 180ms ease,
    background 180ms ease;
}

.difficulty-button strong {
  font-size: 14px;
}

.difficulty-button small {
  color: var(--muted);
  font-size: 11px;
}

.difficulty-button.active {
  border-color: var(--gold);
  background: rgba(245, 185, 66, 0.1);
}

/* Toast */

.notification {
  position: fixed;
  z-index: 20;
  bottom: 28px;
  left: 50%;
  display: flex;
  gap: 10px;
  align-items: center;
  max-width: calc(100% - 30px);
  padding: 13px 18px;
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
  border: 1px solid rgba(245, 185, 66, 0.3);
  border-radius: 999px;
  background: rgba(18, 38, 32, 0.96);
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.4);
  transform: translateX(-50%);
}

/* Transitions */

.modal-enter-active,
.modal-leave-active,
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-card,
.modal-leave-to .modal-card {
  transform: translateY(15px) scale(0.97);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 15px);
}

.reduced-motion *,
.reduced-motion *::before,
.reduced-motion *::after {
  scroll-behavior: auto !important;
  animation-duration: 0.001ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.001ms !important;
}

@keyframes card-float-left {
  0%,
  100% {
    transform: translateY(0) rotate(-19deg);
  }

  50% {
    transform: translateY(-16px) rotate(-15deg);
  }
}

@keyframes card-float-right {
  0%,
  100% {
    transform: translateY(0) rotate(17deg);
  }

  50% {
    transform: translateY(14px) rotate(13deg);
  }
}

@keyframes dim-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@media (max-width: 760px) {
  .game-shell {
    padding: 18px 14px;
  }

  .flip-scene,
  .flip-card,
  .flip-face {
    min-height: 630px;
  }

  .main-menu,
  .settings-card {
    padding: 29px 20px;
    border-radius: 24px;
  }

  .floating-card {
    display: none;
  }

  .modal-card {
    padding: 27px 20px;
  }

  .settings-header h2 {
    font-size: 30px;
  }
}

@media (max-width: 400px) {
  .flip-scene,
  .flip-card,
  .flip-face {
    min-height: 610px;
  }

  .brand-header {
    margin-bottom: 28px;
  }

  .menu-option {
    min-height: 52px;
    padding: 10px 14px;
    font-size: 14px;
  }

  .settings-card {
    padding: 26px 18px;
  }

  .setting-row {
    min-height: 74px;
    padding: 14px;
  }

  .settings-hint {
    font-size: 9px;
  }
}
</style>
