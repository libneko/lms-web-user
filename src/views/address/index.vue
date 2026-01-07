<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getAddressApi,
  saveAddressApi,
  updateAddressApi,
  deleteAddressApi,
  setDefaultAddressApi,
} from '@/api/address'
import type { AddressBook } from '@/api/types'
import { regionData, codeToText } from 'element-china-area-data'
import type { LoginToken } from '@/api/types'


const formRef = ref<FormInstance>()

// 定义AreaOption类型
interface AreaOption {
  value: string
  label: string
  children?: AreaOption[]
}

// 响应式数据
const addressList = ref<AddressBook[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加地址')
const currentEditingId = ref<number | null>(null)
const login_user = ref<LoginToken | null>(null)

// 初始化用户信息
if (typeof window !== 'undefined') {
  const userData = localStorage.getItem('login_user')
  if (userData) {
    login_user.value = JSON.parse(userData) as LoginToken
  }
}

// 表单数据 - 使用 ref
const addressForm = ref({
  consignee: '',
  phone: '',
  sex: 1,
  province_code: '',
  province_name: '',
  city_code: '',
  city_name: '',
  district_code: '',
  district_name: '',
  detail: '',
  label: '家',
  is_default: false,
})

// 省市区级联选择
const regionDataOptions = regionData as AreaOption[]
const selectedArea = ref<string[]>([])

// 标签选项
const labelOptions = ref([
  { value: '家', label: '家' },
  { value: '公司', label: '公司' },
  { value: '学校', label: '学校' },
  { value: '其他', label: '其他' },
])

// 根据编码获取名称
const getAreaNameByCode = (code: string): string => {
  return codeToText[code] || ''
}

// 加载地址列表
const loadAddressList = async () => {
  loading.value = true
  try {
    const response = await getAddressApi()
    console.log('Fetched address list:', response)
    if (response.code === 1) {
      // 排序：默认地址放前面
      addressList.value = response.data.sort((a: AddressBook, b: AddressBook) => {
        // 默认地址排前面
        if (a.is_default && !b.is_default) return -1
        if (!a.is_default && b.is_default) return 1
        // 如果都是默认或都不是默认，按创建时间或其他规则排序
        return 0
      })
    } else {
      ElMessage.error(response.message || '获取地址列表失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 打开添加地址对话框
const openAddDialog = () => {
  dialogTitle.value = '添加地址'
  currentEditingId.value = null
  resetForm()
  dialogVisible.value = true
}

// 打开编辑地址对话框
const openEditDialog = (address: AddressBook) => {
  dialogTitle.value = '编辑地址'
  currentEditingId.value = address.id || null

  // 填充表单数据
  addressForm.value = {
    consignee: address.consignee || '',
    phone: address.phone || '',
    sex: address.sex || 1,
    province_code: address.province_code || '',
    province_name: address.province_name || '',
    city_code: address.city_code || '',
    city_name: address.city_name || '',
    district_code: address.district_code || '',
    district_name: address.district_name || '',
    detail: address.detail || '',
    label: address.label || '家',
    is_default: address.is_default || false,
  }

  // 设置选中的省市区
  const areaCodes: string[] = []
  if (address.province_code) areaCodes.push(address.province_code)
  if (address.city_code) areaCodes.push(address.city_code)
  if (address.district_code) areaCodes.push(address.district_code)

  selectedArea.value = areaCodes
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  addressForm.value = {
    consignee: '',
    phone: '',
    sex: 1,
    province_code: '',
    province_name: '',
    city_code: '',
    city_name: '',
    district_code: '',
    district_name: '',
    detail: '',
    label: '家',
    is_default: false,
  }
  selectedArea.value = []
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 监听省市区选择变化
watch(
  selectedArea,
  (newValue) => {
    if (newValue.length >= 1) {
      addressForm.value.province_code = newValue[0] || ''
      addressForm.value.province_name = getAreaNameByCode(newValue[0] || '') || ''
    } else {
      addressForm.value.province_code = ''
      addressForm.value.province_name = ''
    }

    if (newValue.length >= 2) {
      addressForm.value.city_code = newValue[1] || ''
      addressForm.value.city_name = getAreaNameByCode(newValue[1] || '') || ''
    } else {
      addressForm.value.city_code = ''
      addressForm.value.city_name = ''
    }

    if (newValue.length >= 3) {
      addressForm.value.district_code = newValue[2] || ''
      addressForm.value.district_name = getAreaNameByCode(newValue[2] || '') || ''
    } else {
      addressForm.value.district_code = ''
      addressForm.value.district_name = ''
    }
  },
  { immediate: true },
)

// 表单验证规则
const formRules = ref({
  consignee: [
    { required: true, message: '请输入收货人姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度在2-10个字符', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' },
  ],
  detail: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 0, max: 100, message: '详细地址长度在5-100个字符', trigger: 'blur' },
  ],
  province_code: [
    {
      required: true,
      message: '请选择省市区',
      trigger: 'change',
      validator: (_rule: any, _value: any, callback: any) => {
        if (!selectedArea.value || selectedArea.value.length !== 3) {
          callback(new Error('请选择完整的省市区信息'))
        } else {
          const isValid = selectedArea.value.every(
            (item: any) => item && item !== 'undefined' && String(item).trim() !== '',
          )
          if (!isValid) {
            callback(new Error('请选择完整的省市区信息'))
          } else {
            callback()
          }
        }
      },
    },
  ],
})

// 保存地址
const saveAddress = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    // 验证是否选择了完整的省市区
    if (!selectedArea.value || selectedArea.value.length !== 3) {
      ElMessage.error('请选择完整的省市区信息')
      return
    }

    // 检查每个元素是否都是有效值
    const isValidArea = selectedArea.value.every(
      (item) => item && item !== 'undefined' && String(item).trim() !== '',
    )

    if (!isValidArea) {
      ElMessage.error('请选择完整的省市区信息')
      return
    }

    // 准备提交数据
    const addressData: AddressBook = {
      ...addressForm.value,
      id: currentEditingId.value || 0,
      user_id: login_user.value?.id || 0,
    }

    console.log('提交的地址数据:', addressData)

    if (addressData.is_default) {
      // 如果设置为默认地址，取消其他地址的默认状态
      addressList.value.forEach((addr) => {
        if (addr.is_default) {
          addr.is_default = false
        }
      })
    }

    if (currentEditingId.value) {
      // 编辑地址
      const response = await updateAddressApi(addressData)
      console.log('Response from updateAddressApi:', response)
      if (response.code === 1) {
        await loadAddressList()
        ElMessage.success('地址更新成功')
        dialogVisible.value = false
      } else {
        ElMessage.error(response.message || '更新失败')
      }
    } else {
      // 添加地址
      const response = await saveAddressApi(addressData)
      console.log('Response from saveAddressApi:', response)
      if (response.code === 1) {
        await loadAddressList()
        ElMessage.success('地址添加成功')
        dialogVisible.value = false
      } else {
        ElMessage.error(response.message || '添加失败')
      }
    }
  } catch (error) {
    console.error('保存地址失败:', error)
  }
}

// 删除地址
// 删除地址
const deleteAddress = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个地址吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const response = await deleteAddressApi(id)
    if (response.code === 1) {
      // 删除成功后，检查是否只剩下一个地址
      const remainingAddresses = addressList.value.filter((addr) => addr.id !== id)

      if (remainingAddresses.length === 1) {
        // 只剩下一个地址，自动设置为默认地址
        const lastAddress = remainingAddresses[0]

        // 如果最后一个地址不是默认地址，则设置为默认
        if (lastAddress && !lastAddress.is_default) {
          try {
            const setDefaultResponse = await setDefaultAddressApi(lastAddress.id!)
            if (setDefaultResponse.code === 1) {
              ElMessage.success('只剩下一个地址，已自动设为默认')
            }
          } catch (defaultError) {
            console.error('设置默认地址失败:', defaultError)
          }
        }
      }

      // 重新加载地址列表
      await loadAddressList()
      ElMessage.success('地址删除成功')
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    // 用户取消删除
  }
}

// 设置默认地址
const setDefaultAddress = async (id: number) => {
  try {
    const response = await setDefaultAddressApi(id)
    if (response.code === 1) {
      await loadAddressList()
      ElMessage.success('默认地址设置成功')
    } else {
      ElMessage.error(response.message || '设置失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
  }
}

// 计算完整的地址字符串
const getFullAddress = (address: AddressBook) => {
  return `${address.province_name || ''}${address.city_name || ''}${address.district_name || ''}${address.detail || ''}`
}

// 获取性别标签
const getSexLabel = (sex: any) => {
  const sexNum = Number(sex)
  return sexNum === 1 ? '先生' : '女士'
}

interface LabelStyle {
  color: string
  bgColor: string
}

// 获取标签样式
const getLabelStyle = (label: string): LabelStyle => {
  const styles: Record<string, LabelStyle> = {
    家: { color: '#409EFF', bgColor: '#ecf5ff' },
    公司: { color: '#67C23A', bgColor: '#f0f9eb' },
    学校: { color: '#E6A23C', bgColor: '#fdf6ec' },
    其他: { color: '#909399', bgColor: '#f4f4f5' },
  }
  return styles[label] || styles['其他']!
}

// 生命周期
onMounted(() => {
  loadAddressList()
})
</script>

<template>
  <div class="address-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-button type="primary" @click="openAddDialog" class="add-btn">
        <el-icon><Plus /></el-icon>
        添加新地址
      </el-button>
    </div>

    <!-- 地址列表 -->
    <div class="address-list" v-loading="loading">
      <div
        v-for="address in addressList"
        :key="address.id"
        class="address-card"
        :class="{ 'default-address': address.is_default }"
      >
        <div class="address-header">
          <div class="address-info">
            <span class="recipient">{{ address.consignee }}</span>
            <span class="phone">{{ address.phone }}</span>
            <span class="sex">{{ getSexLabel(address.sex) }}</span>
            <el-tag
              :style="{
                color: getLabelStyle(address.label).color,
                backgroundColor: getLabelStyle(address.label).bgColor,
                borderColor: getLabelStyle(address.label).color,
              }"
              size="small"
              class="label-tag"
            >
              {{ address.label }}
            </el-tag>
            <el-tag v-if="address.is_default" size="small" type="danger" class="default-tag">
              默认
            </el-tag>
          </div>
          <div class="address-actions">
            <el-button link @click="openEditDialog(address)" class="edit-btn">编辑</el-button>
            <el-button link @click="deleteAddress(address.id!)" class="delete-btn">删除</el-button>
          </div>
        </div>

        <div class="address-content">
          <p class="full-address">
            {{ getFullAddress(address) }}
          </p>
        </div>

        <div class="address-footer">
          <el-button
            v-if="!address.is_default"
            @click="setDefaultAddress(address.id!)"
            link
            class="set-default-btn"
          >
            设为默认地址
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="addressList.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无收货地址">
          <el-button type="primary" @click="openAddDialog">添加地址</el-button>
        </el-empty>
      </div>
    </div>

    <!-- 添加/编辑地址对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      class="address-dialog"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="addressForm"
        :rules="formRules"
        label-width="100px"
        class="address-form"
      >
        <el-form-item label="收货人" prop="consignee">
          <el-input
            v-model="addressForm.consignee"
            placeholder="请输入收货人姓名"
            maxlength="10"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="addressForm.phone" placeholder="请输入手机号码" maxlength="11" />
        </el-form-item>

        <el-form-item label="性别">
          <el-radio-group v-model="addressForm.sex">
            <el-radio :label="1">先生</el-radio>
            <el-radio :label="0">女士</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="省市区" prop="province_code">
          <el-cascader
            v-model="selectedArea"
            :options="regionDataOptions"
            placeholder="请选择省市区"
            clearable
            filterable
            style="width: 100%"
            :props="{
              value: 'value',
              label: 'label',
              children: 'children',
            }"
          />
        </el-form-item>

        <el-form-item label="详细地址" prop="detail">
          <el-input
            v-model="addressForm.detail"
            type="textarea"
            placeholder="请输入详细地址，如街道、小区、楼栋、门牌号等"
            :rows="3"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="地址标签">
          <el-select v-model="addressForm.label" placeholder="请选择标签" style="width: 100%">
            <el-option
              v-for="option in labelOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="addressForm.is_default" class="default-checkbox">
            设为默认地址
          </el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAddress">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.address-management {
  padding: 20px;
  background-color: var(--el-bg-color);
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.page-title {
  color: var(--el-text-color-primary);
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.add-btn {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.address-list {
  display: grid;
  gap: 16px;
}

.address-card {
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.address-card:hover {
  box-shadow: var(--el-box-shadow-light);
  transform: translateY(-2px);
}

.default-address {
  border-color: var(--el-color-primary);
  background-color: rgba(var(--el-color-primary-rgb), 0.05);
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.address-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.recipient {
  font-weight: bold;
  color: var(--el-text-color-primary);
  font-size: 16px;
}

.phone {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.sex {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.label-tag {
  border-radius: 4px;
  padding: 0 6px;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  border: 1px solid;
}

.default-tag {
  margin-left: 4px;
  border-radius: 4px;
  padding: 0 6px;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
}

.address-actions {
  display: flex;
  gap: 8px;
}

.edit-btn {
  color: var(--el-color-primary);
}

.delete-btn {
  color: var(--el-color-danger);
}

.address-content {
  margin-bottom: 12px;
}

.full-address {
  margin: 0;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  font-size: 14px;
  padding: 8px 0;
}

.address-footer {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.set-default-btn {
  color: var(--el-color-primary);
  font-size: 13px;
  padding: 4px 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
}

.address-dialog {
  border-radius: 8px;
}

.address-form {
  padding: 0 20px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .address-management {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .page-title {
    font-size: 18px;
  }

  .address-card {
    padding: 12px;
  }

  .address-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .address-info {
    flex-wrap: wrap;
    gap: 8px;
  }

  .recipient {
    font-size: 15px;
  }

  .phone,
  .sex {
    font-size: 13px;
  }

  .address-actions {
    align-self: flex-end;
  }

  .full-address {
    font-size: 13px;
  }
}
</style>
