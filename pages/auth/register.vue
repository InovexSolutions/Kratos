<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-12">
    <div class="max-w-2xl mx-auto px-4">
      <div class="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-8 animate-fade-in-up">
        <h1 class="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Create Your Account
        </h1>
        
        <form @submit.prevent="register" class="space-y-6">
          <!-- Personal Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-gray-300 mb-2">First Name <span class="text-red-500">*</span></label>
              <input v-model="form.first_name" type="text" required
                     class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
            </div>
            <div>
              <label class="block text-gray-300 mb-2">Last Name <span class="text-red-500">*</span></label>
              <input v-model="form.last_name" type="text" required
                     class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
            </div>
          </div>

          <!-- Contact Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-gray-300 mb-2">Email <span class="text-red-500">*</span></label>
              <input v-model="form.email" type="email" required
                     class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
            </div>
            <div>
              <label class="block text-gray-300 mb-2">Phone Number</label>
              <input v-model="form.phone_number" type="tel"
                     class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
            </div>
          </div>

          <!-- Billing Address -->
          <div class="space-y-4">
            <div>
              <label class="block text-gray-300 mb-2">Company Name</label>
              <input v-model="form.company_name" type="text"
                     class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
            </div>
            
            <div>
              <label class="block text-gray-300 mb-2">Street Address <span class="text-red-500">*</span></label>
              <input v-model="form.street_address" type="text" required
                     class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
            </div>
            
            <div>
              <label class="block text-gray-300 mb-2">Street Address 2</label>
              <input v-model="form.street_address2" type="text"
                     class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-gray-300 mb-2">City <span class="text-red-500">*</span></label>
                <input v-model="form.city" type="text" required
                       class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-gray-300 mb-2">State <span class="text-red-500">*</span></label>
                <input v-model="form.state" type="text" required
                       class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-gray-300 mb-2">Zip Code <span class="text-red-500">*</span></label>
                <input v-model="form.zip_code" type="text" required
                       class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-gray-300 mb-2">Country <span class="text-red-500">*</span></label>
                <select 
                  v-model="form.country" 
                  required
                  class="w-full bg-gray-800 rounded-lg px-4 py-3 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="" class="bg-gray-800 text-gray-400">Select Country</option>
                  <option 
                    v-for="country in countryList" 
                    :key="country.code" 
                    :value="country.code"
                    class="bg-gray-800 hover:bg-gray-700 text-gray-100"
                  >
                    {{ country.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-gray-300 mb-2">Tax ID (VAT Number)</label>
                <input v-model="form.tax_id" type="text"
                       class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
              </div>
            </div>
          </div>

          <!-- Password Section -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-gray-300 mb-2">Password <span class="text-red-500">*</span></label>
              <input v-model="form.password" type="password" required
                     class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
            </div>
            <div>
              <label class="block text-gray-300 mb-2">Confirm Password <span class="text-red-500">*</span></label>
              <input v-model="form.password_confirmation" type="password" required
                     class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
            </div>
          </div>

          <!-- Submit Button -->
          <button type="submit" 
                  class="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transform hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-blue-500/20">
            Create Account
          </button>

          <!-- Login Link -->
          <p class="text-center text-gray-400">
            Already have an account? 
            <NuxtLink to="/login" class="text-blue-400 hover:text-blue-300">Sign in here</NuxtLink>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  auth: false
});
import { countries } from '~/server/utils/countries';
const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  password_confirmation: '',
  phone_number: '',
  company_name: '',
  street_address: '',
  street_address2: '',
  city: '',
  state: '',
  zip_code: '',
  country: '',
  tax_id: ''
});

// Convert to sorted array of { code, name } objects
const countryList = computed(() => 
  Object.entries(countries)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
)

const errorMessage = ref('');
const isLoading = ref(false);

const register = async () => {
  if (form.password !== form.password_confirmation) {
    errorMessage.value = 'Passwords do not match';
    return;
  }

  try {
    isLoading.value = true;
    const { data, error } = await useFetch('/api/auth/register', {
      method: 'POST',
      body: {
        ...form,
        name: `${form.first_name} ${form.last_name}` // Maintain compatibility with existing auth
      }
    });

    if (error.value) {
      throw new Error(error.value.data?.message || 'Registration failed');
    }

    await navigateTo('/dashboard');
  } catch (error) {
    errorMessage.value = error.message;
    // Consider adding error highlighting for specific fields
  } finally {
    isLoading.value = false;
  }
};
</script>

<style>
/* Reuse animations from other pages */
.animate-fade-in-up {
  animation: fade-in-up 0.8s ease-out forwards;
}

@keyframes fade-in-up {
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