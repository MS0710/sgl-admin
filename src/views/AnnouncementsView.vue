<template>
  <AdminLayout>
    <div class="pageBody">
      <div class="header">
        <h2 class="title">通告管理</h2>

        <div class="tools">
          <input v-model="q" placeholder="搜尋本頁標題或 UUID" />
          <input v-model.trim="ownerUserUuid" placeholder="owner user UUID" />
          <select v-model="activeStatus" :disabled="loading">
            <option value="">全部狀態</option>
            <option v-for="status in STATUS_OPTIONS" :key="status" :value="status">{{ status }}</option>
          </select>
          <button class="refresh" type="button" @click="reload" :disabled="loading">
            {{ loading ? '載入中...' : '重新整理' }}
          </button>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div v-if="!loading && filtered.length === 0" class="empty">沒有資料</div>

      <div class="list">
        <article v-for="item in filtered" :key="item.uuid" class="row">
          <img v-if="item.cover_url" :src="item.cover_url" class="cover" alt="cover" loading="lazy" />
          <div v-else class="cover placeholder">No Image</div>

          <div class="info">
            <div class="topLine">
              <h3>{{ item.title || item.name || '(no title)' }}</h3>
              <span class="status" :class="`status-${item.status}`">{{ item.status }}</span>
            </div>
            <div class="uuid">{{ item.uuid }}</div>
            <div class="metaLine">
              <span v-if="item.location">{{ item.location }}</span>
              <span v-if="item.from_date_time">{{ formatDateTime(item.from_date_time) }}</span>
              <span v-if="item.deadline">截止 {{ formatDateTime(item.deadline) }}</span>
            </div>
          </div>

          <div class="actions">
            <button class="ghostBtn" type="button" @click="openDetail(item)">詳情</button>
            <select
              :value="item.status || ''"
              :disabled="updatingUuid === item.uuid"
              @change="changeStatus(item, $event.target.value)"
            >
              <option disabled value="">狀態</option>
              <option v-for="status in STATUS_OPTIONS" :key="status" :value="status">{{ status }}</option>
            </select>
          </div>
        </article>
      </div>

      <div v-if="!loading && totalPages > 1" class="paginationWrap">
        <div class="paginationRow">
          <button class="pageBtn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">上一頁</button>
          <button
            v-for="(item, idx) in pageItems"
            :key="`${item}-${idx}`"
            class="pageBtn"
            :class="{ active: item === currentPage }"
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
import { fetchAnnouncements, updateAnnouncementStatus } from '../services/announcements'
import { BASIC_TOKEN } from '../services/auth'

const STATUS_OPTIONS = ['draft', 'pending', 'published', 'unpublished', 'closed']
const PAGE_SIZE = 25

const router = useRouter()
const loading = ref(false)
const error = ref('')
const announcements = ref([])
const q = ref('')
const activeStatus = ref('')
const ownerUserUuid = ref('')
const currentPage = ref(1)
const totalCount = ref(0)
const updatingUuid = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await fetchAnnouncements(BASIC_TOKEN, {
      pageNo: currentPage.value,
      pageSize: PAGE_SIZE,
      status: activeStatus.value,
      ownerUserUuid: ownerUserUuid.value,
    })
    announcements.value = data.announcements
    totalCount.value = data.totalCount
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    loading.value = false
  }
}

const reload = () => {
  currentPage.value = 1
  load()
}

onMounted(load)

const filtered = computed(() => {
  const keyword = q.value.trim().toLowerCase()
  if (!keyword) return announcements.value
  return announcements.value.filter((item) => {
    const haystack = `${item.title ?? ''} ${item.name ?? ''} ${item.uuid ?? ''}`.toLowerCase()
    return haystack.includes(keyword)
  })
})

watch(activeStatus, reload)

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

const openDetail = (item) => {
  router.push({ name: 'announcement_detail', params: { uuid: item.uuid } })
}

const changeStatus = async (item, status) => {
  if (!status || status === item.status) return
  error.value = ''
  updatingUuid.value = item.uuid
  try {
    await updateAnnouncementStatus(BASIC_TOKEN, item.uuid, status)
    item.status = status
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    updatingUuid.value = ''
  }
}

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-TW', { hour12: false })
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

.refresh,
.ghostBtn {
  border: 1px solid #AE1914;
  background: #AE1914;
  color: #fff;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 800;
}

.refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #AE1914;
  font-weight: 800;
}

.empty {
  opacity: 0.72;
  padding: 12px 0;
}

.list {
  display: grid;
  gap: 12px;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
}

.cover {
  width: 96px;
  height: 72px;
  border-radius: 8px;
  border: 1px solid #eee;
  object-fit: cover;
  flex: 0 0 auto;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  background: #f6f6f6;
  font-size: 12px;
}

.info {
  flex: 1;
  min-width: 0;
}

.topLine {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.topLine h3 {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.uuid {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  opacity: 0.72;
  word-break: break-all;
}

.metaLine {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #555;
  margin-top: 5px;
}

.status {
  border: 1px solid #ddd;
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.status-published {
  color: #157347;
  background: #edf8f2;
  border-color: #bfe5cf;
}

.status-draft,
.status-pending,
.status-unpublished {
  color: #8a5a00;
  background: #fff7e6;
  border-color: #f2d7a5;
}

.status-closed {
  color: #AE1914;
  background: #fff0ef;
  border-color: #f0c4c1;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.actions select {
  max-width: 150px;
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
  .tools,
  .row,
  .actions {
    align-items: stretch;
    flex-direction: column;
  }

  .tools,
  .actions,
  input,
  .tools select {
    width: 100%;
    box-sizing: border-box;
  }

  .cover {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }
}
</style>
