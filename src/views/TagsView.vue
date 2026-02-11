<template>
  <AdminLayout>
    <div class="header">
      <h2 class="title">Tag 管理</h2>

      <div class="tools">
        <input v-model="q" placeholder="搜尋名稱 / 分類..." />
        <button class="refresh" @click="load" :disabled="loading">
          {{ loading ? '載入中…' : '重新整理' }}
        </button>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="card">
      <div class="cardTitle">新增 Tag</div>

      <div class="formRow">
        <input v-model="newName" placeholder="名稱 (name) *" />
        <input v-model="newCategory" placeholder="分類 (category) *" list="category-list" />
        <datalist id="category-list">
          <option v-for="c in categories" :key="c" :value="c" />
        </datalist>
        <input :value="newSortOrderText" disabled />
        <div class="formActions">
          <button class="primary" @click="onCreate" :disabled="creating">
            {{ creating ? '新增中…' : '新增' }}
          </button>
        </div>
      </div>
    </div>

    <div class="filters" v-if="categories.length">
      <button class="chip" :class="{ active: activeCategory === '' }" @click="activeCategory = ''">全部分類</button>
      <button
        v-for="c in categories"
        :key="c"
        class="chip"
        :class="{ active: activeCategory === c }"
        @click="activeCategory = c"
      >
        {{ c }}
      </button>
    </div>

    <div v-if="!loading && filtered.length === 0" class="empty">沒有 tag 資料</div>

    <div v-else class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th class="colId">ID</th>
            <th class="colCat">分類</th>
            <th>名稱</th>
            <th class="colStatus">狀態</th>
            <th class="colSort">排序</th>
            <th class="colActions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tag in filtered" :key="tag.id">
            <td class="mono">{{ tag.id }}</td>
            <td>
              <span v-if="editingId !== tag.id">{{ tag.category || '-' }}</span>
              <input v-else v-model="editCategory" />
            </td>
            <td>
              <span v-if="editingId !== tag.id">{{ tag.name || '-' }}</span>
              <input v-else v-model="editName" />
            </td>
            <td>
              <span class="status" :class="`status-${tag.status || 'unknown'}`">
                {{ tag.status || 'unknown' }}
              </span>
            </td>
            <td>
              <span v-if="editingId !== tag.id">{{ tag.sort_order ?? '-' }}</span>
              <input v-else :value="editSortOrderText" disabled />
            </td>
            <td class="colActions">
              <div class="actions">
                <button v-if="editingId !== tag.id" class="ghost" @click="startEdit(tag)">編輯</button>
                <button v-else class="primary" @click="saveEdit(tag)" :disabled="saving">
                  {{ saving ? '儲存中…' : '儲存' }}
                </button>
                <button v-if="editingId === tag.id" class="ghost" @click="cancelEdit" :disabled="saving">取消</button>
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
import { createTag, fetchTags, updateTag } from '../services/tags'

const loading = ref(false)
const error = ref('')
const tags = ref([])
const q = ref('')
const activeCategory = ref('')
const creating = ref(false)
const saving = ref(false)

const newName = ref('')
const newCategory = ref('')
const newSortOrder = ref(null)

const editingId = ref(null)
const editingOriginalTag = ref(null)
const editName = ref('')
const editCategory = ref('')
const editSortOrder = ref(null)

const load = async () => {
  error.value = ''
  loading.value = true
  try {
    const list = await fetchTags(BASIC_TOKEN)
    tags.value = [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

const categories = computed(() => {
  const set = new Set()
  for (const tag of tags.value) {
    if (tag?.category) set.add(tag.category)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

function nextSortOrderForCategory(category) {
  const list = tags.value.filter((tag) => tag.category === category)
  const max = list.reduce((m, tag) => Math.max(m, Number(tag.sort_order ?? 0)), 0)
  return max + 1
}

watch(newCategory, (cat) => {
  const c = (cat || '').trim()
  if (!c) {
    newSortOrder.value = null
    return
  }
  newSortOrder.value = nextSortOrderForCategory(c)
})

watch(editCategory, (cat) => {
  const c = (cat || '').trim()
  if (!c || !editingOriginalTag.value) {
    editSortOrder.value = null
    return
  }

  if (c === editingOriginalTag.value.category) {
    editSortOrder.value =
      editingOriginalTag.value.sort_order ?? nextSortOrderForCategory(c)
    return
  }

  editSortOrder.value = nextSortOrderForCategory(c)
})

const newSortOrderText = computed(() => {
  if (!newCategory.value.trim()) return '排序 (sort_order)：請先選擇分類'
  if (newSortOrder.value === null) return '排序 (sort_order)：自動計算中'
  return `排序 (sort_order)：${newSortOrder.value}（系統自動）`
})

const editSortOrderText = computed(() => {
  if (!editCategory.value.trim()) return '排序 (sort_order)：請先填分類'
  if (editSortOrder.value === null) return '排序 (sort_order)：自動計算中'
  return `排序 (sort_order)：${editSortOrder.value}（系統自動）`
})

const filtered = computed(() => {
  const keyword = q.value.trim().toLowerCase()
  return tags.value.filter((tag) => {
    const matchCategory = !activeCategory.value || tag.category === activeCategory.value
    if (!keyword) return matchCategory
    const haystack = `${tag.name ?? ''} ${tag.category ?? ''} ${tag.status ?? ''}`.toLowerCase()
    return matchCategory && haystack.includes(keyword)
  })
})

const onCreate = async () => {
  error.value = ''
  const name = newName.value.trim()
  const category = newCategory.value.trim()
  if (!name || !category) {
    error.value = 'name、category 為必填'
    return
  }

  const payload = { name, category }
  const so = Number(newSortOrder.value ?? nextSortOrderForCategory(category))
  if (!Number.isNaN(so)) {
    payload.sort_order = so
  }

  creating.value = true
  try {
    await createTag(BASIC_TOKEN, payload)
    newName.value = ''
    newCategory.value = ''
    newSortOrder.value = null
    await load()
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    creating.value = false
  }
}

const startEdit = (tag) => {
  editingId.value = tag.id
  editingOriginalTag.value = tag
  editName.value = tag.name || ''
  editCategory.value = tag.category || ''
  editSortOrder.value = tag.sort_order ?? nextSortOrderForCategory(tag.category || '')
}

const cancelEdit = () => {
  editingId.value = null
  editingOriginalTag.value = null
  editName.value = ''
  editCategory.value = ''
  editSortOrder.value = null
}

const saveEdit = async (tag) => {
  error.value = ''
  const name = editName.value.trim()
  const category = editCategory.value.trim()
  if (!name || !category) {
    error.value = 'name、category 為必填'
    return
  }

  const payload = { name, category }
  const so = Number(editSortOrder.value ?? nextSortOrderForCategory(category))
  if (!Number.isNaN(so)) {
    payload.sort_order = so
  }

  saving.value = true
  try {
    await updateTag(BASIC_TOKEN, tag.id, payload)
    cancelEdit()
    await load()
  } catch (e) {
    error.value = String(e)
    console.error(e)
  } finally {
    saving.value = false
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

.title {
  margin: 0;
}

.tools {
  display: flex;
  gap: 10px;
  align-items: center;
}

.tools input {
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 10px 12px;
  min-width: 250px;
  outline: none;
}

.tools input:focus {
  border-color: #ae1914;
  box-shadow: 0 0 0 3px rgba(174, 25, 20, 0.12);
}

.refresh {
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 800;
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

.formRow {
  display: grid;
  grid-template-columns: 1fr 1fr 220px auto;
  gap: 10px;
  align-items: center;
}

.formRow input {
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 10px 12px;
  outline: none;
}

.formRow input:focus {
  border-color: #ae1914;
  box-shadow: 0 0 0 3px rgba(174, 25, 20, 0.12);
}

.formActions {
  display: flex;
  justify-content: flex-end;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.chip {
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 999px;
  padding: 6px 12px;
  cursor: pointer;
  font-weight: 700;
}

.chip.active {
  border-color: #ae1914;
  color: #ae1914;
  background: rgba(174, 25, 20, 0.07);
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

.table th,
.table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f2f2f2;
  text-align: left;
}

.table td input {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 8px 10px;
  outline: none;
}

.table td input:focus {
  border-color: #ae1914;
  box-shadow: 0 0 0 3px rgba(174, 25, 20, 0.12);
}

.table th {
  background: #fafafa;
  font-weight: 800;
}

.colId,
.colSort {
  width: 90px;
}

.colCat {
  width: 180px;
}

.colStatus {
  width: 120px;
}

.colActions {
  width: 180px;
}

.status {
  display: inline-block;
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 800;
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

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #fafafa;
}

.muted {
  opacity: 0.7;
}

.empty {
  opacity: 0.7;
  padding: 12px 0;
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
  font-weight: 800;
}

button.primary {
  border-color: #ae1914;
  background: #ae1914;
  color: #fff;
}

button.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button.ghost:hover {
  border-color: #bbb;
}

@media (max-width: 900px) {
  .tools {
    width: 100%;
  }

  .tools input {
    min-width: 0;
    flex: 1;
  }

  .formRow {
    grid-template-columns: 1fr;
  }
}
</style>
