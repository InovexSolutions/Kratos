<script setup>
const props = defineProps({
  game: {
    type: Object,
    required: true
  },
  config: {
    type: Object,
    required: true
  },
  pricingData: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:location', 'update:serverType', 'update:ram', 'update:cpu', 'update:storage']);

// Process tiers with correct data types
const processTiers = (tiers, type) => {
  return (tiers || [])
    .filter(tier => tier.type === type)
    .map(tier => ({
      ...tier,
      value: Number(tier.value),
      price: Number(tier.price)
    }))
    .sort((a, b) => a.value - b.value);
};

const locationList = computed(() =>
  processTiers(props.pricingData.pricingTiers, 'location')
);

const serverTypeList = computed(() => 
  processTiers(props.pricingData.pricingTiers, 'server_type')
);

const ramList = computed(() => 
  processTiers(props.pricingData.pricingTiers, 'ram')
);

const cpuList = computed(() =>
  processTiers(props.pricingData.pricingTiers, 'cpu') 
);

const storageList = computed(() =>
  processTiers(props.pricingData.pricingTiers, 'storage')
);

// Computed properties with emit-based setters

const activeLocation = computed({
  get: () => props.config.location,
  set: value => emit('update:location', Number(value))
});

const activeServerType = computed({
  get: () => props.config.server_type,
  set: value => emit('update:serverType', Number(value))
});

const activeRam = computed({
  get: () => props.config.ram,
  set: value => emit('update:ram', Number(value))
});

const activeCpu = computed({
  get: () => props.config.cpu,
  set: value => emit('update:cpu', Number(value))
});

const activeStorage = computed({
  get: () => props.config.storage,
  set: value => emit('update:storage', Number(value))
});
</script>

<template>
  <div class="space-y-8">
    <!-- Add a Location Selector, a bit minimal but pretty -->
    <!-- <div class="bg-gray-800 p-6 rounded-xl">
      <h3 class="text-xl font-bold mb-4">Location</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <label
          v-for="location in props.pricingData.locations"
          :key="location.id"
          class="cursor-pointer"
        >
          <input 
            type="radio" 
            v-model="activeLocation"
            :value="location.id"
            class="hidden"
          >
          <div
            :class="[
              'p-4 rounded-lg border transition-all',
              activeLocation === location.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-blue-400'
            ]"
          >
            <div class="text-lg font-semibold">{{ location.name }}</div>
            <div class="text-sm text-gray-400">
              <span v-if="location.price > 0">+${{ location.price }}/mo</span>
              <span v-else>&nbsp;</span>
            </div>
          </div>
        </label>
      </div>
    </div> -->
    <!-- Server Type Selection -->
    <div class="bg-gray-800 p-6 rounded-xl">
      <h3 class="text-xl font-bold mb-4">Server Type</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <label
          v-for="tier in serverTypeList"
          :key="tier.value"
          class="cursor-pointer"
        >
          <input 
            type="radio" 
            v-model="activeServerType"
            :value="tier.value"
            class="hidden"
          >
          <div
            :class="[
              'p-4 rounded-lg border transition-all',
              activeServerType === tier.value
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-blue-400'
            ]"
          >
            <div class="text-lg font-semibold">{{ tier.label }}</div>
            <div class="text-sm text-gray-400">
              <span v-if="tier.price > 0">+${{ tier.price }}/mo</span>
              <span v-else>&nbsp;</span>
            </div>
          </div>
        </label>
      </div>
    </div>
    <!-- RAM Selection -->
    <div class="bg-gray-800 p-6 rounded-xl">
      <h3 class="text-xl font-bold mb-4">Memory (RAM)</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <label
          v-for="tier in ramList"
          :key="tier.value"
          class="cursor-pointer"
        >
          <input 
            type="radio" 
            v-model="activeRam"
            :value="tier.value"
            class="hidden"
          >
          <div
            :class="[
              'p-4 rounded-lg border transition-all',
              activeRam === tier.value
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-blue-400'
            ]"
          >
            <div class="text-lg font-semibold">{{ tier.value }}GB</div>
            <div class="text-sm text-gray-400">
              <span v-if="tier.price > 0">+${{ tier.price }}/mo</span>
              <span v-else>&nbsp;</span>
            </div>
          </div>
        </label>
      </div>
    </div>

    <!-- CPU Selection -->
    <div class="bg-gray-800 p-6 rounded-xl">
      <h3 class="text-xl font-bold mb-4">CPU Cores</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <label
          v-for="tier in cpuList"
          :key="tier.value"
          class="cursor-pointer"
        >
          <input 
            type="radio" 
            v-model="activeCpu"
            :value="tier.value"
            class="hidden"
          >
          <div
            :class="[
              'p-4 rounded-lg border transition-all',
              activeCpu === tier.value
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-blue-400'
            ]"
          >
            <div class="text-lg font-semibold">{{ tier.value }} Cores</div>
            <div class="text-sm text-gray-400">
              <span v-if="tier.price > 0">+${{ tier.price }}/mo</span>
              <span v-else>&nbsp;</span>
            </div>
          </div>
        </label>
      </div>
    </div>

    <!-- Storage Selection -->
    <div class="bg-gray-800 p-6 rounded-xl">
      <h3 class="text-xl font-bold mb-4">Storage</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <label
          v-for="tier in storageList"
          :key="tier.value"
          class="cursor-pointer"
        >
          <input 
            type="radio" 
            v-model="activeStorage"
            :value="tier.value"
            class="hidden"
          >
          <div
            :class="[
              'p-4 rounded-lg border transition-all',
              activeStorage === tier.value
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-blue-400'
            ]"
          >
            <div class="text-lg font-semibold">{{ tier.value }}GB SSD</div>
            <div class="text-sm text-gray-400">
              <span v-if="tier.price > 0">+${{ tier.price }}/mo</span>
              <span v-else>&nbsp;</span>
            </div>
          </div>
        </label>
      </div>
    </div>
  </div>
</template>