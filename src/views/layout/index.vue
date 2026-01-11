<script setup lang="ts">
import type { LoginToken } from '@/api/types'
import { Theme, setTheme as applyTheme } from '@/api/meta'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import NavMenu from '@/component/nav-menu.vue'

const login_user = ref<LoginToken | null>(null)
const router = useRouter()

// 下拉菜单逻辑
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false
  }
}

const handleStorageChange = (event: StorageEvent) => {
  if (event.key === 'theme') {
    currentTheme.value = (event.newValue as Theme) || Theme.SYSTEM
  }
}

onMounted(() => {
  login_user.value = JSON.parse(localStorage.getItem('login_user')!) as LoginToken
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('storage', handleStorageChange)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('storage', handleStorageChange)
})

// 退出登录
const logout = () => {
  localStorage.removeItem('login_user')
  router.push('/login')
}

const profile = () => {
  window.open('/profile', '_blank')
}


// 外观子菜单逻辑
const isAppearanceOpen = ref(false)
const currentTheme = ref<Theme>((localStorage.getItem('theme') as Theme) || Theme.SYSTEM)

const handleSetTheme = (theme: Theme) => {
  currentTheme.value = theme
  applyTheme(theme)
  isAppearanceOpen.value = false
  isDropdownOpen.value = false
}

// 移动端适配
const isMobile = ref(false)
const drawerVisible = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
  if (!isMobile.value) {
    drawerVisible.value = false
  }
}

onMounted(() => {
  login_user.value = JSON.parse(localStorage.getItem('login_user')!) as LoginToken
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('storage', handleStorageChange)
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('storage', handleStorageChange)
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>
  <el-container>
    <!-- 移动端抽屉菜单 -->
    <el-drawer
      v-model="drawerVisible"
      direction="ltr"
      size="200px"
      :with-header="false"
      class="mobile-drawer"
    >
      <div class="aside-content">
        <NavMenu @menu-click="drawerVisible = false" />
      </div>
    </el-drawer>

    <!-- 左侧菜单 -->

    <el-aside class="aside" v-if="!isMobile">
      <NavMenu />
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="mobile-menu-btn" v-if="isMobile" @click="drawerVisible = true">
          <el-icon size="24" color="#ecc0c0"><Menu /></el-icon>
        </div>
        <span class="left_title">{{ router.currentRoute.value.meta.title }}</span>

        <div class="user-dropdown" ref="dropdownRef" v-if="login_user != null">
          <img :src="login_user?.avatar" class="icon" @click="toggleDropdown" />

          <Transition name="dropdown">
            <div v-show="isDropdownOpen" class="dropdown-menu">
              <div class="dropdown-item">
                <div class="user-info">
                  <img :src="login_user?.avatar" class="icon-small" />
                  <span>{{ login_user?.username }}</span>
                </div>
              </div>
              <div class="dropdown-item" @click="profile">个人信息</div>
              <div
                class="dropdown-item appearance-item"
                @mouseenter="isAppearanceOpen = true"
                @mouseleave="isAppearanceOpen = false"
              >
                <span>外观</span>
                <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                <Transition name="dropdown">
                  <div v-show="isAppearanceOpen" class="submenu">
                    <div
                      class="dropdown-item theme-item"
                      @click.stop="handleSetTheme(Theme.SYSTEM)"
                    >
                      <el-icon
                        class="check-icon"
                        :style="{ opacity: currentTheme === Theme.SYSTEM ? 1 : 0 }"
                      >
                        <Check />
                      </el-icon>
                      <span>跟随系统</span>
                    </div>
                    <div class="dropdown-item theme-item" @click.stop="handleSetTheme(Theme.LIGHT)">
                      <el-icon
                        class="check-icon"
                        :style="{ opacity: currentTheme === Theme.LIGHT ? 1 : 0 }"
                      >
                        <Check />
                      </el-icon>
                      <span>浅色</span>
                    </div>
                    <div class="dropdown-item theme-item" @click.stop="handleSetTheme(Theme.DARK)">
                      <el-icon
                        class="check-icon"
                        :style="{ opacity: currentTheme === Theme.DARK ? 1 : 0 }"
                      >
                        <Check />
                      </el-icon>
                      <span>深色</span>
                    </div>
                  </div>
                </Transition>
              </div>
              <div class="dropdown-item" @click="logout">退出登录</div>
            </div>
          </Transition>
        </div>

        <el-button v-else type="primary" @click="router.push('/login')">登录</el-button>
      </el-header>

      <el-main class="main-content">
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.main-content {
  height: calc(100vh - 60px);
  overflow-y: auto;
  padding: 0%;
}

.header {
  background-image: linear-gradient(
    to right,
    rgba(20, 19, 19, 0.9),
    rgba(20, 19, 19, 0.9),
    rgba(241, 218, 218, 0.7),
    rgba(241, 218, 218, 0.8),
    rgba(20, 19, 19, 0.7),
    rgba(20, 19, 19, 0.8),
    rgba(20, 19, 19, 1)
  );
  justify-content: space-between;
  align-items: center;
  display: flex;
}

.left_title {
  color: rgb(236, 192, 192);
  font-size: 30px;
  font-weight: bolder;
  line-height: 50px;
}

a {
  color: rgb(230, 218, 218);
  text-decoration: none;
}

.aside {
  width: 200px;
  background-color: rgba(241, 218, 218, 0.1);
  height: 100vh;
}

.icon {
  width: 32px;
  height: 32px;
  cursor: pointer;
  border-radius: 50%;
  margin: 5px;
}

.user-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  box-shadow: var(--el-box-shadow-light);
  z-index: 2000;
  min-width: 160px;
  padding: 10px;
  transform-origin: top right;
}

.dropdown-item {
  padding: 0 20px;
  line-height: 36px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.dropdown-item:hover {
  background-color: var(--el-fill-color-light);
  border-radius: 5px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}

.appearance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.submenu {
  position: absolute;
  right: 100%;
  top: 0;
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  box-shadow: var(--el-box-shadow-light);
  z-index: 2001;
  min-width: 120px;
  padding: 10px;
  margin-right: 5px;
}

.theme-item {
  display: flex;
  align-items: center;
}

.check-icon {
  margin-right: 5px;
}

.mobile-menu-btn {
  margin-right: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.aside-content {
  height: 100%;
  background-color: rgba(241, 218, 218, 0.1);
}

:deep(.mobile-drawer .el-drawer__body) {
  padding: 0;
  background-color: var(--el-bg-color);
}

@media (max-width: 768px) {
  .header {
    padding: 0 10px;
  }

  .left_title {
    font-size: 20px;
  }

  .user-info span {
    display: none;
  }
}
</style>
