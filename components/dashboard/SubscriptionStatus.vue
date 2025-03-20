<script setup>
const auth = useAuthStore()
const { data: subscription } = await useFetch('/api/user/subscription', {
    headers: { authorization: auth.token }
})
</script>

<template>
    <div v-if="subscription">
        <h3>Current Plan: {{ subscription.status }}</h3>
        <p>Next billing date: {{ new Date(subscription.currentPeriodEnd).toLocaleDateString() }}</p>
        <button @click="cancelSubscription">Cancel Subscription</button>
    </div>
</template>