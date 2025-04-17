<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="$emit('close')"/>

    <!-- Modal -->
    <div class="flex items-center justify-center min-h-screen p-4">
      <div
        class="relative bg-gray-800 rounded-xl border border-gray-700/50 shadow-xl max-w-4xl w-full mx-auto animate-fade-in-up overflow-hidden"
      >
        <!-- Header -->
        <div class="p-6 border-b border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Create New Server
            </h2>
            <button class="text-gray-400 hover:text-white" @click="$emit('close')">
              <Icon name="heroicons:x-mark" class="w-6 h-6" />
            </button>
          </div>
        </div>

        <!-- Form Content -->
        <div class="p-6 max-h-[70vh] overflow-y-auto">
          <!-- Loading State -->
          <div v-if="loading" class="flex flex-col items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"/>
            <p class="text-gray-400">Loading available games and locations...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="text-center py-12">
            <div class="text-red-400 text-xl mb-3">Failed to load server options</div>
            <p class="text-gray-400 mb-6">{{ error }}</p>
            <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg" @click="fetchOptions">
              Try Again
            </button>
          </div>

          <!-- Form -->
          <form v-else class="space-y-6" @submit.prevent="createServer">
            <!-- Game Selection -->
            <div>
              <label class="block text-gray-300 mb-2 font-medium">Select Game</label>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  v-for="game in games"
                  :key="game.id"
                  :class="[
                    'border rounded-lg p-4 cursor-pointer transition-all duration-200',
                    selectedGame?.id === game.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  ]"
                  @click="selectGame(game)"
                >
                  <div class="flex items-center">
                    <NuxtImg
                      :src="game.image || '/images/games/default.jpg'"
                      class="w-12 h-12 object-cover rounded-md mr-3"
                      width="48"
                      height="48"
                    />
                    <div>
                      <div class="font-medium">{{ game.name }}</div>
                      <div class="text-xs text-gray-400">{{ game.soldOut ? 'Coming Soon' : 'Available' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Server Details -->
            <div v-if="selectedGame && !selectedGame.soldOut" class="space-y-6 animate-fade-in">
              <!-- Server Name -->
              <div>
                <label for="server-name" class="block text-gray-300 mb-2 font-medium">Server Name</label>
                <input
                  id="server-name"
                  v-model="serverConfig.name"
                  type="text"
                  class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="My Awesome Server"
                  required
                >
              </div>

              <!-- Location Selection -->
              <div>
                <label class="block text-gray-300 mb-2 font-medium">Location</label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    v-for="location in locations"
                    :key="location.id"
                    :class="[
                      'border rounded-lg p-4 cursor-pointer transition-all flex items-center justify-between',
                      serverConfig.locationId === location.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    ]"
                    @click="serverConfig.locationId = location.id"
                  >
                    <div>
                      <div class="font-medium">{{ location.short_name }}</div>
                      <div class="text-xs text-gray-400">{{ location.long_name }}</div>
                    </div>
                    <PingTester v-if="serverConfig.locationId === location.id" :host="location.host" />
                  </div>
                </div>
              </div>

              <!-- Resource Configuration -->
              <div v-for="field in serverConfigFields" :key="field.key" class="space-y-2">
                <label class="block text-gray-300 mb-2 font-medium">{{ field.label }}</label>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <button
                    v-for="option in field.options"
                    :key="option.value"
                    type="button"
                    :class="[
                      'border rounded-lg p-4 cursor-pointer transition-all text-center',
                      serverConfig[field.key] === option.value
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    ]"
                    @click="serverConfig[field.key] = option.value"
                  >
                    <div class="font-medium">{{ option.label }}</div>
                    <div class="text-xs text-gray-400">
                      {{ isIncludedResource(field.key, option.value) ? 'Included' : getOptionPrice(field.key, option.value) }}
                    </div>
                  </button>
                </div>
              </div>

              <!-- Price Summary -->
              <div class="bg-gray-700/30 rounded-lg p-4">
                <div class="flex justify-between mb-2">
                  <span class="text-gray-300">Base Price:</span>
                  <span>${{ basePrice.toFixed(2) }}/mo</span>
                </div>
                
                <div v-for="(price, key) in extraPrices" :key="key" class="flex justify-between text-sm">
                  <span class="text-gray-400">{{ getLabel(key) }}:</span>
                  <span>+${{ price.toFixed(2) }}/mo</span>
                </div>
                
                <div class="border-t border-gray-600 mt-3 pt-3 flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${{ totalPrice.toFixed(2) }}/mo</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer Actions -->
        <div class="p-6 border-t border-gray-700 flex justify-between">
          <button class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg" @click="$emit('close')">
            Cancel
          </button>
          
          <div v-if="selectedGame && !selectedGame.soldOut">
            <button
              :disabled="isSubmitting"
              :class="[
                'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-all',
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              ]"
              @click="createServer"
            >
              <span v-if="isSubmitting">
                <div class="animate-spin rounded-full h-4 w-4 border-2 border-white"/>
              </span>
              <span v-else>Create Server</span>
            </button>
          </div>
          
          <div v-else-if="selectedGame?.soldOut" class="text-gray-400">
            This game is coming soon
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['close'])
const toast = useToast()

// State variables
const loading = ref(true)
const error = ref(null)
const games = ref([])
const locations = ref([])
const selectedGame = ref(null)
const isSubmitting = ref(false)

// Server configuration
const serverConfig = ref({
  name: '',
  locationId: null,
  ram: 2, // GB
  cpu: 1, // Core
  storage: 50, // GB
  eggId: null,
  nestId: null
})

// Base prices and configuration
const basePrice = ref(4.99)
const includedResources = ref({
  ram: 2, // 2 GB RAM included in base price
  cpu: 1, // 1 core included
  storage: 50 // 50 GB storage included
})

// Server configuration fields
const serverConfigFields = computed(() => {
  if (!selectedGame.value) return []
  
  return [
    {
      key: 'ram',
      label: 'Memory (RAM)',
      options: [2, 4, 8, 12, 16, 24, 32].map(value => ({ 
        value, 
        label: `${value} GB`
      }))
    },
    {
      key: 'cpu',
      label: 'CPU Cores',
      options: [1, 2, 4, 8].map(value => ({ 
        value, 
        label: `${value} Core${value > 1 ? 's' : ''}`
      }))
    },
    {
      key: 'storage',
      label: 'Storage',
      options: [50, 100, 200, 500].map(value => ({
        value,
        label: `${value} GB`
      }))
    }
  ]
})

// Calculate extra prices
const extraPrices = computed(() => {
  const prices = {}
  
  // Calculate RAM price (if exceeds included amount)
  if (serverConfig.value.ram > includedResources.value.ram) {
    prices.ram = (serverConfig.value.ram - includedResources.value.ram) * 2 // $2 per GB extra
  }
  
  // Calculate CPU price (if exceeds included amount)
  if (serverConfig.value.cpu > includedResources.value.cpu) {
    prices.cpu = (serverConfig.value.cpu - includedResources.value.cpu) * 2 // $2 per core extra
  }
  
  // Calculate storage price (if exceeds included amount)
  if (serverConfig.value.storage > includedResources.value.storage) {
    prices.storage = (serverConfig.value.storage - includedResources.value.storage) * 0.1 // $0.10 per GB extra
  }
  
  return prices
})

// Calculate total price
const totalPrice = computed(() => {
  let total = basePrice.value
  
  for (const price of Object.values(extraPrices.value)) {
    total += price
  }
  
  return total
})

// Helper functions
const getLabel = (key) => {
  const labels = {
    ram: 'Extra RAM',
    cpu: 'Extra CPU',
    storage: 'Extra Storage'
  }
  return labels[key] || key
}

const selectGame = (game) => {
  if (game.soldOut) {
    toast.add({
      title: 'Coming Soon',
      description: `${game.name} servers are not yet available.`,
      color: 'info',
      icon: 'i-heroicons-information-circle'
    })
  } else {
    selectedGame.value = game
    
    // Set default nest and egg IDs based on the selected game
    if (game.nestId && game.eggId) {
      serverConfig.value.nestId = game.nestId
      serverConfig.value.eggId = game.eggId
    }
  }
}

const isIncludedResource = (field, value) => {
  return value <= (includedResources.value[field] || 0)
}

const getOptionPrice = (field, value) => {
  const included = includedResources.value[field] || 0
  
  if (value <= included) {
    return 'Included'
  }
  
  const extra = value - included
  
  // Price per unit based on resource type
  const priceMap = {
    ram: 2, // $2 per GB
    cpu: 2, // $2 per core
    storage: 0.1 // $0.10 per GB
  }
  
  const price = extra * (priceMap[field] || 0)
  
  return `+$${price.toFixed(2)}`
}

// Load data
const fetchOptions = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // Fetch games
    const gamesData = await $fetch('/api/games');
    games.value = gamesData.map(game => ({
      ...game,
      nestId: game.nestId || 1,
      eggId: game.eggId || getDefaultEggId(game.slug)
    }));
    
    // Fetch pricing plans
    const pricingPlans = await $fetch('/api/pricing-plans');
    
    // Match pricing plans to games
    games.value = games.value.map(game => {
      // Find matching pricing plan (by name or other criteria)
      const matchingPlan = pricingPlans.find(plan => 
        plan.name.toLowerCase() === game.name.toLowerCase() ||
        plan.configTemplate?.game === game.slug
      );
      
      return {
        ...game,
        pricingPlanId: matchingPlan?.id
      };
    });
    
    // Fetch locations (using existing endpoint)
    const locationsData = await $fetch('/api/pterodactyl/locations');
    locations.value = locationsData;
    
    // Set default location if available
    if (locations.value.length > 0) {
      serverConfig.value.locationId = locations.value[0].id;
    }
  } catch (err) {
    console.error('Error fetching options:', err);
    error.value = 'Failed to load server options. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Determine default egg ID based on game slug
const getDefaultEggId = (slug) => {
  const eggMap = {
    'minecraft': 1,
    'valheim': 15,
    'rust': 2,
    'ark': 7,
    'cs2': 12,
    'project_zomboid': 18
  }
  return eggMap[slug] || 1 // Default to Minecraft (1) if not found
}

// Create server
const createServer = async () => {
  if (!selectedGame.value || !serverConfig.value.locationId) {
    toast.add({
      title: 'Missing Information',
      description: 'Please select a game and location first.',
      color: 'warning',
      icon: 'i-heroicons-exclamation-triangle'
    })
    return
  }
  
  if (!serverConfig.value.name) {
    toast.add({
      title: 'Missing Information',
      description: 'Please enter a server name.',
      color: 'warning',
      icon: 'i-heroicons-exclamation-triangle'
    })
    return
  }
  
  isSubmitting.value = true
  
  try {
    // Add to cart using the existing cart/items endpoint
    await $fetch('/api/cart/items', {
      method: 'POST',
      body: {
        planId: pricingPlan.value.id, // Use the pricing plan ID from the selected game
        configuration: {
          game: selectedGame.value.slug,
          memory: serverConfig.value.ram * 1024, // Convert to MB
          cpu: serverConfig.value.cpu * 100, // Convert to % (100% = 1 core)
          disk: serverConfig.value.storage * 1024, // Convert to MB
          nestId: serverConfig.value.nestId,
          eggId: serverConfig.value.eggId,
          location: serverConfig.value.locationId
        },
        quantity: 1
      }
    });
    
    toast.add({
      title: 'Server Added to Cart',
      description: 'Proceed to checkout to complete your order.',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    });
    
    // Navigate to checkout
    navigateTo('/checkout');
    
    // Close modal
    emit('close');
  } catch (err) {
    console.error('Error creating server:', err);
    toast.add({
      title: 'Failed to Add to Cart',
      description: err.message || 'An unexpected error occurred',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    });
  } finally {
    isSubmitting.value = false;
  }
}

// Initialize
onMounted(fetchOptions)
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out;
}
</style>