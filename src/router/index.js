import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import PerformersView from '../views/PerformersView.vue'
import PerformerDetailView from '../views/PerformerDetailView.vue'
import { isAuthed } from '../services/auth'
import SpecialtiesView from '../views/SpecialtiesView.vue'
import CompanyInvitationCodesView from '../views/CompanyInvitationCodesView.vue'
import TagsView from '../views/TagsView.vue'
import BannersView from '../views/BannersView.vue'
import SystemMaintenanceView from '../views/SystemMaintenanceView.vue'
import AnnouncementsView from '../views/AnnouncementsView.vue'
import AnnouncementDetailView from '../views/AnnouncementDetailView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/performers', name: 'performers', component: PerformersView, meta: { requiresAuth: true } },
    { path: '/performers/:userUuid', name: 'performer_detail', component: PerformerDetailView, meta: { requiresAuth: true } },
    { path: '/specialties', name: 'specialties', component: SpecialtiesView, meta: { requiresAuth: true } },
    { path: '/tags', name: 'tags', component: TagsView, meta: { requiresAuth: true } },
    { path: '/banners', name: 'banners', component: BannersView, meta: { requiresAuth: true } },
    { path: '/announcements', name: 'announcements', component: AnnouncementsView, meta: { requiresAuth: true } },
    { path: '/announcements/:uuid', name: 'announcement_detail', component: AnnouncementDetailView, meta: { requiresAuth: true } },
    { path: '/system/maintenance', name: 'system_maintenance', component: SystemMaintenanceView, meta: { requiresAuth: true } },
    { path: '/invitation-codes/company', name: 'company_invitation_codes', component: CompanyInvitationCodesView, meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthed()) {
    return { name: 'login' }
  }
  if (to.name === 'login' && isAuthed()) {
    return { name: 'home' }
  }
})

export default router
