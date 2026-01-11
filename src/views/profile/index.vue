<script setup lang="ts">
import { createConfirmPasswordValidator, validatePhone, validateEmail } from '@/api/meta'
import { getProfile, updateProfile, upload } from '@/api/profile'
import type { LoginToken, User } from '@/api/types'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'

const form = reactive<User>({
  id: 0,
  username: '',
  email: '',
  password: '',
  phone: '',
  sex: 0,
  avatar: '',
})
const passwordForm = reactive({
  password: '',
  confirmPassword: '',
})
const originalFormStr = ref('')
const combinedFormData = computed(() => ({
  ...form,
  ...passwordForm,
}))

const rules = computed<FormRules>(() => {
  return {
    username: [{ max: 30, message: '用户名不超过30个字符', trigger: 'blur' }],


    // 2. 手机号：只有点击了编辑手机号才校验
    phone: isPhoneEditing.value
      ? [{ required: true, validator: validatePhone, trigger: 'blur' }]
      : [],

    // 3. 密码：只有点击了编辑密码才校验
    password: isPasswordEditing.value
      ? [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 8, max: 20, message: '长度在 8 到 20 个字符', trigger: 'blur' },
        ]
      : [],

    // 4. 确认密码：跟随密码编辑状态
    confirmPassword: isPasswordEditing.value
      ? [
          {
            required: true,
            validator: createConfirmPasswordValidator(() => passwordForm.password),
            trigger: 'blur',
          },
        ]
      : [],
  }
})
const isPhoneEditing = ref(false)
const isEmailEditing = ref(false)
const isPasswordEditing = ref(false)

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const formRef = ref<FormInstance>()

const handleEditPhone = () => {
  isPhoneEditing.value = true
}
const handleEditPassword = () => {
  isPasswordEditing.value = true
}

const triggerInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const isJPGOrPNG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2
  selectedFile.value = file
  if (!isJPGOrPNG) {
    alert('只能上传 JPG/PNG 文件!')
    return
  }
  if (!isLt2M) {
    alert('图片大小不能超过 2MB!')
    return
  }
  form.avatar = URL.createObjectURL(file)
  target.value = ''
}

const uploadToServer = async (file: File) => {
  try {
    // 发送请求
    const response = await upload(file)
    if (response.code === 1) {
      form.avatar = response.data
      ElMessage.success('上传头像成功')
    }
  } catch (error) {
    ElMessage.error('头像上传失败，请重试')
    console.error('上传失败:', error)
  }
}
const isChanged = computed(() => {
  // 1. 判断基础信息是否有变动 (对比当前 form 和 原始 form 字符串)
  const isProfileChanged = JSON.stringify(form) !== originalFormStr.value

  // 2. 判断密码是否有变动
  // 逻辑：如果处于“正在编辑密码”状态，且密码输入框不为空，则认为有修改
  const isPasswordChanged =
    isPasswordEditing.value && passwordForm.password && passwordForm.password.trim() !== ''

  // 3. 只要满足其中任意一种情况，按钮就应该亮起
  return isProfileChanged || isPasswordChanged
})
onMounted(async () => {
  const loginUserStr = localStorage.getItem('login_user')
  if (loginUserStr) {
    const loginUser = JSON.parse(loginUserStr)
    if (loginUser && loginUser.id) {
      try {
        const res = await getProfile(loginUser.id)
        if (res.code === 1) {
          console.log('用户信息：', res.data)
          Object.assign(form, res.data)
          originalFormStr.value = JSON.stringify(form)
        } else {
          ElMessage.error(res.message || '获取用户信息失败')
        }
      } catch (error) {
        console.error(error)
      }
    }
  }
})

const submit = async () => {
  if (!formRef.value) return
  const fieldsToValidate = []
  if (isPasswordEditing.value) {
    fieldsToValidate.push('password', 'confirmPassword')
  }
  if (isEmailEditing.value) {
    fieldsToValidate.push('email')
  }
  if (isPhoneEditing.value) {
    fieldsToValidate.push('phone')
  }
  try {
    await formRef.value.validateField(fieldsToValidate)
    // 3. 执行保存
    await save()
    originalFormStr.value = JSON.stringify(form)
    ElMessage.success('保存修改成功')
  } catch (error) {
    ElMessage.error('请检查输入的数据是否正确')
  }
}

const save = async () => {
  try {
    form.password = passwordForm.password
    if (selectedFile.value) {
      await uploadToServer(selectedFile.value)
    }
    const res = await updateProfile(form)
    if (res.code === 1) {
      ElMessage.success('用户信息已更新，页面即将刷新')
      setTimeout(() => {
        location.reload()
      }, 1000)
      const storedStr = localStorage.getItem('login_user')

      if (storedStr) {
        const storedUser: LoginToken = JSON.parse(storedStr)

        storedUser.avatar = form.avatar
        storedUser.username = form.username
        storedUser.email = form.email
        storedUser.id = form.id

        localStorage.setItem('login_user', JSON.stringify(storedUser))
      }
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('更新失败')
  }
}
</script>

<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <div class="avatar-wrapper" @click="triggerInput">
        <img :src="form.avatar" class="avatar" />
        <div class="mask">
          <span class="text">更换头像</span>
        </div>
      </div>
      <input
        type="file"
        ref="fileInputRef"
        accept="image/*"
        style="display: none"
        @change="handleFileChange"
      />
      <h2 class="profile-title">个人资料</h2>

      <el-form
        :model="combinedFormData"
        :rules="rules"
        ref="formRef"
        label-width="80px"
        class="profile-form"
      >
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="邮箱" class="profile-form">
          <el-input v-model="form.email" disabled />
        </el-form-item>

        <el-form-item label="手机号" class="choose-edit" prop="phone">
          <el-input
            v-model="form.phone"
            :disabled="!isPhoneEditing"
            placeholder="请输入手机号"
            class="edit"
          />
          <el-button type="primary" @click="handleEditPhone">编辑</el-button>
        </el-form-item>

        <el-form-item label="密码" class="choose-edit" prop="password">
          <el-input
            v-model="passwordForm.password"
            :disabled="!isPasswordEditing"
            placeholder="*************"
            class="edit"
          />
          <el-button type="primary" @click="handleEditPassword">编辑</el-button>
        </el-form-item>
        <el-form-item label="确认密码" v-if="isPasswordEditing" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            placeholder="请再次输入你的密码"
            class="edit"
          />
        </el-form-item>

        <el-form-item label="性别">
          <el-radio-group v-model="form.sex">
            <el-radio :label="1">男</el-radio>
            <el-radio :label="0">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submit" :disabled="!isChanged" class="save-btn"
            >保存修改</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.profile-container {
  display: flex;
  justify-content: center;
  padding-top: 40px;
}

.profile-card {
  width: 100%;
  max-width: 600px;
  padding: 20px;
}

.avatar-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  align-items: center; /* 水平居中所有子元素 */
  cursor: pointer; /* 设置鼠标悬停时显示手型 */
  position: relative; /* 让内部的 absolute 元素以这里为基准 */
  width: 100px;
  margin-left: calc((100% - 100px) / 2);
  height: 100px;
  overflow: hidden; /* 重要：超出圆形的部分隐藏，让遮罩层也是圆的 */
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
  border-radius: 50%; /* 圆形 */
  object-fit: cover; /* 保持图片比例，不会变形 */
}

.mask {
  position: absolute;
  top: 0;
  left: 0;
  margin-left: calc((100% - 100px) / 2);
  border-radius: 50%; /* 圆形 */
  width: 100px;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* 深色半透明背景 */
  display: flex; /* 使用 Flex 让文字垂直水平居中 */
  justify-content: center;
  align-items: center;
  opacity: 0; /* 默认完全透明（看不见） */
  transition: opacity 0.3s ease; /* 增加过渡动画，让效果更平滑 */
}

/* 4. 文字设置 */
.text {
  color: #fff; /* 白色文字 */
  font-size: 14px;
  font-weight: bold;
}

/* 5. 交互效果：鼠标移入容器时，显示遮罩 */
.avatar-wrapper:hover .mask {
  opacity: 1; /* 变为不透明（显示） */
}

.profile-title {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
  font-weight: 500;
}

.choose-edit {
  display: flex;
  flex-direction: row;
}
.edit {
  padding-right: 3%;
  width: 87%;
}

.profile-form {
  margin-top: 20px;
}

.save-btn {
  width: 100%;
}
</style>
