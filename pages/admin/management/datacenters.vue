<template>
    <div class="p-8 max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-300">Data Centers Management</h1>
        <button 
          @click="openCreateModal"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add New Data Center
        </button>
      </div>
  
      <!-- Data Centers Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-400">
          <thead class="bg-gray-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-gray-200 divide-y divide-gray-400">
            <tr v-if="loading">
              <td colspan="4" class="px-6 py-4 text-center text-gray-500">Loading data centers...</td>
            </tr>
            <tr v-else-if="dataCenters.length === 0">
              <td colspan="4" class="px-6 py-4 text-center text-gray-500">No data centers found</td>
            </tr>
            <tr v-for="dc in dataCenters" :key="dc.id">
              <td class="px-6 py-4 whitespace-nowrap">{{ dc.name }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ dc.location }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ formatDate(dc.createdAt) }}</td>
              <td class="px-6 py-4 whitespace-nowrap space-x-2">
                <button 
                  @click="openEditModal(dc)"
                  class="text-blue-500 hover:text-blue-700"
                >
                  Edit
                </button>
                <button 
                  @click="confirmDelete(dc)"
                  class="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Data Center Form Modal -->
      <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 class="text-xl font-bold mb-4">
            {{ isEditing ? 'Edit Data Center' : 'Create New Data Center' }}
          </h2>
          
          <form @submit.prevent="submitForm">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">Name</label>
                <input v-model="form.name" required class="p-2 border rounded w-full">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Location</label>
                <input v-model="form.location" required class="p-2 border rounded w-full">
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
                {{ submitting ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
  
      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white p-6 rounded-lg w-96">
          <h3 class="text-lg font-semibold mb-4">Confirm Delete</h3>
          <p class="mb-4">Are you sure you want to delete "{{ selectedItem?.name }}"?</p>
          <div class="flex justify-end gap-2">
            <button @click="showDeleteModal = false" class="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button 
              @click="deleteItem" 
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
  
  const dataCenters = ref([])
  const loading = ref(true)
  const showModal = ref(false)
  const isEditing = ref(false)
  const submitting = ref(false)
  const showDeleteModal = ref(false)
  const selectedItem = ref(null)
  const deleting = ref(false)

  const { $toast } = useNuxtApp()

  definePageMeta({
    layout: 'admin'
  })
  
  const defaultForm = () => ({
    name: '',
    location: ''
  })
  
  const form = ref(defaultForm())
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }
  
  const openCreateModal = () => {
    form.value = defaultForm()
    isEditing.value = false
    showModal.value = true
  }
  
  const openEditModal = (dc) => {
    form.value = { ...dc }
    isEditing.value = true
    showModal.value = true
  }
  
  const closeModal = () => {
    showModal.value = false
    form.value = defaultForm()
  }
  
  const submitForm = async () => {
    submitting.value = true
    try {
      const url = isEditing.value 
        ? `/api/admin/datacenters/${form.value.id}`
        : '/api/admin/datacenters'
  
      const method = isEditing.value ? 'PUT' : 'POST'
  
      await $fetch(url, {
        method,
        body: form.value
      })
  
      $toast.success(`Data Center ${isEditing.value ? 'updated' : 'created'} successfully`)
      await fetchDataCenters()
      closeModal()
    } catch (error) {
      $toast.error(error.data?.message || 'An error occurred')
    } finally {
      submitting.value = false
    }
  }
  
  const confirmDelete = (dc) => {
    selectedItem.value = dc
    showDeleteModal.value = true
  }
  
  const deleteItem = async () => {
    deleting.value = true
    try {
      await $fetch(`/api/admin/datacenters/${selectedItem.value.id}`, {
        method: 'DELETE'
      })
      $toast.success('Data Center deleted successfully')
      await fetchDataCenters()
    } catch (error) {
      $toast.error(error.data?.message || 'Failed to delete data center')
    } finally {
      deleting.value = false
      showDeleteModal.value = false
    }
  }
  
  const fetchDataCenters = async () => {
    try {
      loading.value = true
      dataCenters.value = await $fetch('/api/admin/datacenters')
    } catch (error) {
      $toast.error('Failed to load data centers')
    } finally {
      loading.value = false
    }
  }
  
  onMounted(fetchDataCenters)
</script>