<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useNotification } from '@/composables/useNotification'

const router = useRouter()
const settingsStore = useSettingsStore()
const { showNotification } = useNotification()

function saveSettings() {
  settingsStore.save()

  router.push({ name: 'home' })
  showNotification('Pengaturan berhasil disimpan.')
}
</script>

<template>
  <div class="panel-content">
    <header class="panel-header">
      <div
        class="panel-emblem panel-emblem--settings"
        aria-hidden="true"
      >
        ♦
      </div>

      <p class="panel-eyebrow">Preferences</p>

      <h2>Settings</h2>

      <p class="panel-description">
        Atur pengalaman bermain sesuai keinginanmu.
      </p>
    </header>

    <div class="settings-list">
      <label
        class="setting-row"
        @click.stop
      >
        <span class="setting-copy">
          <strong>Sound Effects</strong>

          <small>Suara kartu dan tombol permainan</small>
        </span>

        <input
          v-model="settingsStore.soundEnabled"
          class="toggle-input"
          type="checkbox"
        />

        <span class="toggle-switch"></span>
      </label>

      <label
        class="setting-row"
        @click.stop
      >
        <span class="setting-copy">
          <strong>Animations</strong>

          <small>Animasi kartu dan perpindahan menu</small>
        </span>

        <input
          v-model="settingsStore.animationsEnabled"
          class="toggle-input"
          type="checkbox"
        />

        <span class="toggle-switch"></span>
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
      Klik area di luar kartu atau tombol × untuk kembali.
    </p>
  </div>
</template>

<style scoped>
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
    background 180ms ease,
    transform 180ms ease;
}

.setting-row:hover {
  border-color: rgba(245, 185, 66, 0.35);
  background: rgba(245, 185, 66, 0.055);
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

.settings-save-button {
  margin-top: 17px;
}

@media (max-width: 440px) {
  .setting-row {
    min-height: 72px;
    padding: 13px;
  }
}
</style>
