<template>
  <AdminLayout>
    <div class="pageBody">
      <div class="header">
        <h2 class="title">所有表演者</h2>

        <div class="tools">
          <input v-model="q" placeholder="搜尋本頁暱稱或 UUID" />
          <select v-model="activeStatus" :disabled="loading">
            <option value="">全部狀態</option>
            <option v-for="status in STATUS_OPTIONS" :key="status" :value="status">{{ status }}</option>
          </select>
          <button class="refresh" @click="load" :disabled="loading">
            {{ loading ? '載入中...' : '重新整理' }}
          </button>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div v-if="!loading && filtered.length === 0" class="empty">
        沒有資料
      </div>

      <div class="grid">
        <PerformerCard
          v-for="p in filtered"
          :key="p.user_uuid"
          :performer="p"
          :statuses="STATUS_OPTIONS"
          :updating="updatingUuid === p.user_uuid"
          @view-profile="openProfile"
          @change-status="changeStatus"
        />
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
        <div class="summary">第 {{ currentPage }} / {{ totalPages }} 頁，共 {{ totalCount }} 筆</div>
      </div>

    </div>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import PerformerCard from '../components/PerformerCard.vue'
import { fetchPerformers, updatePerformerStatus } from '../services/api'
import { BASIC_TOKEN } from '../services/auth'

const STATUS_OPTIONS = ['ACTIVE', 'PENDING', 'REJECTED', 'UNPUBLISHED', 'DELETED']
const PAGE_SIZE = 25

const loading = ref(false)
const error = ref('')
const performers = ref([])
const q = ref('')
const activeStatus = ref('')
const currentPage = ref(1)
const totalCount = ref(0)
const updatingUuid = ref('')
const router = useRouter()

const load = async () => {
  error.value = ''
  loading.value = true
  try {
    const data = await fetchPerformers(BASIC_TOKEN, {
      pageNo: currentPage.value,
      pageSize: PAGE_SIZE,
      status: activeStatus.value,
    })
    performers.value = data.performers
    totalCount.value = data.totalCount
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
  return performers.value.filter((p) => {
    const haystack = `${p.nickname ?? ''} ${p.user_uuid ?? ''}`.toLowerCase()
    return haystack.includes(keyword)
  })
})

watch(activeStatus, () => {
  currentPage.value = 1
  load()
})

watch(q, () => {
  currentPage.value = 1
})

const totalPages = computed(() => {
  const total = Math.ceil(totalCount.value / PAGE_SIZE)
  return total > 0 ? total : 1
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
  const nextPage = Math.min(Math.max(page, 1), totalPages.value)
  if (nextPage === currentPage.value) return
  currentPage.value = nextPage
  load()
}

const openProfile = (performer) => {
  router.push({ name: 'performer_detail', params: { userUuid: performer.user_uuid } })
}

const changeStatus = async (performer, status) => {
  if (!status || status === performer.status) return
  error.value = ''
  updatingUuid.value = performer.user_uuid
  try {
    await updatePerformerStatus(BASIC_TOKEN, performer.user_uuid, status)
    performer.status = status
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    updatingUuid.value = ''
  }
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
  flex-wrap: wrap;
}

input,
select {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px 12px;
  outline: none;
  background: #fff;
  color: #111;
  font: inherit;
}

input:focus,
select:focus {
  border-color: #AE1914;
  box-shadow: 0 0 0 3px rgba(174, 25, 20, 0.12);
}

.refresh {
  border: 1px solid #AE1914;
  background: #AE1914;
  color: #fff;
  padding: 10px 12px;
  border-radius: 8px;
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
  color: #111;
  border-radius: 8px;
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

.summary {
  font-size: 13px;
  color: #555;
}

@media (max-width: 860px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .tools {
    width: 100%;
  }

  input,
  .tools select {
    flex: 1 1 180px;
    min-width: 0;
  }
}
</style>
