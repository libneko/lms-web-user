<script setup lang="ts">
import { completeBorrowApi, getBorrowRecords, renewBorrowApi } from '@/api/borrow'
import type { BorrowRecord, SendBorrowQuery } from '@/api/types'
import { BorrowStatus, BorrowStatusMap } from '@/utils/status'
import { ElMessage, type CollapseModelValue } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'

const dialogVisible = ref(false)
const currentPage = ref(1) // 当前页码
const pageSize = ref(5) // 每页显示数量
const searchQuery = ref('')
const total = ref(0)
const currentBorrow = ref<BorrowRecord | null>(null) // 存储当前点击的借阅记录
const activeNames = ref<number[]>([])
let timer: any = null

const handleChange = (val: CollapseModelValue) => {
  // 折叠面板状态变化
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchBorrows() // 重新向后端拿数据
  window.scrollTo(0, 0)
}
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1 // 改变每页大小时，重置回第一页
  fetchBorrows()
}

const borrows = ref<BorrowRecord[]>([])

const openBorrow = (borrowId: number) => {
  const targetBorrow = borrows.value.find((item) => item.id === borrowId)
  if (targetBorrow) {
    currentBorrow.value = targetBorrow // 设置当前借阅记录
    dialogVisible.value = true // 打开弹窗
  } else {
    ElMessage.error('未找到借阅记录')
  }
}
const formatStatus = (status: number) => {
  return BorrowStatusMap[status] || { label: '未知状态', type: 'info' }
}
const checkRenewDisabled = (item: any) => {
  if (item.status === BorrowStatus.COMPLETED) {
    return true
  }
  if (item.renew_count > 2) {
    return true
  }

  if (!item.endTime) return true // 防止字段不存在报错

  const deadline = new Date(item.due_date).getTime()
  const now = Date.now()

  const diff = deadline - now

  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000

  if (diff > sevenDaysInMs || diff < 0) {
    return true
  }

  // 否则，说明在 7 天之内且未过期，返回 false (启用/亮起)
  return false
}

const formatTime = (timeStr: string | number | Date) => {
  // 1. 空值检查
  if (!timeStr) return '--'

  // 2. 将字符串转换为 Date 对象
  // 浏览器原生支持解析这种带 'T' 的 ISO 格式
  const date = new Date(timeStr)

  // 3. 提取年月日时分秒，并补零
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')

  // 4. 拼接并返回
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const stepActiveIndex = computed(() => {
  const status = currentBorrow.value?.status ?? 0

  if (status === 0) return 0
  // 对于 1-4 的状态，active 应该是 status - 1
  // 例如 status=1(待付款)，active应该为0
  return Math.max(0, status)
})

const completeBorrow = async (key: BorrowRecord) => {
  const res = await completeBorrowApi(String(key.id))
  if (res.code !== 1) {
    ElMessage.error(res.message || '归还失败')
    return
  }
  ElMessage.success('归还成功')
  setTimeout(() => {
    location.reload()
  }, 1000)
}

const renewBook = async (id: number) => {
  const res = await renewBorrowApi(id)
  if (res.code === 1) {
    ElMessage.success('已续借')
  }
}

const fetchBorrows = async () => {
  const params: SendBorrowQuery = {
    page: currentPage.value,
    pageSize: pageSize.value,
    status: null,
  }

  try {
    console.log('请求参数:', params)
    const res = await getBorrowRecords(params)
    console.log('获取借阅数据:', res)
    if (res.code === 1) {
      borrows.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {}
}

watch(searchQuery, () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    currentPage.value = 1
    fetchBorrows()
  }, 500)
})

onMounted(async () => {
  await fetchBorrows()
})
</script>

<template>
  <div class="borrow-management">
    <div class="borrow-header"></div>

    <el-card class="cart-container">
      <!-- 表头 -->
      <template #header>
        <el-row :gutter="24" align="middle">
          <el-col :span="2"></el-col>
          <el-col :span="10">借阅记录</el-col>
          <el-col class="head-label" :span="3"></el-col>
          <el-col class="head-label" :span="3">状态</el-col>
          <el-col class="head-label" :span="3">操作</el-col>
          <el-col class="head-label" :span="3">借阅时间</el-col>
        </el-row>
      </template>
      <div class="borrow-items">
        <el-card
          v-for="borrow in borrows"
          :key="borrow.id"
          class="borrow-item"
          style="margin-bottom: 20px"
        >
          <template #header>
            <div class="borrow-id-header">
              <span>借阅编号：{{ borrow.number }}</span>
            </div>
          </template>
          <el-row align="middle">
            <el-col class="borrow-info" :span="12">
              <div
                v-if="borrow.borrow_detail_list && borrow.borrow_detail_list.length > 0"
                style="display: flex; align-items: center"
              >
                <div style="margin-right: 15px">
                  <el-image
                    style="width: 60px; height: 80px; border-radius: 4px"
                    :src="borrow.borrow_detail_list[0]?.image"
                    :preview-src-list="[borrow.borrow_detail_list[0]?.image]"
                    fit="cover"
                  />
                </div>

                <div>
                  <h4 style="margin: 0 0 5px 0; font-size: 15px">
                    {{ borrow.borrow_detail_list[0]?.name }}
                  </h4>
                  <div style="font-size: 13px; color: #666">
                    <span
                      v-if="borrow.borrow_detail_list && borrow.borrow_detail_list.length > 1"
                      style="color: #409eff; margin-right: 10px"
                    >
                      [等{{ borrow.borrow_detail_list?.length || 0 }}种书本]
                    </span>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col class="borrow-total" :span="3"> </el-col>
            <el-col class="borrow-status" :span="3">
              <el-tag :type="formatStatus(borrow.status).type">
                {{ formatStatus(borrow.status).label }}
              </el-tag>
            </el-col>
            <el-col class="borrow-opera" :span="3">
              <el-button type="primary" class="button" @click="openBorrow(borrow.id)">
                详情
              </el-button>
              <el-button
                :disabled="borrow.status === BorrowStatus.COMPLETED || checkRenewDisabled(borrow)"
                type="primary"
                @click="renewBook(borrow.id)"
                class="button"
              >
                续借
              </el-button>
              <el-button
                type="danger"
                :disabled="borrow.status === BorrowStatus.COMPLETED"
                @click="completeBorrow(borrow)"
                class="button"
              >
                归还
              </el-button>
            </el-col>
            <el-col class="borrow-time" :span="3">
              <span style="font-size: 13px; color: #999">{{ formatTime(borrow.borrow_time) }}</span>
            </el-col>
          </el-row>
          <el-collapse
            v-model="activeNames"
            @change="handleChange"
            v-if="borrow.borrow_detail_list && borrow.borrow_detail_list.length > 1"
          >
            <el-collapse-item :name="borrow.id">
              <template #title>
                <span style="margin-right: 8px">
                  {{ activeNames.includes(borrow.id) ? '收起' : '查看' }}其余
                  {{ (borrow.borrow_detail_list?.length || 1) - 1 }} 件书籍
                </span>
              </template>

              <div
                v-for="book in borrow.borrow_detail_list?.slice(1)"
                :key="book.id"
                class="book-item"
              >
                <el-image
                  style="width: 50px; height: 60px; margin-right: 15px; border-radius: 2px"
                  :src="book.image"
                  fit="cover"
                />

                <div style="flex: 1">
                  <div style="font-size: 14px">{{ book.name }}</div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-card>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5, 10, 20]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            background
          />
        </div>
      </div>
    </el-card>
    <el-dialog v-model="dialogVisible" title="借阅详情" width="700px" destroy-on-close>
      <div v-if="currentBorrow">
        <div
          v-if="currentBorrow.status === BorrowStatus.OVERDUE"
          style="margin-bottom: 20px; color: #909399; text-align: center"
        >
          <el-steps :active="2" simple style="margin-bottom: 20px">
            <el-step title="借阅提交" status="success" icon="Document" />
            <el-step title="已逾期" status="error" icon="CircleCloseFilled" />
          </el-steps>
        </div>
        <div v-else>
          <el-steps
            :active="stepActiveIndex"
            finish-status="success"
            simple
            style="margin-bottom: 20px"
          >
            <el-step title="借阅中" />
            <el-step title="已归还" />
          </el-steps>
        </div>
        <el-descriptions title="基本信息" :column="2" border>
          <el-descriptions-item label="借阅编号">{{ currentBorrow.number }}</el-descriptions-item>
          <el-descriptions-item label="借阅时间">{{
            formatTime(currentBorrow.borrow_time)
          }}</el-descriptions-item>
          <el-descriptions-item label="截止归还时间">{{
            formatTime(currentBorrow.due_date)
          }}</el-descriptions-item>
          <el-descriptions-item label="实际归还时间">{{
            formatTime(currentBorrow.return_time)
          }}</el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 20px">
          <h4 style="margin-bottom: 10px">书本清单</h4>
          <el-table :data="currentBorrow.borrow_detail_list || []" border stripe size="small">
            <el-table-column label="书本封面" width="80" align="center">
              <template #default="scope">
                <el-image
                  style="width: 40px; height: 50px"
                  :src="scope.row.image"
                  preview-teleported
                />
              </template>
            </el-table-column>
            <el-table-column prop="name" label="书名" show-overflow-tooltip />
            <el-table-column prop="number" label="数量" width="80" align="center" />
          </el-table>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关 闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.borrow-management {
  max-width: 80%;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  min-height: 100vh;
}
.cart-container {
  margin-bottom: 100px;
  padding-bottom: 20px;
}

.borrow-header {
  margin-bottom: 20px;
}

.borrow-total,
.borrow-status,
.borrow-time {
  text-align: center;
}

.borrow-id-header {
  font-size: 13px;
  color: #909399;
}

.head-label {
  text-align: center;
  font-weight: bold;
}

.button {
  margin-top: 10px;
  margin-left: 12px;
  margin-right: 15px;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.borrow-opera {
  display: flex;
  flex-direction: column;
}

/* 折叠面板样式优化，适配深色模式 */
:deep(.el-collapse-item__header) {
  border-top: 1px solid var(--el-border-color);
  border-bottom: none;
}

:deep(.el-collapse-item__wrap) {
  border-bottom: none;
}

:deep(.el-collapse-item__content) {
  background-color: var(--el-bg-color);
  padding: 10px;
}

/* 书籍项样式 */
.book-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color);
}

.book-item:last-child {
  border-bottom: none;
}

.cover-uploader {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}
:deep(.el-upload) {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}
.cover-uploader {
  border-color: var(--el-color-primary);
}
:deep(.el-upload:hover) {
  border-color: var(--el-color-primary);
}
.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px; /* 封面图宽 */
  height: 140px; /* 封面图高，模拟书本比例 */
  line-height: 140px;
  text-align: center;
}

.cover-image {
  width: 100px;
  height: 140px;
  display: block;
  object-fit: cover; /* 保持图片比例填充 */
}
</style>
