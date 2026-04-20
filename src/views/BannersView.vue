<template>
  <AdminLayout>
    <div class="header">
      <div>
        <h2 class="title">廣告管理</h2>
        <div class="subtitle">管理後台廣告輪播項目</div>
      </div>

      <div class="tools">
        <input v-model="q" placeholder="搜尋標題 / UUID / 連結..." />
        <select v-model="activeCategory">
          <option value="">全部類別</option>
          <option v-for="category in CATEGORY_OPTIONS" :key="category.value" :value="category.value">
            {{ category.label }}
          </option>
        </select>
        <select v-model="activeStatus">
          <option value="">全部狀態</option>
          <option value="active">上架中</option>
          <option value="inactive">未上架</option>
        </select>
        <button class="refresh" @click="load" :disabled="loading">
          {{ loading ? '載入中...' : '重新整理' }}
        </button>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="card">
      <div class="cardTitle">新增廣告</div>

      <div class="formGrid">
        <label class="field">
          <span>廣告標題 *</span>
          <input v-model.trim="newForm.title" maxlength="100" placeholder="例如：首頁主視覺活動" />
        </label>

        <div class="field fieldWide">
          <span>圖片 URL *</span>

          <div class="imageMode">
            <button type="button" :class="{ active: newImageMode === 'url' }" @click="setImageMode('url', newImage, newForm, 'new')">
              貼 URL
            </button>
            <button type="button" :class="{ active: newImageMode === 'upload' }" @click="setImageMode('upload', newImage, newForm, 'new')">
              上傳圖片
            </button>
          </div>

          <div v-if="newImageMode === 'url'" class="urlBox">
            <input v-model.trim="newForm.image_url" placeholder="https://..." @input="resetImageState(newImage)" />
            <img v-if="newForm.image_url" class="urlPreview" :src="newForm.image_url" alt="" />
          </div>

          <div
            v-else
            class="dropZone"
            :class="{ dragging: newImage.dragging }"
            @dragover.prevent="newImage.dragging = true"
            @dragleave.prevent="newImage.dragging = false"
            @drop.prevent="onImageDrop($event, newImage, newForm)"
          >
            <input ref="newFileInput" class="fileInput" type="file" accept="image/jpeg,image/png,image/jpg" @change="onImagePick($event, newImage, newForm)" />
            <div v-if="newImage.previewUrl || newForm.image_url" class="uploadPreview">
              <img :src="newImage.previewUrl || newForm.image_url" alt="" />
              <div>
                <div class="uploadTitle">{{ newImage.file?.name || '已設定圖片' }}</div>
                <div class="uploadUrl">{{ newForm.image_url || '送出時會自動上傳並帶入 URL' }}</div>
              </div>
            </div>
            <div v-else class="uploadEmpty">
              <div class="uploadTitle">拖曳圖片到這裡，或選擇檔案</div>
              <div class="uploadUrl">支援 JPEG、PNG、JPG</div>
            </div>
            <div class="uploadActions">
              <button type="button" class="ghost" @click="newFileInput?.click()">選擇圖片</button>
              <button v-if="newImage.file || newForm.image_url" type="button" class="ghost" @click="clearImage(newImage, newForm)">清除</button>
            </div>
          </div>
        </div>

        <label class="field">
          <span>廣告類別 *</span>
          <select v-model="newForm.category">
            <option v-for="category in CATEGORY_OPTIONS" :key="category.value" :value="category.value">
              {{ category.label }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>連結類型 *</span>
          <select v-model="newForm.link_type">
            <option value="internal">站內連結</option>
            <option value="external">外部連結</option>
          </select>
        </label>

        <label class="field">
          <span>跳轉連結</span>
          <input v-model.trim="newForm.link_url" placeholder="/performers 或 https://..." />
        </label>

        <label class="field">
          <span>排序權重</span>
          <input v-model.number="newForm.sort_order" type="number" />
        </label>

        <label class="field">
          <span>廣告狀態 *</span>
          <select v-model="newForm.status">
            <option value="active">上架中</option>
            <option value="inactive">未上架</option>
          </select>
        </label>

        <label class="field">
          <span>開始時間 *</span>
          <input v-model="newForm.start_at" type="datetime-local" />
        </label>

        <label class="field">
          <span>結束時間 *</span>
          <input v-model="newForm.expired_at" type="datetime-local" />
        </label>
      </div>

      <div class="formActions">
        <button class="primary" @click="onCreate" :disabled="creating">
          {{ creating ? '新增中...' : '新增廣告' }}
        </button>
      </div>
    </div>

    <div v-if="selectedBanner" class="detail">
      <div class="detailMain">
        <img v-if="selectedBanner.image_url" :src="selectedBanner.image_url" alt="" />
        <div v-else class="imageEmpty">無圖片</div>

        <div>
          <div class="detailTitle">{{ selectedBanner.title || '-' }}</div>
          <div class="detailMeta mono">{{ selectedBanner.uuid }}</div>
          <div class="detailBadges">
            <span class="badge">{{ categoryLabel(selectedBanner.category) }}</span>
            <span class="badge" :class="`status-${selectedBanner.status || 'unknown'}`">
              {{ statusLabel(selectedBanner.status) }}
            </span>
            <span class="badge">{{ linkTypeLabel(selectedBanner.link_type) }}</span>
          </div>
        </div>
      </div>

      <button class="ghost" @click="selectedBanner = null">關閉詳情</button>
    </div>

    <div v-if="!loading && filtered.length === 0" class="empty">沒有廣告資料</div>

    <div v-else class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th class="colImage">圖片</th>
            <th>內容</th>
            <th class="colCategory">類別</th>
            <th class="colStatus">狀態</th>
            <th class="colTime">刊登時間</th>
            <th class="colActions">操作</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="banner in filtered" :key="banner.uuid">
            <td>
              <img v-if="banner.image_url" class="thumb" :src="banner.image_url" alt="" />
              <div v-else class="thumb emptyThumb">無圖</div>
            </td>

            <td>
              <template v-if="editingUuid !== banner.uuid">
                <div class="name">{{ banner.title || '-' }}</div>
                <div class="mono small">{{ banner.uuid }}</div>
                <div class="small muted">{{ banner.link_url || '未設定連結' }}</div>
                <div class="small muted">排序：{{ banner.sort_order ?? 0 }}</div>
              </template>

              <div v-else class="editGrid">
                <input v-model.trim="editForm.title" maxlength="100" placeholder="廣告標題 *" />

                <div class="imageEditor">
                  <div class="imageMode">
                    <button type="button" :class="{ active: editImageMode === 'url' }" @click="setImageMode('url', editImage, editForm, 'edit')">
                      貼 URL
                    </button>
                    <button type="button" :class="{ active: editImageMode === 'upload' }" @click="setImageMode('upload', editImage, editForm, 'edit')">
                      上傳圖片
                    </button>
                  </div>

                  <div v-if="editImageMode === 'url'" class="urlBox">
                    <input v-model.trim="editForm.image_url" placeholder="圖片 URL *" @input="resetImageState(editImage)" />
                    <img v-if="editForm.image_url" class="urlPreview" :src="editForm.image_url" alt="" />
                  </div>

                  <div
                    v-else
                    class="dropZone compact"
                    :class="{ dragging: editImage.dragging }"
                    @dragover.prevent="editImage.dragging = true"
                    @dragleave.prevent="editImage.dragging = false"
                    @drop.prevent="onImageDrop($event, editImage, editForm)"
                  >
                    <input ref="editFileInput" class="fileInput" type="file" accept="image/jpeg,image/png,image/jpg" @change="onImagePick($event, editImage, editForm)" />
                    <div v-if="editImage.previewUrl || editForm.image_url" class="uploadPreview">
                      <img :src="editImage.previewUrl || editForm.image_url" alt="" />
                      <div>
                        <div class="uploadTitle">{{ editImage.file?.name || '已設定圖片' }}</div>
                        <div class="uploadUrl">{{ editForm.image_url || '儲存時會自動上傳並帶入 URL' }}</div>
                      </div>
                    </div>
                    <div v-else class="uploadEmpty">
                      <div class="uploadTitle">拖曳或選擇圖片</div>
                      <div class="uploadUrl">JPEG、PNG、JPG</div>
                    </div>
                    <div class="uploadActions">
                      <button type="button" class="ghost" @click="editFileInput?.click()">選擇圖片</button>
                      <button v-if="editImage.file || editForm.image_url" type="button" class="ghost" @click="clearImage(editImage, editForm)">清除</button>
                    </div>
                  </div>
                </div>

                <input v-model.trim="editForm.link_url" placeholder="跳轉連結" />
                <input v-model.number="editForm.sort_order" type="number" placeholder="排序權重" />
              </div>
            </td>

            <td>
              <span v-if="editingUuid !== banner.uuid">{{ categoryLabel(banner.category) }}</span>
              <select v-else v-model="editForm.category">
                <option v-for="category in CATEGORY_OPTIONS" :key="category.value" :value="category.value">
                  {{ category.label }}
                </option>
              </select>
            </td>

            <td>
              <template v-if="editingUuid !== banner.uuid">
                <span class="badge" :class="`status-${banner.status || 'unknown'}`">
                  {{ statusLabel(banner.status) }}
                </span>
                <div class="small muted">{{ linkTypeLabel(banner.link_type) }}</div>
              </template>

              <div v-else class="stack">
                <select v-model="editForm.status">
                  <option value="active">上架中</option>
                  <option value="inactive">未上架</option>
                </select>
                <select v-model="editForm.link_type">
                  <option value="internal">站內連結</option>
                  <option value="external">外部連結</option>
                </select>
              </div>
            </td>

            <td>
              <template v-if="editingUuid !== banner.uuid">
                <div class="small">開始：{{ formatDateTime(banner.start_at) }}</div>
                <div class="small">結束：{{ formatDateTime(banner.expired_at) }}</div>
              </template>

              <div v-else class="stack">
                <input v-model="editForm.start_at" type="datetime-local" />
                <input v-model="editForm.expired_at" type="datetime-local" />
              </div>
            </td>

            <td>
              <div class="actions">
                <button class="ghost" @click="showDetail(banner)" :disabled="detailLoadingUuid === banner.uuid">
                  {{ detailLoadingUuid === banner.uuid ? '讀取中...' : '詳情' }}
                </button>
                <button v-if="editingUuid !== banner.uuid" class="ghost" @click="startEdit(banner)">
                  編輯
                </button>
                <button v-else class="primary" @click="saveEdit(banner)" :disabled="saving">
                  {{ saving ? '儲存中...' : '儲存' }}
                </button>
                <button v-if="editingUuid === banner.uuid" class="ghost" @click="cancelEdit" :disabled="saving">
                  取消
                </button>
                <button class="danger" @click="onDelete(banner)" :disabled="deletingUuid === banner.uuid">
                  {{ deletingUuid === banner.uuid ? '刪除中...' : '刪除' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="foot">
        <div class="muted">共 {{ filtered.length }} 筆</div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import { BASIC_TOKEN } from '../services/auth'
import {
  createBanner,
  deleteBanner,
  fetchBanner,
  fetchBanners,
  updateBanner,
} from '../services/banners'
import { uploadImage } from '../services/media'

const CATEGORY_OPTIONS = [
  { value: 'home', label: '首頁' },
  { value: 'hot_performer', label: '熱門表演者' },
  { value: 'performer', label: '表演者' },
  { value: 'group', label: '群組' },
  { value: 'announcement', label: '公告' },
]

const loading = ref(false)
const creating = ref(false)
const saving = ref(false)
const error = ref('')
const banners = ref([])
const q = ref('')
const activeCategory = ref('')
const activeStatus = ref('')
const selectedBanner = ref(null)
const detailLoadingUuid = ref(null)
const deletingUuid = ref(null)
const editingUuid = ref(null)
const newFileInput = ref(null)
const editFileInput = ref(null)
const newImageMode = ref('url')
const editImageMode = ref('url')

const blankForm = () => ({
  title: '',
  image_url: '',
  category: 'home',
  link_type: 'internal',
  link_url: '',
  sort_order: 0,
  status: 'active',
  start_at: '',
  expired_at: '',
})

const newForm = reactive(blankForm())
const editForm = reactive(blankForm())
const newImage = reactive({ file: null, previewUrl: '', dragging: false })
const editImage = reactive({ file: null, previewUrl: '', dragging: false })

const load = async () => {
  error.value = ''
  loading.value = true
  try {
    const list = await fetchBanners(BASIC_TOKEN)
    banners.value = [...list].sort((a, b) => {
      const bySort = Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)
      if (bySort !== 0) return bySort
      return String(b.created_at ?? '').localeCompare(String(a.created_at ?? ''))
    })
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
  return banners.value.filter((banner) => {
    if (activeCategory.value && banner.category !== activeCategory.value) return false
    if (activeStatus.value && banner.status !== activeStatus.value) return false
    if (!keyword) return true

    const haystack = [
      banner.uuid,
      banner.title,
      banner.image_url,
      banner.link_url,
      banner.category,
      banner.status,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(keyword)
  })
})

function resetForm(target) {
  Object.assign(target, blankForm())
}

function setImageMode(mode, state, form, target) {
  if (target === 'new') newImageMode.value = mode
  if (target === 'edit') editImageMode.value = mode

  resetImageState(state)
  if (target === 'new') form.image_url = ''
}

function resetImageState(state) {
  if (state.previewUrl) URL.revokeObjectURL(state.previewUrl)
  state.file = null
  state.previewUrl = ''
  state.dragging = false
}

function isAllowedImage(file) {
  return ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)
}

function setImageFile(file, state, form) {
  error.value = ''
  if (!file) return
  if (!isAllowedImage(file)) {
    error.value = '圖片格式僅支援 JPEG、PNG、JPG'
    return
  }

  resetImageState(state)
  state.file = file
  state.previewUrl = URL.createObjectURL(file)
  form.image_url = ''
}

function onImagePick(event, state, form) {
  const file = event.target.files?.[0]
  setImageFile(file, state, form)
  event.target.value = ''
}

function onImageDrop(event, state, form) {
  state.dragging = false
  const file = event.dataTransfer.files?.[0]
  setImageFile(file, state, form)
}

function clearImage(state, form) {
  resetImageState(state)
  form.image_url = ''
}

function toInputDateTime(value) {
  if (!value) return ''
  return String(value).slice(0, 16)
}

function toApiDateTime(value) {
  if (!value) return ''
  const withSeconds = value.length === 16 ? `${value}:00` : value
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(withSeconds)) return withSeconds
  return `${withSeconds}+08:00`
}

function buildPayload(form) {
  return {
    title: form.title.trim(),
    image_url: form.image_url.trim(),
    category: form.category,
    link_type: form.link_type,
    link_url: form.link_url.trim(),
    sort_order: Number(form.sort_order ?? 0),
    status: form.status,
    start_at: toApiDateTime(form.start_at),
    expired_at: toApiDateTime(form.expired_at),
  }
}

function validatePayload(payload, hasPendingImage = false) {
  if (!payload.title) return '廣告標題為必填'
  if (payload.title.length > 100) return '廣告標題不可超過 100 字'
  if (!payload.image_url && !hasPendingImage) return '圖片為必填'
  if (!payload.category) return '廣告類別為必填'
  if (!payload.link_type) return '連結類型為必填'
  if (!payload.status) return '廣告狀態為必填'
  if (!payload.start_at) return '開始時間為必填'
  if (!payload.expired_at) return '結束時間為必填'
  if (Number.isNaN(payload.sort_order)) return '排序權重必須是數字'
  if (Date.parse(payload.expired_at) <= Date.parse(payload.start_at)) return '結束時間必須晚於開始時間'
  return ''
}

async function uploadPendingImage(form, state) {
  if (!state.file) return form.image_url
  const url = await uploadImage(BASIC_TOKEN, state.file)
  form.image_url = url
  resetImageState(state)
  return url
}

const onCreate = async () => {
  error.value = ''
  const payload = buildPayload(newForm)
  const message = validatePayload(payload, newImageMode.value === 'upload' && Boolean(newImage.file))
  if (message) {
    error.value = message
    return
  }

  creating.value = true
  try {
    if (newImageMode.value === 'upload') {
      payload.image_url = await uploadPendingImage(newForm, newImage)
    }
    const data = await createBanner(BASIC_TOKEN, payload)
    resetForm(newForm)
    resetImageState(newImage)
    newImageMode.value = 'url'
    await load()

    const uuid = data?.uuid
    if (uuid) {
      selectedBanner.value = await fetchBanner(BASIC_TOKEN, uuid)
    }
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    creating.value = false
  }
}

const showDetail = async (banner) => {
  error.value = ''
  detailLoadingUuid.value = banner.uuid
  try {
    selectedBanner.value = await fetchBanner(BASIC_TOKEN, banner.uuid)
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    detailLoadingUuid.value = null
  }
}

const startEdit = (banner) => {
  editingUuid.value = banner.uuid
  editImageMode.value = 'url'
  resetImageState(editImage)
  Object.assign(editForm, {
    title: banner.title || '',
    image_url: banner.image_url || '',
    category: banner.category || 'home',
    link_type: banner.link_type || 'internal',
    link_url: banner.link_url || '',
    sort_order: banner.sort_order ?? 0,
    status: banner.status || 'active',
    start_at: toInputDateTime(banner.start_at),
    expired_at: toInputDateTime(banner.expired_at),
  })
}

const cancelEdit = () => {
  editingUuid.value = null
  resetForm(editForm)
  resetImageState(editImage)
  editImageMode.value = 'url'
}

const saveEdit = async (banner) => {
  error.value = ''
  const payload = buildPayload(editForm)
  const message = validatePayload(payload, editImageMode.value === 'upload' && Boolean(editImage.file))
  if (message) {
    error.value = message
    return
  }

  saving.value = true
  try {
    if (editImageMode.value === 'upload') {
      payload.image_url = await uploadPendingImage(editForm, editImage)
    }
    await updateBanner(BASIC_TOKEN, banner.uuid, payload)
    cancelEdit()
    await load()
    if (selectedBanner.value?.uuid === banner.uuid) {
      selectedBanner.value = await fetchBanner(BASIC_TOKEN, banner.uuid)
    }
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    saving.value = false
  }
}

const onDelete = async (banner) => {
  error.value = ''
  const ok = confirm(`確定刪除廣告？\n\n${banner.title || '-'}\n${banner.uuid}`)
  if (!ok) return

  deletingUuid.value = banner.uuid
  try {
    await deleteBanner(BASIC_TOKEN, banner.uuid)
    if (selectedBanner.value?.uuid === banner.uuid) {
      selectedBanner.value = null
    }
    if (editingUuid.value === banner.uuid) {
      cancelEdit()
    }
    await load()
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    deletingUuid.value = null
  }
}

function categoryLabel(value) {
  return CATEGORY_OPTIONS.find((category) => category.value === value)?.label || value || '-'
}

function statusLabel(value) {
  if (value === 'active') return '上架中'
  if (value === 'inactive') return '未上架'
  return value || '未知'
}

function linkTypeLabel(value) {
  if (value === 'internal') return '站內連結'
  if (value === 'external') return '外部連結'
  return value || '-'
}

function formatDateTime(value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 19)
}
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

.subtitle {
  margin-top: 4px;
  color: #666;
  font-size: 14px;
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
  border-radius: 12px;
  padding: 10px 12px;
  outline: none;
  min-width: 0;
  background: #fff;
  color: #111;
}

input:focus,
select:focus {
  border-color: #ae1914;
  box-shadow: 0 0 0 3px rgba(174, 25, 20, 0.12);
}

.tools input {
  width: 260px;
}

.error {
  color: #ae1914;
  font-weight: 700;
  margin: 8px 0 12px 0;
}

.card {
  border: 1px solid #eee;
  border-radius: 16px;
  padding: 14px;
  background: #fff;
  margin-bottom: 12px;
}

.cardTitle {
  font-weight: 800;
  margin-bottom: 10px;
}

.formGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
}

.fieldWide {
  grid-column: span 2;
}

.field span {
  font-size: 13px;
  font-weight: 800;
  color: #333;
}

.imageEditor {
  display: grid;
  gap: 8px;
}

.imageMode {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  width: fit-content;
  border: 1px solid #ddd;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.imageMode button {
  border: 0;
  border-radius: 0;
  padding: 8px 12px;
  background: #fff;
  color: #333;
}

.imageMode button.active {
  background: #ae1914;
  color: #fff;
}

.urlBox {
  display: grid;
  gap: 8px;
}

.urlPreview {
  width: 160px;
  height: 90px;
  border-radius: 10px;
  object-fit: cover;
  background: #f1f1f1;
}

.dropZone {
  border: 1px dashed #d8d8d8;
  border-radius: 12px;
  padding: 12px;
  background: #fcfcfc;
  display: grid;
  gap: 10px;
  min-height: 126px;
}

.dropZone.dragging {
  border-color: #ae1914;
  background: #fff8f8;
  box-shadow: 0 0 0 3px rgba(174, 25, 20, 0.08);
}

.dropZone.compact {
  min-height: 0;
  padding: 10px;
}

.fileInput {
  display: none;
}

.uploadPreview {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.uploadPreview img {
  width: 96px;
  height: 58px;
  border-radius: 10px;
  object-fit: cover;
  background: #f1f1f1;
}

.uploadEmpty {
  border-radius: 10px;
  min-height: 58px;
  display: grid;
  place-content: center;
  gap: 2px;
  text-align: center;
  color: #555;
}

.uploadTitle {
  font-weight: 800;
  overflow-wrap: anywhere;
}

.uploadUrl {
  color: #777;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.uploadActions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.formActions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.detail {
  border: 1px solid rgba(174, 25, 20, 0.2);
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 12px;
  background: #fff8f8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.detailMain {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.detailMain img,
.imageEmpty {
  width: 140px;
  height: 78px;
  border-radius: 10px;
  object-fit: cover;
  background: #f1f1f1;
  flex: 0 0 auto;
}

.imageEmpty {
  display: grid;
  place-items: center;
  color: #777;
  font-size: 13px;
}

.detailTitle {
  font-weight: 900;
  font-size: 18px;
}

.detailMeta {
  color: #666;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.detailBadges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.tableWrap {
  border: 1px solid #eee;
  border-radius: 16px;
  overflow: auto;
  background: #fff;
}

.table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: top;
  text-align: left;
}

.table th {
  background: #fafafa;
  font-weight: 800;
}

.thumb {
  width: 88px;
  height: 50px;
  object-fit: cover;
  border-radius: 10px;
  background: #f1f1f1;
  display: block;
}

.emptyThumb {
  display: grid;
  place-items: center;
  color: #777;
  font-size: 12px;
}

.name {
  font-weight: 800;
}

.small {
  font-size: 12px;
  overflow-wrap: anywhere;
}

.muted {
  opacity: 0.7;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.badge {
  display: inline-block;
  border-radius: 999px;
  padding: 3px 10px;
  background: #f2f2f2;
  color: #333;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.status-active {
  color: #116d3f;
  background: #e7f7ee;
}

.status-inactive {
  color: #8b5a00;
  background: #fff4dd;
}

.status-unknown {
  color: #555;
  background: #f2f2f2;
}

.editGrid,
.stack {
  display: grid;
  gap: 8px;
}

.colImage {
  width: 110px;
}

.colCategory {
  width: 130px;
}

.colStatus {
  width: 130px;
}

.colTime {
  width: 180px;
}

.colActions {
  width: 220px;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

button {
  border-radius: 12px;
  padding: 9px 12px;
  cursor: pointer;
  border: 1px solid #ddd;
  background: #fff;
  color: #111;
  font-weight: 800;
}

button.primary,
button.refresh {
  border-color: #ae1914;
  background: #ae1914;
  color: #fff;
}

button.danger {
  border-color: #ffdddd;
  background: #fff5f5;
  color: #b00020;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button.ghost:hover {
  border-color: #bbb;
}

.foot {
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
}

.empty {
  opacity: 0.7;
  padding: 12px 0;
}

@media (max-width: 900px) {
  .tools,
  .tools input,
  .tools select {
    width: 100%;
  }

  .formGrid {
    grid-template-columns: 1fr;
  }

  .detail,
  .detailMain {
    align-items: stretch;
    flex-direction: column;
  }

  .detailMain img,
  .imageEmpty {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }
}
</style>
