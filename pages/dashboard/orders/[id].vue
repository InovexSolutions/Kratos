<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
    <NavBar class="sticky top-0 z-50" />

    <div v-if="loading" class="container mx-auto px-4 py-12 flex justify-center">
      <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"/>
    </div>

    <div v-else-if="error" class="container mx-auto px-4 py-12 text-center">
      <div class="text-red-400 text-2xl mb-4">Failed to load order details</div>
      <p class="text-gray-400 mb-6">{{ error }}</p>
      <NuxtLink to="/dashboard/orders" class="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Return to Orders
      </NuxtLink>
    </div>

    <div v-else class="container mx-auto px-4 py-12 max-w-7xl">
      <!-- Order Header -->
      <div class="mb-8 animate-fade-in-up">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              {{ order.items[0]?.plan?.name || 'Server' }} Manager
            </h1>
            <p class="text-gray-300 mt-2">Order ID: #{{ order.id?.slice(0,8) || 'N/A' }}</p>
          </div>
          <span
class="px-4 py-2 rounded-full text-sm" 
                :class="statusBadge(order.status)">
            {{ order.status }}
          </span>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
            <div class="text-gray-400 text-sm mb-1">Next Payment</div>
            <div class="text-xl font-bold text-purple-400">
              {{ formatCurrency(order.totalAmount) }}
            </div>
            <div class="text-gray-400 text-xs mt-1">
              {{ formatDate(order.nextBillingDate || new Date(Date.now() + 30*24*60*60*1000)) }}
            </div>
          </div>
          
          <div class="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
            <div class="text-gray-400 text-sm mb-1">Uptime</div>
            <div class="text-xl font-bold text-green-400">99.97%</div>
            <div class="text-gray-400 text-xs mt-1">Last 30 days</div>
          </div>

          <div class="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
            <div class="text-gray-400 text-sm mb-1">Resources</div>
            <div class="text-xl font-bold text-blue-400">
              {{ order.items[0]?.configuration?.ram || '4' }} GB
            </div>
            <div class="text-gray-400 text-xs mt-1">RAM Allocation</div>
          </div>

          <div class="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
            <div class="text-gray-400 text-sm mb-1">Active Since</div>
            <div class="text-xl font-bold text-yellow-400">{{ formatDaysActive(order.createdAt) }}</div>
            <div class="text-gray-400 text-xs mt-1">Days Online</div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Service Controls -->
          <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
            <h2 class="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
              <Icon name="heroicons:command-line" class="text-blue-400" />
              Server Controls
            </h2>
            
            <div class="grid grid-cols-2 gap-4 text-gray-400">
              <button
class="control-btn bg-green-500/20 hover:bg-green-500/30"
                      @click="restartServer">
                <Icon name="heroicons:arrow-path" class="text-green-400" />
                Restart Instance
              </button>
              <button
class="control-btn bg-blue-500/20 hover:bg-blue-500/30"
                      @click="openBackupModal">
                <Icon name="heroicons:server-stack" class="text-blue-400" />
                Create Backup
              </button>
              <button
class="control-btn bg-purple-500/20 hover:bg-purple-500/30"
                      @click="openStatsModal">
                <Icon name="heroicons:chart-bar" class="text-purple-400" />
                View Metrics
              </button>
              <button
class="control-btn bg-yellow-500/20 hover:bg-yellow-500/30"
                      @click="openConfigEditor">
                <Icon name="heroicons:adjustments-vertical" class="text-yellow-400" />
                Edit Config
              </button>
            </div>
          </div>

          <!-- Billing Section -->
          <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold text-gray-100 flex items-center gap-2">
                <Icon name="heroicons:credit-card" class="text-purple-400" />
                Billing & Payments
              </h2>
              <button
class="text-blue-400 hover:text-blue-300 text-sm"
                      @click="refreshPaymentStatus">
                Refresh Status
              </button>
            </div>

            <!-- Payment Methods -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-gray-400">Payment Method</h3>
                <button
class="text-sm text-blue-400 hover:text-blue-300"
                        @click="openPaymentMethodModal">
                  {{ order.paymentMethod ? 'Change Card' : 'Add Card' }}
                </button>
              </div>
              <div class="bg-gray-900/50 p-4 rounded-lg flex items-center gap-4">
                <Icon name="heroicons:credit-card" class="text-2xl text-gray-400" />
                <span v-if="order.paymentMethod?.card" class="font-mono text-lg text-gray-100">
                  **** **** **** {{ order.paymentMethod.card.last4 }}
                </span>
                <span v-else class="text-sm text-gray-400">No payment method on file</span>
              </div>
            </div>

            <!-- Invoices -->
            <!-- Update the invoices section to match the overall design -->
            <div class="bg-gray-800 rounded-lg p-6 mb-6">
              <h3 class="text-xl font-semibold text-gray-100 mb-4">Recent Invoices</h3>
              
              <div v-if="order.invoices && order.invoices.length > 0">
                <div
v-for="invoice in order.invoices" :key="invoice.id"
                     class="bg-gray-700/50 rounded-lg p-4 mb-3 hover:bg-gray-700/70 transition-colors">
                  
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center gap-2">
                        <Icon 
                          :name="getInvoiceIcon(invoice.status)" 
                          class="text-lg" 
                          :class="invoiceStatusColor(invoice.status)" 
                        />
                        <span class="font-medium text-gray-100">Invoice #{{ invoice.id.substring(0, 8) }}</span>
                      </div>
                      
                      <div class="text-sm text-gray-400 mt-1">
                        Period: {{ formatDate(invoice.periodStart) }} - {{ formatDate(invoice.periodEnd) }}
                      </div>
                    </div>
                    
                    <div class="text-right">
                      <div class="text-xl font-bold text-purple-400">
                        {{ formatCurrency(invoice.amount) }}
                      </div>
                      <div class="mt-1">
                        <span 
                          class="text-xs px-2 py-1 rounded-full"
                          :class="getInvoiceStatusClass(invoice.status)">
                          {{ invoice.status }}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Payment details or actions -->
                  <div class="mt-3 flex justify-between items-center">
                    <div class="text-sm text-gray-400">
                      <span v-if="invoice.paidAt">
                        Paid on {{ formatDate(invoice.paidAt) }}
                      </span>
                      <span v-else-if="invoice.status === 'UNPAID'">
                        Due {{ formatDateRelative(invoice.dueDate || invoice.createdAt) }}
                      </span>
                    </div>
                    
                    <div class="flex gap-2">
                      <button 
                        v-if="invoice.status === 'UNPAID'"
                        class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm rounded-lg transition-colors"
                        @click="payInvoice(invoice)">
                        Pay Now
                      </button>
                      
                      <button
                        class="bg-gray-600/40 hover:bg-gray-600/60 text-gray-200 px-4 py-2 text-sm rounded-lg flex items-center gap-1 transition-colors"
                        @click="downloadInvoice(invoice)">
                        <Icon name="heroicons:document-arrow-down" class="text-sm" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-else class="bg-gray-700/30 rounded-lg p-8 text-center">
                <Icon name="heroicons:document-text" class="text-3xl text-gray-500 mb-2 mx-auto" />
                <p class="text-gray-400">No invoices found for this order</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Subscription Management -->
        <div class="space-y-6">
          <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
            <h2 class="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
              <Icon name="heroicons:clock" class="text-yellow-400" />
              Subscription
            </h2>

            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-gray-400">Billing Cycle</span>
                <span class="text-gray-100">Monthly</span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-gray-400">Next Renewal</span>
                <span class="text-gray-100">
                  {{ formatDate(order.nextBillingDate || order.subscription?.currentPeriodEnd || new Date(Date.now() + 30*24*60*60*1000)) }}
                </span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-gray-400">Auto Renew</span>
                <div class="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox" 
                    :checked="autoRenew" 
                    class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    @change="toggleAutoRenew" >
                  <label class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-700 cursor-pointer"/>
                </div>
              </div>

              <div v-if="order.status === 'CANCELLED'" class="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                <div class="flex items-start">
                  <Icon name="heroicons:clock" class="text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h4 class="text-red-400 font-medium">Subscription Cancelled</h4>
                    <p class="text-sm text-gray-300 mt-1">
                      Your subscription has been cancelled.
                      <span v-if="order.terminateAtPeriodEnd">
                        Your server will be permanently deleted on {{ formatDate(order.nextBillingDate || order.subscription?.currentPeriodEnd) }}.
                      </span>
                      <span v-else>
                        Your server will be paused at the end of your billing period.
                      </span>
                    </p>
                    <button 
                      v-if="order.status === 'CANCELLED'" 
                      class="mt-3 text-sm bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors" 
                      @click="reactivateSubscription">
                      Reactivate Subscription
                    </button>
                  </div>
                </div>
              </div>

              <div class="pt-4 border-t border-gray-700/50 space-y-3">
                <button
                    v-if="order.status === 'ACTIVE'"
                    class="danger-btn w-full"
                    @click="openCancelModal">
                  Cancel Subscription
                </button>

                <button
                        v-if="order.status === 'ACTIVE'"
                        class="danger-btn w-full"
                        @click="openPauseModal">
                  Pause Service
                </button>

                <button
                    v-if="order.status === 'ACTIVE'"
                    class="success-btn w-full"
                    @click="openUpgradeModal">
                  Upgrade Plan
                </button>

                <button
                    v-if="order.status === 'UNPAID' || order.status === 'PAST_DUE'"
                    class="success-btn w-full"
                    @click="retryPayment">
                  Retry Payment
                </button>
              </div>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="bg-red-900/20 p-6 rounded-xl border border-red-700/50">
            <h2 class="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
              <Icon name="heroicons:exclamation-triangle" />
              Danger Zone
            </h2>

            <div class="space-y-4">
              <button
                  class="danger-btn w-full"
                  @click="openDeleteModal">
                <Icon name="heroicons:trash" class="mr-2" />
                Delete Server Permanently
              </button>

              <p class="text-xs text-red-400/70">
                Warning: This will immediately terminate your service and delete all data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <div v-if="showCancelModal" class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-700/50">
        <h3 class="text-xl font-bold mb-4">Cancel Subscription</h3>
        <p class="text-gray-300 mb-4">Are you sure you want to cancel your subscription?</p>
        
        <div class="bg-gray-700/30 p-4 rounded-lg mb-6">
          <div class="flex items-start mb-4">
            <div class="relative inline-block w-10 mr-2 align-middle select-none mt-1">
              <input
                id="terminate-toggle" 
                v-model="terminateAtPeriodEnd"
                type="checkbox"
                class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" >
              <label for="terminate-toggle" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-700 cursor-pointer"/>
            </div>
            <div class="ml-2">
              <label for="terminate-toggle" class="text-gray-100 font-medium block mb-1">Terminate server at period end</label>
              <p class="text-gray-400 text-sm">If enabled, your server will be completely deleted at the end of your current billing cycle on {{ formatDate(order.nextBillingDate || order.subscription?.currentPeriodEnd) }}.</p>
            </div>
          </div>
          
          <div v-if="!terminateAtPeriodEnd" class="text-sm text-yellow-400 bg-yellow-400/10 p-3 rounded-lg">
            <Icon name="heroicons:information-circle" class="inline-block mr-1" />
            Your subscription will be cancelled but your server will remain active until the end of your billing period, then be paused.
          </div>
          
          <div v-else class="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">
            <Icon name="heroicons:exclamation-triangle" class="inline-block mr-1" />
            Warning: Your data will be permanently deleted when the billing period ends. This action cannot be undone.
          </div>
        </div>
        
        <div class="flex justify-end gap-3">
          <button class="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600" @click="showCancelModal = false">
            Keep Subscription
          </button>
          <button class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600" @click="cancelSubscription">
            Confirm Cancellation
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-700/50">
        <h3 class="text-xl font-bold mb-4">Delete Server Permanently</h3>
        <p class="text-gray-300 mb-6">This action cannot be undone. All data associated with this server will be permanently deleted.</p>
        <div class="flex justify-end gap-3">
          <button class="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600" @click="showDeleteModal = false">
            Cancel
          </button>
          <button class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600" @click="deleteServer">
            Delete Permanently
          </button>
        </div>
      </div>
    </div>

    <div v-if="showPaymentMethodModal" class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-700/50">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-gray-100">Update Payment Method</h3>
          <button class="text-gray-400 hover:text-gray-200" @click="showPaymentMethodModal = false">
            <Icon name="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>
        
        <div id="payment-element" class="mb-6">
          <!-- Stripe Elements will mount here -->
          <div class="animate-pulse bg-gray-700/50 h-12 rounded-lg mb-2"/>
          <div class="animate-pulse bg-gray-700/50 h-12 rounded-lg mb-2"/>
          <div class="animate-pulse bg-gray-700/50 h-12 rounded-lg"/>
        </div>
        
        <div class="flex justify-end gap-3 mt-4">
          <button 
            class="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600" 
            @click="showPaymentMethodModal = false">
            Cancel
          </button>
          <button 
            :disabled="updatingPayment" 
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" 
            @click="updatePaymentMethod">
            <span v-if="updatingPayment" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
            {{ updatingPayment ? 'Processing...' : 'Update Payment Method' }}
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

const route = useRoute();
const toast = useToast(); // Replace $toast with useToast()
const { $stripe } = useNuxtApp();

const loading = ref(true);
const error = ref(null);
const order = ref({});
const autoRenew = ref(true);

// Modal states
const showCancelModal = ref(false);
const showDeleteModal = ref(false);
const showPaymentMethodModal = ref(false);  // This exists but wasn't being used correctly

// Add these missing refs
const paymentClientSecret = ref(null);
const stripeElements = ref(null);
const updatingPayment = ref(false);
const terminateAtPeriodEnd = ref(false); // Add this ref

// Fetch order details
const fetchOrder = async () => {
  try {
    loading.value = true;
    error.value = null;
    const { data, error: fetchError } = await useFetch(`/api/order/${route.params.id}`);
    
    if (fetchError.value) {
      throw new Error(fetchError.value.message || 'Failed to load order');
    }
    
    if (!data.value) {
      throw new Error('Order not found');
    }
    
    order.value = data.value;
    autoRenew.value = data.value.autoRenew ?? true;
    
  } catch (err) {
    console.error('Error fetching order:', err);
    error.value = err.message || 'Failed to load order details';
  } finally {
    loading.value = false;
  }
};

// Formatter helpers
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

const formatDaysActive = (createdAt) => {
  if (!createdAt) return 'N/A';
  
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Status and badges 
const statusBadge = (status) => {
  return {
    'ACTIVE': 'bg-green-400/20 text-green-400',
    'PENDING': 'bg-blue-400/20 text-blue-400',
    'UNPAID': 'bg-red-400/20 text-red-400',
    'PAST_DUE': 'bg-red-400/20 text-red-400',
    'PAUSED': 'bg-yellow-400/20 text-yellow-400',
    'CANCELLED': 'bg-gray-400/20 text-gray-400'
  }[status] || 'bg-gray-400/20 text-gray-400';
};

const invoiceStatusColor = (status) => {
  return {
    'PAID': 'text-green-400',
    'UNPAID': 'text-red-400',
    'PENDING': 'text-yellow-400'
  }[status] || 'text-gray-400';
};

// Server controls
const restartServer = async () => {
  try {
    toast.add({
      title: 'Restarting Server',
      description: 'Server restart has been initiated...',
      color: 'info',
      icon: 'i-heroicons-arrow-path',
      timeout: 3000
    });
    
    await $fetch(`/api/server/${order.value.serviceId}/restart`, {
      method: 'POST'
    });
    
    toast.add({
      title: 'Server Restarted',
      description: 'Server restart has been initiated successfully',
      color: 'success',
      icon: 'i-heroicons-check-circle',
      timeout: 5000
    });
  } catch (error) {
    toast.add({
      title: 'Restart Failed',
      description: 'Failed to restart the server. Please try again.',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle',
      timeout: 5000
    });
    console.error(error);
  }
};

const openBackupModal = () => {
  toast.add({
    title: 'Coming Soon',
    description: 'Backup feature will be available soon',
    color: 'info',
    icon: 'i-heroicons-information-circle'
  });
};

const openStatsModal = () => {
  toast.add({
    title: 'Coming Soon',
    description: 'Statistics feature will be available soon',
    color: 'info',
    icon: 'i-heroicons-information-circle'
  });
};

const openConfigEditor = () => {
  toast.add({
    title: 'Coming Soon',
    description: 'Configuration editor will be available soon',
    color: 'info',
    icon: 'i-heroicons-information-circle'
  });
};

// Payment methods
const refreshPaymentStatus = async () => {
  toast.add({
    title: 'Refreshing Status',
    description: 'Updating payment status information...',
    color: 'info',
    icon: 'i-heroicons-arrow-path'
  });
  
  await fetchOrder();
  
  toast.add({
    title: 'Status Updated',
    description: 'Payment status has been refreshed',
    color: 'success',
    icon: 'i-heroicons-check-circle'
  });
};

const payInvoice = async (invoice) => {
  try {
    toast.add({
      title: 'Processing Payment',
      description: 'Please wait while we process your payment...',
      color: 'info',
      icon: 'i-heroicons-credit-card'
    });
    
    const response = await $fetch(`/api/invoices/${invoice.id}/retry-payment`, {
      method: 'POST'
    });
    
    if (response.success) {
      toast.add({
        title: 'Payment Successful',
        description: 'Your payment has been processed successfully',
        color: 'success',
        icon: 'i-heroicons-check-circle'
      });
      await fetchOrder(); // Refresh order data
    } else {
      // If not immediately successful, show info about processing
      toast.add({
        title: 'Payment Processing',
        description: response.message || 'Your payment is being processed',
        color: 'info',
        icon: 'i-heroicons-clock'
      });
      
      // Check again after a delay
      setTimeout(async () => {
        await fetchOrder();
      }, 5000);
    }
  } catch (error) {
    console.error('Error processing invoice payment:', error);
    
    // Check if it's a payment method issue
    if (error.data?.message?.includes('payment_method')) {
      toast.add({
        title: 'Payment Method Invalid',
        description: 'Please update your payment details',
        color: 'error',
        icon: 'i-heroicons-credit-card'
      });
      openPaymentMethodModal(); // Open modal to update payment method
    } else {
      toast.add({
        title: 'Payment Failed',
        description: error.data?.message || 'Unknown error occurred',
        color: 'error',
        icon: 'i-heroicons-exclamation-circle'
      });
    }
  }
};

// Subscription management
const toggleAutoRenew = async () => {
  autoRenew.value = !autoRenew.value;
  
  try {
    toast.add({
      title: 'Auto-Renewal Updated',
      description: `Auto-renewal is now ${autoRenew.value ? 'enabled' : 'disabled'}`,
      color: 'info',
      icon: 'i-heroicons-clock'
    });
    
    await $fetch(`/api/order/${order.value.id}/auto-renew`, {
      method: 'POST',
      body: {
        autoRenew: autoRenew.value
      }
    });
  } catch (error) {
    // Revert UI state if API call fails
    autoRenew.value = !autoRenew.value;
    
    toast.add({
      title: 'Update Failed',
      description: 'Failed to update auto-renewal settings',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    });
    console.error(error);
  }
};

const cancelSubscription = async () => {
  try {
    toast.add({
      title: 'Processing Cancellation',
      description: 'Please wait while we process your request...',
      color: 'info',
      icon: 'i-heroicons-clock'
    });
    
    await $fetch(`/api/order/${order.value.id}/cancel`, {
      method: 'POST',
      body: {
        terminateAtPeriodEnd: terminateAtPeriodEnd.value
      }
    });
    
    showCancelModal.value = false;
    await fetchOrder();
    
    // Updated success message to reflect the user's choice
    if (terminateAtPeriodEnd.value) {
      toast.add({
        title: 'Subscription Cancelled',
        description: 'Your subscription has been cancelled and server will be terminated at the end of your billing period.',
        color: 'success',
        icon: 'i-heroicons-check-circle',
        timeout: 6000
      });
    } else {
      toast.add({
        title: 'Subscription Cancelled',
        description: 'Your subscription has been cancelled. Your server will remain accessible until the end of your billing period.',
        color: 'success',
        icon: 'i-heroicons-check-circle',
        timeout: 6000
      });
    }
  } catch (error) {
    toast.add({
      title: 'Cancellation Failed',
      description: error.data?.message || 'Failed to cancel your subscription',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    });
    console.error(error);
  }
};

const retryPayment = async () => {
  try {
    toast.add({
      title: 'Retrying Payment',
      description: 'Initiating payment process...',
      color: 'info',
      icon: 'i-heroicons-credit-card'
    });
    
    const { url } = await $fetch(`/api/order/${order.value.id}/retry-payment`, {
      method: 'POST'
    });
    
    if (url) {
      window.location.href = url;
    } else {
      throw new Error('No payment URL received');
    }
  } catch (error) {
    toast.add({
      title: 'Payment Failed',
      description: 'Failed to retry payment. Please try again.',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    });
    console.error(error);
  }
};

const deleteServer = async () => {
  try {
    toast.add({
      title: 'Deleting Server',
      description: 'Please wait while we process your request...',
      color: 'info',
      icon: 'i-heroicons-trash'
    });
    
    await $fetch(`/api/order/${order.value.id}`, {
      method: 'DELETE'
    });
    
    showDeleteModal.value = false;
    
    toast.add({
      title: 'Server Deleted',
      description: 'Your server has been deleted successfully',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    });
    
    // Redirect to orders page
    navigateTo('/dashboard/orders');
  } catch (error) {
    toast.add({
      title: 'Deletion Failed',
      description: 'Failed to delete your server',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    });
    console.error(error);
  }
};

const openPaymentMethodModal = async () => {
  try {
    const { clientSecret } = await $fetch(`/api/stripe/setup-intent`, { 
      method: 'POST' 
    });
    
    if (!clientSecret) {
      throw new Error('Failed to create setup intent');
    }
    
    // Show modal with Stripe Elements to update payment method
    showPaymentMethodModal.value = true;  // Fixed variable name
    paymentClientSecret.value = clientSecret;
    
    // Initialize after modal is shown
    await nextTick();
    await initializeStripeElements(clientSecret);
    
  } catch (error) {
    console.error('Error setting up payment method update:', error);
    toast.add({
      title: 'Payment Setup Failed',
      description: 'Failed to initialize payment update',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    });
  }
};

// Add method to initialize Stripe elements for payment method update
const initializeStripeElements = async (clientSecret) => {
  try {
    const stripeInstance = await $stripe();
    const elements = stripeInstance.elements({
      clientSecret,
      appearance: { 
        theme: 'night',
        variables: {
          colorPrimary: '#3b82f6',
          colorBackground: '#1f2937',
          fontFamily: 'Inter, system-ui, sans-serif',
        }
      }
    });
    
    const paymentElement = elements.create('payment', {
      fields: {
        billingDetails: 'auto'
      }
    });
    
    // Wait for nextTick to ensure the DOM is ready
    await nextTick();
    const mountElement = document.getElementById('payment-element');
    
    if (mountElement) {
      paymentElement.mount('#payment-element');
      stripeElements.value = elements;
    } else {
      throw new Error('Payment element mount point not found');
    }
  } catch (error) {
    console.error('Failed to initialize Stripe Elements:', error);
    toast.add({
      title: 'Form Load Failed',
      description: 'Failed to load payment form',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    });
    showPaymentMethodModal.value = false;
  }
};

const updatePaymentMethod = async () => {
  if (!stripeElements.value) {
    toast.add({
      title: 'Form Not Ready',
      description: 'Payment form not initialized',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    });
    return;
  }
  
  try {
    updatingPayment.value = true;
    const stripeInstance = await $stripe();
    
    const { error, setupIntent } = await stripeInstance.confirmSetup({
      elements: stripeElements.value,
      redirect: 'if_required',
      confirmParams: {
        return_url: window.location.origin + route.fullPath,
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (setupIntent?.status === 'succeeded') {
      // Update the payment method on our backend
      await $fetch(`/api/order/${order.value.id}/update-payment`, {
        method: 'POST',
        body: {
          setupIntentId: setupIntent.id
        }
      });
      
      toast.add({
        title: 'Payment Method Updated',
        description: 'Your payment method has been updated successfully',
        color: 'success',
        icon: 'i-heroicons-check-circle'
      });
      showPaymentMethodModal.value = false;
      await fetchOrder(); // Refresh order data
    } else if (setupIntent?.status === 'requires_action') {
      // Handle additional authentication steps if needed
      toast.add({
        title: 'Authentication Required',
        description: 'Additional authentication is needed',
        color: 'info',
        icon: 'i-heroicons-shield-check'
      });
      // The user will be redirected automatically by Stripe
    } else {
      throw new Error('Unexpected payment setup status');
    }
  } catch (error) {
    console.error('Error updating payment method:', error);
    toast.add({
      title: 'Update Failed',
      description: error.message || 'Failed to update payment method',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    });
  } finally {
    updatingPayment.value = false;
  }
};

const openPauseModal = () => {
  toast.add({
    title: 'Coming Soon',
    description: 'Pause feature will be available soon',
    color: 'info',
    icon: 'i-heroicons-information-circle'
  });
};

const openUpgradeModal = () => {
  toast.add({
    title: 'Coming Soon',
    description: 'Upgrade feature will be available soon',
    color: 'info',
    icon: 'i-heroicons-information-circle'
  });
};

// Add these helper methods to your script section

// Get icon based on invoice status
const getInvoiceIcon = (status) => {
  return {
    'PAID': 'heroicons:check-circle',
    'UNPAID': 'heroicons:clock',
    'PENDING': 'heroicons:clock',
    'FAILED': 'heroicons:exclamation-circle',
    'VOID': 'heroicons:x-circle'
  }[status] || 'heroicons:document-text';
};

// Get status badge class
const getInvoiceStatusClass = (status) => {
  return {
    'PAID': 'bg-green-400/20 text-green-400',
    'UNPAID': 'bg-red-400/20 text-red-400',
    'PENDING': 'bg-yellow-400/20 text-yellow-400',
    'FAILED': 'bg-red-400/20 text-red-400',
    'VOID': 'bg-gray-400/20 text-gray-400'
  }[status] || 'bg-gray-400/20 text-gray-400';
};

// Format date in relative terms (e.g., "2 days ago", "in 3 days")
const formatDateRelative = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return Math.abs(diffDays) === 1 ? 'Yesterday' : `${Math.abs(diffDays)} days ago`;
  } else if (diffDays === 0) {
    return 'Today';
  } else {
    return diffDays === 1 ? 'Tomorrow' : `in ${diffDays} days`;
  }
};

// Function to handle invoice download
const downloadInvoice = async (invoice) => {
  try {
    toast.add({
      title: 'Preparing Download',
      description: 'Getting your invoice ready...',
      color: 'info',
      icon: 'i-heroicons-document-arrow-down'
    });
    
    // Implement actual download logic here
    // For example:
    const { url } = await $fetch(`/api/invoices/${invoice.id}/download`);
    
    if (url) {
      // Open in new window or use direct download
      window.open(url, '_blank');
    } else {
      throw new Error('No download URL available');
    }
  } catch (error) {
    console.error('Failed to download invoice:', error);
    toast.add({
      title: 'Download Failed',
      description: 'Could not download invoice',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    });
  }
};

// Add this method to your script section
const reactivateSubscription = async () => {
  try {
    toast.add({
      title: 'Reactivating Subscription',
      description: 'Please wait while we process your request...',
      color: 'info',
      icon: 'i-heroicons-clock'
    });
    
    await $fetch(`/api/order/${order.value.id}/reactivate`, {
      method: 'POST'
    });
    
    await fetchOrder();
    
    toast.add({
      title: 'Subscription Reactivated',
      description: 'Your subscription has been successfully reactivated.',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    });
  } catch (error) {
    toast.add({
      title: 'Reactivation Failed',
      description: error.data?.message || 'Failed to reactivate your subscription',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    });
    console.error(error);
  }
};

// Initialize data
onMounted(fetchOrder);
</script>

<style>
@reference "~/assets/css/main.css";

.control-btn {
  @apply p-3 rounded-lg flex items-center justify-center gap-2 
         transition-all duration-200 border border-transparent
         hover:border-gray-700/50 text-sm;
}

.pay-btn {
  @apply px-4 py-2 bg-green-500/20 text-green-400 rounded-lg 
         hover:bg-green-500/30 transition-colors text-sm;
}

.danger-btn {
  @apply px-4 py-2 bg-red-500/20 text-red-400 rounded-lg 
         hover:bg-red-500/30 transition-colors flex items-center 
         justify-center text-sm;
}

.success-btn {
  @apply px-4 py-2 bg-green-500/20 text-green-400 rounded-lg 
         hover:bg-green-500/30 transition-colors text-sm;
}

.toggle-checkbox:checked {
  @apply right-0 border-blue-500;
}
.toggle-checkbox:checked + .toggle-label {
  @apply bg-blue-500;
}
.toggle-checkbox {
  right: 0;
  z-index: 1;
  border-color: #68D391;
}
.toggle-label {
  @apply block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer;
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
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
</style>