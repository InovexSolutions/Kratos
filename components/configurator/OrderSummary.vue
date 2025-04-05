<template>
  <div class="bg-gray-800 p-6 rounded-xl sticky top-8">
    <h3 class="text-2xl font-bold mb-6">Order Summary</h3>
    
    <div class="space-y-4">
      <div class="flex justify-between">
        <span class="text-gray-400">Base Price:</span>
        <span>${{ pricingData.basePrice }}/mo</span>
      </div>
      
      <div v-if="showRamExtra" class="flex justify-between">
        <span class="text-gray-400">Extra RAM ({{ config.ram }}GB):</span>
        <span>+${{ ramPrice }}/mo</span>
      </div>
      
      <div v-if="showCpuExtra" class="flex justify-between">
        <span class="text-gray-400">Extra CPU ({{ config.cpu }} Cores):</span>
        <span>+${{ cpuPrice }}/mo</span>
      </div>
      
      <div v-if="showStorageExtra" class="flex justify-between">
        <span class="text-gray-400">Extra Storage ({{ config.storage }}GB):</span>
        <span>+${{ storagePrice }}/mo</span>
      </div>
      
      <div class="pt-4 border-t border-gray-700">
        <div class="flex justify-between text-xl font-bold">
          <span>Total:</span>
          <span>${{ totalPrice.toFixed(2) }}/mo</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  game: Object,
  config: Object,
  pricingData: Object,
  totalPrice: Number
});

// Find base resources
const baseRam = computed(() => 
  findBaseTier('ram', props.pricingData)
);
const baseCpu = computed(() => 
  findBaseTier('cpu', props.pricingData)
);
const baseStorage = computed(() => 
  findBaseTier('storage', props.pricingData)
);

// Calculate extras visibility
const showRamExtra = computed(() => props.config.ram > baseRam.value);
const showCpuExtra = computed(() => props.config.cpu > baseCpu.value);
const showStorageExtra = computed(() => props.config.storage > baseStorage.value);

// Current tier prices
const ramPrice = computed(() => 
  findTierPrice('ram', props.config.ram, props.pricingData)
);
const cpuPrice = computed(() => 
  findTierPrice('cpu', props.config.cpu, props.pricingData)
);
const storagePrice = computed(() => 
  findTierPrice('storage', props.config.storage, props.pricingData)
);

// Helper functions
const findBaseTier = (type, data) => {
  const tier = data.pricingTiers.find(t => 
    t.type === type && Number(t.price) === 0
  );
  return tier ? Number(tier.value) : 0;
};

const findTierPrice = (type, value, data) => {
  const tier = data.pricingTiers.find(t => 
    t.type === type && Number(t.value) === value
  );
  return tier ? Number(tier.price) : 0;
};
</script>