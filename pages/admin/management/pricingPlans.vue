<template>
    <div class="p-8 max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Pricing Plans Management</h1>
        <button 
          @click="openCreateModal"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add New Plan
        </button>
      </div>
  
      <!-- Plans Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pricing Model</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Price</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading">
              <td colspan="5" class="px-6 py-4 text-center text-gray-500">Loading plans...</td>
            </tr>
            <tr v-else-if="plans.length === 0">
              <td colspan="5" class="px-6 py-4 text-center text-gray-500">No pricing plans found</td>
            </tr>
            <tr v-for="plan in plans" :key="plan.id">
              <td class="px-6 py-4 whitespace-nowrap">{{ plan.name }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ plan.serviceType }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span v-if="plan.pricingModel" class="bg-green-100 text-green-800 px-2 py-1 rounded">
                  Dynamic Pricing
                </span>
                <span v-else class="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                  Fixed Pricing
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">{{ formatCurrency(plan.priceMonthly) }}</td>
              <td class="px-6 py-4 whitespace-nowrap space-x-2">
                <button 
                  @click="openEditModal(plan)"
                  class="text-blue-500 hover:text-blue-700"
                >
                  Edit
                </button>
                <button 
                  @click="confirmDelete(plan)"
                  class="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Plan Form Modal -->
      <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h2 class="text-xl font-bold mb-4">
            {{ isEditing ? 'Edit Pricing Plan' : 'Create New Pricing Plan' }}
          </h2>
          
          <form @submit.prevent="submitForm">
            <div class="grid grid-cols-2 gap-4">
              <!-- Basic Information -->
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Plan Name</label>
                  <input v-model="form.name" required class="p-2 border rounded w-full">
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Service Type</label>
                  <select v-model="form.serviceType" required class="p-2 border rounded w-full">
                    <option value="GAME_SERVER">Game Server</option>
                    <option value="VPS">VPS</option>
                    <option value="DEDICATED_SERVER">Dedicated Server</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Monthly Price</label>
                  <input 
                    v-model="form.priceMonthly" 
                    type="number" 
                    step="0.01" 
                    required 
                    class="p-2 border rounded w-full"
                  >
                </div>
              </div>
  
              <!-- Pricing Model Configuration -->
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Pricing Model</label>
                  <div class="space-y-2">
                    <div v-for="(modifier, index) in form.pricingModel.modifiers" :key="index" class="border p-2 rounded">
                      <div class="flex justify-between mb-2">
                        <span class="font-medium">Modifier {{ index + 1 }}</span>
                        <button 
                          type="button" 
                          @click="removeModifier(index)"
                          class="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <div>
                          <label class="text-sm">Field Name</label>
                          <input v-model="modifier.field" required class="p-1 border rounded w-full">
                        </div>
                        <div>
                          <label class="text-sm">Type</label>
                          <select v-model="modifier.type" required class="p-1 border rounded w-full">
                            <option value="per_unit">Per Unit</option>
                            <option value="fixed">Fixed</option>
                          </select>
                        </div>
                        <div>
                          <label class="text-sm">Price</label>
                          <input 
                            v-model="modifier.price" 
                            type="number" 
                            step="0.01" 
                            required 
                            class="p-1 border rounded w-full"
                          >
                        </div>
                        <div>
                          <label class="text-sm">Unit (optional)</label>
                          <input v-model="modifier.unit" class="p-1 border rounded w-full">
                        </div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      @click="addModifier"
                      class="text-sm text-blue-500 hover:text-blue-700"
                    >
                      + Add Modifier
                    </button>
                  </div>
                </div>
              </div>
            </div>
  
            <div class="mt-6 flex justify-end gap-2">
              <button 
                type="button" 
                @click="closeModal"
                class="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                :disabled="submitting"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {{ submitting ? 'Saving...' : 'Save Plan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
  
      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white p-6 rounded-lg w-96">
          <h3 class="text-lg font-semibold mb-4">Confirm Delete</h3>
          <p class="mb-4">Are you sure you want to delete "{{ selectedPlan?.name }}"?</p>
          <div class="flex justify-end gap-2">
            <button @click="showDeleteModal = false" class="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button 
              @click="deletePlan" 
              :disabled="deleting"
              class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
            >
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  const { $toast } = useNuxtApp()
  
  const plans = ref([])
  const loading = ref(true)
  const showModal = ref(false)
  const isEditing = ref(false)
  const submitting = ref(false)
  const showDeleteModal = ref(false)
  const selectedPlan = ref(null)
  const deleting = ref(false)
  
  const defaultForm = () => ({
    name: '',
    serviceType: 'GAME_SERVER',
    priceMonthly: 0,
    pricingModel: {
      basePrice: 0,
      modifiers: []
    }
  })
  
  const form = ref(defaultForm())
  
  // Format currency display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }
  
  // Modifier management
  const addModifier = () => {
    form.value.pricingModel.modifiers.push({
      field: '',
      type: 'per_unit',
      price: 0,
      unit: ''
    })
  }
  
  const removeModifier = (index) => {
    form.value.pricingModel.modifiers.splice(index, 1)
  }
  
  // Modal handling
  const openCreateModal = () => {
    form.value = defaultForm()
    isEditing.value = false
    showModal.value = true
  }
  
  const openEditModal = (plan) => {
    form.value = {
      ...plan,
      pricingModel: plan.pricingModel || { basePrice: 0, modifiers: [] }
    }
    isEditing.value = true
    showModal.value = true
  }
  
  const closeModal = () => {
    showModal.value = false
    form.value = defaultForm()
  }
  
  // Form submission
  const submitForm = async () => {
    submitting.value = true
    try {
      const url = isEditing.value 
        ? `/api/admin/pricing-plans/${form.value.id}`
        : '/api/admin/pricing-plans'
  
      const method = isEditing.value ? 'PUT' : 'POST'

      form.value.priceMonthly = parseFloat(form.value.priceMonthly)
  
      await $fetch(url, {
        method,
        body: form.value
      })
  
      $toast.success(`Plan ${isEditing.value ? 'updated' : 'created'} successfully`)
      await fetchPlans()
      closeModal()
    } catch (error) {
      $toast.error(error.data?.message || 'An error occurred')
    } finally {
      submitting.value = false
    }
  }
  
  // Delete handling
  const confirmDelete = (plan) => {
    selectedPlan.value = plan
    showDeleteModal.value = true
  }
  
  const deletePlan = async () => {
    deleting.value = true
    try {
      await $fetch(`/api/admin/pricing-plans/${selectedPlan.value.id}`, {
        method: 'DELETE'
      })
      $toast.success('Plan deleted successfully')
      await fetchPlans()
    } catch (error) {
      $toast.error(error.data?.message || 'Failed to delete plan')
    } finally {
      deleting.value = false
      showDeleteModal.value = false
    }
  }
  
  // Fetch plans
  const fetchPlans = async () => {
    try {
      loading.value = true
      plans.value = await $fetch('/api/admin/pricing-plans')
    } catch (error) {
      $toast.error('Failed to load plans')
    } finally {
      loading.value = false
    }
  }
  
  onMounted(fetchPlans)
  </script>