<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <NavBar class="sticky top-0 z-50" />
  
      <div class="container mx-auto px-4 py-12">
        <!-- Header Section -->
        <div class="text-center mb-16 animate-fade-in-up">
          <h1 class="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Billing History
          </h1>
          <p class="text-xl text-gray-300">View and manage your payment invoices</p>
        </div>
  
        <!-- Invoice Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto animate-slide-in-right">
          <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
            <div class="text-2xl font-bold text-green-400 mb-2">${{ totalPaid }}</div>
            <div class="text-gray-400">Total Paid</div>
          </div>
          <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
            <div class="text-2xl font-bold text-yellow-400 mb-2">{{ pendingInvoices }}</div>
            <div class="text-gray-400">Pending Payments</div>
          </div>
          <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
            <div class="text-2xl font-bold text-purple-400 mb-2">{{ totalInvoices }}</div>
            <div class="text-gray-400">Total Invoices</div>
          </div>
        </div>
  
        <!-- Invoices List -->
        <div class="bg-gray-800/30 rounded-xl border border-gray-700/50 animate-fade-in-up">
          <div class="p-6 border-b border-gray-700/50">
            <div class="grid grid-cols-12 gap-4 text-gray-400 text-sm font-semibold">
              <div class="col-span-4">Invoice</div>
              <div class="col-span-3">Date</div>
              <div class="col-span-2">Amount</div>
              <div class="col-span-2">Status</div>
              <div class="col-span-1"></div>
            </div>
          </div>
  
          <div v-for="invoice in invoices" :key="invoice.id" 
               class="p-6 border-b border-gray-700/50 last:border-0 hover:bg-gray-700/20 transition-colors">
            <div class="grid grid-cols-12 gap-4 items-center">
              <div class="col-span-4">
                <div class="font-bold text-gray-100">#{{ invoice.po_number }}</div>
                <div class="text-sm text-gray-400">{{ invoice.game }} Server</div>
              </div>
              
              <div class="col-span-3 text-gray-300">
                {{ new Date(invoice.date).toLocaleDateString() }}
              </div>
              
              <div class="col-span-2 text-gray-100 font-bold">
                ${{ invoice.amount }}
              </div>
              
              <div class="col-span-2">
                <span :class="statusClasses(invoice.status)" 
                      class="px-3 py-1 rounded-full text-sm font-semibold">
                  {{ invoice.status }}
                </span>
              </div>
              
              <div class="col-span-1 text-right">
                <a :href="invoice.payment_url" target="_blank"
                   class="text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-end">
                  View <span class="ml-2">→</span>
                </a>
              </div>
            </div>
  
            <!-- Line Items -->
            <div v-if="invoice.line_items" class="mt-4 pt-4 border-t border-gray-700/50">
              <div v-for="(item, index) in invoice.line_items" :key="index" 
                   class="text-sm text-gray-400 flex justify-between mb-2 last:mb-0">
                <div>{{ item.notes }}</div>
                <div>${{ item.cost }}</div>
              </div>
            </div>
          </div>
  
          <!-- Empty State -->
          <div v-if="!invoices?.length" class="p-12 text-center text-gray-400">
            No invoices found. Your billing history will appear here.
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  const auth = useAuthStore();
  const { data: invoices, pending, error } = await useAsyncData('invoices', 
  async () => {
    try {
      const { data: response } = await $fetch('/api/invoices/customer', {
        credentials: 'include'
      });

      console.log('Invoices response:', response);
      
      // Validate response structure
      if (!Array.isArray(response)) {
        throw new Error('Invalid invoices response format');
      }
      
      return response.map(invoice => ({
        ...invoice,
        date: invoice.date || new Date().toISOString(),
        amount: parseFloat(invoice.amount) || 0,
        status: invoice.status?.toLowerCase() || 'unknown',
        line_items: Array.isArray(invoice.line_items) ? invoice.line_items : []
      }));
      
    } catch (err) {
      console.error('Invoice fetch error:', err);
      throw new Error('Failed to load invoices');
    }
  },
  {
    server: true,
    initialCache: false
  }
);

  
  // Sample metrics - replace with actual calculations
  const totalPaid = computed(() => {
  const invoiceList = invoices.value || [];
  return invoiceList.reduce((sum, inv) => {
    const amount = Number(inv?.amount) || 0;
    return inv.status === 'paid' ? sum + amount : sum;
  }, 0);
});

const pendingInvoices = computed(() => {
  const invoiceList = invoices.value || [];
  return invoiceList.filter(inv => inv?.status === 'pending').length;
});

const totalInvoices = computed(() => {
  return (invoices.value || []).length;
});

  
  const statusClasses = (status) => {
    return {
      'paid': 'bg-green-400/20 text-green-400',
      'pending': 'bg-yellow-400/20 text-yellow-400',
      'overdue': 'bg-red-400/20 text-red-400',
    }[status.toLowerCase()] || 'bg-gray-400/20 text-gray-400';
  };
  </script>
  
  <style>
  /* Reuse existing animations */
  /* Animations */
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

@keyframes slide-in-right {
    from {
        opacity: 0;
        transform: translateX(20px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.animate-fade-in-up {
    animation: fade-in-up 0.8s ease-out forwards;
}

.delay-100 {
    animation-delay: 100ms;
}

.delay-200 {
    animation-delay: 200ms;
}

.animate-slide-in-right {
    animation: slide-in-right 0.6s ease-out forwards;
}
  </style>