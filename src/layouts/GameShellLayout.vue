<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HomeView from '@/views/home/HomeView.vue'
import { panelComponents, type PanelName } from '@/router/panels'
import { useSettingsStore } from '@/stores/settings'
import { useNotification } from '@/composables/useNotification'
import { PANEL_FLIP_DURATION_MS } from '@/constants/panel'

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()
const { notification } = useNotification()

const isFlipped = ref(false)
const activePanelName = ref<PanelName | null>(null)

let closePanelTimer: number | undefined

function isPanelName(name: unknown): name is PanelName {
  return (
    name === 'settings' || name === 'solo-player' || name === 'multiplayer'
  )
}

watch(
  () => route.name,
  (name) => {
    if (closePanelTimer) {
      window.clearTimeout(closePanelTimer)
      closePanelTimer = undefined
    }

    if (isPanelName(name)) {
      activePanelName.value = name
      isFlipped.value = true
      return
    }

    isFlipped.value = false

    closePanelTimer = window.setTimeout(
      () => {
        activePanelName.value = null
      },
      settingsStore.animationsEnabled ? PANEL_FLIP_DURATION_MS : 0,
    )
  },
  { immediate: true },
)

const activePanelComponent = computed(() =>
  activePanelName.value ? panelComponents[activePanelName.value] : null,
)

const panelTitle = computed(() => {
  switch (activePanelName.value) {
    case 'multiplayer':
      return 'Online Room'
    case 'solo-player':
      return 'Solo Player'
    case 'settings':
      return 'Settings'
    default:
      return ''
  }
})

const panelSuit = computed(() => {
  switch (activePanelName.value) {
    case 'multiplayer':
      return '♣'
    case 'settings':
      return '♦'
    default:
      return '♠'
  }
})

function closePanel() {
  if (isFlipped.value) {
    router.push({ name: 'home' })
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closePanel()
  }
}

onMounted(() => {
  settingsStore.load()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)

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
      'reduced-motion': !settingsStore.animationsEnabled,
    }"
    @click="closePanel"
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
      <span class="card-suit red-suit">♥</span>
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
        :class="{ 'is-flipped': isFlipped }"
      >
        <!-- MAIN MENU -->
        <section
          class="game-card game-card--front flip-face"
          :class="{ 'face-active': !isFlipped }"
          :aria-hidden="isFlipped"
        >
          <div
            class="inner-card-border"
            aria-hidden="true"
          ></div>

          <HomeView />
        </section>

        <!-- BACK CARD -->
        <section
          class="game-card game-card--back flip-face"
          :class="{ 'face-active': isFlipped }"
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
            <component
              :is="activePanelComponent"
              v-if="activePanelComponent"
            />
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
        <span aria-hidden="true">♠</span>
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
  height: min(660px, calc(100dvh - 40px));
  min-height: 580px;
  perspective: 1800px;
}

.flip-card {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 720ms
    cubic-bezier(0.2, 0.78, 0.22, 1);
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
    0 35px 90px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.game-card--front {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 38px;
  transform: rotateY(0deg) translateZ(1px);
  background: linear-gradient(
    145deg,
    rgba(24, 52, 43, 0.97),
    rgba(7, 20, 16, 0.98)
  );
}

.game-card--back {
  padding: 38px;
  transform: rotateY(180deg) translateZ(1px);
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
  border: 1px solid rgba(245, 185, 66, 0.13);
  border-radius: 22px;
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
      rgba(245, 185, 66, 0.35) 47%,
      rgba(245, 185, 66, 0.35) 49%,
      transparent 50%
    ),
    linear-gradient(
      -45deg,
      transparent 46%,
      rgba(255, 255, 255, 0.2) 47%,
      rgba(255, 255, 255, 0.2) 49%,
      transparent 50%
    );
  background-size: 54px 54px;
}

.corner-mark {
  position: absolute;
  z-index: 1;
  color: rgba(245, 185, 66, 0.11);
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
  color: rgba(255, 100, 111, 0.08);
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
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  place-items: center;
  background: rgba(255, 255, 255, 0.06);
  transition:
    color 180ms ease,
    background 180ms ease,
    transform 180ms ease;
}

.panel-close:hover,
.panel-close:focus-visible {
  color: var(--gold);
  outline: none;
  background: rgba(245, 185, 66, 0.11);
  transform: rotate(90deg);
}

.back-content {
  position: relative;
  z-index: 3;
  display: flex;
  height: 100%;
  align-items: center;
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
  border: 5px solid rgba(255, 255, 255, 0.42);
  border-radius: 17px;
  background: #f7f0df;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
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

/* TOAST */

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
  white-space: nowrap;
  border: 1px solid rgba(245, 185, 66, 0.3);
  border-radius: 999px;
  background: rgba(18, 38, 32, 0.97);
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.4);
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
  transform: translate(-50%, 15px);
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

@media (max-width: 760px) {
  .game-shell {
    padding: 14px;
  }

  .flip-scene {
    height: min(630px, calc(100dvh - 28px));
  }

  .game-card--front,
  .game-card--back {
    padding: 27px 20px;
    border-radius: 24px;
  }

  .floating-card {
    display: none;
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
    height: calc(100dvh - 16px);
    min-height: 550px;
  }

  .game-card--back {
    padding: 22px 17px;
  }

  .notification {
    width: max-content;
    max-width: calc(100% - 24px);
    font-size: 11px;
    white-space: normal;
  }
}
</style>
