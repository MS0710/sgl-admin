const KEY = 'admin_authed'

const ADMIN_USERNAME = 'SGL'
const ADMIN_PASSWORD = 'T9pN6@kF2mX8rLv5'

export const BASIC_TOKEN = 'U0dMOlQ5cE42QGtGMm1YOHJMdjU='

export function isAuthed() {
  return localStorage.getItem(KEY) === '1'
}

export function loginWithCredentials(username, password) {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    localStorage.setItem(KEY, '1')
    return true
  }
  return false
}

export function logout() {
  localStorage.removeItem(KEY)
}
