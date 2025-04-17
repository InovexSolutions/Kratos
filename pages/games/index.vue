<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
    <NavBar class="sticky top-0 z-50" />

    <!-- Hero Section -->
    <section class="relative py-24 overflow-hidden">
      <div class="container mx-auto px-4 text-center">
        <div class="max-w-4xl mx-auto">
          <h1 class="text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 animate-fade-in-up">
            Game Servers
          </h1>
          <p class="text-xl text-gray-300 mb-8 animate-fade-in-up delay-100">
            Deploy your game server in seconds with zero technical knowledge
          </p>
        </div>
      </div>
    </section>

    <!-- Game Server Grid -->
    <section class="py-12 bg-gray-800/50">
      <div class="container mx-auto px-4">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-20">
          <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"/>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-20">
          <div class="text-red-400 text-2xl mb-4">Something went wrong</div>
          <p class="text-gray-400 mb-6">{{ error }}</p>
          <button class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg" @click="fetchGames">
            Try Again
          </button>
        </div>

        <!-- No Games State -->
        <div v-else-if="games.length === 0" class="text-center py-20">
          <div class="text-2xl text-gray-400 mb-4">No games available at this time</div>
          <p class="text-gray-500">Please check back later for new offerings</p>
        </div>

        <!-- Games Grid -->
        <div v-else>
          <!-- Filter/Category Toggles (Optional) -->
          <div v-if="categories.length > 1" class="flex flex-wrap justify-center gap-4 mb-12">
            <button 
              v-for="category in categories" 
              :key="category"
              :class="[
                'px-4 py-2 rounded-full transition-colors',
                currentCategory === category 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              ]"
              @click="currentCategory = category"
            >
              {{ category === 'all' ? 'All Games' : category }}
            </button>
          </div>
          
          <!-- Game Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div 
              v-for="game in filteredGames" 
              :key="game.id"
              class="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden hover:border-purple-500/30 transition-all duration-300 group animate-fade-in-up"
            >
              <div class="relative">
                <!-- Game Image -->
                <NuxtImg 
                  :src="game.image || '/images/games/default.jpg'" 
                  class="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  width="400"
                  height="192"
                  :alt="game.name"
                />
                
                <!-- Price Badge -->
                <div class="absolute top-4 right-4 bg-blue-600/90 text-white px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
                  From ${{ game.minPrice || '2.99' }}/mo
                </div>

                <!-- Sold Out Overlay -->
                <div v-if="game.soldOut" class="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div class="bg-red-500/90 text-white px-6 py-3 rounded-lg text-lg font-bold transform -rotate-12 backdrop-blur-sm">
                    Coming Soon
                  </div>
                </div>
              </div>

              <div class="p-6">
                <h3 class="text-xl font-bold mb-2 text-white">{{ game.name }}</h3>
                <p class="text-gray-300 mb-4 h-12 line-clamp-2">{{ game.description }}</p>
                
                <!-- Features List -->
                <div class="mb-6 min-h-[80px]">
                  <ul class="space-y-2">
                    <li v-for="(feature, idx) in game.features.slice(0, 3)" :key="idx" class="flex items-center text-sm text-gray-400">
                      <Icon name="heroicons:check-circle" class="text-green-400 mr-2" />
                      {{ feature }}
                    </li>
                  </ul>
                </div>
                
                <!-- Action Button -->
                <NuxtLink 
                  :to="`/games/${game.slug}`" 
                  :class="[
                    'w-full block text-center py-3 px-4 rounded-lg font-semibold transition-all duration-300',
                    game.soldOut 
                      ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transform hover:scale-[1.02] shadow-lg shadow-blue-500/20'
                  ]"
                  :disabled="game.soldOut"
                  :tabindex="game.soldOut ? -1 : 0"
                >
                  {{ game.soldOut ? 'Coming Soon' : 'Configure Server' }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
definePageMeta({
  auth: false
});

const games = ref([]);
const loading = ref(true);
const error = ref(null);
const categories = ref(['all']);
const currentCategory = ref('all');

// Filter games by category
const filteredGames = computed(() => {
  if (currentCategory.value === 'all') {
    return games.value;
  }
  return games.value.filter(game => 
    game.category === currentCategory.value || 
    game.tags?.includes(currentCategory.value)
  );
});

// Fetch games from API
const fetchGames = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    // Fetch games from API
    const response = await $fetch('/api/games');
    games.value = response;
    
    // Extract unique categories
    const allCategories = new Set(['all']);
    for (const game of games.value) {
      if (game.category) {
        allCategories.add(game.category);
      }
      if (game.tags && Array.isArray(game.tags)) {
        game.tags.forEach(tag => allCategories.add(tag));
      }
    }
    
    categories.value = Array.from(allCategories);
  } catch (err) {
    console.error('Error fetching games:', err);
    error.value = 'Failed to load games. Please try again later.';
  } finally {
    loading.value = false;
  }
};

// Initialize data
onMounted(fetchGames);
</script>

<style>
/* Animation classes */
.animate-fade-in-up {
  animation: fade-in-up 0.8s ease-out forwards;
}

.delay-100 {
  animation-delay: 100ms;
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

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>