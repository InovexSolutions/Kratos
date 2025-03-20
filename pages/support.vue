<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <!-- Navbar -->
      <NavBar class="sticky top-0 z-50" />
  
      <!-- Hero Section -->
      <section class="relative py-32 overflow-hidden">
        <div class="container mx-auto px-4 text-center">
          <div class="max-w-4xl mx-auto">
            <h1 class="text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 animate-fade-in-up">
              Game Server Support
            </h1>
            <p class="text-xl text-gray-300 mb-8 animate-fade-in-up delay-100">
              24/7 Expert Support for Your Gaming Servers
            </p>
          </div>
        </div>
      </section>
  
      <!-- Support Content -->
      <section class="py-20 bg-gray-800/50">
        <div class="container mx-auto px-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <!-- FAQ Section -->
            <div class="space-y-6">
              <h2 class="text-3xl font-bold text-white mb-8">
                Frequently Asked Questions
              </h2>
              <div v-for="(faq, index) in faqs" :key="index" 
                   class="bg-gray-700/30 rounded-xl p-6 transition-all duration-300 hover:bg-gray-700/50">
                <button @click="toggleFAQ(index)" 
                        class="w-full flex justify-between items-center text-left">
                  <span class="text-lg font-semibold text-gray-100">{{ faq.question }}</span>
                  <span class="text-2xl text-purple-400 ml-4">
                    {{ activeFAQ === index ? '−' : '+' }}
                  </span>
                </button>
                <div v-show="activeFAQ === index" class="mt-4 text-gray-300">
                  {{ faq.answer }}
                </div>
              </div>
            </div>
  
            <!-- Contact Form -->
            <div class="bg-gray-800/40 rounded-2xl p-8 shadow-xl">
              <h2 class="text-3xl font-bold text-white mb-8">
                Direct Support
              </h2>
              <form @submit.prevent="submitSupportRequest" class="space-y-6">
                <div>
                  <label class="block text-gray-300 mb-2">Your Name</label>
                  <input type="text" 
                         class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                  <label class="block text-gray-300 mb-2">Email Address</label>
                  <input type="email" 
                         class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                  <label class="block text-gray-300 mb-2">Server Type</label>
                  <select class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option>Minecraft</option>
                    <option>Valheim</option>
                    <option>Rust</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label class="block text-gray-300 mb-2">Message</label>
                  <textarea rows="4" 
                            class="w-full bg-gray-700/40 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
                </div>
                <button type="submit" 
                        class="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-4 rounded-xl text-lg font-semibold transform hover:scale-[1.02] transition-all duration-300">
                  Send Support Request
                </button>
              </form>
            </div>
          </div>
  
          <!-- Support Channels -->
          <div class="mt-20 max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold text-white mb-12 text-center">
              Other Support Channels
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div class="text-center bg-gray-700/30 p-8 rounded-xl hover:bg-gray-700/50 transition-all">
                <div class="text-4xl mb-4 text-green-400">💬</div>
                <h3 class="text-xl font-bold text-white mb-2">Live Chat</h3>
                <p class="text-gray-300">Instant support from our team</p>
                <button class="mt-4 text-blue-400 hover:text-blue-300 font-semibold">
                  Start Chat →
                </button>
              </div>
              <div class="text-center bg-gray-700/30 p-8 rounded-xl hover:bg-gray-700/50 transition-all">
                <div class="text-4xl mb-4 text-yellow-400">📚</div>
                <h3 class="text-xl font-bold text-white mb-2">Knowledge Base</h3>
                <p class="text-gray-300">Guides & troubleshooting articles</p>
                <button class="mt-4 text-blue-400 hover:text-blue-300 font-semibold">
                  Browse Guides →
                </button>
              </div>
              <div class="text-center bg-gray-700/30 p-8 rounded-xl hover:bg-gray-700/50 transition-all">
                <div class="text-4xl mb-4 text-red-400">🆘</div>
                <h3 class="text-xl font-bold text-white mb-2">Emergency</h3>
                <p class="text-gray-300">Critical server issues</p>
                <button class="mt-4 text-blue-400 hover:text-blue-300 font-semibold">
                  24/7 Hotline →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
  
      <!-- CTA Section -->
      <section class="py-20 bg-gradient-to-br from-blue-600 to-purple-700">
        <div class="container mx-auto px-4 text-center">
          <h2 class="text-4xl font-bold mb-6 text-white">
            Need Immediate Assistance?
          </h2>
          <p class="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Our support team is available 24/7 to help with any server issues or questions.
          </p>
          <div class="flex justify-center gap-6">
            <button class="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-bold transform hover:scale-105 transition-all duration-300 shadow-lg">
              Start Live Chat
            </button>
            <button class="border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-bold transform hover:scale-105 transition-all duration-300 hover:bg-white/10">
              Call Support
            </button>
          </div>
        </div>
      </section>
  
      <!-- <Footer /> -->
    </div>
  </template>
  
  <script setup>
  definePageMeta({
  auth: false
  });
  const activeFAQ = ref(null);
  
  const faqs = ref([
    {
      question: "How quickly do you respond to support requests?",
      answer: "Our average response time is under 15 minutes for premium users and under 1 hour for all other support requests."
    },
    {
      question: "Can you help with server configuration?",
      answer: "Yes! Our support team can assist with all aspects of server setup, mod installation, and performance optimization."
    },
    {
      question: "What's your server restoration policy?",
      answer: "We maintain daily backups for all servers and can restore to any point within the last 7 days upon request."
    },
    {
      question: "How do I upgrade my server resources?",
      answer: "You can easily upgrade your server directly from the control panel or contact us for assisted upgrades."
    }
  ]);
  
  const toggleFAQ = (index) => {
    activeFAQ.value = activeFAQ.value === index ? null : index;
  };
  
  const submitSupportRequest = () => {
    // Handle form submission
  };
  </script>
  
  <style>
  /* Reuse animations from main page */
  </style>