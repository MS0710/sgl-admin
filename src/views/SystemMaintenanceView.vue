<template>
  <AdminLayout>
    <div class="header">
      <div>
        <h2 class="title">系統維護設定</h2>
        <p class="subtitle">控制前台維護模式、登入與下單開關。</p>
      </div>

      <button class="refresh" @click="load" :disabled="loading">
        {{ loading ? '載入中...' : '重新整理' }}
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="savedMessage" class="success">{{ savedMessage }}</p>

    <div class="statusPanel">
      <div>
        <div class="eyebrow">目前狀態</div>
        <div class="statusLine">
          <span class="dot" :class="{ on: form.is_maintenance }"></span>
          <strong>{{ form.is_maintenance ? '維護中' : '正常服務' }}</strong>
          <span class="mode">{{ modeLabel(form.mode) }}</span>
        </div>
      </div>

      <div class="statusMeta">
        <div>ID：{{ maintenance?.id ?? '-' }}</div>
        <div>更新：{{ formatDateTime(maintenance?.updated_at) }}</div>
      </div>
    </div>

    <div class="formGrid">
      <section class="section">
        <div class="sectionTitle">維護內容</div>

        <label class="field checkboxField">
          <input v-model="form.is_maintenance" type="checkbox" />
          <span>
            <strong>啟用維護模式</strong>
            <small>開啟後依下方設定限制登入或下單。</small>
          </span>
        </label>

        <label class="field">
          <span>維護模式</span>
          <select v-model="form.mode">
            <option value="full">全站維護 full</option>
            <option value="partial">部分維護 partial</option>
          </select>
        </label>

        <label class="field">
          <span>維護標題</span>
          <input v-model="form.title" placeholder="系統維護中" />
        </label>

        <label class="field">
          <span>維護訊息</span>
          <textarea v-model="form.message" rows="4" placeholder="系統正在維護，請稍後再試。" />
        </label>

        <label class="field">
          <span>客服聯絡方式</span>
          <input v-model="form.support_contact" placeholder="support@sgl.com.tw" />
        </label>
      </section>

      <section class="section">
        <div class="sectionTitle">時間與限制</div>

        <label class="field">
          <span>開始時間 (UTC)</span>
          <input v-model="form.start_time" type="datetime-local" />
        </label>

        <label class="field">
          <span>結束時間 (UTC)</span>
          <input v-model="form.end_time" type="datetime-local" />
        </label>

        <div class="toggleList">
          <label class="toggleField">
            <input v-model="form.force_update" type="checkbox" />
            <span>強制更新</span>
          </label>

          <label class="toggleField">
            <input v-model="form.allow_login" type="checkbox" />
            <span>允許登入</span>
          </label>

          <label class="toggleField">
            <input v-model="form.allow_order" type="checkbox" />
            <span>允許下單</span>
          </label>
        </div>

        <div class="actions">
          <button class="ghost" @click="resetForm" :disabled="saving || loading">還原</button>
          <button class="primary" @click="save" :disabled="saving || loading">
            {{ saving ? '儲存中...' : '儲存設定' }}
          </button>
        </div>
      </section>
    </div>

    <section class="section rawSection">
      <div class="sectionTitle">API 回應</div>
      <pre>{{ prettyMaintenance }}</pre>
    </section>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import { BASIC_TOKEN } from '../services/auth'
import {
  fetchSystemMaintenance,
  updateSystemMaintenance,
} from '../services/maintenance'

const emptyForm = {
  is_maintenance: false,
  mode: 'full',
  title: '',
  message: '',
  start_time: '',
  end_time: '',
  force_update: false,
  allow_login: true,
  allow_order: true,
  support_contact: '',
}

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const savedMessage = ref('')
const maintenance = ref(null)
const form = ref({ ...emptyForm })

const prettyMaintenance = computed(() => JSON.stringify(maintenance.value ?? {}, null, 2))

function toDatetimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 16)
}

function fromDatetimeLocal(value) {
  if (!value) return null
  const normalized = value.length === 16 ? `${value}:00Z` : `${value}Z`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function hydrateForm(data) {
  form.value = {
    is_maintenance: Boolean(data?.is_maintenance),
    mode: data?.mode || 'full',
    title: data?.title || '',
    message: data?.message || '',
    start_time: toDatetimeLocal(data?.start_time),
    end_time: toDatetimeLocal(data?.end_time),
    force_update: Boolean(data?.force_update),
    allow_login: Boolean(data?.allow_login),
    allow_order: Boolean(data?.allow_order),
    support_contact: data?.support_contact || '',
  }
}

const load = async () => {
  error.value = ''
  savedMessage.value = ''
  loading.value = true
  try {
    const data = await fetchSystemMaintenance(BASIC_TOKEN)
    maintenance.value = data
    hydrateForm(data)
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

function resetForm() {
  hydrateForm(maintenance.value)
  savedMessage.value = ''
  error.value = ''
}

function buildPayload() {
  return {
    is_maintenance: Boolean(form.value.is_maintenance),
    mode: form.value.mode,
    title: form.value.title.trim(),
    message: form.value.message.trim(),
    start_time: fromDatetimeLocal(form.value.start_time),
    end_time: fromDatetimeLocal(form.value.end_time),
    force_update: Boolean(form.value.force_update),
    allow_login: Boolean(form.value.allow_login),
    allow_order: Boolean(form.value.allow_order),
    support_contact: form.value.support_contact.trim() || null,
  }
}

const save = async () => {
  error.value = ''
  savedMessage.value = ''

  if (!['full', 'partial'].includes(form.value.mode)) {
    error.value = 'mode 只能是 full 或 partial'
    return
  }

  saving.value = true
  try {
    const updated = await updateSystemMaintenance(BASIC_TOKEN, buildPayload())
    maintenance.value = updated
    hydrateForm(updated)
    savedMessage.value = '維護設定已更新'
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    saving.value = false
  }
}

function modeLabel(mode) {
  if (mode === 'partial') return '部分維護'
  if (mode === 'full') return '全站維護'
  return mode || '-'
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('zh-TW', { hour12: false })
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.title {
  margin: 0;
}

.subtitle {
  margin: 4px 0 0;
  color: #666;
  font-size: 14px;
}

.error,
.success {
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 800;
  margin: 0 0 12px;
}

.error {
  color: #ae1914;
  background: rgba(174, 25, 20, 0.08);
}

.success {
  color: #116d3f;
  background: #e7f7ee;
}

.statusPanel,
.section {
  border: 1px solid #eee;
  border-radius: 16px;
  background: #fff;
}

.statusPanel {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 16px;
  margin-bottom: 12px;
}

.eyebrow {
  color: #777;
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 6px;
}

.statusLine {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #2f9e44;
}

.dot.on {
  background: #ae1914;
}

.mode {
  border: 1px solid rgba(174, 25, 20, 0.25);
  border-radius: 999px;
  color: #ae1914;
  font-size: 12px;
  font-weight: 800;
  padding: 3px 9px;
}

.statusMeta {
  color: #666;
  font-size: 13px;
  text-align: right;
}

.formGrid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: 12px;
}

.section {
  padding: 16px;
}

.sectionTitle {
  font-weight: 900;
  margin-bottom: 12px;
}

.field {
  display: grid;
  gap: 6px;
  margin-bottom: 12px;
  color: #333;
  font-weight: 800;
}

.field small {
  display: block;
  color: #777;
  font-weight: 500;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 10px 12px;
  background: #fff;
  color: #111;
  font: inherit;
  outline: none;
}

.field textarea {
  resize: vertical;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: #ae1914;
  box-shadow: 0 0 0 3px rgba(174, 25, 20, 0.12);
}

.checkboxField {
  grid-template-columns: auto 1fr;
  align-items: center;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 12px;
}

.checkboxField input,
.toggleField input {
  width: 18px;
  height: 18px;
  accent-color: #ae1914;
}

.toggleList {
  display: grid;
  gap: 10px;
  margin-top: 4px;
}

.toggleField {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 12px;
  font-weight: 800;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
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

button.primary {
  border-color: #ae1914;
  background: #ae1914;
  color: #fff;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh {
  white-space: nowrap;
}

.rawSection {
  margin-top: 12px;
}

pre {
  margin: 0;
  padding: 12px;
  overflow: auto;
  border-radius: 12px;
  background: #111;
  color: #e8f5e9;
  font-size: 12px;
  line-height: 1.6;
  text-align: left;
}

@media (max-width: 900px) {
  .formGrid {
    grid-template-columns: 1fr;
  }

  .statusPanel {
    display: block;
  }

  .statusMeta {
    margin-top: 12px;
    text-align: left;
  }
}
</style>
