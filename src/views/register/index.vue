<script setup lang="ts">
import type { RegisterForm } from '@/api/types'
import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormRules, FormInstance } from 'element-plus'
import { registerApi } from '@/api/register'
import AuthLayout from '@/component/auth-layout.vue'
import { createConfirmPasswordValidator, isValidEmail } from '@/api/meta'
import { sendCodeApi, sendEmailApi } from '@/api/login'

const registerForm = ref<RegisterForm>({
  email: '',
  password: '',
  username: '',
  code: '',
})
const getInstance = (instance: any) => {
  captcha.value = instance
}

const captcha = ref<any>(null)
const router = useRouter()
const countdown = ref(0)
const formRef = ref<FormInstance>()
const captchaButton = ref<HTMLElement | null>(null)
let timer: number | undefined

const passwordForm = reactive({
  password: '',
  confirmPassword: '',
})
const sendCode = async () => {
  const email = registerForm.value.email.trim()
  if (!isValidEmail(email)) {
    ElMessage.warning('请输入正确的邮箱地址')
    return
  }
  captchaButton.value?.click()
}
const captchaVerifyCallback = async (captchaVerifyParam: any) => {
  const res = await sendCodeApi(captchaVerifyParam)
  if (res.code === 1) {
    await sendEmailApi(registerForm.value.email.trim())
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
const register = async () => {
  const result = await registerApi(registerForm.value)
  if (result.code === 1) {
    localStorage.setItem('login_user', JSON.stringify(result.data))
    router.push('/')
  } else {
    ElMessage.error('传验证码或相关信息填写错误')
  }
}

const submit = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      registerForm.value.password = passwordForm.password
      register()
    } else {
      ElMessage.error('填写数据有误，请按照提示重新填写')
    }
  })
}

const rules = computed<FormRules>(() => {
  return {
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
    ],
    confirmPassword: [
      {
        required: true,
        validator: createConfirmPasswordValidator(() => passwordForm.password),
        trigger: 'blur',
      },
    ],
  }
})

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

const login = () => {
  router.push('/login')
}
</script>

<template>
  <AuthLayout>
    <el-form :model="passwordForm" :rules="rules" ref="formRef" label-width="80px" class="form">
      <p class="title">注册账户</p>
      <el-form-item label="注册邮箱" prop="email">
        <el-input v-model="registerForm.email" placeholder="请输入邮箱"></el-input>
      </el-form-item>

      <el-form-item label="用户名" prop="username">
        <el-input v-model="registerForm.username" placeholder="输入用户名"></el-input>
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input
          type="password"
          minlength="8"
          maxlength="20"
          v-model="passwordForm.password"
          class="password-input"
          placeholder="输入密码（8-20位）"
          show-password
        ></el-input>
      </el-form-item>

      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          type="password"
          v-model="passwordForm.confirmPassword"
          placeholder="请再输入密码"
          class="password-input"
          show-password
        ></el-input>
      </el-form-item>
      <el-form-item label="验证码">
        <div class="captcha-box">
          <el-input
            v-model="registerForm.code"
            placeholder="请输入验证码"
            maxlength="10"
            class="captcha-input"
          >
          </el-input>
          <el-button
            id="captcha-button"
            type="primary"
            plain
            :disabled="countdown > 0"
            @click="sendCode"
            class="captcha-btn"
          >
            {{ countdown > 0 ? countdown + '秒后可再次获取' : '获取验证码' }}
          </el-button>
        </div>
      </el-form-item>
    </el-form>
    <el-button type="primary" @click="submit">注 册</el-button>
    <el-link href="#" underline="never" @click="login">已有账号？去登录</el-link>
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
  padding-right: 5% !important;
}

.title {
  font-size: 30px;
  font-family: '楷体';
  text-align: center;
  margin-bottom: 30px;
  font-weight: bold;
}
.captcha-box {
  display: flex; /* 开启弹性布局 */
  width: 100%; /* 占满父容器宽度 */
  align-items: center; /* 垂直居中 */
}

/* 输入框 */
.captcha-input {
  flex: 1; /* 关键：让输入框自动收缩/拉伸以适应剩余空间 */
  min-width: 30%; /* 防止 flex 子项在内容过多时无法收缩 */
}

/* 按钮 */
.captcha-btn {
  /* 保持按钮的默认大小，不要被压缩 */
  flex-shrink: 0;
  width: 50%;
}

/* 针对小屏幕（手机）的额外优化 */
@media (max-width: 480px) {
  .captcha-btn {
    font-size: 12px; /* 字体变小 */
    padding: 8px 8px; /* 内边距变小 */
  }
}
</style>
