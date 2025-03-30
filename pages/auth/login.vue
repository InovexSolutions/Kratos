<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-12">
    <div class="max-w-2xl mx-auto px-4">
      <div class="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-8 animate-fade-in-up">
        <h1 class="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Welcome Back
        </h1>
        
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email Input -->
          <div>
            <label class="block text-gray-300 mb-2">Email</label>
            <input 
              v-model="email" 
              type="email" 
              placeholder="your@email.com"
              autocomplete="username"
              required
              class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
          </div>

          <!-- Password Input -->
          <div>
            <label class="block text-gray-300 mb-2">Password</label>
            <input 
              v-model="password" 
              type="password" 
              placeholder="••••••••"
              autocomplete="current-password"
              required
              class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="text-red-400 text-sm">
            ⚠️ {{ errorMessage }}
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            :disabled="isLoading"
            class="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transform hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            <span v-if="!isLoading">Login</span>
            <span v-else class="flex items-center justify-center">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          </button>
          <button 
            type="button" 
            @click="signIn('github')"
            class="w-full bg-gray-800/40 hover:bg-gray-700/40 text-gray-300 px-8 py-4 rounded-xl text-lg font-semibold transform hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-gray-800/20"
          >
            <span class="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="w-6 h-6 mr-2 bi bi-github" viewBox="0 0 16 16">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/>
              </svg>
              Login with GitHub
            </span>
          </button>
          <button 
            type="button" 
            @click="signIn('discord')"
            class="w-full bg-gray-800/40 hover:bg-gray-700/40 text-gray-300 px-8 py-4 rounded-xl text-lg font-semibold transform hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-gray-800/20"
          >
            <span class="flex items-center justify-center">
              <svg class="w-6 h-6 mr-2" fill="currentColor" stroke="none" viewBox="0 0 16 16">
                <!-- <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path> -->
                <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"/>
              </svg>
              Login with Discord
            </span>
          </button>
          <!-- New Authentik Button -->
          <button 
            type="button" 
            @click="signIn('authentik')"
            class="w-full bg-gray-800/40 hover:bg-gray-700/40 text-gray-300 px-8 py-4 rounded-xl text-lg font-semibold transform hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-gray-800/20"
          >
            <span class="flex items-center justify-center">
              <svg class="w-6 h-6 mr-2" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
                <g fill="#fff"><path d="m535.5 293.4h31.9v91h-31.9z"/><path d="m618.3 289.6h31.9v71.1h-31.9z"/><path d="m154.1 393.8c-42.562 0-81.726 23.16-102.041 60.5h-.059c-42.3 73.8 16.3 173.4 102.1 171.1 66.5 0 121.3-98.5 121.3-116 0-7.7-10.8-31.3-28.5-55-22.3-30.1-55.7-60.6-92.8-60.6zm-6.625 42.9c14.825-.75 29.825 4.4 42.525 17.7 16.8 15.8 30.7 34.4 41.2 54.9-74.4 155.8-205 23-125-55h-.075c11.977-10.24 26.575-16.853 41.35-17.6z"/><path d="m948.1 292.3v411.4c-.2 78.9-64.2 142.8-143.1 142.7h-60.6v-140h-289.7v140h-60.7c-78.8 0-142.7-63.8-142.9-142.7v-129.5h459.3v-247.3h-221.7v138.9h-237.6v-173.5q0-8.3.9-16.5 1.1-9.7 3.6-19.2c.5-2 1.1-4 1.7-6q.2-.8.4-1.5c.4-1.1.7-2 1-2.9.4-1 .7-2 1.1-3 .3-.9.8-2.2 1.2-3.3.5-1 .9-2.1 1.4-3.2 3.5-8.4 7.9-16.4 12.9-24v-.3c1.4-1.8 2.7-3.7 4.1-5.6s2.3-3 3.5-4.5 2.9-3.4 4.3-5c1.4-1.7 2.8-3.2 4.3-4.7q1.1-1.3 2.5-2.4c5.2-5.2 10.9-10 16.9-14.3 1.6-1.1 3.3-2.2 5-3.3 1.7-1.2 3.9-2.5 5.9-3.7q5.6-3.3 11.5-6l3.7-1.7q8.2-3.6 16.7-6c2.3-.7 4.4-1.3 6.7-1.8q1.6-.5 3.3-.7 9.5-2.1 19.3-2.9h432.7q9.8.8 19.4 2.9c1.1 0 2.1.4 3.2.7 2.3.5 4.5 1.1 6.7 1.8q8.5 2.4 16.7 6l3.7 1.7q6 2.7 11.5 6 3 1.8 5.9 3.7c1.8 1.2 3.4 2.2 5 3.3 6.9 5.1 13.5 10.7 19.5 16.8q2.3 2.3 4.4 4.7c1.4 1.6 2.8 3.3 4.2 5l3.5 4.6c1.4 1.8 2.7 3.7 4.1 5.6v.2c5 7.6 9.4 15.7 12.9 24.1l1.4 3.2 1.2 3.2c.4 1 .7 2 1.1 3l1 2.9c0 .5.3 1 .4 1.6.6 1.9 1.2 4 1.7 6q2.5 9.5 3.6 19.2 1.1 8.1 1.3 16.3z"/></g>
              </svg>
              Login with Authentik
            </span>
          </button>

          <!-- Additional Links -->
          <div class="text-center space-y-2">
            <NuxtLink 
              to="/auth/register" 
              class="text-blue-400 hover:text-blue-300 text-sm"
            >
              Create New Account
            </NuxtLink>
            <div class="text-gray-400"></div>
            <NuxtLink 
              to="/auth/forgot-password" 
              class="text-blue-400 hover:text-blue-300 text-sm"
            >
              Forgot Password?
            </NuxtLink>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { signIn } from "~/lib/auth-client.js";
definePageMeta({
  auth: false
})
const route = useRoute()
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)



const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    await signIn.email(
        {
            email: email.value,
            password: password.value,
            callbackURL: route.query.redirect || '/dashboard',
        },
        {
            onError(context) {
                alert(context.error.message);
            },
        },
    );
    
  } catch (error) {
    errorMessage.value = error.message || 'Login failed. Please check your credentials.'
    console.error('Login error:', error)
  } finally {
    isLoading.value = false
  }
}
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