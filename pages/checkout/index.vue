<template>
  <div class="min-h-screen bg-gray-900 text-gray-100">
    <NavBar />
    
    <div class="max-w-6xl mx-auto px-4 py-16">
      <h1 class="text-4xl font-bold mb-12">Checkout</h1>
      
      <div v-if="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      
      <div v-else-if="cart.items.length === 0" class="text-center py-20">
        <h2 class="text-2xl font-medium mb-6">Your cart is empty</h2>
        <nuxt-link to="/games" class="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg">
          Browse Games
        </nuxt-link>
      </div>
      
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Order Summary -->
        <div class="lg:col-span-2">
          <!-- Cart Items -->
          <div class="bg-gray-800 p-6 rounded-xl mb-8">
            <h2 class="text-2xl font-bold mb-6">Order Summary</h2>
            
            <div v-for="item in cart.items" :key="item.id" class="border-b border-gray-700 pb-6 mb-6 last:border-0 last:pb-0 last:mb-0">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-xl font-medium">{{ item.plan.name }}</h3>
                  <p class="text-gray-400">{{ formatServiceType(item.plan.serviceType) }}</p>
                </div>
                <div class="text-right">
                  <div class="text-xl font-bold text-white">{{ formatCurrency(calculateItemTotal(item)) }}</div>
                  <div class="text-sm text-gray-400">{{ item.quantity }} × {{ formatCurrency(item.unitPrice) }}</div>
                </div>
              </div>
              
              <!-- Configuration Details -->
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <div v-for="(value, key) in item.configuration" :key="key" 
                     class="bg-gray-700/50 p-2 rounded text-sm">
                  <span class="text-gray-400 capitalize">{{ formatConfigKey(key) }}: </span>
                  <span class="font-medium">{{ value }}{{ getUnit(key) }}</span>
                </div>
              </div>
              
              <div class="flex justify-end">
                <button @click="removeItem(item.id)" class="text-red-400 hover:text-red-300 text-sm">
                  <Icon name="heroicons:trash" class="inline mr-1" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Payment Section -->
        <div>
          <div class="bg-gray-800 p-6 rounded-xl sticky top-8">
            <h3 class="text-2xl font-bold mb-6">Payment</h3>
            
            <div class="space-y-4 mb-6">
              <div class="flex justify-between">
                <span class="text-gray-400">Subtotal:</span>
                <span>{{ formatCurrency(cart.total) }}</span>
              </div>
              
              <div class="pt-3 border-t border-gray-700">
                <div class="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span>{{ formatCurrency(cart.total) }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="!paymentLoading">
              <div ref="paymentElementRef" class="mb-6"></div>
              
              <button 
                @click="processPayment"
                :disabled="isProcessing"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                {{ isProcessing ? 'Processing...' : 'Complete Payment' }}
              </button>
            </div>
            <div v-else class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            
            <div v-if="paymentError" class="mt-4 p-3 bg-red-500/20 text-red-300 rounded-lg text-sm">
              {{ paymentError }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const paymentElementRef = ref(null);
const { $stripe } = useNuxtApp();
const toast = useToast(); // Replace $toast with useToast()
const router = useRouter();
const loading = ref(true);
const cart = ref({ items: [], total: 0 });
const isProcessing = ref(false);
const paymentLoading = ref(true);
const paymentError = ref('');

let stripe, elements;

// Fetch cart data
const fetchCart = async () => {
  try {
    const response = await $fetch('/api/cart');
    cart.value = response;
  } catch (error) {
    console.error('Error fetching cart:', error);
    toast.add({
      title: 'Cart Error',
      description: 'Failed to load your cart',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    });
  } finally {
    loading.value = false;
  }
};

// Remove item from cart
const removeItem = async (itemId) => {
  try {
    await $fetch(`/api/cart/items/${itemId}`, { method: 'DELETE' });
    await fetchCart();
    toast.add({
      title: 'Item Removed',
      description: 'Item successfully removed from cart',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    });
  } catch (error) {
    console.error('Error removing item:', error);
    toast.add({
      title: 'Remove Error',
      description: 'Failed to remove item',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    });
  }
};

// Initialize Stripe
const initializeStripe = async () => {
  try {
    paymentLoading.value = true;
    
    // Create checkout session - update API to create a subscription setup
    const { sessionId, clientSecret } = await $fetch('/api/checkout/create-session', {
      method: 'POST',
      body: {
        mode: 'subscription'  // Indicate we want subscription mode
      }
    });
    
    if (!sessionId || !clientSecret) {
      throw new Error('Failed to initialize payment');
    }
    
    // Load Stripe
    stripe = await $stripe();
    
    // Configure Stripe Elements with support for multiple payment methods
    elements = stripe.elements({
      clientSecret,
      appearance: {
        theme: 'night',
        variables: {
          colorPrimary: '#3b82f6',
          colorBackground: '#2b3544',
        },
      },
      loader: 'auto'
    });
    
    paymentLoading.value = false;
    await nextTick();
    
    // Create payment element with enhanced options
    const paymentElement = elements.create('payment', {
      fields: {
        billingDetails: 'auto'
      },
      wallets: {
        applePay: 'auto',
        googlePay: 'auto'
      },
      paymentMethodOrder: ['card', 'sepa_debit', 'ideal', 'sofort', 'bancontact', 'giropay', 'paypal']
    });
    
    paymentElement.mount(paymentElementRef.value);
    
  } catch (error) {
    console.error('Stripe initialization error:', error);
    paymentError.value = 'Failed to initialize payment system';
    paymentLoading.value = false;
  }
};

// Process payment
const processPayment = async () => {
  if (!stripe || !elements) {
    paymentError.value = 'Payment system is not ready. Please refresh the page.';
    return;
  }
  
  try {
    isProcessing.value = true;
    paymentError.value = '';
    
    // Step 1: Create order
    toast.add({
      title: 'Creating Order',
      description: 'Please wait while we create your order...',
      color: 'info',
      icon: 'i-heroicons-clock'
    });
    
    let orderId;
    try {
      const response = await $fetch('/api/checkout/create-order', { method: 'POST' });
      orderId = response.orderId;
      
      if (!orderId) {
        throw new Error('Failed to create order');
      }
      
      console.log('Order created:', orderId);
    } catch (error) {
      console.error('Order creation failed:', error);
      throw new Error(`Order creation failed: ${error.message || 'Unknown error'}`);
    }
    
    // Step 2: Setup payment method
    toast.add({
      title: 'Setting Up Payment',
      description: 'Configuring your payment method...',
      color: 'info',
      icon: 'i-heroicons-credit-card'
    });
    
    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        // Don't set return_url to avoid early redirect
        payment_method_data: {
          billing_details: {
            name: '', 
            email: ''
          }
        }
      },
      redirect: 'if_required',
    });
    
    if (error) {
      console.error('Setup error:', error);
      throw new Error(error.message || 'Payment setup failed');
    }

    console.log('Setup intent completed:', setupIntent);
    
    // Step 3: Finalize if immediate completion
    if (setupIntent?.status === 'succeeded') {
      toast.add({
        title: 'Finalizing Subscription',
        description: 'Almost there! Completing your subscription...',
        color: 'info',
        icon: 'i-heroicons-cog-6-tooth'
      });
      
      try {
        // Send the setup intent ID to backend and wait for response
        const response = await $fetch(`/api/checkout/finalize-subscription`, {
          method: 'POST',
          body: {
            setupIntentId: setupIntent.id,
            orderId: orderId
          }
        });
        
        // Add logs to help with debugging
        console.log('Finalization response:', response);
        
        // Check if we got a subscription ID back (indicates success)
        if (response && response.subscriptionId) {
          toast.add({
            title: 'Success!',
            description: 'Your subscription was created successfully',
            color: 'success',
            icon: 'i-heroicons-check-circle',
            duration: 5000
          });
          
          // Add a delay before redirecting to ensure database updates complete
          setTimeout(() => {
            router.push(`/dashboard/orders/${orderId}?success=true`);
          }, 1000);
        } else {
          throw new Error('No subscription was created');
        }
      } catch (error) {
        console.error('Subscription finalization error:', error);
        let errorMessage = 'Failed to create subscription';
        
        // Show more specific error message if available
        if (error.data && error.data.message) {
          errorMessage += ': ' + error.data.message;
        } else if (error.message) {
          errorMessage += ': ' + error.message;
        }
        
        paymentError.value = errorMessage;
        toast.add({
          title: 'Subscription Error',
          description: errorMessage,
          color: 'error',
          icon: 'i-heroicons-exclamation-circle'
        });
        isProcessing.value = false;
      }
    } else {
      // For 3DS or other auth flows that require redirect
      toast.add({
        title: 'Authentication Required',
        description: 'Additional verification is needed to complete your payment',
        color: 'warning',
        icon: 'i-heroicons-shield-check'
      });
      // The user will be redirected by Stripe, so we don't need to do anything
    }
  } catch (error) {
    console.error('Payment error:', error);
    paymentError.value = error.message || 'Payment failed';
    toast.add({
      title: 'Payment Failed',
      description: error.message || 'There was a problem processing your payment',
      color: 'error',
      icon: 'i-heroicons-x-circle'
    });
    isProcessing.value = false;
  }
};

// Calculate total for an item
const calculateItemTotal = (item) => {
  return item.unitPrice * item.quantity;
};

// Format currency 
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

// Format service type
const formatServiceType = (type) => {
  const types = {
    'GAME_SERVER': 'Game Server',
    'VPS': 'Virtual Private Server',
    'DEDICATED_SERVER': 'Dedicated Server'
  };
  return types[type] || type;
};

// Format configuration key
const formatConfigKey = (key) => {
  const keys = {
    'ram': 'Memory',
    'cpu': 'CPU',
    'storage': 'Storage',
    'backups': 'Backups'
  };
  return keys[key] || key.replace(/([A-Z])/g, ' $1').trim();
};

// Get unit for a field
const getUnit = (field) => {
  const units = {
    'ram': ' GB',
    'cpu': ' Cores',
    'storage': ' GB',
    'slots': ' Players'
  };
  return units[field] || '';
};

onMounted(async () => {
  await fetchCart();
  if (cart.value.items.length > 0) {
    await initializeStripe();
  }
});
</script>