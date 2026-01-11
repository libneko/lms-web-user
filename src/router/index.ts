import { createRouter, createWebHistory } from 'vue-router'

import IndexView from '@/views/index/index.vue'
import LayoutView from '@/views/layout/index.vue'
import LoginView from '@/views/login/index.vue'
import RegisterView from '@/views/register/index.vue'
import BorrowCartView from '@/views/borrow-cart/index.vue'
import SearchView from '@/views/search/index.vue'
import IntroductionView from '@/views/Introduction/index.vue'
import ProfileView from '@/views/profile/index.vue'
import BorrowView from '@/views/order/index.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: LayoutView,
      children: [
        {
          path: '/',
          name: 'index',
          component: IndexView,
        },
        {
          path: '/borrow-cart',
          name: 'borrow-cart',
          component: BorrowCartView,
          meta: { title: '我的书单' },
        },
        {
          path: '/search',
          name: 'search',
          component: SearchView,
          meta: { title: '搜索' },
        },
        {
          path: '/introduction/:id',
          name: 'introduction',
          component: IntroductionView,
          meta: { title: '书本详情' },
          props: true,
        },
        {
          path: '/profile',
          name: 'profile',
          component: ProfileView,
          meta: { title: '个人资料' },
        },
        {
          path: '/order',
          name: 'borrow-management',
          component: BorrowView,
          meta: { title: '图书管理' },
        },
      ],
    },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterView },
  ],
})

function isLoggedIn(): boolean {
  const user = localStorage.getItem('login_user')
  return !!user
}

router.beforeEach((to, _from, next) => {
  if (!isLoggedIn() && to.name !== 'login' && to.name !== 'register' && to.name !== 'index') {
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router
