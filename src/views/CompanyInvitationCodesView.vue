<template>
  <AdminLayout>
    <div class="header">
      <h2 class="title">公司邀請碼產生器</h2>

      <div class="tools">
        <button class="refresh" @click="clear" :disabled="loading">
          清空
        </button>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="card">
      <div class="cardTitle">產生邀請碼</div>

      <div class="formRow">
        <div class="field">
          <div class="label">產生數量（1 ~ 10）</div>
          <input v-model.number="count" type="number" min="1" max="10" />
        </div>

        <div class="field">
          <div class="label">建立者 UUID（creator_uuid）</div>
          <input v-model.trim="creatorUuid" placeholder="例如：550e8400-e29b-41d4-a716-446655440000" />
          <div class="hint">必填。通常是 admin user 的 uuid。</div>
        </div>

        <div class="actions">
          <button class="primary" @click="submit" :disabled="loading">
            {{ loading ? '產生中…' : '產生' }}
          </button>
        </div>
      </div>
    </div>

    <div class="card" v-if="codes.length">
      <div class="cardTitle">產生結果</div>

      <div class="resultRow">
        <button class="ghost" @click="copyAll">一鍵複製全部</button>
        <div class="muted">共 {{ codes.length }} 組</div>
      </div>

      <div class="codes">
        <div class="codeItem" v-for="(c, i) in codes" :key="c + i">
          <div class="mono">{{ c }}</div>
          <button class="ghost" @click="copyOne(c)">複製</button>
        </div>
      </div>
    </div>

    <div class="empty" v-else>
      尚未產生邀請碼
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref } from 'vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import { BASIC_TOKEN } from '../services/auth'
import { createCompanyInvitationCodes } from '../services/invitation_codes'

const loading = ref(false)
const error = ref('')
const count = ref(1)
const creatorUuid = ref('550e8400-e29b-41d4-a716-446655440000')
const codes = ref([])

const clear = () => {
  error.value = ''
  codes.value = []
}

const submit = async () => {
  error.value = ''
  codes.value = []

  const c = Number(count.value)
  if (Number.isNaN(c) || c < 1 || c > 10) {
    error.value = 'count 必須是 1 ~ 10'
    return
  }
  if (!creatorUuid.value) {
    error.value = 'creator_uuid 必填'
    return
  }

  loading.value = true
  try {
    const data = await createCompanyInvitationCodes(BASIC_TOKEN, {
      count: c,
      creator_uuid: creatorUuid.value,
    })
    const list = Array.isArray(data?.invitation_codes) ? data.invitation_codes : []
    codes.value = list
    if (!list.length) error.value = 'API 回傳沒有 invitation_codes（請確認後端回應格式）'
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    loading.value = false
  }
}

const copyOne = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (e) {
    error.value = `複製失敗：${e}`
  }
}

const copyAll = async () => {
  try {
    await navigator.clipboard.writeText(codes.value.join('\n'))
  } catch (e) {
    error.value = `複製失敗：${e}`
  }
}
</script>

<style scoped>
.header{
  display:flex;
  justify-content:space-between;
  align-items:flex-end;
  gap:12px;
  flex-wrap:wrap;
  margin-bottom:12px;
}

.title{ margin:0; }

.tools{ display:flex; gap:10px; align-items:center; }

.error{
  color:#AE1914;
  font-weight:700;
  margin: 8px 0 12px 0;
}

.card{
  border:1px solid #eee;
  border-radius:16px;
  padding:14px;
  background:#fff;
  margin-bottom:12px;
}

.cardTitle{
  font-weight:800;
  margin-bottom:10px;
}

.formRow{
  display:grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
  align-items: start;
}

@media (max-width: 900px){
  .formRow{ grid-template-columns: 1fr; }
}

.field .label{
  font-weight: 800;
  margin-bottom: 6px;
}

input{
  border:1px solid #ddd;
  border-radius:12px;
  padding:10px 12px;
  outline:none;
  width:100%;
}

input:focus{
  border-color:#AE1914;
  box-shadow:0 0 0 3px rgba(174,25,20,0.12);
}

.hint{
  margin-top:6px;
  opacity:0.65;
  font-size:12px;
}

.actions{
  grid-column: 1 / -1;
  display:flex;
  justify-content:flex-end;
  margin-top: 4px;
}

button{
  border-radius:12px;
  padding:9px 12px;
  cursor:pointer;
  border:1px solid #ddd;
  background:#fff;
  font-weight:800;
}

button.primary{
  border-color:#AE1914;
  background:#AE1914;
  color:#fff;
}

button.primary:disabled{ opacity:0.6; cursor:not-allowed; }

button.ghost:hover{ border-color:#bbb; }

button.refresh{
  border:1px solid #ddd;
}

.resultRow{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:10px;
}

.codes{
  display:grid;
  grid-template-columns: 1fr;
  gap:8px;
}

.codeItem{
  border:1px solid #f0f0f0;
  border-radius:12px;
  padding:10px 12px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:10px;
}

.mono{
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.muted{ opacity:0.7; }

.empty{
  opacity:0.7;
  padding: 12px 0;
}
</style>
