<!-- ~/components/SecuritySettings.vue -->
<template>
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Security Settings</h2>
      
      <form @submit.prevent="changePassword">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Current Password</label>
            <input v-model="password.current" type="password" required class="w-full p-2 border rounded">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">New Password</label>
            <input v-model="password.new" type="password" required class="w-full p-2 border rounded">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Confirm New Password</label>
            <input v-model="password.confirm" type="password" required class="w-full p-2 border rounded">
          </div>
          <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">
            Change Password
          </button>
        </div>
      </form>
    </div>
  </template>
  
  <script setup>
  const password = reactive({
    current: '',
    new: '',
    confirm: ''
  })
  const toast = useToast()
  
  async function changePassword() {
    if (password.new !== password.confirm) {
      toast.add({ title: 'Passwords do not match', color: 'red' })
      return
    }
  
    try {
      await $fetch('/api/user/change-password', {
        method: 'POST',
        body: {
          currentPassword: password.current,
          newPassword: password.new
        }
      })
      
      toast.add({
        title: 'Password Changed',
        description: 'Your password has been updated successfully',
        color: 'green'
      })
      password.current = ''
      password.new = ''
      password.confirm = ''
    } catch (error) {
      toast.add({
        title: 'Password Change Failed',
        description: error.data?.message || 'An error occurred',
        color: 'red'
      })
    }
  }
  </script>