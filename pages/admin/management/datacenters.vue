<template>
    <div class="min-h-screen py-12">
      <div class="container mx-auto px-4">
        <!-- Header Section -->
        <section class="mb-12 animate-fade-in-up">
          <div class="flex justify-between items-center">
            <h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Data Centers
            </h1>
            <button 
              @click="openCreateModal"
              class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              + New Data Center
            </button>
          </div>
          <p class="text-gray-300 mt-2">Manage your server infrastructure locations</p>
        </section>
  
        <!-- Data Centers Table -->
        <div class="bg-gray-800/50 rounded-xl border border-gray-700/50 animate-slide-in-right">
          <table class="w-full">
            <thead class="border-b border-gray-700/50">
              <tr>
                <th class="px-6 py-4 text-left text-gray-400 font-medium">Name</th>
                <th class="px-6 py-4 text-left text-gray-400 font-medium">Location</th>
                <th class="px-6 py-4 text-left text-gray-400 font-medium">Created</th>
                <th class="px-6 py-4 text-left text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading" class="border-b border-gray-700/50">
                <td colspan="4" class="px-6 py-8 text-center text-gray-400">
                  <div class="flex justify-center items-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                </td>
              </tr>
              <tr 
                v-for="dc in dataCenters" 
                :key="dc.id"
                class="border-b border-gray-700/50 last:border-0 hover:bg-gray-800/20 transition-colors"
              >
                <td class="px-6 py-4 text-gray-200 font-medium">{{ dc.name }}</td>
                <td class="px-6 py-4 text-gray-300">{{ dc.location }}</td>
                <td class="px-6 py-4 text-gray-400">{{ formatDate(dc.createdAt) }}</td>
                <td class="px-6 py-4">
                  <div class="flex space-x-4">
                    <button 
                      @click="openEditModal(dc)"
                      class="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      @click="confirmDelete(dc)"
                      class="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!loading && dataCenters.length === 0" class="border-b border-gray-700/50">
                <td colspan="4" class="px-6 py-8 text-center text-gray-400">No data centers found</td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <!-- Modals (keep same structure but update styling) -->
        <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div class="bg-gray-800 rounded-xl border border-gray-700/50 w-full max-w-md animate-fade-in-up">
            <div class="p-6">
              <h2 class="text-2xl font-bold text-gray-100 mb-4">
                {{ isEditing ? 'Edit Data Center' : 'New Data Center' }}
              </h2>
              
              <form @submit.prevent="submitForm">
                <div class="space-y-6">
                  <div>
                    <label class="block text-sm text-gray-300 mb-2">Name</label>
                    <input 
                      v-model="form.name" 
                      required 
                      class="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                  </div>
                  <div>
                    <label class="block text-sm text-gray-300 mb-2">Location</label>
                    <input 
                      v-model="form.location" 
                      required 
                      class="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                  </div>
                </div>
  
                <div class="mt-8 flex justify-end gap-3">
                  <button 
                    type="button" 
                    @click="closeModal"
                    class="px-5 py-2.5 text-gray-300 hover:text-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    :disabled="submitting"
                    class="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {{ submitting ? 'Saving...' : 'Save' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
  
        <!-- Delete Modal -->
        <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div class="bg-gray-800 rounded-xl border border-gray-700/50 w-full max-w-md animate-fade-in-up">
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-100 mb-3">Confirm Delete</h3>
              <p class="text-gray-300 mb-6">Delete "{{ selectedItem?.name }}" permanently?</p>
              <div class="flex justify-end gap-3">
                <button 
                  @click="showDeleteModal = false" 
                  class="px-5 py-2.5 text-gray-300 hover:text-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  @click="deleteItem" 
                  :disabled="deleting"
                  class="px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {{ deleting ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
            </div>
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