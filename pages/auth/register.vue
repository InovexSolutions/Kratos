<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-12">
    <div class="max-w-2xl mx-auto px-4">
      <div class="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-8 animate-fade-in-up">
        <h1 class="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Create Your Account
        </h1>
        
        <form class="space-y-6" @submit.prevent="register">
          <!-- Contact Info -->
          <div>
            <label class="block text-gray-300 mb-2">Email <span class="text-red-500">*</span></label>
            <input v-model="form.email" type="email" required
                    class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
          </div>
          <!-- Personal Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-gray-300 mb-2">First Name <span class="text-red-500">*</span></label>
              <input
                v-model="form.first_name" type="text" required
                class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
            </div>
            <div>
              <label class="block text-gray-300 mb-2">Last Name <span class="text-red-500">*</span></label>
              <input
                v-model="form.last_name" type="text" required
                class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
            </div>
          </div>

          <!-- Password Section -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-gray-300 mb-2">Password <span class="text-red-500">*</span></label>
              <input
                v-model="form.password" type="password" required
                class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
            </div>
            <div>
              <label class="block text-gray-300 mb-2">Confirm Password <span class="text-red-500">*</span></label>
              <input
                v-model="form.password_confirmation" type="password" required
                class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit" 
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
import { signUp } from "~/lib/auth-client.js";

const errorMessage = ref('');
const isLoading = ref(false);

const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  password_confirmation: ''
});

const register = async () => {
  if (form.password !== form.password_confirmation) {
    errorMessage.value = 'Passwords do not match';
    return;
  }

  try {
    isLoading.value = true;
    const { data, error } = await signUp.email({
      email: form.email,
      password: form.password,
      name: `${form.first_name} ${form.last_name}`,
      callbackURL: '/dashboard',
      fetchOptions: {
        onError(context) {
          errorMessage.value = context.error.message;
        },
        onSuccess() {
          // Handle success if needed
        }
      },
    });
    console.log('Registration data:', data);
    console.log('Registration error:', error);

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