<template>
  <AdminLayout>
    <div class="header">
      <h2 class="title">所有表演者</h2>

      <div class="tools">
        <input v-model="q" placeholder="搜尋暱稱..." />
        <button class="refresh" @click="load" :disabled="loading">
          {{ loading ? '載入中…' : '重新整理' }}
        </button>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="!loading && filtered.length === 0" class="empty">
      沒有資料
    </div>

    <div class="grid">
      <PerformerCard v-for="p in filtered" :key="p.user_uuid" :performer="p" />
    </div>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import PerformerCard from '../components/PerformerCard.vue'
import { fetchPerformers } from '../services/api'
import { BASIC_TOKEN } from '../services/auth'

const loading = ref(false)
const error = ref('')
const performers = ref([])
const q = ref('')

const load = async () => {
  error.value = ''
  loading.value = true
  try {
    // 目前先用固定 token（你已驗證 OK）
    performers.value = await fetchPerformers(BASIC_TOKEN)
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

const filtered = computed(() => {
  const keyword = q.value.trim().toLowerCase()
  if (!keyword) return performers.value
  return performers.value.filter((p) =>
    String(p.nickname || '').toLowerCase().includes(keyword)
  )
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.title {
  margin: 0;
}

.tools {
  display: flex;
  gap: 10px;
  align-items: center;
}

input {
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 10px 12px;
  outline: none;
}

input:focus {
  border-color: #AE1914;
  box-shadow: 0 0 0 3px rgba(174, 25, 20, 0.12);
}

.refresh {
  border: 1px solid #AE1914;
  background: #AE1914;
  color: #fff;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
}

.refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #AE1914;
  font-weight: 700;
  margin: 8px 0 12px 0;
}

.empty {
  opacity: 0.7;
  padding: 12px 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 900px) {
  .grid { grid-template-columns: repeat(1, minmax(0, 1fr)); }
}
</style>
