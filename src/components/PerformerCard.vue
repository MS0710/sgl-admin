<template>
  <div class="card">
    <div class="avatarWrap">
      <img
        v-if="performer.profile_photo_url"
        :src="performer.profile_photo_url"
        class="avatar"
        alt="avatar"
        loading="lazy"
      />
      <div v-else class="avatar placeholder">No Photo</div>
    </div>

    <div class="info">
      <div class="topLine">
        <div class="name">{{ performer.nickname || '(no nickname)' }}</div>
        <span v-if="performer.status" class="status" :class="`status-${performer.status}`">
          {{ performer.status }}
        </span>
      </div>
      <div class="uuid">{{ performer.user_uuid }}</div>
    </div>

    <div class="actions">
      <button class="ghostBtn" type="button" @click="$emit('view-profile', performer)">
        詳情
      </button>
      <select
        :value="performer.status || ''"
        :disabled="updating"
        @change="$emit('change-status', performer, $event.target.value)"
      >
        <option disabled value="">狀態</option>
        <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
      </select>
    </div>
  </div>
</template>

<script setup>
defineProps({
  performer: { type: Object, required: true },
  statuses: { type: Array, default: () => [] },
  updating: { type: Boolean, default: false },
})

defineEmits(['view-profile', 'change-status'])
</script>

<style scoped>
.card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  gap: 12px;
  align-items: center;
  background: #fff;
}

.avatarWrap {
  width: 56px;
  height: 56px;
  flex: 0 0 auto;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  object-fit: cover;
  border: 1px solid #eee;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #666;
  background: #f6f6f6;
}

.info {
  min-width: 0;
  flex: 1;
}

.topLine {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.name {
  font-weight: 800;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.uuid {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  opacity: 0.75;
  word-break: break-all;
}

.status {
  border: 1px solid #ddd;
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.status-ACTIVE {
  color: #157347;
  background: #edf8f2;
  border-color: #bfe5cf;
}

.status-PENDING,
.status-UNPUBLISHED {
  color: #8a5a00;
  background: #fff7e6;
  border-color: #f2d7a5;
}

.status-REJECTED,
.status-DELETED {
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

.ghostBtn,
select {
  border: 1px solid #ddd;
  background: #fff;
  color: #111;
  border-radius: 8px;
  padding: 8px 10px;
  font: inherit;
}

.ghostBtn {
  cursor: pointer;
  font-weight: 700;
}

select:disabled {
  opacity: 0.6;
}

@media (max-width: 720px) {
  .card {
    align-items: flex-start;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
