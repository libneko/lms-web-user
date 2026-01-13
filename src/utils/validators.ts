import type { FormItemRule } from 'element-plus'
import type { InternalRuleItem } from 'async-validator'

/**
 * 邮箱格式验证
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/
  return emailRegex.test(email)
}

/**
 * 用户名验证规则
 * - 必填
 * - 最大30个字符
 */
export const usernameRules: FormItemRule[] = [
  { required: true, message: '请输入用户名', trigger: 'blur' },
  { min: 1, max: 30, message: '用户名长度为1-30个字符', trigger: 'blur' },
]

/**
 * 密码验证规则
 * - 必填
 * - 8-20个字符
 */
export const passwordRules: FormItemRule[] = [
  { required: true, message: '请输入密码', trigger: 'blur' },
  { min: 8, max: 20, message: '密码长度为8-20个字符', trigger: 'blur' },
]

/**
 * 手机号验证器
 */
export const validatePhone = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入手机号'))
  } else if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('手机号格式不正确'))
  } else {
    callback()
  }
}

/**
 * 手机号验证规则
 */
export const phoneRules: FormItemRule[] = [
  { required: true, validator: validatePhone, trigger: 'blur' },
]

/**
 * 邮箱验证器
 */
export const validateEmail = (_rule: any, value: string, callback: any) => {
  const safeValue = value ? value.trim() : ''

  if (!safeValue) {
    callback(new Error('请输入邮箱'))
  } else if (!isValidEmail(safeValue)) {
    callback(new Error('邮箱格式不正确'))
  } else {
    callback()
  }
}

/**
 * 邮箱验证规则
 */
export const emailRules: FormItemRule[] = [
  { required: true, validator: validateEmail, trigger: 'blur' },
]

/**
 * 创建确认密码验证器
 * @param getOriginalPassword 获取原始密码的函数
 */
export const createConfirmPasswordValidator = (getOriginalPassword: () => string) => {
  return (_rule: InternalRuleItem, value: string, callback: (error?: Error) => void) => {
    if (!value) {
      callback(new Error('请再次输入密码'))
    } else if (value.length < 8) {
      callback(new Error('密码长度不能少于8位'))
    } else if (value.length > 20) {
      callback(new Error('密码长度不能超过20位'))
    } else if (value !== getOriginalPassword()) {
      callback(new Error('两次输入的密码不一致'))
    } else {
      callback()
    }
  }
}

/**
 * 创建确认密码验证规则
 * @param getOriginalPassword 获取原始密码的函数
 */
export const createConfirmPasswordRules = (
  getOriginalPassword: () => string,
): FormItemRule[] => {
  return [
    {
      required: true,
      validator: createConfirmPasswordValidator(getOriginalPassword),
      trigger: 'blur',
    },
  ]
}
