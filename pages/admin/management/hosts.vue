<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-12">
      <div class="container mx-auto px-4">
        <!-- Header Section -->
        <section class="mb-12 animate-fade-in-up">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Host Management
              </h1>
              <p class="text-gray-300 mt-2">Manage your server infrastructure hosts</p>
            </div>
            <button 
              @click="openCreateModal"
              class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              + New Host
            </button>
          </div>
        </section>
  
        <!-- Hosts Table -->
        <div class="bg-gray-800/50 rounded-xl border border-gray-700/50 animate-slide-in-right">
          <table class="w-full">
            <thead class="border-b border-gray-700/50">
              <tr>
                <th class="px-6 py-4 text-left text-gray-400 font-medium">Hostname</th>
                <th class="px-6 py-4 text-left text-gray-400 font-medium">Data Center</th>
                <th class="px-6 py-4 text-left text-gray-400 font-medium">Type</th>
                <th class="px-6 py-4 text-left text-gray-400 font-medium">Status</th>
                <th class="px-6 py-4 text-left text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading" class="border-b border-gray-700/50">
                <td colspan="5" class="px-6 py-8 text-center text-gray-400">
                  <div class="flex justify-center items-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                </td>
              </tr>
              <tr 
                v-for="host in hosts" 
                :key="host.id"
                class="border-b border-gray-700/50 last:border-0 hover:bg-gray-800/20 transition-colors"
              >
                <td class="px-6 py-4 text-gray-200 font-mono">{{ host.hostname }}</td>
                <td class="px-6 py-4 text-gray-300">{{ host.dataCenter?.name }}</td>
                <td class="px-6 py-4 text-gray-300">{{ formatHostType(host.type) }}</td>
                <td class="px-6 py-4">
                  <span :class="statusClasses(host.status)" class="px-3 py-1 rounded-full text-sm">
                    {{ host.status }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex space-x-4">
                    <button 
                      @click="openEditModal(host)"
                      class="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      @click="confirmDelete(host)"
                      class="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!loading && hosts.length === 0" class="border-b border-gray-700/50">
                <td colspan="5" class="px-6 py-8 text-center text-gray-400">No hosts found</td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <!-- Host Form Modal -->
        <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div class="bg-gray-800 rounded-xl border border-gray-700/50 w-full max-w-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div class="p-6">
              <h2 class="text-2xl font-bold text-gray-100 mb-6">
                {{ isEditing ? 'Edit Host' : 'New Host' }}
              </h2>
              
              <form @submit.prevent="submitForm">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-6">
                    <div>
                      <label class="block text-sm text-gray-300 mb-2">Hostname</label>
                      <input 
                        v-model="form.hostname"
                        required
                        class="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                    </div>
                    <div>
                      <label class="block text-sm text-gray-300 mb-2">Data Center</label>
                      <select 
                        v-model="form.dataCenterId"
                        required
                        class="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option 
                          v-for="dc in dataCenters" 
                          :key="dc.id" 
                          :value="dc.id"
                          class="bg-gray-800"
                        >
                          {{ dc.name }} ({{ dc.location }})
                        </option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm text-gray-300 mb-2">Type</label>
                      <select 
                        v-model="form.type"
                        required
                        class="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="GAME_SERVER" class="bg-gray-800">Game Server</option>
                        <option value="VPS" class="bg-gray-800">VPS</option>
                        <option value="DEDICATED_SERVER" class="bg-gray-800">Dedicated Server</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm text-gray-300 mb-2">Status</label>
                      <select 
                        v-model="form.status"
                        required
                        class="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="AVAILABLE" class="bg-gray-800">Available</option>
                        <option value="ALLOCATED" class="bg-gray-800">Allocated</option>
                        <option value="MAINTENANCE" class="bg-gray-800">Maintenance</option>
                        <option value="RETIRED" class="bg-gray-800">Retired</option>
                      </select>
                    </div>
                  </div>
  
                  <div class="space-y-6">
                    <div>
                      <label class="block text-sm text-gray-300 mb-2">Specifications (JSON)</label>
                      <textarea
                        v-model="form.specJson"
                        rows="8"
                        class="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-gray-100 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder='Example: { "cpu": 128, "ramGB": 512, "storageTB": 100 }'
                      ></textarea>
                    </div>
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
                    {{ submitting ? 'Saving...' : 'Save Host' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
  
        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div class="bg-gray-800 rounded-xl border border-gray-700/50 w-full max-w-md animate-fade-in-up">
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-100 mb-3">Confirm Delete</h3>
              <p class="text-gray-300 mb-6">Delete "{{ selectedItem?.hostname }}" permanently?</p>
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
  const { $toast } = useNuxtApp()
  
  const hosts = ref([])
  const dataCenters = ref([])
  const loading = ref(true)
  const showModal = ref(false)
  const isEditing = ref(false)
  const submitting = ref(false)
  const showDeleteModal = ref(false)
  const selectedItem = ref(null)
  const deleting = ref(false)
  
  definePageMeta({
    layout: 'admin'
  })
  
  const defaultForm = () => ({
    hostname: '',
    dataCenterId: '',
    type: 'GAME_SERVER',
    status: 'AVAILABLE',
    spec: {},
    specJson: '{\n"ip": "10.168.1.1",\n"cpu": 0,\n"ram": 0,\n"storage": 0\n}'
  })
  
  const form = ref(defaultForm())
  
    const statusClasses = (status) => {
      return {
        'AVAILABLE': 'bg-green-500/20 text-green-400',
        'ALLOCATED': 'bg-blue-500/20 text-blue-400',
        'MAINTENANCE': 'bg-yellow-500/20 text-yellow-400',
        'RETIRED': 'bg-red-500/20 text-red-400'
      }[status]
    }

    // Add host type formatter
    const formatHostType = (type) => {
      const typeMap = {
        'GAME_SERVER': 'Game Server',
        'VPS': 'VPS',
        'DEDICATED_SERVER': 'Dedicated Server'
      }
      return typeMap[type] || type
    }
  
  const openCreateModal = async () => {
    form.value = defaultForm()
    isEditing.value = false
    await fetchDataCenters()
    showModal.value = true
  }
  
  const openEditModal = async (host) => {
    await fetchDataCenters()
    form.value = {
      ...host,
      dataCenterId: host.dataCenterId,
      specJson: JSON.stringify(host.spec, null, 2)
    }
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
      // Parse JSON specs
      form.value.spec = JSON.parse(form.value.specJson)
      
      const url = isEditing.value 
        ? `/api/admin/hosts/${form.value.id}`
        : '/api/admin/hosts'
  
      const method = isEditing.value ? 'PUT' : 'POST'
  
      await $fetch(url, {
        method,
        body: {
          ...form.value,
          spec: form.value.spec
        }
      })
  
      $toast.success(`Host ${isEditing.value ? 'updated' : 'created'} successfully`)
      await fetchHosts()
      closeModal()
    } catch (error) {
      if (error.data?.message?.includes('JSON')) {
        $toast.error('Invalid JSON format for Specs')
      } else {
        $toast.error(error.data?.message || 'An error occurred')
      }
    } finally {
      submitting.value = false
    }
  }
  
  const confirmDelete = (host) => {
    selectedItem.value = host
    showDeleteModal.value = true
  }
  
  const deleteItem = async () => {
    deleting.value = true
    try {
      await $fetch(`/api/admin/hosts/${selectedItem.value.id}`, {
        method: 'DELETE'
      })
      $toast.success('Host deleted successfully')
      await fetchHosts()
    } catch (error) {
      $toast.error(error.data?.message || 'Failed to delete host')
    } finally {
      deleting.value = false
      showDeleteModal.value = false
    }
  }
  
  const fetchHosts = async () => {
    try {
      loading.value = true
      hosts.value = await $fetch('/api/admin/hosts')
    } catch (error) {
      $toast.error('Failed to load hosts')
    } finally {
      loading.value = false
    }
  }
  
  const fetchDataCenters = async () => {
    try {
      dataCenters.value = await $fetch('/api/admin/datacenters')
    } catch (error) {
      $toast.error('Failed to load data centers')
    }
  }
  
  onMounted(() => {
    fetchHosts()
    fetchDataCenters()
  })
  </script>