<template>
  <div>
    <div v-if="isLoading" class="text-sm text-gray-500">
      Testing connection...
      <div class="w-16 h-1 mt-1 bg-gray-800 rounded overflow-hidden">
        <div class="h-full bg-blue-500 animate-pulse"/>
      </div>
    </div>
    <div v-else-if="latency !== null" class="flex items-center gap-1">
      <div :class="getLatencyColorClass()">{{ Math.round(latency) }}ms</div>
      <div class="flex items-center space-x-1">
        <div v-for="i in 3" :key="i" 
             :class="[
               'w-1.5 h-3 rounded-sm',
               i <= getSignalStrength() ? getLatencyColorClass() : 'bg-gray-700'
             ]"/>
      </div>
    </div>
    <div v-else class="text-sm text-gray-500">
      Unable to test connection
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  host: {
    type: String,
    required: true
  }
})

const latency = ref(null)
const isLoading = ref(true)
const abortController = ref(null)

// Clean up any pending requests on component unmount
onBeforeUnmount(() => {
  if (abortController.value) {
    abortController.value.abort()
  }
})

// Test ping to the host
onMounted(async () => {
  try {
    console.log(`Pinging ${props.host}...`)
    
    // First do a DNS warmup request - this doesn't count toward ping measurement
    await warmupConnection(props.host)
    
    // Then perform the actual ping test
    const pingResults = await testPing(props.host)
    latency.value = pingResults.bestLatency // Use best latency instead of average
  } catch (error) {
    console.error(`Error pinging ${props.host}:`, error)
    latency.value = null
  } finally {
    isLoading.value = false
  }
})

// Helper function to get color class based on latency
const getLatencyColorClass = () => {
  if (latency.value === null) return 'text-gray-500'
  if (latency.value < 30) return 'text-green-500'  // Optimistic threshold
  if (latency.value < 80) return 'text-blue-400'   // Good threshold
  if (latency.value < 150) return 'text-yellow-500' // OK threshold
  if (latency.value < 250) return 'text-orange-500' // Poor threshold
  return 'text-red-500'                            // Bad threshold
}

// Helper function to get signal strength (1-3) based on latency
const getSignalStrength = () => {
  if (latency.value === null) return 0
  if (latency.value < 50) return 3
  if (latency.value < 150) return 2
  return 1
}

// Perform initial connection to warm up DNS and TCP
const warmupConnection = async (host) => {
  try {
    const url = formatUrl(host)
    
    // Create a new AbortController for this request
    const controller = new AbortController()
    abortController.value = controller
    
    // Send a quick ping to warm up DNS and connection
    await fetch(`${url}`, {
      method: 'HEAD',
      cache: 'no-store',
      mode: 'no-cors',
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' }
    })
    
    // Short delay to allow connection to fully establish
    await new Promise(resolve => setTimeout(resolve, 100))
  } catch (error) {
    // Ignore errors during warmup
    console.log('Warmup connection failed, continuing with ping test')
    console.warn(`Warmup connection error: ${error}`)
  }
}

// Format URL correctly
const formatUrl = (host) => {
  if (host.startsWith('http://') || host.startsWith('https://')) {
    return host
  }
  // Default to HTTPS
  return `https://${host}`
}

// Improved ping testing function
const testPing = async (host) => {
  const samples = 8  // More samples for more accurate results
  const results = []
  const url = formatUrl(host)
  
  // Create a unique endpoint to avoid any caching
  const pingEndpoint = `${url}/?_cachebust=${Date.now()}`
  
  // Create a new AbortController for these requests
  const controller = new AbortController()
  abortController.value = controller
  
  for (let i = 0; i < samples; i++) {
    try {
      const start = performance.now()
      
      // Use a small endpoint that should return quickly
      await fetch(pingEndpoint, {
        method: 'HEAD', // HEAD is lighter than GET
        cache: 'no-store',
        credentials: 'omit', // Don't send cookies
        mode: 'no-cors',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
        }
      })
      
      const end = performance.now()
      const elapsed = end - start
      
      // Only add if the request was successful and time is reasonable
      if (elapsed > 0 && elapsed < 1000) {
        results.push(elapsed)
      }
    } catch (error) {
      // If fetch fails after the component is unmounted, ignore it
      if (error.name === 'AbortError') return { bestLatency: null, averageLatency: null }
      
      console.warn(`Ping test ${i} failed:`, error)
      // Don't add failed requests to results to avoid skewing the average
    }
    
    // Shorter delay between tests (50ms is enough)
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  
  if (results.length === 0) {
    // All requests failed
    return { bestLatency: null, averageLatency: null }
  }
  
  // Sort results for analysis
  results.sort((a, b) => a - b)
  
  // Calculate best latency (lowest value), which is often most accurate
  const bestLatency = results[0]
  
  // Calculate average latency excluding any outliers
  // (filter out top 20% highest values if we have enough samples)
  const filteredResults = results.length >= 3 
    ? results.slice(0, Math.ceil(results.length * 0.8)) 
    : results
  
  const averageLatency = filteredResults.reduce((sum, time) => sum + time, 0) / filteredResults.length
  
  console.log(`Ping results for ${host}:`, {
    samples: results.length,
    results,
    bestLatency,
    averageLatency
  })
  
  return {
    bestLatency,
    averageLatency,
    samples: results
  }
}
</script>