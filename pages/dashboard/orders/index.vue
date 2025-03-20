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
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-xl font-bold text-gray-100 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full" 
                        :class="statusColor(order.status)"></span>
                  {{ serviceTypeIcon(order.items[0].plan.serviceType) }} {{ order.serviceTypeLabel }} {{ order.items[0].plan.name }}
                </h3>
                <p class="text-sm text-gray-400">#{{ order.id.slice(0,8) }}</p>
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
                <span class="text-gray-100 font-mono">{{ order.plan?.name }}</span>
              </div>
              
              <div class="bg-gray-900/50 p-4 rounded-lg">
                <div class="text-sm text-gray-400 mb-2">Configuration</div>
                <div v-for="(value, key) in order.items[0].configuration" :key="key" 
                     class="flex justify-between text-sm py-1">
                  <span class="text-gray-400 capitalize">{{ key }}:</span>
                  <span class="text-gray-100">{{ value }}</span>
                </div>
              </div>
  
              <div class="flex justify-between items-center pt-4 border-t border-gray-700/50">
                <span class="text-gray-400">Price:</span>
                <span class="text-xl font-bold text-purple-400">
                  {{ formatCurrency(order.totalAmount) }}/mo
                </span>
              </div>
            </div>
  
            <!-- Order Actions -->
             <NuxtLink :to="`/dashboard/orders/${order.id}`">
             
              <div class="mt-6 flex justify-between items-center">
                <div class="text-sm text-gray-400">
                  Created: {{ formatDate(order.createdAt) }}
                </div>
                <button class="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <Icon name="heroicons:arrow-top-right-on-square-20-solid" class="w-4 h-4" />
                  Manage
                </button>
              </div>
            </NuxtLink>
          </div>
        </div>
  
        <!-- Empty State -->
        <div v-if="statusFetch.status === 'success' && orders.length === 0" 
             class="text-center py-24 animate-fade-in-up">
          <div class="text-2xl text-gray-400 mb-4">No active orders found</div>
          <NuxtLink to="/create-server" 
             class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2">
            <Icon name="heroicons:plus-20-solid" class="w-5 h-5" />
            Create New Service
          </NuxtLink>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  const { data: orders, status: statusFetch } = await useFetch('/api/order')
  console.log("statusFetch:", statusFetch)
  console.log("orders:", orders)
  
  const totalOrders = computed(() => orders.value?.length || 0)
  const activeServices = computed(() => orders.value?.filter(o => o.status === 'ACTIVE').length || 0)
  const monthlySpending = computed(() => {
    const total = orders.value?.reduce((sum, order) => sum + order.price, 0) || 0
    return formatCurrency(total)
  })
  
  const serviceTypeIcon = (type) => {
    const icons = {
      GAME_SERVER: '🎮',
      VPS: '💻',
      DEDICATED_SERVER: '🖥️'
    }
    return icons[type] || '❓'
  }

  const serviceTypeLabel = (type) => {
    return {
      GAME_SERVER: 'Game Server',
      VPS: 'VPS',
      DEDICATED_SERVER: 'Dedicated Server'
    }[type]
  }
  
  const statusColor = (status) => {
    return {
      ACTIVE: 'bg-green-400',
      PENDING: 'bg-yellow-400',
      UNPAID: 'bg-purple-400',
      SUSPENDED: 'bg-red-400',
      CANCELLED: 'bg-gray-400'
    }[status]
  }
  
  const statusBadge = (status) => {
    return {
      ACTIVE: 'bg-green-400/20 text-green-400',
      PENDING: 'bg-yellow-400/20 text-yellow-400',
      UNPAID: 'bg-purple-400/20 text-purple-400',
      SUSPENDED: 'bg-red-400/20 text-red-400',
      CANCELLED: 'bg-gray-400/20 text-gray-400'
    }[status]
  }
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  </script>
  
  <style>
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