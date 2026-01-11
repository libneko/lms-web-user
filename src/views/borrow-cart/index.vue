<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  getborrowCartApi,
  updateCartItemApi,
  deleteCartItemApi,
  clearCartApi,
  SubmitOrderApi,
} from '@/api/borrow-cart'
import type { Product, Store } from '@/api/types'
import { bookApi } from '@/api/introduction'
import { openBook } from '@/api/meta'
import router from '@/router'
import { getProfile } from '@/api/profile'

// 加载状态
const loading = ref(false)
const dialogVisible = ref(false)
const isSubmitting = ref(false)
const itemTimers = new Map<number, any>()
const ischeck = ref(0)
// 2. 用于存储全选操作的计时器
let selectAllTimer: any = null

const store = ref<Store>({
  id: 1,
  name: '',
  selected: false,
  indeterminate: false,
  items: [],
})

const fetchborrowCartData = async () => {
  loading.value = true
  try {
    const response = await getborrowCartApi()

    if (response.code === 1 && response.data && Array.isArray(response.data)) {
      // 清空并重新填充数据
      const items = response.data
      const bookPromises = items.map((item) => bookApi(item.book_id))
      const books = await Promise.all(bookPromises)

      // 合并数据
      store.value.items = items.map((cartItem, idx) => {
        const bookDetail = books[idx]!.data
        return {
          ...bookDetail,
          cartId: cartItem.id,
          quantity: cartItem.number,
          selected: Boolean(cartItem.selected), // 确保转为布尔值

          // 其他前端字段
          specifications: ['默认规格'],
          stock: bookDetail?.stock ?? 100,
        }
      })
      refreshStoreState()
    } else {
      ElMessage.error(response.message)
    }
  } catch (error) {
    console.error('获取书单数据失败:', error)
    ElMessage.error('网络错误，请稍后重试')
    // 错误时清空数据
    store.value.items = []
  } finally {
    loading.value = false
  }
}

// 计算属性 - 所有书籍列表
const cartItems = computed<Product[]>(() => {
  return store.value.items
})

// 计算属性 - 选中书籍数量
const selectedCount = computed(() => {
  return cartItems.value.filter((item: Product) => item.selected).length
})

const updateStoreIndeterminate = () => {
  if (!store.value) return

  const items = store.value.items
  const total = items.length
  const selectedCount = items.filter((item) => item.selected).length

  // 逻辑：如果选中的数量等于总数，且总数大于0，则为全选
  store.value.selected = selectedCount === total && total > 0

  // 逻辑：如果选中数大于0 且 小于总数，则为半选状态
  store.value.indeterminate = selectedCount > 0 && selectedCount < total
}
const refreshStoreState = () => {
  const items = store.value.items
  const total = items.length
  // 计算已选中的数量
  const selectedCount = items.filter((item) => item.selected).length

  // 全选条件：所有都被选中 且 列表不为空
  store.value.selected = selectedCount === total && total > 0
  // 半选条件：选中数大于0 且 小于总数
  store.value.indeterminate = selectedCount > 0 && selectedCount < total
}

const handleItemSelectChange = async (item: Product) => {
  updateStoreIndeterminate()
  if (itemTimers.has(item.id)) {
    clearTimeout(itemTimers.get(item.id))
  }

  const timer = setTimeout(async () => {
    try {
      console.log(`[防抖结束] 正在向后端同步书籍ID: ${item.id}, 状态: ${item.selected}`)

      // TODO: 这里调用你的真实接口
      // await updateCartItemApi({ id: item.cartId, selected: item.selected })

      // 请求成功后，从 Map 中移除该计时器记录
      itemTimers.delete(item.id)
    } catch (error) {
      console.error('同步失败', error)
      // 如果后端报错，可能需要在这里把 item.selected 改回去，并提示用户
    }
  }, 1000) // <--- 设置延迟时间，这里是 1 秒

  // 4. 将计时器存入 Map
  itemTimers.set(item.id, timer)
}
// 3. 全选/取消全选
const handleSelectAllChange = async (val: boolean) => {
  if (!store.value) return

  store.value.items.forEach((item) => {
    item.selected = val
  })
  updateStoreIndeterminate()
  if (itemTimers.size > 0) {
    itemTimers.forEach((timer) => clearTimeout(timer))
    itemTimers.clear()
  }
  if (selectAllTimer) {
    clearTimeout(selectAllTimer)
  }
  selectAllTimer = setTimeout(async () => {
    try {
      console.log(`[防抖结束] 正在向后端同步全选状态: ${val}`)

      // TODO: 调用批量修改接口
      // await updateCartBatchApi({ selected: val })
    } catch (error) {
      console.error('全选同步失败', error)
      // 失败回滚逻辑...
    } finally {
      selectAllTimer = null
    }
  }, 1000) // <--- 延迟 1 秒
}

// 删除书籍（调用API）
const removeItem = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个书籍吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const response = await deleteCartItemApi(id)

    if (response.code === 1) {
      // 删除成功后重新获取数据
      console.log('删除书籍成功，刷新数据', response)
      await fetchborrowCartData()
    } else {
      ElMessage.error(response.message)
    }
  } catch {
    ElMessage.info('已取消删除')
  }
}

// 方法 - 清空书单（调用API）
const clearCart = async () => {
  if (cartItems.value.length === 0) {
    ElMessage.warning('书单已经是空的')
    return
  }

  try {
    await ElMessageBox.confirm('确定要清空书单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const response = await clearCartApi()

    if (response.code === 1) {
      store.value.items = []
      ElMessage.success('书单已清空')
    } else {
      ElMessage.error(response.message)
    }
  } catch {
    ElMessage.info('已取消清空操作')
  }
}

const checkProfile = async () => {
  const loginUserStr = localStorage.getItem('login_user')
  if (loginUserStr) {
    const loginUser = JSON.parse(loginUserStr)
    if (loginUser && loginUser.id) {
      try {
        const res = await getProfile(loginUser.id)
        console.log(res)
        if (res.code === 1) {
          if (res.data.phone === null) {
            ElMessage.error('您的个人信息不完整，请先完善个人信息')
          } else {
            ischeck.value = 1
          }
        } else {
          ElMessage.error(res.message || '获取用户信息失败')
        }
      } catch (error) {
        console.error(error)
      }
    }
  }
}

// 方法 - 处理结算
const handleCheckout = async () => {
  if (selectedCount.value === 0) {
    ElMessage.warning('请选择要结算的书籍')
    return
  }
  await checkProfile()
  if (ischeck.value === 0) return

  const res = await SubmitOrderApi()
  if (res.code === 1) {
    setTimeout(() => {
      isSubmitting.value = false
      dialogVisible.value = false
      location.reload()
    }, 1500)
    ElMessage.success('借阅请求提交成功，后续可在图书管理中查看相关信息')
  } else {
    ElMessage.error(res.message || '请求提交失败，请重试')
    isSubmitting.value = false
    return
  }
}

// 生命周期
onMounted(() => {
  console.log('书单组件已加载')
  fetchborrowCartData()
})
</script>
<template>
  <div class="borrow-cart">
    <!-- 顶部标题栏 -->
    <div class="cart-header">
      <span class="selected-count">已选 {{ selectedCount }} 件图书</span>
    </div>

    <!-- 书单内容区域 -->
    <el-card class="cart-container">
      <!-- 表头 -->
      <template #header>
        <el-row :gutter="24" align="middle">
          <el-col :span="2">
            <el-checkbox
              v-model="store.selected"
              :indeterminate="store.indeterminate"
              @change="handleSelectAllChange"
              >全选
            </el-checkbox>
          </el-col>
          <el-col :span="16">图书</el-col>
          <el-col class="head-label" :span="3"></el-col>
          <el-col class="head-label" :span="3">操作</el-col>
        </el-row>
      </template>

      <!-- 书籍列表 -->
      <div class="store-items">
        <el-card
          v-for="item in store.items"
          :key="item.id"
          class="cart-item"
          :class="{ selected: item.selected }"
          shadow="hover"
        >
          <el-row :gutter="24" align="middle">
            <!-- 选择框 -->
            <el-col :span="2">
              <el-checkbox v-model="item.selected" @change="() => handleItemSelectChange(item)" />
            </el-col>

            <!-- 书籍信息 -->
            <el-col class="item-info" :span="16">
              <el-row>
                <el-image
                  :src="item.image"
                  class="product-image"
                  fit="contain"
                  @click="openBook(item.id)"
                  style="cursor: pointer"
                />

                <div class="item-details">
                  <h4 class="product-name">{{ item.name }}</h4>
                  <div class="product-specs">
                    <span class="spec" v-for="spec in item.specifications" :key="spec">
                      {{ spec }}
                    </span>
                  </div>
                </div>
              </el-row>
            </el-col>

            <!-- 数量控制 -->
            <el-col class="item-quantity" :span="3" style="margin-top: 20px"> </el-col>

            <!-- 操作按钮 -->
            <el-col class="item-actions" :span="3">
              <el-button link type="danger" size="small" @click="() => removeItem(item.id)">
                删除
              </el-button>
            </el-col>
          </el-row>
        </el-card>
      </div>

      <!-- 空书单状态 -->
      <div v-if="cartItems.length === 0" class="empty-cart">
        <el-empty description="书单空空如也">
          <el-button type="primary" @click="router.push('/')">去借阅</el-button>
        </el-empty>
      </div>
    </el-card>
  </div>
  <!-- 底部悬浮结算栏 -->
  <el-affix
    position="bottom"
    :offset="0"
    v-if="cartItems.length > 0"
    style="width: 80%; margin: 0 auto"
  >
    <div class="footer-content">
      <div class="footer-left">
        <el-checkbox
          v-model="store.selected"
          :indeterminate="store.indeterminate"
          @change="handleSelectAllChange"
        >
          全选
        </el-checkbox>
        <el-button link type="danger" @click="clearCart"> 清空书单 </el-button>
      </div>

      <div class="footer-right">
        <div class="price-line">
          <span>已选 {{ selectedCount }} 本书籍</span>
        </div>

        <el-button
          type="warning"
          size="large"
          class="checkout-btn"
          :disabled="selectedCount === 0"
          @click="handleCheckout"
        >
          借阅 ({{ selectedCount }})
        </el-button>
      </div>
    </div>
  </el-affix>
</template>

<style scoped>
.borrow-cart {
  max-width: 80%;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  min-height: 100vh;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-left: 30px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e8e8e8;
}

.cart-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.selected-count {
  color: #666;
  font-size: 14px;
}

.cart-container {
  margin-bottom: 100px;
  padding-bottom: 20px;
}

.head-label {
  text-align: center;
}

.store-items {
  background-color: #fff;
}

.cart-item {
  margin-bottom: 10px;
}

.item-content {
  display: grid;
  grid-template-columns: 60px 1fr 120px 140px 120px 100px;
  gap: 15px;
  padding: 20px;
  align-items: center;
}

.item-info {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.item-details {
  flex: 1;
}

.product-name {
  margin: 0 0 8px 0;
  font-size: 14px;
  line-height: 1.4;
  color: #333;
}

.product-specs {
  margin-bottom: 8px;
}

.spec {
  display: inline-block;
  background: #f5f5f5;
  padding: 2px 6px;
  margin-right: 8px;
  border-radius: 3px;
  font-size: 12px;
  color: #666;
}

.product-tags {
  display: flex;
  gap: 5px;
}

.item-quantity {
  text-align: center;
}

.stock-info {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.item-actions {
  text-align: center;
}

.empty-cart {
  padding: 60px 0;
  text-align: center;
}

.footer-content {
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #fff;
  border-top: 1px solid #e8e8e8;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 30px;
}

.price-line {
  font-size: 16px;
  margin-bottom: 5px;
}

.checkout-btn {
  min-width: 120px;
  height: 40px;
  font-size: 16px;
}
</style>
