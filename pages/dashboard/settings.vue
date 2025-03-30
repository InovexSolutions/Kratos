<!-- ~/pages/dashboard/settings.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
    <NavBar class="sticky top-0 z-50" />
    <!-- Loading state -->
    <div v-if="status === 'loading' || pending" class="container mx-auto px-4 max-w-4xl py-12">
      <div class="text-center space-y-4">
        <div class="animate-pulse text-gray-400">
          <div class="h-8 bg-gray-700/50 rounded w-64 mx-auto mb-4"></div>
          <div class="h-4 bg-gray-700/50 rounded w-48 mx-auto"></div>
        </div>
      </div>
    </div>
    <!-- Authenticated content -->
    <div v-else-if="status === 'authenticated'" class="container mx-auto px-4 max-w-4xl py-12">
      <!-- Header -->
      <div class="mb-12 text-center animate-fade-in-up">
        <h1 class="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Account Settings
        </h1>
        <p class="text-xl text-gray-300">Manage your profile and billing information</p>
      </div>

      <!-- Status Message -->
      <div v-if="message.visible" 
           :class="['p-4 mb-6 rounded-xl border backdrop-blur-lg', 
                    message.type === 'success' ? 'bg-green-500/10 border-green-400/30 text-green-300' : 
                    'bg-red-500/10 border-red-400/30 text-red-300']"
           role="alert">
        {{ message.text }}
      </div>

      <form @submit.prevent="updateProfile" class="space-y-8">
        <!-- Personal Information -->
        <div class="bg-gray-800/40 p-8 rounded-2xl border border-gray-700/50 backdrop-blur-lg">
          <h2 class="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Personal Information
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium mb-3 text-gray-400">First Name</label>
              <input v-model="form.firstName" type="text" 
                     class="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-100 
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
            </div>
            <div>
              <label class="block text-sm font-medium mb-3 text-gray-400">Last Name</label>
              <input v-model="form.lastName" type="text" 
                     class="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-100 
                            focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all">
            </div>
            <div>
              <label class="block text-sm font-medium mb-3 text-gray-400">Email</label>
              <input v-model="form.email" type="email" disabled 
                     class="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-400 
                            cursor-not-allowed">
            </div>
            <div>
              <label class="block text-sm font-medium mb-3 text-gray-400">Phone Number</label>
              <input v-model="form.phoneNumber" type="tel" 
                     class="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-100 
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
            </div>
          </div>
        </div>

        <!-- Billing Address -->
        <div class="bg-gray-800/40 p-8 rounded-2xl border border-gray-700/50 backdrop-blur-lg">
          <h2 class="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Billing Address
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="col-span-2">
              <label class="block text-sm font-medium mb-3 text-gray-400">Street Address</label>
              <input v-model="form.streetAddress" type="text" 
                     class="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-100 
                            focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all">
            </div>
            <div>
              <label class="block text-sm font-medium mb-3 text-gray-400">City</label>
              <input v-model="form.city" type="text" 
                     class="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-100 
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
            </div>
            <div>
              <label class="block text-sm font-medium mb-3 text-gray-400">State/Province</label>
              <input v-model="form.state" type="text" 
                     class="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-100 
                            focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all">
            </div>
            <div>
              <label class="block text-sm font-medium mb-3 text-gray-400">ZIP/Postal Code</label>
              <input v-model="form.zipCode" type="text" 
                     class="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-100 
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
            </div>
            <div>
              <label class="block text-sm font-medium mb-3 text-gray-400">Country</label>
              <input v-model="form.country" type="text" 
                     class="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-100 
                            focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all">
            </div>
          </div>
        </div>

        <!-- Company Information -->
        <div class="bg-gray-800/40 p-8 rounded-2xl border border-gray-700/50 backdrop-blur-lg">
          <h2 class="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Company Information
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium mb-3 text-gray-400">Company Name</label>
              <input v-model="form.companyName" type="text" 
                     class="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-100 
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
            </div>
            <div>
              <label class="block text-sm font-medium mb-3 text-gray-400">Tax ID</label>
              <input v-model="form.taxId" type="text" 
                     class="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-100 
                            focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all">
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-4 items-center">
          <div v-if="isLoading" class="text-gray-400 text-sm">
            <span class="animate-pulse">Saving changes...</span>
          </div>
          <button 
            type="button" 
            @click="resetForm" 
            class="px-6 py-3 border border-gray-600/50 rounded-xl text-gray-300 hover:bg-gray-700/30 
                   transition-all duration-300 hover:border-purple-500/30"
            :disabled="isLoading">
            Reset
          </button>
          <button 
            type="submit" 
            class="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-medium
                   hover:from-blue-600 hover:to-purple-700 transform hover:scale-[1.02] transition-all 
                   duration-300 shadow-lg shadow-blue-500/20 disabled:opacity-50"
            :disabled="isLoading">
            <span v-if="!isLoading">Save Changes</span>
            <span v-else class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
const { status, data: authData, getSession } = useAuth()
const router = useRouter()
// console.log('User data:', authData.value?.user)
// Fetch user data only when authenticated
const { data: user, pending, status: userStatus, refresh: refreshUser } = await useLazyAsyncData(
  'user',
  async () => {
    // Ensure we have a valid session first
    await getSession({ required: true })
    
    if (status.value === 'authenticated' && authData.value?.user.id) {
      const response = await $fetch(`/api/user/${authData.value.user.id}`)
      return response
    }
    console.error('User data not available')
    return null
  },
  {
    watch: [status], // Refresh when auth status changes
  }
)

// Handle auth state changes
watchEffect(() => {
  if (status.value === 'unauthenticated') {
    router.push('/login')
  }
})

// Define missing reactive state variables
const message = reactive({
  text: '',
  type: 'success',
  visible: false
})
const isLoading = ref(false)

// Initialize form with empty values
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  streetAddress: '',
  streetAddress2: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  companyName: '',
  taxId: ''
})

// Populate form when user data is available
watch(user, (newUser) => {
  if (newUser) {
    Object.assign(form, {
      firstName: newUser.firstName || '',
      lastName: newUser.lastName || '',
      email: newUser.email || '',
      phoneNumber: newUser.phoneNumber || '',
      streetAddress: newUser.streetAddress || '',
      streetAddress2: newUser.streetAddress2 || '',
      city: newUser.city || '',
      state: newUser.state || '',
      zipCode: newUser.zipCode || '',
      country: newUser.country || '',
      companyName: newUser.companyName || '',
      taxId: newUser.taxId || ''
    })
  }
}, { immediate: true })

async function updateProfile() {
  isLoading.value = true
  message.visible = false
  try {
    const { data } = await useFetch(`/api/user/${user.value.id}`, {
      method: 'PUT',
      body: form
    })
    // Show success message
    showMessage('Profile updated successfully', 'success')
    // Refresh user data
    await refreshUser()
  } catch (error) {
    showMessage(error.data?.message || 'Failed to update profile', 'error')
  } finally {
    isLoading.value = false
  }
}

function showMessage(text, type = 'success') {
  message.text = text
  message.type = type
  message.visible = true
  
  // Auto-hide message after 5 seconds
  setTimeout(() => {
    message.visible = false
  }, 5000)
}

function resetForm() {
  if (user.value) {
    Object.assign(form, {
      firstName: user.value.firstName || '',
      lastName: user.value.lastName || '',
      email: user.value.email || '',
      phoneNumber: user.value.phoneNumber || '',
      streetAddress: user.value.streetAddress || '',
      streetAddress2: user.value.streetAddress2 || '',
      city: user.value.city || '',
      state: user.value.state || '',
      zipCode: user.value.zipCode || '',
      country: user.value.country || '',
      companyName: user.value.companyName || '',
      taxId: user.value.taxId || ''
    })
  }
}
</script>

<style>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
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