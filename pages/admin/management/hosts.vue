<template>
    <div class="p-8 max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-300">Hosts Management</h1>
        <button 
          @click="openCreateModal"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add New Host
        </button>
      </div>
  
      <!-- Hosts Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-400 border-t border-gray-200">
          <thead class="bg-gray-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hostname</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Center</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-gray-200 divide-y divide-gray-400">
            <tr v-if="loading">
              <td colspan="5" class="px-6 py-4 text-center text-gray-500">Loading hosts...</td>
            </tr>
            <tr v-else-if="hosts.length === 0">
              <td colspan="5" class="px-6 py-4 text-center text-gray-500">No hosts found</td>
            </tr>
            <tr v-for="host in hosts" :key="host.id">
              <td class="px-6 py-4 whitespace-nowrap">{{ host.hostname }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ host.dataCenter?.name }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ host.type }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="statusClasses(host.status)">
                  {{ host.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap space-x-2">
                <button 
                  @click="openEditModal(host)"
                  class="text-blue-500 hover:text-blue-700"
                >
                  Edit
                </button>
                <button 
                  @click="confirmDelete(host)"
                  class="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Host Form Modal -->
      <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h2 class="text-xl font-bold mb-4">
            {{ isEditing ? 'Edit Host' : 'Create New Host' }}
          </h2>
          
          <form @submit.prevent="submitForm">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Hostname</label>
                  <input v-model="form.hostname" required class="p-2 border rounded w-full">
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Data Center</label>
                  <select v-model="form.dataCenterId" required class="p-2 border rounded w-full">
                    <option 
                      v-for="dc in dataCenters" 
                      :key="dc.id" 
                      :value="dc.id"
                    >
                      {{ dc.name }} ({{ dc.location }})
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Type</label>
                  <select v-model="form.type" required class="p-2 border rounded w-full">
                    <option value="GAME_SERVER">Game Server</option>
                    <option value="VPS">VPS</option>
                    <option value="DEDICATED_SERVER">Dedicated Server</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Status</label>
                  <select v-model="form.status" required class="p-2 border rounded w-full">
                    <option value="AVAILABLE">Available</option>
                    <option value="ALLOCATED">Allocated</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="RETIRED">Retired</option>
                  </select>
                </div>
              </div>
  
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Specs (JSON)</label>
                  <textarea 
                    v-model="form.specJson" 
                    class="p-2 border rounded w-full font-mono" 
                    rows="6"
                    placeholder='Example: { "cpu": 128, "ramGB": 512, "storageTB": 100 }'
                  ></textarea>
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
                {{ submitting ? 'Saving...' : 'Save Host' }}
              </button>
            </div>
          </form>
        </div>
      </div>
  
      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white p-6 rounded-lg w-96">
          <h3 class="text-lg font-semibold mb-4">Confirm Delete</h3>
          <p class="mb-4">Are you sure you want to delete "{{ selectedItem?.hostname }}"?</p>
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
    const classes = {
      AVAILABLE: 'bg-green-100 text-green-800',
      ALLOCATED: 'bg-blue-100 text-blue-800',
      MAINTENANCE: 'bg-yellow-100 text-yellow-800',
      RETIRED: 'bg-gray-100 text-gray-800'
    }
    return `${classes[status]} px-2 py-1 rounded`
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