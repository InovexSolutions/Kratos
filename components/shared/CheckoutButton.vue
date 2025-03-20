<!-- components/CheckoutButton.vue -->
<template>
  <div class="checkout-form">
    <div class="stripe-card-element mb-6">
      <div id="card-element" ref="cardElementRef"></div>
    </div>
    
    <button 
      @click.prevent="handleCheckout"
      :disabled="processing"
      class="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl text-lg font-bold transition-colors disabled:opacity-50"
    >
      <span v-if="processing">Processing...</span>
      <span v-else>Pay ${{ totalPrice }}</span>
    </button>
  </div>
</template>

<script setup>
// import { useStripe } from '@stripe/stripe-js'

// const stripe = await useStripe()
// const elements = useElements()
const cardElementRef = ref(null)
let cardElement = null

onMounted(() => {
  if (elements && cardElementRef.value) {
    cardElement = elements.createElement('card')
    cardElement.mount(cardElementRef.value)
  }
})

onBeforeUnmount(() => {
  if (cardElement) {
    cardElement.unmount()
  }
})

const props = defineProps({
  game: {
    type: Object,
    required: true
  },
  config: {
    type: Object,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

const { data } = useAuth()
const user = data?.value?.user
const cart = useCartStore()
const router = useRouter()
const processing = ref(false)

const handleCheckout = async () => {
  try {
    processing.value = true

    if (!user) {
      localStorage.setItem('pendingCheckout', JSON.stringify(cart.items))
      router.push({ 
        path: '/auth/login',
        query: { redirect: '/checkout' }
      })
      return
    }

    if (!stripe || !elements) {
      throw new Error('Stripe failed to initialize')
    }

    // Create invoice and get client secret
    const { clientSecret, invoiceId } = await createInvoice()

    // Confirm card payment
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: user.name,
          email: user.email
        }
      }
    })

    if (error) {
      await handlePaymentError(error, invoiceId)
      throw error
    }

    await handlePaymentSuccess(paymentIntent, invoiceId)
    router.push('/dashboard/invoices?success=true')
    
  } catch (error) {
    console.error('Checkout error:', error)
    alert(`Payment failed: ${error.message}`)
  } finally {
    processing.value = false
  }
}

const createInvoice = async () => {
  try {
    const { data, error } = await useFetch('/api/invoices/create', {
      method: 'POST',
      body: {
        gameSlug: props.game.slug,
        config: props.config
      }
    })

    if (error.value) {
      console.error('Invoice Error Details:', error.value.data)
      throw new Error(error.value.data?.message || 'Invoice creation failed')
    }

    return {
      clientSecret: data.value.clientSecret,
      invoiceId: data.value.invoiceId
    }

  } catch (error) {
    throw new Error(`Invoice creation failed: ${error.message}`)
  }
}

const handlePaymentSuccess = async (paymentIntent, invoiceId) => {
  try {
    // Update local invoice status
    await useFetch(`/api/invoices/${invoiceId}`, {
      method: 'PUT',
      body: { status: 'PAID' }
    })

    // Clear cart
    cart.removeAllItems()
    console.log('Payment succeeded:', paymentIntent.id)
    
  } catch (error) {
    console.error('Post-payment update failed:', error)
    // Handle failed status update
  }
}

const handlePaymentError = async (error, invoiceId) => {
  try {
    await useFetch(`/api/invoices/${invoiceId}`, {
      method: 'PUT',
      body: { 
        status: 'FAILED',
        error: error.message 
      }
    })
  } catch (updateError) {
    console.error('Failed to update invoice status:', updateError)
  }
}
</script>

<style>
.stripe-card-element {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

.StripeElement--focus {
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.5);
}
</style>