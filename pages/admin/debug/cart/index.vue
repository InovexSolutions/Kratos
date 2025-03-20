<template>
    <div class="p-8 max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-6">Cart API Debug</h1>

        <!-- Add Item Section -->
        <div class="mb-8 p-4 bg-gray-100 rounded-lg">
            <h2 class="text-xl font-semibold mb-4">Add Item to Cart</h2>
            <div class="space-y-4">
                <input v-model="newItem.planId" placeholder="Plan ID" class="p-2 border rounded w-full">
                <textarea v-model="newItem.config" placeholder="Configuration (JSON)"
                    class="p-2 border rounded w-full h-32"></textarea>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Quantity</label>
                        <input v-model.number="newItem.quantity" type="number" 
                            class="p-2 border rounded w-full">
                    </div>
                </div>
                <button @click="addItem" :disabled="addingItem"
                    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400">
                    {{ addingItem ? 'Adding...' : 'Add Item' }}
                </button>
                <button @click="fillSampleData" class="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 ml-2">
                    Fill Sample Data
                </button>
                <div v-if="addError" class="text-red-500 mt-2">{{ addError }}</div>
            </div>
        </div>

        <!-- Current Cart Display -->
        <div class="mb-8 p-4 bg-gray-100 rounded-lg">
            <h2 class="text-xl font-semibold mb-4">Current Cart</h2>
            <div v-if="loadingCart" class="text-gray-600">Loading cart...</div>
            <div v-else>
                <div v-if="!cart?.items?.length" class="text-gray-600">Cart is empty</div>
                <div v-else class="space-y-4">
                    <div v-for="item in cart.items" :key="item.id" class="p-4 bg-white rounded shadow">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="font-semibold">{{ item.plan.name }}</h3>
                                <p class="text-sm text-gray-600">Plan ID: {{ item.plan.id }}</p>
                                <div class="mt-2 grid grid-cols-2 gap-4">
                                    <div>
                                        <p>Unit Price: {{ formatCurrency(item.unitPrice) }}</p>
                                        <p>Quantity: {{ item.quantity }}</p>
                                        <p class="font-semibold">Total: {{ formatCurrency(item.unitPrice * item.quantity) }}</p>
                                    </div>
                                    <div>
                                        <pre class="text-sm bg-gray-50 p-2 rounded">{{ item.configuration }}</pre>
                                    </div>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button @click="openUpdateModal(item)" class="text-blue-500 hover:text-blue-700">
                                    Edit
                                </button>
                                <button @click="deleteItem(item.id)" class="text-red-500 hover:text-red-700">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-t">
                        <h3 class="text-xl font-semibold text-right">
                            Cart Total: {{ formatCurrency(cart.total) }}
                        </h3>
                    </div>
                </div>
            </div>
        </div>

        <!-- Checkout Section -->
        <div class="mb-8 p-4 bg-gray-100 rounded-lg">
            <h2 class="text-xl font-semibold mb-4">Checkout</h2>
            <button @click="checkoutCart" :disabled="checkingOut || !cart?.items?.length"
                class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400">
                {{ checkingOut ? 'Processing...' : 'Checkout' }}
            </button>
            <div v-if="checkoutResult" class="mt-4 p-4 bg-white rounded shadow">
                <h3 class="font-semibold mb-2">Checkout Result:</h3>
                <pre>{{ checkoutResult }}</pre>
                <div v-if="checkoutResult.stripeSessionId" class="mt-4">
                    <a :href="checkoutResult.url" target="_blank" class="text-blue-500 hover:underline">
                        Proceed to Stripe Checkout
                    </a>
                </div>
            </div>
            <div v-if="checkoutError" class="text-red-500 mt-2">{{ checkoutError }}</div>
        </div>

        <!-- Update Quantity Modal -->
        <div v-if="selectedItem" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg w-96">
                <h3 class="text-lg font-semibold mb-4">Update Quantity</h3>
                <input v-model.number="updateQuantity" type="number" class="p-2 border rounded w-full mb-4">
                <div class="flex justify-end gap-2">
                    <button @click="selectedItem = null" class="px-4 py-2 text-gray-600 hover:text-gray-800">
                        Cancel
                    </button>
                    <button @click="updateItemQuantity"
                        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Update
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>

const newItem = ref({
    planId: '',
    config: '{}',
    quantity: 1
})

const cart = ref(null)
const loadingCart = ref(false)
const addError = ref('')
const addingItem = ref(false)

const checkoutResult = ref(null)
const checkoutError = ref('')
const checkingOut = ref(false)

const selectedItem = ref(null)
const updateQuantity = ref(1)

// Sample data for testing
const samplePlanId = '017290e0-4adf-45a3-988e-c9e46aab7ad6' // Replace with actual ID from your DB

// Add currency formatter
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount)
}

// Update sample data to include pricing-related fields
const fillSampleData = () => {
    newItem.value = {
        planId: samplePlanId,
        config: JSON.stringify({ 
            ram: 8, 
            cpu: 4,
            backupEnabled: true,
            disk: 1,
            location: 'EU Central'
        }, null, 2),
        quantity: 1
    }
}

// Fetch cart
const fetchCart = async () => {
    try {
        loadingCart.value = true
        const response = await $fetch('/api/cart', { method: 'GET' })
        cart.value = response
    } catch (error) {
        console.error('Error fetching cart:', error)
    } finally {
        loadingCart.value = false
    }
}

// Add item
const addItem = async () => {
    try {
        addingItem.value = true
        addError.value = ''
        const config = JSON.parse(newItem.value.config)

        await $fetch('/api/cart/items', {
            method: 'POST',
            body: {
                planId: newItem.value.planId,
                configuration: config,
                quantity: newItem.value.quantity
            }
        })

        await fetchCart()
        newItem.value = { planId: '', config: '{}', quantity: 1 }
    } catch (error) {
        addError.value = error || 'Failed to add item'
    } finally {
        addingItem.value = false
    }
}

// Delete item
const deleteItem = async (itemId) => {
    try {
        await $fetch(`/api/cart/items/${itemId}`, { method: 'DELETE' })
        await fetchCart()
    } catch (error) {
        console.error('Error deleting item:', error)
    }
}

// Update quantity
const openUpdateModal = (item) => {
    selectedItem.value = item
    updateQuantity.value = item.quantity
}

const updateItemQuantity = async () => {
    try {
        await $fetch(`/api/cart/items/${selectedItem.value.id}`, {
            method: 'PUT',
            body: { quantity: updateQuantity.value }
        })
        await fetchCart()
        selectedItem.value = null
    } catch (error) {
        console.error('Error updating item:', error)
    }
}

// Checkout
const checkoutCart = async () => {
    try {
        checkingOut.value = true
        checkoutError.value = ''
        const result = await $fetch('/api/cart/checkout', { method: 'POST' })

        checkoutResult.value = {
            ...result,
            stripeSessionUrl: result.stripeSessionId
                ? `/checkout/session/${result.stripeSessionId}`
                : null
        }

        await fetchCart()
    } catch (error) {
        checkoutError.value = error.data?.message || 'Checkout failed'
    } finally {
        checkingOut.value = false
    }
}

// Initial fetch
onMounted(fetchCart)
</script>