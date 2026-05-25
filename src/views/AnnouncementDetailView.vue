<template>
  <AdminLayout>
    <div class="pageBody">
      <button class="backBtn" type="button" @click="router.push('/announcements')">返回列表</button>

      <p v-if="loading" class="muted">載入中...</p>
      <p v-else-if="error" class="error">{{ error }}</p>

      <template v-else-if="announcement">
        <section class="hero">
          <div class="mainInfo">
            <img v-if="coverUrl" :src="coverUrl" class="cover" alt="cover" />
            <div v-else class="cover placeholder">No Image</div>

            <div class="identity">
              <h2>{{ announcement.name || announcement.title || '(no title)' }}</h2>
              <div class="uuid">{{ announcement.uuid }}</div>
              <div class="metaLine">
                <span v-if="announcement.city">{{ announcement.city }}</span>
                <span v-if="announcement.location">{{ announcement.location }}</span>
                <span v-if="announcement.deadline">截止 {{ formatDateTime(announcement.deadline) }}</span>
              </div>
            </div>
          </div>

          <div class="statusPanel">
            <label for="status">通告狀態</label>
            <select id="status" v-model="selectedStatus" :disabled="savingStatus">
              <option v-for="status in STATUS_OPTIONS" :key="status" :value="status">{{ status }}</option>
            </select>
            <button
              class="saveBtn"
              type="button"
              :disabled="savingStatus || selectedStatus === announcement.status"
              @click="saveStatus"
            >
              {{ savingStatus ? '更新中...' : '更新狀態' }}
            </button>
            <p v-if="statusMessage" class="statusMessage">{{ statusMessage }}</p>
          </div>
        </section>

        <section class="detailGrid">
          <div v-for="item in detailFields" :key="item.label" class="detailItem">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <section v-if="announcement.content" class="section">
          <h3>內容</h3>
          <p>{{ announcement.content }}</p>
        </section>

        <section v-if="announcement.remark" class="section">
          <h3>備註</h3>
          <p>{{ announcement.remark }}</p>
        </section>

        <section v-if="photoUrls.length" class="section">
          <h3>照片</h3>
          <div class="photoGrid">
            <a
              v-for="(url, idx) in photoUrls"
              :key="url"
              :href="url"
              target="_blank"
              rel="noreferrer"
              class="photoCard"
            >
              <img :src="url" :alt="`photo ${idx + 1}`" loading="lazy" />
              <span>照片 {{ idx + 1 }}</span>
            </a>
          </div>
        </section>
      </template>
    </div>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import { fetchAnnouncementDetail, updateAnnouncementStatus } from '../services/announcements'
import { BASIC_TOKEN } from '../services/auth'

const STATUS_OPTIONS = ['draft', 'pending', 'published', 'unpublished', 'closed']

const route = useRoute()
const router = useRouter()
const announcement = ref(null)
const loading = ref(false)
const error = ref('')
const selectedStatus = ref('')
const savingStatus = ref(false)
const statusMessage = ref('')

const uuid = computed(() => String(route.params.uuid || ''))

const load = async () => {
  loading.value = true
  error.value = ''
  statusMessage.value = ''
  try {
    announcement.value = await fetchAnnouncementDetail(BASIC_TOKEN, uuid.value)
    selectedStatus.value = announcement.value?.status || ''
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

const photoUrls = computed(() => {
  if (!announcement.value) return []
  const urls = []
  if (announcement.value.cover_url) urls.push(announcement.value.cover_url)
  for (const url of announcement.value.photo_urls || []) {
    if (url && !urls.includes(url)) urls.push(url)
  }
  return urls
})

const coverUrl = computed(() => announcement.value?.cover_url || photoUrls.value[0] || '')

const detailFields = computed(() => {
  if (!announcement.value) return []
  const a = announcement.value
  return [
    ['狀態', a.status],
    ['開始日期', formatDateTime(a.from_date_time)],
    ['結束日期', formatDateTime(a.to_date_time)],
    ['每日開始', a.daily_start_time],
    ['每日結束', a.daily_end_time],
    ['需求人數', a.required_people],
    ['年齡', formatRange(a.from_age, a.to_age)],
    ['最低費用', formatMoney(a.min_fee)],
    ['最高費用', formatMoney(a.max_fee)],
    ['Tag ID', Array.isArray(a.tag_ids) ? a.tag_ids.join(', ') : ''],
    ['Owner UUID', a.owner_user_uuid],
    ['Owner Identity', a.owner_identity],
    ['建立時間', formatDateTime(a.created_at)],
    ['更新時間', formatDateTime(a.updated_at)],
  ]
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => ({ label, value }))
})

const saveStatus = async () => {
  if (!announcement.value || !selectedStatus.value || selectedStatus.value === announcement.value.status) return
  savingStatus.value = true
  statusMessage.value = ''
  error.value = ''
  try {
    await updateAnnouncementStatus(BASIC_TOKEN, announcement.value.uuid, selectedStatus.value)
    announcement.value.status = selectedStatus.value
    statusMessage.value = '狀態已更新'
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    savingStatus.value = false
  }
}

function formatRange(from, to) {
  if ((from === undefined || from === null || from === '') && (to === undefined || to === null || to === '')) return ''
  if (from !== undefined && from !== null && from !== '' && to !== undefined && to !== null && to !== '') return `${from} - ${to}`
  return String(from || to)
}

function formatMoney(value) {
  if (value === undefined || value === null || value === '') return ''
  return Number(value).toLocaleString('zh-TW')
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
  text-align: left;
}

.backBtn,
.saveBtn {
  border: 1px solid #AE1914;
  background: #AE1914;
  color: #fff;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 800;
}

.backBtn {
  margin-bottom: 14px;
}

.saveBtn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  border-bottom: 1px solid #eee;
  padding-bottom: 18px;
}

.mainInfo {
  display: flex;
  gap: 16px;
  align-items: center;
  min-width: 0;
}

.cover {
  width: 180px;
  height: 120px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #eee;
  flex: 0 0 auto;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  background: #f6f6f6;
}

.identity {
  min-width: 0;
}

.identity h2 {
  margin: 0 0 6px;
  font-size: 28px;
  line-height: 1.2;
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
  margin-top: 8px;
}

.statusPanel {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
  width: 260px;
  display: grid;
  gap: 8px;
  background: #fafafa;
}

.statusPanel label {
  color: #666;
  font-size: 13px;
  font-weight: 700;
}

select {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px 12px;
  outline: none;
  background: #fff;
  color: #111;
  font: inherit;
}

select:focus {
  border-color: #AE1914;
  box-shadow: 0 0 0 3px rgba(174, 25, 20, 0.12);
}

.statusMessage {
  color: #157347;
  font-weight: 800;
  margin: 0;
}

.error {
  color: #AE1914;
  font-weight: 800;
}

.muted {
  opacity: 0.72;
}

.detailGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.detailItem {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
}

.detailItem span {
  display: block;
  color: #666;
  font-size: 12px;
  margin-bottom: 3px;
}

.detailItem strong {
  font-size: 18px;
  word-break: break-word;
}

.section {
  margin-top: 22px;
}

.section h3 {
  margin: 0 0 10px;
  font-size: 18px;
}

.section p {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.75;
}

.photoGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.photoCard {
  display: grid;
  gap: 6px;
  color: #111;
}

.photoCard img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #eee;
  background: #f6f6f6;
}

.photoCard span {
  color: #AE1914;
  font-weight: 800;
}

@media (max-width: 860px) {
  .hero,
  .mainInfo {
    flex-direction: column;
  }

  .statusPanel {
    width: 100%;
    box-sizing: border-box;
  }

  .cover {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }

  .detailGrid,
  .photoGrid {
    grid-template-columns: 1fr;
  }
}
</style>
