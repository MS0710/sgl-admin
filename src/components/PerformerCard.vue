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
      <div class="name">{{ performer.nickname || '(no nickname)' }}</div>
      <div class="uuid">{{ performer.user_uuid }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  performer: { type: Object, required: true },
})
</script>

<style scoped>
.card {
  border: 1px solid #eee;
  border-radius: 16px;
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
}

.name {
  font-weight: 800;
  margin-bottom: 4px;
}

.uuid {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  opacity: 0.75;
  word-break: break-all;
}
</style>
