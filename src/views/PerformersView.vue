<template>
  <AdminLayout>
    <div class="pageBody">
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
        <PerformerCard v-for="p in pagedPerformers" :key="p.user_uuid" :performer="p" />
      </div>

      <div v-if="!loading && totalPages > 1" class="paginationWrap">
        <div class="paginationRow">
          <button class="pageBtn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">上一頁</button>

          <button
            v-for="(item, idx) in pageItems"
            :key="`${item}-${idx}`"
            class="pageBtn"
            :class="{ active: item === currentPage, dots: item === '...'}"
            :disabled="item === '...'"
            @click="typeof item === 'number' && goToPage(item)"
          >
            {{ item }}
          </button>

          <button class="pageBtn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">下一頁</button>
        </div>
        <div class="summary">第 {{ currentPage }} / {{ totalPages }} 頁，共 {{ filtered.length }} 筆</div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import PerformerCard from '../components/PerformerCard.vue'
import { fetchPerformers } from '../services/api'
import { BASIC_TOKEN } from '../services/auth'

const loading = ref(false)
const error = ref('')
const performers = ref([])
const q = ref('')
const currentPage = ref(1)
const PAGE_SIZE = 20

const load = async () => {
  error.value = ''
  loading.value = true
  try {
    // 目前先用固定 token（你已驗證 OK）
    performers.value = await fetchPerformers(BASIC_TOKEN)
    currentPage.value = 1
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

watch(q, () => {
  currentPage.value = 1
})

const totalPages = computed(() => {
  const total = Math.ceil(filtered.value.length / PAGE_SIZE)
  return total > 0 ? total : 1
})

const pagedPerformers = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

const pageItems = computed(() => {
  const total = totalPages.value
  const page = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const items = [1]
  const left = Math.max(2, page - 1)
  const right = Math.min(total - 1, page + 1)

  if (left > 2) items.push('...')
  for (let p = left; p <= right; p += 1) items.push(p)
  if (right < total - 1) items.push('...')
  items.push(total)

  return items
})

const goToPage = (page) => {
  if (page < 1) {
    currentPage.value = 1
    return
  }
  if (page > totalPages.value) {
    currentPage.value = totalPages.value
    return
  }
  currentPage.value = page
}
</script>

<style scoped>
.pageBody {
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

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

.paginationWrap {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding-top: 16px;
}

.paginationRow {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.pageBtn {
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 10px;
  padding: 7px 11px;
  cursor: pointer;
  font-weight: 700;
}

.pageBtn:hover:not(:disabled) {
  border-color: #AE1914;
}

.pageBtn.active {
  border-color: #AE1914;
  background: #AE1914;
  color: #fff;
}

.pageBtn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.pageBtn.dots {
  border-style: dashed;
}

.summary {
  text-align: center;
  opacity: 0.72;
  font-size: 13px;
}

@media (max-width: 900px) {
  .grid { grid-template-columns: repeat(1, minmax(0, 1fr)); }
}
</style>
