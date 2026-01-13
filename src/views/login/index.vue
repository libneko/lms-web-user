<script setup lang="ts">
import { codeLoginApi, loginApi, sendCodeApi, sendEmailApi } from '@/api/login'
import { isValidEmail } from '@/utils/validators'
import type { ApiResponse, LoginToken } from '@/api/types'
import { ElMessage } from 'element-plus'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/component/auth-layout.vue'

const router = useRouter()
const activeTab = ref<'code' | 'password'>('code')
const captchaButton = ref<HTMLElement | null>(null)
const captcha = ref<any>(null)
const getInstance = (instance: any) => {
  captcha.value = instance
}

const captchaVerifyCallback = async (captchaVerifyParam: any) => {
  const res = await sendCodeApi(captchaVerifyParam)
  if (res.code === 1) {
    await sendEmailApi(codeForm.email.trim())
    ElMessage.success('校验成功，已发送邮箱验证')
    startCountdown(60)
  } else {
    ElMessage.error('校验失败，重新校验')
  }
  return {
    captchaResult: true,
    bizResult: true,
  }
}

const codeForm = reactive({
  email: '',
  code: '',
})

const pwdForm = reactive({
  email: '',
  password: '',
})

// 验证码倒计时
const countdown = ref(0)
let timer: number | undefined

const startCountdown = (sec: number) => {
  countdown.value = sec
  if (timer) window.clearInterval(timer)
  timer = window.setInterval(() => {
    if (countdown.value <= 1) {
      window.clearInterval(timer)
      timer = undefined
      countdown.value = 0
    } else {
      countdown.value--
    }
  }, 1000)
}

const sendCode = async () => {
  const email = codeForm.email.trim()
  if (!isValidEmail(email)) {
    ElMessage.warning('请输入正确的邮箱地址')
    return
  }
  captchaButton.value?.click()
}

const login = async () => {
  let result: ApiResponse<LoginToken>
  let email = activeTab.value === 'code' ? codeForm.email.trim() : pwdForm.email.trim()
  if (!isValidEmail(email)) {
    ElMessage.warning('请输入正确的邮箱')
    return
  }
  if (activeTab.value === 'code') {
    if (!codeForm.code.trim()) {
      ElMessage.warning('请输入验证码')
      return
    }

    result = await codeLoginApi({
      email: codeForm.email,
      code: codeForm.code,
    })
  } else {
    if (!pwdForm.password) {
      ElMessage.warning('请输入密码')
      return
    }

    result = await loginApi({
      email: pwdForm.email,
      password: pwdForm.password,
    })
  }
  if (result.code === 1) {
    localStorage.setItem('login_user', JSON.stringify(result.data))
    router.push('/')
  } else {
    ElMessage.error(result.message)
  }
}

const register = () => {
  router.push('/register')
}

onMounted(async () => {
  captchaButton.value = document.getElementById('captcha-button')

  const script = document.createElement('script')
  script.src = 'https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js'
  script.async = true
  script.onload = () => {
    ;(window as any).initAliyunCaptcha({
      SceneId: import.meta.env.VITE_ALIYUN_CAPTCHA_SCENE_ID,
      prefix: import.meta.env.VITE_ALIYUN_CAPTCHA_PREFIX,
      mode: 'popup',
      button: '#captcha-button',
      captchaVerifyCallback: captchaVerifyCallback,
      getInstance: getInstance,
      language: 'cn',
    })
  }

  document.getElementsByTagName('head')[0]?.appendChild(script)
})

onBeforeUnmount(() => {
  captchaButton.value = null

  document.getElementById('aliyunCaptcha-mask')?.remove()
  document.getElementById('aliyunCaptcha-window-popup')?.remove()
})
</script>

<template>
  <AuthLayout>
    <el-tabs v-model="activeTab" class="login-tabs" stretch="false">
      <el-tab-pane label="验证码登录" name="code">
        <el-form>
          <p class="title">欢迎回来</p>

          <el-form-item>
            <el-input v-model="codeForm.email" placeholder="请输入邮箱" maxlength="20" />
          </el-form-item>

          <el-form-item>
            <el-input
              v-model="codeForm.code"
              placeholder="请输入验证码"
              maxlength="6"
              @keyup.enter="login"
            >
              <template #append>
                <el-button id="captcha-button" :disabled="countdown > 0" @click="sendCode">
                  {{ countdown > 0 ? countdown + '秒后可再次获取' : '获取验证码' }}
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="密码登录" name="password">
        <el-form>
          <p class="title">欢迎回来</p>

          <el-form-item>
            <el-input
              v-model="pwdForm.email"
              placeholder="请输入邮箱"
              maxlength="20"
              @keyup.enter="login"
            />
          </el-form-item>

          <el-form-item>
            <el-input
              v-model="pwdForm.password"
              type="password"
              class="password-input"
              placeholder="请输入密码"
              show-password
              @keyup.enter="login"
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <el-button class="button" type="primary" @click="login">登 录</el-button>

    <div class="auth-hints" v-if="activeTab === 'password'">
      <a href="#" class="right register" @click="register">立即注册</a>
    </div>
  </AuthLayout>
</template>

<style scoped>
:deep(.el-input__suffix) {
  position: absolute;
  right: 10px;
  height: 100%;
  display: flex;
  align-items: center;
}

:deep(.password-input .el-input__wrapper) {
  padding-right: 30px !important;
}

/* 使 el-tabs 标签居中 */
.login-tabs :deep(.el-tabs__nav-wrap) {
  display: flex;
  justify-content: center;
}
.login-tabs :deep(.el-tabs__nav-scroll) {
  display: inline-block;
}
.login-tabs :deep(.el-tabs__nav) {
  float: none !important;
  display: inline-flex;
}

.title {
  font-size: 30px;
  font-family: '楷体';
  text-align: center;
  margin-bottom: 30px;
  font-weight: bold;
}

.button {
  margin-top: 30px;
  width: 100%;
}

.auth-hints {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 14px;
}

.auth-hints a {
  color: var(--el-color-primary);
  cursor: pointer;
  text-decoration: none;
}
</style>
