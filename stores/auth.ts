import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
    returnUrl: null,
    isAuthenticated: false,
    _isInitialized: false // Add initialization flag
  }),
  persist: true,
  actions: {
    async initialize() {
      try {
        const { data } = await useFetch<{ user?: User }>('/api/auth/validate', {
          credentials: 'include'
        })
        
        if (data.value?.user) {
          this.user = data.value.user
          this.isAuthenticated = true
        }
      } catch (error) {
        console.error('Auth init error:', error)
      }
    },

    async login(email: string, password: string): Promise<void> {
      const { data, error } = await useFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      if (error.value) {
        throw new Error(error.value.data?.message || 'Login failed')
      }

      this.setAuthData(data.value as { user: User; token: string })
    },

    setAuthData(authData: { user: User; token: string }) {
      this.user = authData.user
      this.token = authData.token
      this.isAuthenticated = true
      
      // Set secure cookie
      useCookie('authToken', {
        secure: false,
        sameSite: 'lax',
        maxAge: 604800 // 7 days
      }).value = authData.token
    },

    async validate(): Promise<boolean> {
      try {
        const { data } = await useFetch<{ valid: boolean }>('/api/auth/validate')
        return !!data.value?.valid
      } catch {
        this.logout()
        return false
      }
    },

    logout() {
      this.$reset()
      useCookie('authToken').value = null
    },

    async register(userData: { email: string; password: string; firstName: string; lastName: string }) {
      const { data } = await useFetch('/api/auth/register', {
        method: 'POST',
        body: userData
      })

      if (data.value) {
        await this.login(userData.email, userData.password)
      }
    }
  },
  getters: {
    isReady: (state) => state._isInitialized
  }
})