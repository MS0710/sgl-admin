<template>
  <div class="wrap">
    <div class="card">
      <h1>後台登入</h1>
      <p class="hint">請輸入密碼</p>

      <input v-model="pwd" type="password" placeholder="Password" @keydown.enter="submit" />
      <button @click="submit">進入</button>

      <p v-if="err" class="err">{{ err }}</p>

      <details class="dev">
        <summary>（測試用）顯示預設密碼</summary>
        <code>U0dMOlRFU1QxMjM0</code>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { loginWithToken } from '../services/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const pwd = ref('') // 你要預填就改成：ref('U0dMOlRFU1QxMjM0')
const err = ref('')

const submit = () => {
  err.value = ''
  const ok = loginWithToken(pwd.value.trim())
  if (!ok) {
    err.value = '密碼錯誤'
    return
  }
  router.replace('/')
}
</script>

<style scoped>
.wrap {
  min-height: 100vh;
  background: #fff;
  color: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}

.card {
  width: 420px;
  max-width: 100%;
  border: 1px solid #eee;
  border-radius: 16px;
  padding: 22px;
}

h1 {
  margin: 0 0 6px 0;
  color: #AE1914;
}

.hint {
  margin: 0 0 14px 0;
  opacity: 0.75;
}

input {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 12px 12px;
  outline: none;
}

input:focus {
  border-color: #AE1914;
  box-shadow: 0 0 0 3px rgba(174, 25, 20, 0.12);
}

button {
  width: 100%;
  margin-top: 12px;
  border: 1px solid #AE1914;
  background: #AE1914;
  color: #fff;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
}

.err {
  margin-top: 12px;
  color: #AE1914;
  font-weight: 700;
}

.dev {
  margin-top: 14px;
  opacity: 0.8;
}

code {
  display: inline-block;
  margin-top: 8px;
  background: #f6f6f6;
  padding: 6px 8px;
  border-radius: 10px;
}
</style>
