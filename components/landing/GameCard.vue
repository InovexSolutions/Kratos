<template>
  <NuxtLink
    :to="!game.soldOut ? `/games/${game.slug}` : undefined"
    class="game-card relative overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-900 transform transition-all duration-300 group"
    :class="{
      'hover:-translate-y-2': !game.soldOut,
      'cursor-not-allowed opacity-80': game.soldOut
    }"
    :style="{ '--delay': index * 100 + 'ms' }"
  >
    <!-- Sold Out Overlay -->
    <div 
      v-if="game.soldOut"
      class="absolute inset-0 z-20 bg-gray-900/80 flex items-center justify-center"
    >
      <span class="text-2xl font-bold text-white tracking-wider">SOLD OUT</span>
    </div>

    <div class="relative overflow-hidden h-64">
      <NuxtImg 
        :src="game.image"
        :alt="game.name"
        provider="ipx"
        class="w-full h-full object-cover transform transition-all duration-500"
        :class="{ 'group-hover:scale-105': !game.soldOut }"
        loading="lazy"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
    </div>

    <div class="p-6">
      <h3 class="text-2xl font-bold mb-2 text-white">{{ game.name }}</h3>
      <p class="text-gray-400 mb-4">{{ game.description }}</p>
      
      <div class="flex items-center justify-between mb-4">
        <div class="text-blue-400 text-lg font-semibold">
          From ${{ game.minPrice }}/mo
        </div>
        <div
            class="flex items-center text-white transition-colors"
            :class="{ 'hover:text-blue-400': !game.soldOut }">
          Get Started
          <Icon name="heroicons:arrow-right-20-solid" class="ml-2 w-4 h-4" />
        </div>
      </div>

      <div class="border-t border-gray-800 pt-4">
        <div class="flex flex-wrap gap-2">
          <div 
            v-for="(feature, i) in game.features"
            :key="i"
            class="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300"
          >
            {{ feature }}
          </div>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup>
defineProps({
  game: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    default: 0
  }
});
</script>

<style scoped>
.game-card {
  opacity: 0;
  animation: fade-in-up 0.6s ease-out forwards;
  animation-delay: var(--delay);
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
