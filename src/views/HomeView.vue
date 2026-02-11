<template>
  <AdminLayout>
    <h2 class="title">工作列表</h2>

    <div class="grid">
      <!-- 卡片 1：所有表演者 -->
      <div class="job" @click="$router.push('/performers')">
        <div class="jobTitle">所有表演者</div>
        <div class="jobDesc">查詢表演者清單，快速查看頭像、暱稱與帳號資訊。</div>
        <div class="tag">人員管理</div>
      </div>

      <!-- 卡片 2：專長列表編輯 -->
      <div class="job" @click="$router.push('/specialties')">
        <div class="jobTitle">專長列表編輯</div>
        <div class="jobDesc">新增、修改、刪除專長與排序，維護前台顯示內容。</div>
        <div class="tag">內容維護</div>
      </div>

      <div class="job" @click="$router.push('/invitation-codes/company')">
        <div class="jobTitle">公司邀請碼</div>
        <div class="jobDesc">批次產生公司邀請碼，提供給合作方或內部同仁使用。</div>
        <div class="tag">帳號開通</div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '../layouts/AdminLayout.vue'
</script>

<style scoped>
.title {
  margin: 0 0 14px 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 900px) {
  .grid { grid-template-columns: repeat(1, minmax(0, 1fr)); }
}

.job {
  border: 1px solid #eee;
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  background: #fff;
}

.job:hover {
  border-color: rgba(174, 25, 20, 0.35);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}

.jobTitle {
  font-weight: 800;
  color: #111;
}

.jobDesc {
  margin-top: 6px;
  opacity: 0.8;
  font-size: 14px;
}

.tag {
  margin-top: 12px;
  display: inline-block;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(174, 25, 20, 0.35);
  color: #AE1914;
  font-weight: 700;
  font-size: 12px;
}
</style>
