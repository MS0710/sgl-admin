import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import PerformersView from '../views/PerformersView.vue'
import { isAuthed } from '../services/auth'
import SpecialtiesView from '../views/SpecialtiesView.vue'
import CompanyInvitationCodesView from '../views/CompanyInvitationCodesView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/performers', name: 'performers', component: PerformersView, meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
    { path: '/specialties', name: 'specialties', component: SpecialtiesView, meta: { requiresAuth: true } },
    { path: '/invitation-codes/company', name: 'company_invitation_codes', component: CompanyInvitationCodesView, meta: { requiresAuth: true } },
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
