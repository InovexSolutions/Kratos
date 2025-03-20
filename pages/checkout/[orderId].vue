<template>
    <div class="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div class="max-w-4xl mx-auto">
        <!-- Order Summary -->
        <div class="bg-gray-800 rounded-lg p-6 mb-8">
          <h1 class="text-3xl font-bold mb-6">Checkout</h1>
          
          <!-- Order Items -->
          <div v-for="(item, index) in order.items" :key="index" 
               class="bg-gray-700/50 rounded-lg p-4 mb-4">
            <div class="flex justify-between items-start mb-2">
              <div>
                <h3 class="text-xl font-semibold">{{ item.plan.name }}</h3>
                <p class="text-gray-400">{{ serviceTypeLabel(item.plan.serviceType) }}</p>
              </div>
              <span class="text-xl font-bold text-purple-400">
                {{ formatCurrency(item.unitPrice * item.quantity) }}
              </span>
            </div>
  
            <!-- Configuration Details -->
            <div class="grid grid-cols-2 gap-4 text-sm mb-4">
              <div v-for="(value, key) in item.configuration" :key="key" 
                   class="bg-gray-600/20 p-2 rounded">
                <span class="text-gray-400 capitalize">{{ key }}: </span>
                <span class="font-mono">{{ value }} {{ getUnit(key, item.plan) }}</span>
              </div>
            </div>
  
            <!-- Pricing Breakdown -->
            <div class="border-t border-gray-600/50 pt-3">
              <div v-for="modifier in item.plan.pricingModel.modifiers" 
                   :key="modifier.field"
                   class="flex justify-between text-sm py-1">
                <span class="text-gray-400">
                  {{ modifier.field }} ({{ modifier.type }}):
                </span>
                <span class="text-gray-100">
                  +{{ formatCurrency(calculateModifier(item.configuration, modifier)) }}
                </span>
              </div>
            </div>
          </div>
  
          <!-- Total -->
          <div class="border-t border-gray-600/50 pt-4">
            <div class="flex justify-between items-center">
              <span class="text-xl">Total:</span>
              <span class="text-2xl font-bold text-green-400">
                {{ formatCurrency(order.totalAmount) }}
              </span>
            </div>
          </div>
        </div>
  
        <!-- Stripe Payment Element -->
        <div id="stripe-element" class="bg-gray-800 rounded-lg p-6"></div>
  
        <!-- Payment Actions -->
        <div class="mt-6 flex justify-end gap-4">
          <button @click="handlePayment" 
                  class="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold">
            Pay Now
          </button>
          <button @click="$router.back()" 
                  class="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  const route = useRoute()
  // const { $stripe } = useNuxtApp()
  
  const stripe = ref(null)
  const elements = ref(null)
  const order = ref(null)
  
  // Fetch order details
  const { data } = await useFetch(`/api/order/${route.params.orderId}`, {
    headers: { Authorization: `Bearer ${useAuth().token}` }
  })
  console.log("Data:", data)
  order.value = data.value
  
  // Initialize Stripe
  onMounted(async () => {
    stripe.value = await $stripe()
    elements.value = stripe.value.elements({
      mode: 'payment',
      amount: order.value.totalAmount * 100,
      currency: 'usd',
      paymentMethodCreation: 'manual'
    })
  
    const paymentElement = elements.value.create('payment')
    paymentElement.mount('#stripe-element')
  })
  
  // Handle payment submission
  const handlePayment = async () => {
    const { error } = await stripe.value.confirmPayment({
      elements: elements.value,
      confirmParams: {
        return_url: `${window.location.origin}/order/${order.value.id}/success`
      }
    })
  
    if (error) {
      console.error('Payment failed:', error)
      // Handle error
    }
  }
  
  // Helper functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }
  
  const serviceTypeLabel = (type) => {
    const labels = {
      GAME_SERVER: 'Game Server',
      VPS: 'Virtual Private Server',
      DEDICATED_SERVER: 'Dedicated Server'
    }
    return labels[type] || type
  }
  
  const getUnit = (field, plan) => {
    const modifier = plan.pricingModel.modifiers.find(m => m.field === field)
    return modifier?.unit || ''
  }
  
  const calculateModifier = (config, modifier) => {
    const value = config[modifier.field] || 0
    return modifier.type === 'fixed' 
      ? modifier.price 
      : value * modifier.price
  }
  </script>