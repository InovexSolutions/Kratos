<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
    <NavBar class="sticky top-0 z-50" />

    <div class="container mx-auto px-4 py-12">
      <!-- Orders Header -->
      <div class="mb-12 text-center animate-fade-in-up">
        <h1 class="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          My Orders
        </h1>
        <p class="text-xl text-gray-300">Manage your hosting services</p>

        <!-- Order Stats -->
        <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-slide-in-right">
          <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
            <div class="text-3xl font-bold text-green-400 mb-2">{{ totalOrders }}</div>
            <div class="text-gray-400">Total Orders</div>
          </div>
          <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
            <div class="text-3xl font-bold text-blue-400 mb-2">{{ activeServices }}</div>
            <div class="text-gray-400">Active Services</div>
          </div>
          <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
            <div class="text-3xl font-bold text-purple-400 mb-2">{{ monthlySpending }}</div>
            <div class="text-gray-400">Monthly Spending</div>
          </div>
        </div>
      </div>

      <!-- Orders Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="(order, index) in orders" :key="order.id"
          class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 group animate-fade-in-up"
          :style="`animation-delay: ${index * 50}ms`">
          
          <!-- Order Header -->
          <NuxtLink :to="`/dashboard/orders/${order.id}`">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-xl font-bold text-gray-100 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full" 
                        :class="statusColor(order.status)"></span>
                  {{ getServiceTypeIcon(order) }} 
                  {{ getPlanName(order) }}
                </h3>
                <p class="text-sm text-gray-400">#{{ order.id?.slice(0,8) || 'N/A' }}</p>
              </div>
              <span class="text-sm px-3 py-1 rounded-full" 
                    :class="statusBadge(order.status)">
                {{ order.status }}
              </span>
            </div>

            <!-- Order Details -->
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-gray-400">Plan:</span>
                <span class="text-gray-100 font-mono">{{ getPlanName(order) }}</span>
              </div>
              
              <div class="bg-gray-900/50 p-4 rounded-lg">
                <div class="text-sm text-gray-400 mb-2">Configuration</div>
                <div v-if="hasConfiguration(order)" 
                     v-for="(value, key) in getOrderConfiguration(order)" 
                     :key="key" 
                     class="flex justify-between text-sm py-1">
                  <span class="text-gray-400 capitalize">{{ formatConfigKey(key) }}:</span>
                  <span class="text-gray-100">{{ value }}{{ getUnitForConfig(key) }}</span>
                </div>
                <div v-else class="text-sm text-gray-500 italic">No configuration details available</div>
              </div>

              <div class="flex justify-between items-center pt-4 border-t border-gray-700/50">
                <span class="text-gray-400">Price:</span>
                <span class="text-xl font-bold text-purple-400">
                  {{ formatCurrency(order.totalAmount) }}/mo
                </span>
              </div>

              <div class="mt-6 flex justify-between items-center">
                <div class="text-sm text-gray-400">
                  Created: {{ formatDate(order.createdAt) }}
                </div>
                <div class="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <Icon name="heroicons:arrow-top-right-on-square-20-solid" class="w-4 h-4" />
                  Manage
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- Empty State -->
        <div v-if="statusFetch === 'success' && (!orders || orders.length === 0)" 
             class="text-center py-24 animate-fade-in-up col-span-3">
          <div class="text-2xl text-gray-400 mb-4">No active orders found</div>
          <NuxtLink to="/games" 
             class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2">
            <Icon name="heroicons:plus-20-solid" class="w-5 h-5" />
            Create New Service
          </NuxtLink>
        </div>

        <!-- Loading State -->
        <div v-if="statusFetch === 'pending'" class="col-span-3 flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>

        <!-- Error State -->
        <div v-if="statusFetch === 'error'" class="col-span-3 text-center py-12">
          <div class="text-red-400 text-xl mb-4">Failed to load orders</div>
          <button @click="refreshOrders" class="px-4 py-2 bg-blue-500 text-white rounded-lg">
            Try again
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  auth: true
});

// Fetch order data
const { data: orders, status: statusFetch, refresh: refreshOrders } = await useFetch('/api/order', {
  server: false,
  initialCache: false
});

// Calculate dashboard metrics
const totalOrders = computed(() => orders.value?.length || 0);

const activeServices = computed(() => {
  return orders.value?.filter(o => o.status === 'ACTIVE').length || 0;
});

const monthlySpending = computed(() => {
  if (!orders.value) return formatCurrency(0);
  
  const total = orders.value.reduce((sum, order) => {
    // Check if totalAmount exists and is a number or can be converted to one
    const amount = order.totalAmount ? Number(order.totalAmount) : 0;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
  return formatCurrency(total);
});

// Helper functions to safely access order data
const getPlanName = (order) => {
  if (!order.items || !order.items.length || !order.items[0].plan) {
    return 'Server';
  }
  return order.items[0].plan.name || 'Server';
};

const getServiceType = (order) => {
  if (!order.items || !order.items.length || !order.items[0].plan) {
    return 'GAME_SERVER';
  }
  return order.items[0].plan.serviceType || 'GAME_SERVER';
};

const getServiceTypeIcon = (order) => {
  const type = getServiceType(order);
  return serviceTypeIcon(type);
};

const hasConfiguration = (order) => {
  return order.items && 
         order.items.length > 0 && 
         order.items[0].configuration && 
         Object.keys(order.items[0].configuration).length > 0;
};

const getOrderConfiguration = (order) => {
  if (!hasConfiguration(order)) return {};
  return order.items[0].configuration;
};

// Format helpers
const formatConfigKey = (key) => {
  const keys = {
    'ram': 'Memory',
    'cpu': 'CPU',
    'storage': 'Storage',
    'slots': 'Player Slots',
    'backups': 'Backups'
  };
  
  return keys[key] || key.replace(/([A-Z])/g, ' $1').trim();
};

const getUnitForConfig = (key) => {
  const units = {
    'ram': ' GB',
    'cpu': ' Cores',
    'storage': ' GB',
    'slots': ' Players'
  };
  
  return units[key] || '';
};

// Visual helpers
const serviceTypeIcon = (type) => {
  const icons = {
    'GAME_SERVER': '🎮',
    'VPS': '💻',
    'DEDICATED_SERVER': '🖥️'
  };
  return icons[type] || '🎮';
};

const statusColor = (status) => {
  return {
    'ACTIVE': 'bg-green-500',
    'PENDING': 'bg-blue-500',
    'UNPAID': 'bg-red-500',
    'FAILED': 'bg-red-500',
    'CANCELLED': 'bg-gray-500'
  }[status] || 'bg-gray-500';
};

const statusBadge = (status) => {
  return {
    'ACTIVE': 'bg-green-400/20 text-green-400',
    'PENDING': 'bg-blue-400/20 text-blue-400',
    'UNPAID': 'bg-red-400/20 text-red-400',
    'FAILED': 'bg-red-400/20 text-red-400',
    'CANCELLED': 'bg-gray-400/20 text-gray-400'
  }[status] || 'bg-gray-400/20 text-gray-400';
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
</script>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in-right {
  animation: slideInRight 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
  opacity: 0;
  transform: translateX(20px);
}

@keyframes slideInRight {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>