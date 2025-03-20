<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div class="container mx-auto px-4 py-12">
        <!-- Header Section -->
        <section class="mb-16 text-center animate-fade-in-up">
          <h1 class="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Admin Dashboard
          </h1>
          <p class="text-xl text-gray-300">Manage your gaming server ecosystem</p>
        </section>
  
        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto animate-slide-in-right">
          <AdminStatCard 
            title="Total Servers" 
            :value="stats.totalServers" 
            icon="🖥️" 
            color="purple" 
          />
          <AdminStatCard 
            title="Active Users" 
            :value="stats.activeUsers" 
            icon="👥" 
            color="blue" 
          />
          <AdminStatCard 
            title="Monthly Revenue" 
            :value="stats.monthlyRevenue" 
            icon="💰" 
            color="green"
            :formatter="val => `$${val.toFixed(2)}`"
          />
        </div>
  
        <!-- Recent Activity -->
        <section class="bg-gray-800/50 rounded-xl border border-gray-700/50 p-8 animate-fade-in-up delay-100">
          <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold text-white mb-6">
              Recent <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Activity</span>
            </h2>
            <ActivityTimeline 
              :activities="recentActivities" 
              class="bg-gray-800/30 rounded-xl p-6"
            />
          </div>
        </section>
      </div>
    </div>
  </template>
  
  <script setup>
  definePageMeta({
    layout: 'admin'
  });
  const { data: stats } = await useAsyncData('admin-stats', 
    () => $fetch('/api/admin/stats'),
    {
      server: true,
      initialCache: false
    }
  );
  
  const recentActivities = ref([
    { 
      type: 'server', 
      action: 'created new Minecraft server', 
      user: 'john@example.com',
      timestamp: new Date(Date.now() - 3600000),
      status: 'online'
    },
    { 
      type: 'user', 
      action: 'updated profile information',
      user: 'sarah@example.com',
      timestamp: new Date(Date.now() - 7200000),
      status: 'updated'
    },
    { 
      type: 'billing', 
      action: 'completed payment for Rust server',
      user: 'mike@example.com',
      timestamp: new Date(Date.now() - 10800000),
      status: 'paid'
    }
  ]);
  
  // Add error handling
  onErrorCaptured((err) => {
    console.error('Admin dashboard error:', err);
    return false;
  });
  </script>