<template>
  <AdminLayout>
    <div class="header">
      <h2 class="title">專長列表編輯</h2>

      <div class="tools">
        <input v-model="q" placeholder="搜尋名稱 / 分類..." />
        <button class="refresh" @click="load" :disabled="loading">
          {{ loading ? '載入中…' : '重新整理' }}
        </button>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <!-- 新增專長 -->
    <div class="card">
      <div class="cardTitle">新增專長</div>

      <div class="formRow">
        <input v-model="newName" placeholder="名稱 (name) *" />

        <!-- ✅ 方案 A：可選現有分類，也可輸入新分類 -->
        <input
          v-model="newCategory"
          placeholder="分類 (category) *（可選現有/也可輸入新分類）"
          list="category-list"
        />
        <datalist id="category-list">
          <option v-for="c in categories" :key="c" :value="c" />
        </datalist>

        <input
          v-model.number="newSortOrder"
          type="number"
          placeholder="排序 (sort_order)（若選現有分類會自動帶入 +1）"
        />

        <div class="formActions">
          <button class="primary" @click="onCreate" :disabled="creating">
            {{ creating ? '新增中…' : '新增' }}
          </button>
        </div>
      </div>

      <div class="hint">
        ※ category 在 Update API 裡通常不支援更新（如需改分類，建議刪除後重建）。<br />
        ※ sort_order 用於排序顯示；同一分類若重複可能導致順序不穩，已在前端防呆避免重複。
      </div>
    </div>

    <!-- 列表 -->
    <div v-if="!loading && filtered.length === 0" class="empty">沒有資料</div>

    <div v-else class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th class="colId">ID</th>
            <th class="colCat">分類</th>
            <th>名稱</th>
            <th class="colSort">排序</th>
            <th class="colActions">操作</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="s in filtered" :key="s.id">
            <td class="mono">{{ s.id }}</td>

            <!-- category：預設顯示，不做 edit（避免跟 API 規格衝突） -->
            <td>
              <span v-if="editingId !== s.id">{{ s.category }}</span>
              <span v-else class="muted">{{ s.category }}</span>
            </td>

            <td>
              <span v-if="editingId !== s.id">{{ s.name }}</span>
              <input v-else v-model="editName" />
            </td>

            <td class="colSort">
              <span v-if="editingId !== s.id">{{ s.sort_order }}</span>
              <input v-else v-model.number="editSortOrder" type="number" />
            </td>

            <td class="colActions">
              <div class="actions">
                <button v-if="editingId !== s.id" class="ghost" @click="startEdit(s)">編輯</button>
                <button v-else class="primary" @click="saveEdit(s)" :disabled="saving">
                  {{ saving ? '儲存中…' : '儲存' }}
                </button>

                <button v-if="editingId === s.id" class="ghost" @click="cancelEdit" :disabled="saving">
                  取消
                </button>

                <button class="danger" @click="onDelete(s)" :disabled="deletingId === s.id">
                  {{ deletingId === s.id ? '刪除中…' : '刪除' }}
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
import { computed, onMounted, ref, watch } from 'vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import { BASIC_TOKEN } from '../services/auth'
import {
  fetchSpecialties,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
} from '../services/specialties'

const loading = ref(false)
const error = ref('')
const specialties = ref([])
const q = ref('')

// create
const newName = ref('')
const newCategory = ref('')
const newSortOrder = ref(null)
const creating = ref(false)
const userTouchedSortOrder = ref(false) // ✅ 使用者是否手動改過 sort_order（避免自動覆蓋）

// edit
const editingId = ref(null)
const editName = ref('')
const editSortOrder = ref(null)
const saving = ref(false)

// delete
const deletingId = ref(null)

const load = async () => {
  error.value = ''
  loading.value = true
  try {
    const list = await fetchSpecialties(BASIC_TOKEN)
    // 前端先按 sort_order 反向排序顯示
    specialties.value = [...list].sort((a, b) => (b.sort_order ?? 0) - (a.sort_order ?? 0))
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
  if (!keyword) return specialties.value
  return specialties.value.filter((s) => {
    const hay = `${s.name ?? ''} ${s.category ?? ''}`.toLowerCase()
    return hay.includes(keyword)
  })
})

/** ✅ 方案A：從現有資料自動整理分類清單 */
const categories = computed(() => {
  const set = new Set()
  for (const s of specialties.value) {
    if (s?.category) set.add(s.category)
  }
  return Array.from(set).sort()
})

/** ✅ 取得某分類下一個 sort_order（max + 1） */
function nextSortOrderForCategory(category) {
  const list = specialties.value.filter((s) => s.category === category)
  const max = list.reduce((m, s) => Math.max(m, Number(s.sort_order ?? 0)), 0)
  return max + 1
}

/** ✅ 防呆：同分類 sort_order 不重複 */
function isSortOrderTaken(category, so) {
  return specialties.value.some((s) => s.category === category && Number(s.sort_order) === Number(so))
}

/** ✅ 只要 category 變更，若使用者沒手動輸入 sort_order，就自動帶入 +1 */
watch(newCategory, (cat) => {
  const c = (cat || '').trim()
  if (!c) return

  if (!userTouchedSortOrder.value) {
    newSortOrder.value = nextSortOrderForCategory(c)
  }
})

/** ✅ 只要使用者動了 sort_order，就不要再自動覆蓋 */
watch(newSortOrder, (v, oldV) => {
  if (loading.value) return
  // 這個判斷用來避免剛 watch(newCategory) 自動塞值就被當成「使用者修改」
  // 若 oldV 為 null 且 v 是我們自動計算塞的，userTouchedSortOrder 仍為 false
  // 一旦使用者手動再改，v 會變動，這裡就會設為 true
  if (oldV !== undefined && oldV !== v) {
    // 但如果是 cat watch 自動填的，此時 userTouchedSortOrder 還是 false
    // 使用者真正手動時才會觸發（你輸入框打字/改數字）
    // 這裡保守：只要目前有值且輸入框被改過，就視為 touched
    // 若你覺得太敏感，也可改成在 @input 事件設 touched（但你現在是純 input，先不加事件）
    if (userTouchedSortOrder.value === false && String(v ?? '').trim() !== '') {
      // 不直接設 true，避免「第一次自動帶值」就鎖死
      // 所以改成：只要分類清單已有且 v 不等於 nextSortOrder，就視為使用者改過
      const c = (newCategory.value || '').trim()
      if (c) {
        const auto = nextSortOrderForCategory(c)
        if (Number(v) !== Number(auto)) userTouchedSortOrder.value = true
      }
    } else if (userTouchedSortOrder.value === true) {
      // already touched
    }
  }
})

const onCreate = async () => {
  error.value = ''
  const name = newName.value.trim()
  const category = newCategory.value.trim()
  if (!name || !category) {
    error.value = 'name、category 為必填'
    return
  }

  creating.value = true
  try {
    const payload = {
      name,
      category,
    }

    // sort_order 可選，但我們通常會自動帶
    const so = Number(newSortOrder.value)
    if (!Number.isNaN(so) && newSortOrder.value !== null && String(newSortOrder.value).trim() !== '') {
      // ✅ 防止同分類重複
      if (isSortOrderTaken(category, so)) {
        error.value = `此分類 sort_order=${so} 已存在，請改成其他值（或保持自動帶入）。`
        return
      }
      payload.sort_order = so
    }

    await createSpecialty(BASIC_TOKEN, payload)

    // 清空表單 + reload
    newName.value = ''
    newCategory.value = ''
    newSortOrder.value = null
    userTouchedSortOrder.value = false
    await load()
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    creating.value = false
  }
}

const startEdit = (s) => {
  editingId.value = s.id
  editName.value = s.name ?? ''
  editSortOrder.value = s.sort_order ?? 0
}

const cancelEdit = () => {
  editingId.value = null
  editName.value = ''
  editSortOrder.value = null
}

const saveEdit = async (s) => {
  error.value = ''
  const name = editName.value.trim()
  if (!name) {
    error.value = 'name 為必填'
    return
  }

  const so = Number(editSortOrder.value)
  if (Number.isNaN(so)) {
    error.value = 'sort_order 必須是數字'
    return
  }

  // ✅ 編輯時也防止同分類 sort_order 跟「其他筆」衝突
  const category = s.category
  const clash = specialties.value.some(
    (x) => x.id !== s.id && x.category === category && Number(x.sort_order) === Number(so)
  )
  if (clash) {
    error.value = `此分類 sort_order=${so} 已被其他專長使用，請改成其他值`
    return
  }

  saving.value = true
  try {
    await updateSpecialty(BASIC_TOKEN, s.id, {
      name,
      category: s.category,
      sort_order: so,
    })

    cancelEdit()
    await load()
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    saving.value = false
  }
}

const onDelete = async (s) => {
  error.value = ''
  const ok = confirm(`確定刪除專長？\n\n#${s.id} ${s.category} / ${s.name}`)
  if (!ok) return

  deletingId.value = s.id
  try {
    await deleteSpecialty(BASIC_TOKEN, s.id)
    await load()
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    deletingId.value = null
  }
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

.title { margin: 0; }

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
  width: 100%;
  min-width: 180px;
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

.refresh:disabled { opacity: 0.6; cursor: not-allowed; }

.error {
  color: #AE1914;
  font-weight: 700;
  margin: 8px 0 12px 0;
}

.empty { opacity: 0.7; padding: 12px 0; }

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

/* ✅ 不再擠成一條：桌機兩欄，sort_order 佔滿，按鈕獨立列靠右 */
.formRow{
  display: grid;
  grid-template-columns: 1fr 1fr; /* 名稱、分類兩欄 */
  gap: 10px;
  align-items: center;
}

.formRow input[type="number"]{
  grid-column: 1 / -1; /* sort_order 佔滿整列 */
  min-width: 0;
}

.formActions{
  grid-column: 1 / -1; /* 按鈕佔滿整列 */
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .formRow{ grid-template-columns: 1fr; }
  input{ min-width: 0; }
}

.hint {
  margin-top: 8px;
  opacity: 0.65;
  font-size: 12px;
}

.tableWrap {
  border: 1px solid #eee;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
  text-align: left;
}

thead th {
  background: #fafafa;
  font-weight: 800;
}

.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.muted { opacity: 0.7; }

.colId { width: 90px; }
.colCat { width: 160px; }
.colSort { width: 140px; }
.colActions { width: 240px; }

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
  font-weight: 800;
}

button.ghost:hover { border-color: #bbb; }

button.primary {
  border-color: #AE1914;
  background: #AE1914;
  color: #fff;
  color: #fff;
}

button.primary:disabled { opacity: 0.6; cursor: not-allowed; }

button.danger {
  border-color: #ffdddd;
  background: #fff5f5;
  color: #b00020;
}

.foot {
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
