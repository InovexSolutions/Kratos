<template>
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <NuxtLink 
              to="/admin/management" 
              class="text-xl font-bold text-gray-800"
            >
              Admin Panel
            </NuxtLink>
            
            <div class="hidden md:ml-6 md:flex md:space-x-8">
              <NuxtLink
                v-for="link in links"
                :key="link.path"
                :to="link.path"
                class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-600"
                :class="{
                  'text-blue-600 border-b-2 border-blue-600': $route.path === link.path
                }"
              >
                {{ link.name }}
              </NuxtLink>
            </div>
          </div>
          
          <div class="flex items-center">
            <NuxtLink 
              to="/" 
              class="text-sm text-gray-700 hover:text-blue-600"
            >
              Back to Site
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>
  </template>
  
  <script setup>
  const links = [
    { name: 'Pricing Plans', path: '/admin/management' },
    { name: 'Data Centers', path: '/admin/datacenters' },
    { name: 'Hosts', path: '/admin/hosts' }
  ]
  </script>