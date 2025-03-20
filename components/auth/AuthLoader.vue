<template>
    <div v-if="!auth.isReady" class="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
</template>
  
<script setup>
  const auth = useAuthStore()
</script>