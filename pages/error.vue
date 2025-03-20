<template>
    <div class="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div class="text-center p-8">
            <h1 class="text-4xl font-bold mb-4">{{ error.statusCode }} Error</h1>
            <p class="text-xl text-gray-400 mb-8">{{ error.message }}</p>
            <NuxtLink to="/" class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors">
                Return Home
            </NuxtLink>
        </div>
    </div>
</template>

<script setup>
definePageMeta({
  auth: false
});
defineProps({
    error: {
        type: Object,
        required: true
    }
});
</script>