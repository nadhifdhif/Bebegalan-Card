<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
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
      @click.stop="router.push({ name: 'multiplayer' })"
    >
      Online Room
    </button>

    <button
      class="menu-option"
      type="button"
      @click.stop="router.push({ name: 'solo-player' })"
    >
      Solo Player
    </button>

    <button
      class="menu-option"
      type="button"
      @click.stop="router.push({ name: 'settings' })"
    >
      Settings
    </button>
  </div>

  <footer class="menu-footer">
    <span>v0.1.0</span>
    <span class="footer-dot"></span>
    <span>Made for tongkrongan</span>
  </footer>
</template>

<style scoped>
.eyebrow {
  margin: 0 0 8px;
  color: var(--gold);
  font-size: 11px;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.24em;
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
  border: 1px solid rgba(245, 185, 66, 0.3);
  border-radius: 999px;
  background: rgba(245, 185, 66, 0.08);
}

.brand-badge span:nth-child(2),
.brand-badge span:nth-child(3) {
  color: var(--red);
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

@media (max-width: 440px) {
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
}
</style>
