<template>
  <AdminLayout>
    <div class="pageBody">
      <button class="backBtn" type="button" @click="router.push('/performers')">返回列表</button>

      <p v-if="loading" class="muted">載入中...</p>
      <p v-else-if="error" class="error">{{ error }}</p>

      <template v-else-if="profile">
        <section class="hero">
          <div class="profileMain">
            <img
              v-if="profile.profile_photo_url"
              :src="profile.profile_photo_url"
              class="avatar"
              alt="profile"
            />
            <div v-else class="avatar placeholder">No Photo</div>

            <div class="identity">
              <h2>{{ profile.nickname || fullName || '(no nickname)' }}</h2>
              <div class="uuid">{{ profile.user_uuid }}</div>
              <div class="metaLine">
                <span v-if="profile.gender">{{ profile.gender }}</span>
                <span v-if="profile.city">{{ profile.city }}</span>
                <span v-if="profile.view_count !== undefined">瀏覽 {{ profile.view_count }}</span>
              </div>
            </div>
          </div>

          <div class="statusPanel">
            <label for="status">表演者狀態</label>
            <select id="status" v-model="selectedStatus" :disabled="savingStatus">
              <option v-for="status in STATUS_OPTIONS" :key="status" :value="status">{{ status }}</option>
            </select>
            <button
              class="saveBtn"
              type="button"
              :disabled="savingStatus || selectedStatus === profile.status"
              @click="saveStatus"
            >
              {{ savingStatus ? '更新中...' : '更新狀態' }}
            </button>
            <p v-if="statusMessage" class="statusMessage">{{ statusMessage }}</p>
          </div>
        </section>

        <section class="detailGrid">
          <div v-for="item in profileFields" :key="item.label" class="detailItem">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <section v-if="profile.self_introduction" class="section">
          <h3>自我介紹</h3>
          <p>{{ profile.self_introduction }}</p>
        </section>

        <section v-if="profile.experience" class="section">
          <h3>經驗</h3>
          <p>{{ profile.experience }}</p>
        </section>

        <section v-if="profile.manager" class="section">
          <h3>經紀人</h3>
          <div class="manager">
            <img
              v-if="profile.manager.profile_photo_url"
              :src="profile.manager.profile_photo_url"
              class="managerPhoto"
              alt="manager"
            />
            <div>
              <strong>{{ profile.manager.nickname || profile.manager.user_uuid }}</strong>
              <div class="uuid">{{ profile.manager.user_uuid }}</div>
            </div>
          </div>
        </section>

        <section v-if="photoItems.length" class="section">
          <h3>照片</h3>
          <div class="photoGrid">
            <a
              v-for="photo in photoItems"
              :key="photo.url"
              :href="photo.url"
              target="_blank"
              rel="noreferrer"
              class="photoCard"
            >
              <img :src="photo.url" :alt="photo.label" loading="lazy" />
              <span>{{ photo.label }}</span>
            </a>
          </div>
        </section>

        <section v-if="socialLinks.length" class="section">
          <h3>社群</h3>
          <div class="links">
            <a
              v-for="item in socialLinks"
              :key="`${item.label}-${item.url}`"
              :href="item.url"
              target="_blank"
              rel="noreferrer"
            >
              {{ item.label }}
            </a>
          </div>
        </section>

        <section v-if="videoLinks.length" class="section">
          <h3>影片</h3>
          <div class="links">
            <a
              v-for="item in videoLinks"
              :key="item.url"
              :href="item.url"
              target="_blank"
              rel="noreferrer"
            >
              {{ item.label }}
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
import { fetchPerformerProfile, updatePerformerStatus } from '../services/api'
import { BASIC_TOKEN } from '../services/auth'

const STATUS_OPTIONS = ['ACTIVE', 'PENDING', 'REJECTED', 'UNPUBLISHED', 'DELETED']

const route = useRoute()
const router = useRouter()
const profile = ref(null)
const loading = ref(false)
const error = ref('')
const selectedStatus = ref('')
const savingStatus = ref(false)
const statusMessage = ref('')

const userUuid = computed(() => String(route.params.userUuid || ''))

const load = async () => {
  loading.value = true
  error.value = ''
  statusMessage.value = ''
  try {
    profile.value = await fetchPerformerProfile(BASIC_TOKEN, userUuid.value)
    selectedStatus.value = profile.value?.status || ''
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

const fullName = computed(() => {
  if (!profile.value) return ''
  return [profile.value.first_name, profile.value.last_name].filter(Boolean).join(' ')
})

const profileFields = computed(() => {
  if (!profile.value) return []
  const p = profile.value
  return [
    ['姓名', fullName.value],
    ['生日', p.birthday],
    ['身高', formatUnit(p.height, 'cm')],
    ['體重', formatUnit(p.weight, 'kg')],
    ['胸圍', formatUnit(p.bust, 'cm')],
    ['腰圍', formatUnit(p.waist, 'cm')],
    ['臀圍', formatUnit(p.hip, 'cm')],
    ['罩杯', p.cup],
    ['專長 ID', Array.isArray(p.specialty_ids) ? p.specialty_ids.join(', ') : ''],
  ]
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => ({ label, value }))
})

const photoItems = computed(() => {
  if (!profile.value) return []
  const photos = []
  if (profile.value.profile_photo_url) {
    photos.push({ label: '大頭照', url: profile.value.profile_photo_url })
  }
  for (const [idx, photo] of (profile.value.photos || []).entries()) {
    if (!photo.url) continue
    photos.push({
      label: photo.is_cover ? '封面照片' : `照片 ${idx + 1}`,
      url: photo.url,
    })
  }
  return photos
})

const socialLinks = computed(() => {
  return (profile.value?.social_medias || [])
    .filter((item) => item.link)
    .map((item) => ({
      label: item.platform || 'social',
      url: item.link,
    }))
})

const videoLinks = computed(() => {
  return (profile.value?.videos || [])
    .filter((item) => item.link)
    .map((item, idx) => ({
      label: `影片 ${idx + 1}`,
      url: item.link,
    }))
})

const saveStatus = async () => {
  if (!profile.value || !selectedStatus.value || selectedStatus.value === profile.value.status) return
  savingStatus.value = true
  statusMessage.value = ''
  error.value = ''
  try {
    await updatePerformerStatus(BASIC_TOKEN, profile.value.user_uuid, selectedStatus.value)
    profile.value.status = selectedStatus.value
    statusMessage.value = '狀態已更新'
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    savingStatus.value = false
  }
}

function formatUnit(value, unit) {
  if (value === undefined || value === null || value === '') return ''
  return `${value} ${unit}`
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

.profileMain {
  display: flex;
  gap: 16px;
  align-items: center;
  min-width: 0;
}

.avatar {
  width: 132px;
  height: 132px;
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

.manager {
  display: flex;
  align-items: center;
  gap: 10px;
}

.managerPhoto {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #eee;
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

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.links a {
  border: 1px solid #ddd;
  border-radius: 8px;
  color: #AE1914;
  padding: 7px 10px;
  background: #fff;
  font-weight: 700;
}

@media (max-width: 860px) {
  .hero,
  .profileMain {
    flex-direction: column;
  }

  .statusPanel {
    width: 100%;
    box-sizing: border-box;
  }

  .detailGrid,
  .photoGrid {
    grid-template-columns: 1fr;
  }
}
</style>
