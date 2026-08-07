<script setup lang="ts">
import { computed } from 'vue'
import type { Card } from '@/game/types'
import { cardImageUrl, cardLabel, suitGlyph } from '@/game/deck'

const props = withDefaults(
  defineProps<{
    card?: Card
    faceUp?: boolean
    size?: 'xs' | 'sm' | 'md' | 'lg'
    selected?: boolean
    disabled?: boolean
  }>(),
  {
    card: undefined,
    faceUp: false,
    size: 'md',
    selected: false,
    disabled: false,
  },
)

const imageUrl = computed(() => (props.card ? cardImageUrl(props.card) : ''))
const label = computed(() => (props.card ? cardLabel(props.card) : 'Kartu tertutup'))
const glyph = computed(() => (props.card ? suitGlyph(props.card.suit) : '♠'))
</script>

<template>
  <div
    class="playing-card"
    :class="[
      `playing-card--${size}`,
      { 'is-selected': selected, 'is-disabled': disabled },
    ]"
    :aria-label="faceUp ? label : 'Kartu tertutup'"
  >
    <div
      class="card-flip"
      :class="{ 'is-revealed': faceUp }"
    >
      <div class="card-face card-face--down">
        <div
          class="card-face-pattern"
          aria-hidden="true"
        ></div>
        <span
          class="card-face-emblem"
          aria-hidden="true"
        >
          ♠
        </span>
      </div>

      <div class="card-face card-face--up">
        <img
          v-if="card"
          :src="imageUrl"
          :alt="label"
          draggable="false"
        />
        <span
          v-else
          class="card-face-emblem"
          aria-hidden="true"
        >
          {{ glyph }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playing-card {
  --card-w: clamp(46px, 9vh, 68px);

  position: relative;
  width: var(--card-w);
  aspect-ratio: 222 / 323;
  perspective: 900px;
  transition:
    transform 160ms ease,
    filter 160ms ease;
}

.playing-card--xs {
  --card-w: clamp(13px, 2.6vh, 20px);
}

.playing-card--sm {
  --card-w: clamp(26px, 5.5vh, 40px);
}

.playing-card--md {
  --card-w: clamp(46px, 9vh, 68px);
}

.playing-card--lg {
  --card-w: clamp(58px, 12vh, 88px);
}

.playing-card.is-selected {
  transform: translateY(-14px);
}

.playing-card.is-disabled {
  filter: grayscale(0.5) brightness(0.7);
  opacity: 0.6;
}

.card-flip {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 500ms cubic-bezier(0.2, 0.78, 0.22, 1);
}

.card-flip.is-revealed {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  inset: 0;
  display: grid;
  overflow: hidden;
  border: max(1px, calc(var(--card-w) * 0.045)) solid var(--gold);
  border-radius: calc(var(--card-w) * 0.12);
  place-items: center;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.card-face--down {
  background:
    radial-gradient(
      circle at center,
      rgba(39, 98, 77, 0.24),
      transparent 58%
    ),
    linear-gradient(145deg, var(--card-light), var(--card-dark));
}

.card-face--up {
  background: #fdfaf2;
  transform: rotateY(180deg);
}

.card-face--up img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 6%;
}

.card-face-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.5;
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
  background-size: 12px 12px;
}

.card-face-emblem {
  position: relative;
  z-index: 1;
  color: var(--gold);
  font-size: calc(var(--card-w) * 0.32);
}
</style>
