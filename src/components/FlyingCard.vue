<script setup lang="ts">
import { nextTick, ref } from 'vue'
import PlayingCard from './PlayingCard.vue'
import type { Card } from '@/game/types'

const props = defineProps<{
  card: Card
  faceUp: boolean
  from: DOMRect
  to: DOMRect
}>()

function centerTransform(rect: DOMRect) {
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  return `translate(${x}px, ${y}px) translate(-50%, -50%)`
}

const transform = ref(centerTransform(props.from))
const transitioning = ref(false)

async function playFlight() {
  transform.value = centerTransform(props.from)
  transitioning.value = false

  await nextTick()

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      transitioning.value = true
      transform.value = centerTransform(props.to)
    })
  })
}

void playFlight()
</script>

<template>
  <div
    class="flying-card"
    :class="{ 'is-transitioning': transitioning }"
    :style="{ transform }"
  >
    <PlayingCard
      :card="card"
      :face-up="faceUp"
      size="md"
    />
  </div>
</template>

<style scoped>
.flying-card {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
  pointer-events: none;
  will-change: transform;
}

.flying-card.is-transitioning {
  transition: transform 650ms cubic-bezier(0.3, 0.74, 0.18, 1);
}
</style>
