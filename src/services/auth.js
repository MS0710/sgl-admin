const KEY = 'admin_authed'

export const BASIC_TOKEN = 'U0dMOlRFU1QxMjM0'

export function isAuthed() {
  return localStorage.getItem(KEY) === '1'
}

export function loginWithToken(token) {
  if (token === BASIC_TOKEN) {
    localStorage.setItem(KEY, '1')
    return true
  }
  return false
}

export function logout() {
  localStorage.removeItem(KEY)
}
