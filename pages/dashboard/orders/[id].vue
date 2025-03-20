<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
    <NavBar class="sticky top-0 z-50" />

    <div class="container mx-auto px-4 py-12 max-w-7xl">
      <!-- Order Header -->
      <div class="mb-8 animate-fade-in-up">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              {{ order.items[0].plan.name }} Manager
            </h1>
            <p class="text-gray-300 mt-2">Order ID: #{{ order.id.slice(0,8) }}</p>
          </div>
          <span class="px-4 py-2 rounded-full text-sm" 
                :class="statusBadge(order.status)">
            {{ order.status }}
          </span>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
            <div class="text-gray-400 text-sm mb-1">Next Payment</div>
            <div class="text-xl font-bold text-purple-400">
              {{ formatCurrency(order.price) }}
            </div>
            <div class="text-gray-400 text-xs mt-1">
              {{ formatDate(order.nextBillingDate) }}
            </div>
          </div>
          
          <div class="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
            <div class="text-gray-400 text-sm mb-1">Uptime</div>
            <div class="text-xl font-bold text-green-400">99.97%</div>
            <div class="text-gray-400 text-xs mt-1">Last 30 days</div>
          </div>

          <div class="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
            <div class="text-gray-400 text-sm mb-1">Resources</div>
            <div class="text-xl font-bold text-blue-400">{{ order.config }}GB</div>
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
              <button class="control-btn bg-green-500/20 hover:bg-green-500/30"
                      @click="restartServer">
                <Icon name="heroicons:arrow-path" class="text-green-400" />
                Restart Instance
              </button>
              <button class="control-btn bg-blue-500/20 hover:bg-blue-500/30"
                      @click="openBackupModal">
                <Icon name="heroicons:server-stack" class="text-blue-400" />
                Create Backup
              </button>
              <button class="control-btn bg-purple-500/20 hover:bg-purple-500/30"
                      @click="openStatsModal">
                <Icon name="heroicons:chart-bar" class="text-purple-400" />
                View Metrics
              </button>
              <button class="control-btn bg-yellow-500/20 hover:bg-yellow-500/30"
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
              <button class="text-blue-400 hover:text-blue-300 text-sm"
                      @click="refreshPaymentStatus">
                Refresh Status
              </button>
            </div>

            <!-- Payment Methods -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-gray-400">Payment Method</h3>
                <button class="text-sm text-blue-400 hover:text-blue-300"
                        @click="openPaymentMethodModal">
                  Change Card
                </button>
              </div>
              <div class="bg-gray-900/50 p-4 rounded-lg flex items-center gap-4">
                <Icon name="heroicons:credit-card" class="text-2xl text-gray-400" />
                <span class="font-mono text-lg text-gray-100">**** **** **** {{ order.paymentMethod?.card?.last4 }}</span>
                <span class="text-sm text-gray-400">Exp {{ order.paymentMethod?.card?.exp_month }}/{{ order.paymentMethod?.card?.exp_year }}</span>
              </div>
            </div>

            <!-- Invoices -->
            <div>
              <h3 class="text-gray-400 mb-3">Recent Invoices</h3>
              <div v-for="invoice in order.invoices" :key="invoice.id"
                   class="bg-gray-900/50 p-4 rounded-lg mb-2 flex items-center justify-between">
                <div>
                  <div class="text-sm">{{ formatDate(invoice.createdAt) }}</div>
                  <div :class="invoiceStatusColor(invoice.status)"
                       class="text-xs">
                    {{ invoice.status }}
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <div class="text-right">
                    <div class="text-sm">{{ formatCurrency(invoice.amount) }}</div>
                    <div class="text-xs text-gray-400">{{ invoice.period }}</div>
                  </div>
                  <button v-if="order.status === 'UNPAID'"
                          class="pay-btn"
                          @click="payInvoice(invoice)">
                    Pay Now
                  </button>
                </div>
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
                <span class="text-gray-100">{{ order.billingCycle }}</span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-gray-400">Next Renewal</span>
                <span class="text-gray-100">{{ formatDate(order.nextBillingDate) }}</span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-gray-400">Auto Renew</span>
                <ToggleSwitch :value="order.autoRenew" @toggle="toggleAutoRenew" />
              </div>

              <div class="pt-4 border-t border-gray-700/50 space-y-3">
                <button class="danger-btn w-full"
                        @click="openCancelModal"
                        v-if="order.status === 'ACTIVE'">
                  Cancel Subscription
                </button>
                
                <button class="danger-btn w-full"
                        @click="openPauseModal"
                        v-if="order.status === 'ACTIVE'">
                  Pause Service
                </button>

                <button class="success-btn w-full"
                        @click="openUpgradeModal"
                        v-if="order.status === 'ACTIVE'">
                  Upgrade Plan
                </button>

                <button class="success-btn w-full"
                        @click="retryPayment"
                        v-if="order.status === 'PAST_DUE'">
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
              <button class="danger-btn w-full"
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
    <CancelSubscriptionModal v-if="showCancelModal" @close="showCancelModal = false" />
    <PaymentMethodModal v-if="showPaymentMethodModal" @close="showPaymentMethodModal = false" />
    <ConfirmDeleteModal v-if="showDeleteModal" @close="showDeleteModal = false" />
  </div>
</template>

<script setup>
const route = useRoute()
const { data: order } = await useFetch(`/api/order/${route.params.id}`)
console.log("order:", order)


const formatCurrency = (amount) => { /* ... */ }
const formatDate = (dateString) => { /* ... */ }
const formatDaysActive = (createdAt) => { /* ... */ }

const statusBadge = (status) => {
  return {
    ACTIVE: 'bg-green-400/20 text-green-400',
    PENDING: 'bg-blue-400/20 text-blue-400',
    UNPAID: 'bg-red-400/20 text-red-400',
    PAST_DUE: 'bg-red-400/20 text-red-400',
    PAUSED: 'bg-yellow-400/20 text-yellow-400',
    CANCELLED: 'bg-gray-400/20 text-gray-400'
  }[status]
}

const invoiceStatusColor = (status) => {
  return {
    PAID: 'text-green-400',
    UNPAID: 'text-red-400',
    PENDING: 'text-yellow-400'
  }[status]
}

// Control Functions
const restartServer = async () => { /* API call */ }
const openBackupModal = () => { /* ... */ }
const openStatsModal = () => { /* ... */ }
const openConfigEditor = () => { /* ... */ }

// Subscription Management
const toggleAutoRenew = async () => { /* API call */ }
const openCancelModal = () => { showCancelModal.value = true }
const openPauseModal = () => { /* ... */ }
const openUpgradeModal = () => { /* ... */ }
const retryPayment = async () => { /* API call */ }

// Payment Methods
const openPaymentMethodModal = () => { showPaymentMethodModal.value = true }

// Danger Zone
const openDeleteModal = () => { showDeleteModal.value = true }

// Modals state
const showCancelModal = ref(false)
const showPaymentMethodModal = ref(false)
const showDeleteModal = ref(false)
</script>

<style scoped>
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
</style>