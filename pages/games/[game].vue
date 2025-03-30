<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <NavBar />
    
    <div class="container mx-auto px-4 py-16">
      <div v-if="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"/>
      </div>
      
      <div v-else class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Configuration Section -->
        <div class="lg:col-span-2 bg-gray-800 rounded-xl p-6">
          <h1 class="text-3xl font-bold mb-6">{{ game.name }} Configuration</h1>
          
          <div class="space-y-8">
            <!-- Server Location Selection -->
            <div v-if="locations.length > 0" class="space-y-3">
              <div class="flex justify-between">
                <h3 class="text-lg font-medium">Server Location</h3>
                <span class="text-sm text-gray-400">Choose where your server will be hosted</span>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label 
                  v-for="location in locations" 
                  :key="location.id" 
                  class="flex flex-col cursor-pointer"
                >
                  <input
                    v-model="serverConfig.locationId"
                    type="radio"
                    name="location"
                    :value="location.id"
                    class="hidden"
                  >
                  <div
                    :class="[
                      'p-4 rounded-lg border transition-all',
                      serverConfig.locationId === location.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-blue-400'
                    ]"
                  >
                    <div class="flex justify-between items-start">
                      <div>
                        <div class="text-lg font-semibold">{{ location.name }}</div>
                        <div class="text-sm text-gray-400">{{ location.description }}</div>
                      </div>
                      <div class="mt-1">
                        <PingTester :host="location.host.fqdn" />
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Server resources configuration -->
            <div v-for="field in configFields" :key="field.key" class="space-y-3">
              <div class="flex justify-between">
                <h3 class="text-lg font-medium">{{ field.label }}</h3>
                <span v-if="getModifierPrice(field.key)" class="text-blue-400">
                  +${{ getModifierPrice(field.key) }}/mo
                </span>
              </div>
              
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div v-for="option in field.options" :key="option.value" class="col-span-1">
                  <label class="flex flex-col cursor-pointer">
                    <input
                      v-model="serverConfig[field.key]"
                      type="radio"
                      :name="field.key"
                      :value="option.value"
                      class="hidden"
                    >
                    <div
                      :class="[
                        'p-4 rounded-lg border transition-all text-center',
                        serverConfig[field.key] === option.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 hover:border-blue-400'
                      ]"
                    >
                      <div class="text-lg font-semibold">{{ option.label }}</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <!-- Game Type Selection -->
            <div v-if="eggOptions.length > 0" class="space-y-3">
              <div class="flex justify-between">
                <h3 class="text-lg font-medium">Server Type</h3>
              </div>
              
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div v-for="egg in eggOptions" :key="egg.id" class="col-span-1">
                  <label class="flex flex-col cursor-pointer">
                    <input
                      v-model="serverConfig.eggId"
                      type="radio"
                      name="egg"
                      :value="egg.id"
                      class="hidden"
                    >
                    <div
                      :class="[
                        'p-4 rounded-lg border transition-all',
                        serverConfig.eggId === egg.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 hover:border-blue-400'
                      ]"
                    >
                      <div class="text-lg font-semibold text-center">{{ egg.name }}</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="order-summary">
          <div class="bg-gray-800 p-6 rounded-xl sticky top-8">
            <h3 class="text-2xl font-bold mb-6">Order Summary</h3>
            
            <div class="space-y-4">
              <div class="flex justify-between">
                <span class="text-gray-400">Base Price:</span>
                <span>${{ basePrice }}/mo</span>
              </div>
              
              <div v-if="getSelectedLocation" class="flex justify-between">
                <span class="text-gray-400">Location:</span>
                <span>{{ getSelectedLocation.name }}</span>
              </div>

              <div v-if="getSelectedEgg" class="flex justify-between">
                <span class="text-gray-400">Server Type:</span>
                <span>{{ getSelectedEgg.name }}</span>
              </div>
              
              <div v-for="(price, field) in modifierPrices" :key="field" class="flex justify-between">
                <span class="text-gray-400">{{ getFieldLabel(field) }} ({{ serverConfig[field] }}{{ getFieldUnit(field) }}):</span>
                <span>+${{ price }}/mo</span>
              </div>
              
              <div class="pt-4 border-t border-gray-700">
                <div class="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span>${{ totalPrice.toFixed(2) }}/mo</span>
                </div>
              </div>
            </div>
            
            <button 
              class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              :disabled="isAddingToCart"
              @click="addToCart"
            >
              {{ isAddingToCart ? 'Adding to Cart...' : 'Add to Cart' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const { $toast } = useNuxtApp();

// State variables
const loading = ref(true);
const game = ref({});
const pricingPlan = ref(null);
const serverConfig = ref({});
const isAddingToCart = ref(false);
// const eggOptions = ref([]);

// State variables
const locations = ref([]);
const loadingLocations = ref(true);

// Load locations
const fetchLocations = async () => {
  try {
    
    loadingLocations.value = true;
    const locationsData = await $fetch('/api/pterodactyl/locations');
    locations.value = locationsData;
    console.log(locationsData);
  } catch (error) {
    console.error('Error fetching locations:', error);
    $toast.error('Failed to load server locations');
  } finally {
    loadingLocations.value = false;
  }
};

// Get game data
const getGameData = async () => {
  try {
    // Load locations in parallel with other data
    const [gameData, plans] = await Promise.all([
      $fetch(`/api/games/${route.params.game}`),
      $fetch('/api/pricing-plans'),
      fetchLocations() // This doesn't return a value, it updates locations.value
    ]);
    
    game.value = gameData;
    
    pricingPlan.value = plans.find(p => 
      p.serviceType === 'GAME_SERVER' && 
      p.name.toLowerCase().includes(route.params.game.toLowerCase())
    );
    
    if (!pricingPlan.value) {
      // Use default game plan if specific one not found
      pricingPlan.value = plans.find(p => p.serviceType === 'GAME_SERVER');
    }
    
    // Initialize the server configuration with defaults
    initializeConfig();
    
    loading.value = false;
  } catch (error) {
    console.error('Error fetching game data:', error);
    $toast.error('Failed to load game data');
  }
};

// Update the initializeConfig function

const initializeConfig = () => {
  // Create default configuration based on pricing model
  const config = {};
  
  // Use the configuration template or extract from pricing model modifiers
  if (pricingPlan.value.configTemplate) {
    // Copy basic config values
    for (const [key, value] of Object.entries(pricingPlan.value.configTemplate)) {
      // Only copy simple values, not arrays or objects
      if (typeof value !== 'object') {
        config[key] = value;
      }
    }
    
    // Set default egg if available
    if (pricingPlan.value.configTemplate.eggs?.length > 0) {
      config.eggId = pricingPlan.value.configTemplate.eggs[0].id;
      config.nestId = pricingPlan.value.configTemplate.nest;
    }
  }
  
  // Add fields from pricing model modifiers
  if (pricingPlan.value.pricingModel?.modifiers) {
    for (const modifier of pricingPlan.value.pricingModel.modifiers) {
      // Only set if not already defined
      if (config[modifier.field] === undefined) {
        // Set default values based on type
        if (modifier.type === 'per_unit') {
          config[modifier.field] = modifier.unit === 'gb' ? 4 : 
                                  modifier.unit === 'cores' ? 2 : 1;
        }
      }
    }
  }
  
  // Set default location if locations are available
  if (locations.value.length > 0) {
    config.locationId = locations.value[0].id;
  }
  
  serverConfig.value = config;
};

// Configuration fields with their labels and options
const configFields = computed(() => {
  if (!pricingPlan.value?.pricingModel?.modifiers) return [];
  
  return pricingPlan.value.pricingModel.modifiers.map(modifier => {
    // Create options based on the field type
    let options = [];
    
    if (modifier.field === 'ram') {
      options = [2, 4, 8, 12, 16, 24, 32].map(value => ({ 
        value, 
        label: `${value} GB` 
      }));
    } 
    else if (modifier.field === 'cpu') {
      options = [2, 4, 8].map(value => ({ 
        value, 
        label: `${value} Cores` 
      }));
    }
    else if (modifier.field === 'storage') {
      options = [50, 100, 200, 500].map(value => ({ 
        value, 
        label: `${value} GB` 
      }));
    }
    else {
      // Default options if specific options not defined
      options = [1, 2, 4, 8].map(value => ({ 
        value, 
        label: `${value}` 
      }));
    }
    
    return {
      key: modifier.field,
      label: getFieldLabel(modifier.field),
      options: options
    };
  });
});

// Base price from the pricing plan
const basePrice = computed(() => {
  return pricingPlan.value?.pricingModel?.basePrice || 
         Number(pricingPlan.value?.priceMonthly) || 0;
});

// Calculate individual modifier prices
const modifierPrices = computed(() => {
  if (!pricingPlan.value?.pricingModel?.modifiers) return {};
  
  const prices = {};
  
  for (const modifier of pricingPlan.value.pricingModel.modifiers) {
    const value = serverConfig.value[modifier.field];
    if (value !== undefined) {
      if (modifier.type === 'per_unit') {
        prices[modifier.field] = value * modifier.price;
      } else if (modifier.type === 'fixed') {
        prices[modifier.field] = modifier.price;
      }
    }
  }
  
  return prices;
});

// Calculate total price
const totalPrice = computed(() => {
  let total = basePrice.value;
  
  for (const price of Object.values(modifierPrices.value)) {
    total += price;
  }
  
  return total;
});

// Get the price of a specific modifier
const getModifierPrice = (field) => {
  return modifierPrices.value[field] || 0;
};

// Get human-readable field labels
const getFieldLabel = (field) => {
  const labels = {
    ram: 'Memory',
    cpu: 'CPU',
    storage: 'Storage',
    slots: 'Player Slots',
    backups: 'Backups'
  };
  
  return labels[field] || field.charAt(0).toUpperCase() + field.slice(1);
};

// Get unit for a field
const getFieldUnit = (field) => {
  const units = {
    ram: 'GB',
    cpu: ' Cores',
    storage: 'GB',
    slots: ' Players'
  };
  
  return units[field] || '';
};

// Add the configured server to cart
const addToCart = async () => {
  isAddingToCart.value = true;
  
  try {
    await $fetch('/api/cart/items', {
      method: 'POST',
      body: {
        planId: pricingPlan.value.id,
        configuration: serverConfig.value,
        quantity: 1
      }
    });
    
    $toast.success('Added to cart successfully');
    router.push('/checkout');
  } catch (error) {
    console.error('Error adding to cart:', error);
    $toast.error('Failed to add to cart');
  } finally {
    isAddingToCart.value = false;
  }
};

// Get available egg options from the config template
const eggOptions = computed(() => {
  const configTemplate = pricingPlan.value?.configTemplate;
  if (!configTemplate || !configTemplate.eggs || !Array.isArray(configTemplate.eggs)) {
    return [];
  }
  
  return configTemplate.eggs.map(egg => ({
    id: egg.id,
    name: egg.name
  }));
});

// Get the currently selected egg
const getSelectedEgg = computed(() => {
  if (!serverConfig.value.eggId || !eggOptions.value.length) return null;
  return eggOptions.value.find(egg => egg.id === serverConfig.value.eggId);
});

// Add selected location to computed properties
const getSelectedLocation = computed(() => {
  if (!serverConfig.value.locationId || !locations.value.length) return null;
  return locations.value.find(location => location.id === serverConfig.value.locationId);
});

// Fetch data on mount
onMounted(getGameData);
</script>