<!-- components/ActivityTimeline.vue -->
<template>
    <div class="relative">
      <!-- Timeline line -->
      <div class="absolute left-6 top-0 h-full w-0.5 bg-gradient-to-b from-purple-500/20 to-transparent" />
  
      <div class="space-y-8 pl-10">
        <div 
          v-for="(activity, index) in activities"
          :key="index"
          class="relative group transition-all duration-300 hover:transform hover:-translate-x-2"
        >
          <!-- Timeline dot -->
          <div 
            class="absolute w-5 h-5 rounded-full -left-[34px] top-5 flex items-center justify-center border-2 border-purple-500/50 bg-gray-900 group-hover:bg-purple-500/20 transition-colors"
            :class="activityDotGlow(activity)"
          >
            <div class="w-2 h-2 rounded-full bg-purple-400 shadow-purple-glow" />
          </div>
  
          <!-- Activity card -->
          <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50 group-hover:border-purple-500/30 transition-all">
            <div class="flex items-start gap-4">
              <div class="text-2xl p-3 rounded-lg bg-gray-700/50">
                {{ activityIcon(activity.type) }}
              </div>
              
              <div class="flex-1">
                <div class="flex items-baseline gap-3 mb-2">
                  <span 
                    class="text-sm font-semibold text-purple-400"
                    v-html="activityUser(activity.user)"
                  />
                  <span class="text-sm text-gray-400 ml-2">
                    {{ formatTimestamp(activity.timestamp) }}
                  </span>
                </div>
                <p class="text-gray-300 text-sm">
                  {{ activity.action }}
                  <span v-if="activity.status" class="ml-2 text-xs px-2 py-1 rounded-full" :class="statusBadge(activity.status)">
                    {{ activity.status }}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  const props = defineProps({
    activities: {
      type: Array,
      default: () => []
    }
  });
  
  const activityIcon = (type) => {
    const icons = {
      server: '🖥️',
      user: '👤',
      billing: '💳',
      system: '⚙️'
    };
    return icons[type] || '🔔';
  };
  
  const activityDotGlow = (activity) => {
    return {
      server: 'shadow-purple-500/20',
      user: 'shadow-blue-500/20',
      billing: 'shadow-green-500/20',
      system: 'shadow-yellow-500/20'
    }[activity.type] || 'shadow-gray-500/20';
  };
  
  const activityUser = (user) => {
    return user ? `<span class="font-mono">${user}</span>` : 'System';
  };
  
  const statusBadge = (status) => {
    const styles = {
      online: 'bg-green-500/20 text-green-400',
      paid: 'bg-purple-500/20 text-purple-400',
      updated: 'bg-blue-500/20 text-blue-400',
      offline: 'bg-red-500/20 text-red-400'
    };
    return styles[status.toLowerCase()] || 'bg-gray-500/20 text-gray-400';
  };
  
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    }).format(date);
  };
  </script>
  
  <style>
  .shadow-purple-glow {
    box-shadow: 0 0 8px 2px rgba(139, 92, 246, 0.3);
  }
  
  .group:hover .shadow-purple-glow {
    box-shadow: 0 0 12px 3px rgba(139, 92, 246, 0.4);
  }
  
  .transition-all {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  </style>