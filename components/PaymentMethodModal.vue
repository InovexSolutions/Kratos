<!-- components/PaymentMethodModal.vue -->
<template>
    <div class="modal-overlay">
      <div class="modal-content">
        <h3>Update Payment Method</h3>
        <div id="card-element" class="my-4"></div>
        <button @click="savePaymentMethod">Save</button>
      </div>
    </div>
  </template>
  
  <script setup>
  const { $stripe } = useNuxtApp()
  const cardElement = ref()
  const elements = ref()
  
  onMounted(async () => {
    const stripe = await $stripe()
    elements.value = stripe.elements()
    cardElement.value = elements.value.create('card')
    cardElement.value.mount('#card-element')
  })
  
  const savePaymentMethod = async () => {
    const stripe = await $stripe()
    const { error, setupIntent } = await stripe.confirmSetup({
      elements: elements.value,
      redirect: 'if_required'
    })
  
    if (error) {
      alert(error.message)
      return
    }
  
    // Save setupIntent.payment_method to your server
    await $fetch('/api/payment-methods', {
      method: 'POST',
      body: { paymentMethod: setupIntent.payment_method }
    })
    
    // Refresh order data
    refreshNuxtData()
  }
  </script>