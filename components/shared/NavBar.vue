<!-- components/NavBar.vue -->
<template>
    <nav class="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center space-x-2">
            <span class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Kratos Host
            </span>
          </NuxtLink>
  
          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center space-x-8">
            <NuxtLink 
              to="/#games" 
              class="text-gray-300 hover:text-white transition-colors"
              @click="scrollToGames"
            >
              Games
            </NuxtLink>
            <!-- <NuxtLink 
              to="/pricing" 
              class="text-gray-300 hover:text-white transition-colors"
            >
              Pricing
            </NuxtLink> -->
            <NuxtLink 
              to="/support" 
              class="text-gray-300 hover:text-white transition-colors"
            >
              Support
            </NuxtLink>
  
            <!-- Auth Links -->
            <template v-if="!user">
              <NuxtLink 
                to="/auth/login" 
                class="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Login
              </NuxtLink>
              <NuxtLink 
                to="/auth/register" 
                class="text-gray-100 bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                Get Started
              </NuxtLink>
            </template>
  
            <!-- User Dropdown -->
            <div v-else class="relative">
              <button 
                class="flex items-center space-x-2"
                @mouseenter="showDropdown"
                @mouseleave="hideDropdown"
                @click="isDropdownOpen = !isDropdownOpen"
              >
                <div class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden">
                  <img v-if="image" :src="image" alt="User avatar" class="w-full h-full object-cover" >
                  <span v-else class="text-white text-sm font-bold">
                    {{ email[0].toUpperCase() || 'U' }}
                  </span>
                </div>
                <span class="text-gray-300">{{ email || 'U' }}</span>
              </button>
  
              <!-- Dropdown Menu -->
              <div 
                v-show="isDropdownOpen"
                class="absolute right-0 top-full mt-1 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-lg transition-all duration-200 origin-top"
                @mouseenter="showDropdown"
                @mouseleave="hideDropdown"
              >
                <NuxtLink 
                  to="/dashboard" 
                  class="block px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Dashboard
                </NuxtLink>
                <NuxtLink 
                  to="/dashboard/invoices" 
                  class="block px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Invoices
                </NuxtLink>
                <NuxtLink 
                  to="/dashboard/servers" 
                  class="block px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  <Icon name="heroicons:server" class="mr-2" />
                  Game Servers
                </NuxtLink>
                <NuxtLink to="/dashboard/settings" class="block px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white">
                  <Icon name="mdi:account-cog" class="mr-2" />
                  Settings
                </NuxtLink>
                <button 
                  class="block w-full text-left px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white" 
                  @click="authClient.signOut()"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
  
          <!-- Mobile Menu Button -->
          <button class="md:hidden text-gray-400 hover:text-white" @click="isMobileMenuOpen = !isMobileMenuOpen">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
  
        <!-- Mobile Menu -->
        <div v-show="isMobileMenuOpen" class="md:hidden py-4 space-y-4">
          <NuxtLink 
            to="/#games" 
            class="block text-gray-300 hover:text-white"
            @click="scrollToGames"
          >
            Games
          </NuxtLink>
          <!-- <NuxtLink 
            to="/pricing" 
            class="block text-gray-300 hover:text-white"
          >
            Pricing
          </NuxtLink> -->
          <NuxtLink 
            to="/support" 
            class="block text-gray-300 hover:text-white"
          >
            Support
          </NuxtLink>
  
          <template v-if="!user">
            <NuxtLink 
              to="/auth/login" 
              class="block px-4 py-2 text-gray-300 hover:text-white"
            >
              Login
            </NuxtLink>
            <NuxtLink 
              to="/auth/register" 
              class="block bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              Get Started
            </NuxtLink>
          </template>
  
          <template v-else>
            <NuxtLink 
              to="/dashboard" 
              class="block px-4 py-2 text-gray-300 hover:text-white"
            >
              Dashboard
            </NuxtLink>
            <NuxtLink 
              to="/dashboard/invoices" 
              class="block px-4 py-2 text-gray-300 hover:text-white"
            >
              Invoices
            </NuxtLink>
            <NuxtLink 
              to="/dashboard/servers" 
              class="block px-4 py-2 text-gray-300 hover:text-white"
            >
              <Icon name="heroicons:server" class="mr-2" />
              Game Servers
            </NuxtLink>
            <NuxtLink to="/dashboard/settings" class="nav-link">
              <Icon name="mdi:account-cog" class="mr-2" />
              Settings
            </NuxtLink>
            <button 
              class="block w-full text-left px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white" 
              @click="authClient.signOut()"
              >
              Logout
            </button>
          </template>
        </div>
      </div>
    </nav>
  </template>

<script setup>
import { useSession, authClient } from "~/lib/auth-client";

const { data: session } = await useSession(useFetch);

const user = computed(() => session.value?.user || null);
const email = computed(() => user.value?.email || "missigno");
const image = computed(() => user.value?.image || '');

const isMobileMenuOpen = ref(false);
const isDropdownOpen = ref(false);
let dropdownTimer = null;

const scrollToGames = () => {
  const gamesSection = document.querySelector('#games');
  if (gamesSection) {
    gamesSection.scrollIntoView({ behavior: 'smooth' });
  }
}

const showDropdown = () => {
  clearTimeout(dropdownTimer);
  isDropdownOpen.value = true;
}

const hideDropdown = () => {
  dropdownTimer = setTimeout(() => {
    isDropdownOpen.value = false;
  }, 150); // 150ms delay gives time to move to the dropdown
}
</script>
  
  <style scoped>
  .router-link-active {
    @reference text-white font-semibold;
  }
  
  .nuxt-link-exact-active {
    @reference text-white font-semibold;
  }
  </style>