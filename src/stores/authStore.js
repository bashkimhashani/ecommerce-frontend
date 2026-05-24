import { defineStore } from 'pinia'

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch {
    return null
  }
}

function getInitialUser() {
  return readJson('currentUser')
}

function getInitialAccessToken() {
  return localStorage.getItem('accessToken') || localStorage.getItem('access') || ''
}

function getUserRole(user) {
  return user?.role || localStorage.getItem('role') || ''
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const user = getInitialUser()
    const accessToken = getInitialAccessToken()

    return {
      user,
      accessToken,
      role: getUserRole(user),
      isAuthenticated: Boolean(accessToken),
    }
  },
  actions: {
    setSession(payload) {
      const user = payload?.user || null
      const accessToken = payload?.access || payload?.accessToken || ''
      const refreshToken = payload?.refresh || payload?.refreshToken || ''
      const role = payload?.role || user?.role || ''

      this.user = user
      this.accessToken = accessToken
      this.role = role
      this.isAuthenticated = Boolean(accessToken)

      if (accessToken) {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('access', accessToken)
      } else {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('access')
      }

      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
        localStorage.setItem('refresh', refreshToken)
      }

      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user))
      } else {
        localStorage.removeItem('currentUser')
      }

      if (role) {
        localStorage.setItem('role', role)
      } else {
        localStorage.removeItem('role')
      }
    },
    updateUser(user) {
      this.user = user || null
      this.role = user ? getUserRole(user) : ''

      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user))
      } else {
        localStorage.removeItem('currentUser')
      }

      if (this.role) {
        localStorage.setItem('role', this.role)
      } else {
        localStorage.removeItem('role')
      }
    },
    clearSession() {
      this.user = null
      this.accessToken = ''
      this.role = ''
      this.isAuthenticated = false

      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      localStorage.removeItem('currentUser')
      localStorage.removeItem('role')
    },
  },
})
