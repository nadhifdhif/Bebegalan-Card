<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useNotification } from '@/composables/useNotification'
import { PANEL_FLIP_DURATION_MS } from '@/constants/panel'

const router = useRouter()
const settingsStore = useSettingsStore()
const { showNotification } = useNotification()

const roomCode = ref('')
const roomCodeInput = ref<HTMLInputElement | null>(null)

const normalizedRoomCode = computed(() => roomCode.value.trim().toUpperCase())

function formatRoomCode(event: Event) {
  const input = event.target as HTMLInputElement

  roomCode.value = input.value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8)
}

function joinRoom() {
  if (!normalizedRoomCode.value) {
    showNotification('Masukkan kode room terlebih dahulu.')
    roomCodeInput.value?.focus()
    return
  }

  const code = normalizedRoomCode.value

  router.push({ name: 'home' })
  showNotification(`Room ${code} siap dihubungkan nanti.`)
}

function createRoom() {
  router.push({ name: 'home' })
  showNotification('Fitur membuat room akan ditambahkan berikutnya.')
}

onMounted(() => {
  window.setTimeout(
    () => {
      roomCodeInput.value?.focus()
    },
    settingsStore.animationsEnabled ? PANEL_FLIP_DURATION_MS : 0,
  )
})
</script>

<template>
  <div class="panel-content">
    <header class="panel-header">

      <p class="panel-eyebrow">Online Multiplayer</p>

      <h2>Online Room</h2>

      <p class="panel-description">
        Masukkan kode room dari temanmu atau buat room permainan baru.
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
        :disabled="!normalizedRoomCode"
        @click.stop="joinRoom"
      >
        Gabung Room
      </button>

      <div class="button-divider">
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
      Klik area di luar kartu atau tombol × untuk kembali.
    </p>
  </div>
</template>

<style scoped>
.room-input {
  width: 100%;
  min-height: 50px;
  padding: 11px 15px;
  color: var(--text);
  font: inherit;
  font-size: 16px;
  font-weight: 850;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  border: 1px solid var(--border);
  border-radius: 13px;
  outline: none;
  background: rgba(0, 0, 0, 0.2);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
}

.room-input::placeholder {
  color: rgba(158, 175, 168, 0.43);
}

.room-input:focus {
  border-color: var(--gold);
  background: rgba(0, 0, 0, 0.28);
  box-shadow: 0 0 0 4px rgba(245, 185, 66, 0.1);
}

@media (max-width: 440px) {
  .room-input {
    min-height: 46px;
    font-size: 15px;
  }
}
</style>
