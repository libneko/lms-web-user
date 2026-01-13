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
  if (!email) {
    ElMessage.warning('请输入邮箱')
    return
  }
  if (!isValidEmail(email)) {
    ElMessage.warning('请输入正确的邮箱地址')
    return
  }
  document.getElementById('aliyun-captcha-trigger')?.click()
}
const captchaVerifyCallback = async (captchaVerifyParam: any) => {
  const res = await sendCodeApi(captchaVerifyParam)
  if (res.code === 1) {
    const emailRes = await sendEmailApi(registerForm.value.email.trim())
    if (emailRes.code === 1) {
      ElMessage.success('校验成功，已发送邮箱验证')
      startCountdown(60)
    } else {
      ElMessage.error(emailRes.message || '发送邮件失败')
      return {
        captchaResult: true,
        bizResult: false,
      }
    }
  } else {
    ElMessage.error('校验失败，重新校验')
    return {
      captchaResult: false,
      bizResult: false,
    }
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
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } else {
    ElMessage.error(result.message || '注册失败')
  }
}

const submit = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      if (!registerForm.value.code || !registerForm.value.code.trim()) {
        ElMessage.warning('请输入验证码')
        return
      }
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
  const script = document.createElement('script')
  script.src = 'https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js'
  script.async = true
  script.onload = () => {
    ;(window as any).initAliyunCaptcha({
      SceneId: import.meta.env.VITE_ALIYUN_CAPTCHA_SCENE_ID,
      prefix: import.meta.env.VITE_ALIYUN_CAPTCHA_PREFIX,
      mode: 'popup',
      button: '#aliyun-captcha-trigger',
      captchaVerifyCallback: captchaVerifyCallback,
      getInstance: getInstance,
      language: 'cn',
    })
  }

  document.getElementsByTagName('head')[0]?.appendChild(script)
})

onBeforeUnmount(() => {
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
        <el-input v-model="registerForm.code" placeholder="请输入验证码" maxlength="10">
          <template #append>
            <el-button :disabled="countdown > 0" @click="sendCode">
              {{ countdown > 0 ? countdown + '秒后可再次获取' : '获取验证码' }}
            </el-button>
          </template>
        </el-input>
      </el-form-item>
    </el-form>
    <el-button type="primary" @click="submit">注 册</el-button>
    <el-link href="#" underline="never" @click="login">已有账号？去登录</el-link>
    <div id="aliyun-captcha-trigger" style="display: none"></div>
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
</style>
