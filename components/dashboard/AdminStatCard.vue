<!-- components/AdminStatCard.vue -->
<template>
    <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50 transition-all hover:bg-gray-700/50">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-2xl font-bold mb-2" :class="textColor">
            {{ formattedValue }}
          </div>
          <div class="text-gray-400">{{ title }}</div>
        </div>
        <div class="text-3xl" :class="textColor">
          {{ icon }}
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  const props = defineProps({
    title: String,
    value: [Number, String],
    icon: String,
    color: {
      type: String,
      default: 'purple'
    },
    formatter: {
        type: Function,
        default: (value) => value
    }
  });
  
    const formattedValue = computed(() => {
        const val = typeof props.value === 'number' ? props.value : parseFloat(props.value) || 0;
        return props.formatter(val);
    });

  
  const textColor = computed(() => {
    return {
      purple: 'text-purple-400',
      blue: 'text-blue-400',
      green: 'text-green-400',
      red: 'text-red-400',
      yellow: 'text-yellow-400'
    }[props.color] || 'text-purple-400';
  });
  </script>