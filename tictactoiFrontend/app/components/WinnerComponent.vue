<script setup>
import { onMounted, ref } from 'vue'
import lottie from 'lottie-web'
import winnner from '@/assets/animations/Win-Result-1.json'

const winnerContainer = ref(null)

onMounted(() => {
  lottie.loadAnimation({
    container: winnerContainer.value,
    renderer: 'svg',
    autoplay: true,
    loop: false,
    animationData: winnner,
  })
})
</script>

<template>
  <div ref="winnerContainer" class="w-100 h-100" />
</template>
