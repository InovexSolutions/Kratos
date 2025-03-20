<template>
    <div class="p-8 max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-300">Pterodactyl Servers</h1>
        <button 
          @click="openCreateModal"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create New Server
        </button>
      </div>
  
      <!-- Servers Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Identifier</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resources</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <!-- Loading and empty states remain unchanged -->
              <tr v-for="server in servers" :key="server.id">
                <td class="px-6 py-4 whitespace-nowrap">{{ server.name }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ server.identifier }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-xs">
                    CPU: {{ server.limits?.cpu || 0 }}%<br>
                    RAM: {{ formatMB(server.limits?.memory) }}<br>
                    Disk: {{ formatMB(server.limits?.disk) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ server.user?.email || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="statusClasses(server.status)">
                    {{ server.status }}
                  </span>
                </td>
                <!-- Actions column remains the same -->
                <td class="px-6 py-4 whitespace-nowrap space-x-2">
                  <button 
                    @click="openEditModal(server)"
                    class="text-blue-500 hover:text-blue-700"
                  >
                    Edit
                  </button>
                  <button 
                    @click="confirmDelete(server)"
                    class="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
        </table>
      </div>
  
      <!-- Server Form Modal -->
      <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 w-full max-w-2xl">
          <h2 class="text-xl font-bold mb-4">
            {{ isEditing ? 'Edit Server' : 'Create New Server' }}
          </h2>
          
          <form @submit.prevent="submitForm">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">Server Name</label>
                <input v-model="form.name" required class="p-2 border rounded w-full">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Description</label>
                <textarea v-model="form.description" class="p-2 border rounded w-full"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Nests</label>
                <select v-model="form.nestId" required class="p-2 border rounded w-full">
                  <option v-for="nest in nests" :key="nest.id" :value="nest.id">
                    {{ nest.id }} ({{ nest.name }})
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Egg</label>
                <select v-model="form.eggId" required class="p-2 border rounded w-full" :disabled="!form.nestId || eggs.length === 0">
                  <option v-if="!form.nestId" value="" disabled>Select a nest first</option>
                  <option v-else-if="eggs.length === 0" value="" disabled>Loading eggs...</option>
                  <option v-else value="">Select an Egg</option>
                  <option v-for="egg in eggs" :key="egg.id" :value="egg.id">
                    {{ egg.name }} ({{ egg.docker_image }})
                  </option>
                </select>
              </div>
            </div>
            <!-- Server Specs/Limits Section -->
            <div class="mt-4">
              <h3 class="font-medium text-lg mb-2">Resource Limits</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Memory (MB)</label>
                  <input 
                    type="number" 
                    v-model.number="form.limits.memory" 
                    required 
                    min="128"
                    class="p-2 border rounded w-full"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Disk Space (MB)</label>
                  <input 
                    type="number" 
                    v-model.number="form.limits.disk" 
                    required 
                    min="1024"
                    class="p-2 border rounded w-full"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">CPU Limit (%)</label>
                  <input 
                    type="number" 
                    v-model.number="form.limits.cpu" 
                    required 
                    min="0"
                    max="6400" 
                    class="p-2 border rounded w-full"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">I/O Weight</label>
                  <select v-model.number="form.limits.io" class="p-2 border rounded w-full">
                    <option v-for="i in [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 250, 500, 1000]" :key="i" :value="i">
                      {{ i }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Owner Selection -->
            <div class="mt-4">
              <label class="block text-sm font-medium mb-1">Server Owner</label>
              <div class="flex gap-2">
                <!-- In your template in the user dropdown -->
                <select v-model="form.userId" required class="p-2 border rounded flex-grow">
                    <option value="">Select Owner</option>
                    <option v-for="user in users" :key="user.id" :value="user.id">
                    {{ user.name }} ({{ user.email }})
                    </option>
                </select>
                <button 
                  type="button"
                  @click="refreshUsers" 
                  class="p-2 text-blue-500 hover:text-blue-700"
                  title="Refresh users list"
                >
                  <span>🔄</span>
                </button>
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
                {{ submitting ? 'Saving...' : 'Save Server' }}
              </button>
            </div>
          </form>
        </div>
      </div>
  
      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white p-6 rounded-lg w-96">
          <h3 class="text-lg font-semibold mb-4">Confirm Delete</h3>
          <p class="mb-4">Are you sure you want to delete "{{ selectedServer?.name }}"?</p>
          <div class="flex justify-end gap-2">
            <button @click="showDeleteModal = false" class="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button 
              @click="deleteServer" 
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
  
  const servers = ref([])
  const nests = ref([])
  const eggs = ref([])
  const users = ref([])
  const loading = ref(true)
  const showModal = ref(false)
  const isEditing = ref(false)
  const submitting = ref(false)
  const showDeleteModal = ref(false)
  const selectedServer = ref(null)
  const deleting = ref(false)
  
  definePageMeta({
    layout: 'admin'
  })

  const form = ref({
    name: '',
    description: '',
    nestId: '',
    eggId: '',
    userId: '', // Should be populated with actual user ID
    limits: {
      memory: 1024,  // Default 1GB
      disk: 10240,   // Default 10GB
      cpu: 100,      // Default 100%
      io: 500        // Default I/O weight
    }
  })

  // Format MB to readable format
    const formatMB = (mb) => {
      if (!mb) return '0 MB'
      if (mb < 1024) return `${mb} MB`
      return `${(mb / 1024).toFixed(1)} GB`
    }

    // Fetch users for owner selection
    // In your script section, update the fetchUsers function
    const fetchUsers = async () => {
      try {
        const response = await $fetch('/api/admin/users')
        users.value = response.data.map((user) => user.attributes)
        console.log(users.value)
      } catch (error) {
        $toast.error('Failed to load users')
        console.error(error)
      }
    }

    // Refresh users list
    const refreshUsers = () => {
      fetchUsers()
    }

  
  const statusClasses = (status) => {
    const classes = {
      installing: 'bg-yellow-100 text-yellow-800',
      install_failed: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800',
      restoring: 'bg-blue-100 text-blue-800',
      normal: 'bg-green-100 text-green-800'
    }
    return `${classes[status] || 'bg-gray-100'} px-2 py-1 rounded`
  }
  
  const openCreateModal = async () => {
    await fetchNests()
    await fetchUsers()
    form.value = {
        name: '',
        description: '',
        nestId: '',
        eggId: '',
        userId: '',
        limits: {
          memory: 1024,  // Default 1GB
          disk: 10240,   // Default 10GB
          cpu: 100,      // Default 100%
          io: 500        // Default I/O weight
        }
     }
    isEditing.value = false
    showModal.value = true
  }
  
    const openEditModal = async (server) => {
      await fetchNests()
      await fetchUsers()
    
      // Ensure limits exist in the form
      const limits = server.limits || {
        memory: 1024,
        disk: 10240,
        cpu: 100,
        io: 500
      }

      // Create a properly formatted form object
      form.value = { 
        id: server.id,
        name: server.name,
        description: server.description,
        nestId: server.nest,  // This should be the nest ID
        eggId: server.egg,    // This should be the egg ID
        userId: server.user?.id || '',  // Get the user ID
        limits: limits
      }

      // Fetch eggs for the selected nest
      if (form.value.nestId) {
        await fetchEggs(form.value.nestId)
      }

      isEditing.value = true
      showModal.value = true
    }
  
    const submitForm = async () => {
        submitting.value = true
        try {
        const url = isEditing.value 
            ? `/api/admin/pterodactyl-servers/${form.value.id}`
            : '/api/admin/pterodactyl-servers'
    
        const method = isEditing.value ? 'PUT' : 'POST'

        // Format the data to match what the API expects
        const requestData = {
            name: form.value.name,
            userId: form.value.userId,
            eggId: form.value.eggId,
            description: form.value.description,
        
            // Properly format resource limits
            limits: {
            memory: parseInt(form.value.limits?.memory) || 1024,
            disk: parseInt(form.value.limits?.disk) || 10240,
            cpu: parseInt(form.value.limits?.cpu) || 100,
            io: parseInt(form.value.limits?.io) || 500,
            swap: 0
            },

            // Add feature limits
            feature_limits: {
            databases: 5,
            allocations: 5,
            backups: 1
            }
        }
    
        const response = await $fetch(url, {
            method,
            body: requestData
        })
    
        console.log("Server API response:", response)
        $toast.success(`Server ${isEditing.value ? 'updated' : 'created'} successfully`)
        await fetchServers()
        closeModal()
        } catch (error) {
        console.error("API error:", error)
        $toast.error(error.data?.message || 'An error occurred')
        } finally {
        submitting.value = false
        }
    }
  
  const confirmDelete = (server) => {
    selectedServer.value = server
    showDeleteModal.value = true
  }
  
  const deleteServer = async () => {
    deleting.value = true
    try {
      await $fetch(`/api/admin/pterodactyl-servers/${selectedServer.value.id}`, {
        method: 'DELETE'
      })
      $toast.success('Server deleted successfully')
      await fetchServers()
    } catch (error) {
      $toast.error(error.data?.message || 'Failed to delete server')
    } finally {
      deleting.value = false
      showDeleteModal.value = false
    }
  }
  
    const fetchServers = async () => {
      try {
        loading.value = true
        const response = await $fetch('/api/admin/pterodactyl-servers')

        // Map the response data to what the UI expects
        servers.value = response.data.map((server) => {
          const attributes = server.attributes
        
          // Extract user data if available in the relationships
          if (server.attributes?.relationships?.user?.data) {
            attributes.user = server.attributes.relationships.user.data.attributes || 
                              server.attributes.relationships.user.data
          }

          return {
            id: attributes.id,
            name: attributes.name,
            identifier: attributes.identifier,
            description: attributes.description,
            status: attributes.status || 'normal',
            limits: attributes.limits || {},
            user: attributes.user,
            suspended: attributes.suspended
          }
        })
      } catch (error) {
        console.error("Error fetching servers:", error)
        $toast.error('Failed to load servers')
      } finally {
        loading.value = false
      }
    }

  const fetchNests = async () => {
    try {
      const response = await $fetch('/api/admin/pterodactyl-servers/nests')
      nests.value = response.data.map((nest) => nest.attributes)
    } catch (error) {
      $toast.error(`Failed to load nests error ${error}`)
      console.error(error)
    }
  }
  
    // Fix the fetchEggs function to accept the nestId parameter
    const fetchEggs = async (nestId) => {
      try {
        eggs.value = [] // Clear eggs while loading
        if (!nestId) {
          return // Don't fetch if no nest selected
        }

        const response = await $fetch(`/api/admin/pterodactyl-servers/eggs?nestId=${nestId}`)
        // Transform the nested structure if necessary
        eggs.value = response.data.map(egg => ({
          id: egg.attributes.id,
          name: egg.attributes.name,
          docker_image: egg.attributes.docker_image,
          // Include other needed properties
        }))
      } catch (error) {
        $toast.error('Failed to load eggs')
        console.error(error)
      }
    }

    // Watch for changes to the selected nest
    watch(() => form.value.nestId, async (newNestId) => {
      // When nest changes, reset egg selection
      form.value.eggId = ''
    
      // Fetch eggs for the selected nest
      if (newNestId) {
        await fetchEggs(newNestId)
      } else {
        eggs.value = [] // Clear eggs if no nest selected
      }
    })
  
  onMounted(() => {
    fetchServers()
    fetchUsers() // Add this line
  })
  </script>