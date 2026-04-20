<template>
  <div class="page">
    <header class="topbar">
      <div class="brand" @click="$router.push('/')">SGL Admin</div>

      <nav class="nav">
        <button class="navBtn" :class="{ active: $route.path === '/' }" @click="$router.push('/')">工作列表</button>
        <button class="navBtn" :class="{ active: $route.path.startsWith('/performers') }" @click="$router.push('/performers')">所有表演者</button>
        <button
          class="navBtn"
          :class="{ active: $route.path.startsWith('/specialties') }"
          @click="$router.push('/specialties')"
        >
          專長列表編輯
        </button>

        <button
          class="navBtn"
          :class="{ active: $route.path.startsWith('/tags') }"
          @click="$router.push('/tags')"
        >
          tag管理
        </button>

        <button
          class="navBtn"
          :class="{ active: $route.path.startsWith('/banners') }"
          @click="$router.push('/banners')"
        >
          廣告管理
        </button>

        <button
          class="navBtn"
          :class="{ active: $route.path.startsWith('/invitation-codes/company') }"
          @click="$router.push('/invitation-codes/company')"
        >
          公司邀請碼
        </button>
      </nav>

      

      <button class="logout" @click="doLogout">登出</button>
    </header>

    <main class="content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { logout } from '../services/auth'
import { useRouter } from 'vue-router'
const router = useRouter()

const doLogout = () => {
  logout()
  router.replace('/login')
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #fff;
  color: #111;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}

.topbar {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 18px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  background: #fff;
}

.brand {
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #AE1914;
  cursor: pointer;
}

.nav {
  display: flex;
  gap: 10px;
  flex: 1;
}

.navBtn {
  border: 1px solid #eee;
  background: #fff;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
}

.navBtn.active {
  border-color: #AE1914;
  color: #AE1914;
}

.logout {
  border: 1px solid #AE1914;
  background: #AE1914;
  color: #fff;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
}

.content {
  padding: 18px;
  max-width: 1100px;
  margin: 0 auto;
}
</style>
