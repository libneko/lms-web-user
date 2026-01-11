<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { bookApi } from '@/api/introduction'
import type { BookData, Book } from '@/api/types'
import { ref, onMounted } from 'vue'
import { addborrowCartApi, getborrowCartApi } from '@/api/borrow-cart'
import router from '@/router'

const props = defineProps<{ id: number }>()

let book = ref<Book>()

let borrowItem = ref<BookData>({
  book_id: 0,
  number: 1,
})
let book_id: number
const count = ref(1)

const num = ref(1)

onMounted(async () => {
  const res = await bookApi(props.id)
  if (res.code === 0) {
    ElMessage.error('该书籍已被借完或者下架')
    router.push('/')
  } else {
    book.value = res.data
    book_id = book.value.id
    borrowItem.value.book_id = book_id
  }
})

const addToBorrowCart = async (book: BookData) => {
  // 先检查该书是否已经在书单中
  try {
    const cartRes = await getborrowCartApi()
    if (cartRes.code === 1 && cartRes.data && Array.isArray(cartRes.data)) {
      // 检查是否已存在相同书籍
      const existingBook = cartRes.data.find((item) => item.book_id === book.book_id)
      if (existingBook) {
        ElMessage.warning('该书已在书单中，同种书一次只能借一本')
        return
      }
    }
  } catch (error) {
    console.error('检查书单失败:', error)
  }

  const res = await addborrowCartApi(book)
  if (res.code !== 0) {
    count.value = count.value + 1
    ElMessage.success('已加入书单')
  } else {
    ElMessage.error('加入失败')
  }
}

const handleChange = (value: number) => {
  borrowItem.value.number = value
}
</script>

<template>
  <div class="introduction-view">
    <div class="books">
      <div class="books-row1">
        <div class="books-pic">
          <el-image style="width: 100%; height: 100%" :src="book?.image" fit="contain" />
        </div>
      </div>
      <div class="books-row2">
        <div class="books-col1">
          <div class="books-col1-row">
            <div class="books-introduction">
              <p>书籍详情</p>
            </div>
            <div class="books-title">
              <h2>&nbsp;&nbsp;{{ book?.name }}</h2>
            </div>
            <div class="books-auth">
              <p>作者: {{ book?.author }}</p>
              <p>IBNS: {{ book?.isbn }}</p>
              <p>图书位置: {{ book?.location }}</p>
              <p>出版社: {{ book?.publisher }}</p>
            </div>
          </div>
          <div class="books-col1-row2"></div>
        </div>
        <div class="books-col2">
          <div class="books-intro">
            <h3>简介:</h3>
            <p>{{ book?.description }}</p>
          </div>
          <div class="books-buy">
            <el-button
              type="primary"
              :disabled="(book?.stock ?? 0) <= 0 || count > (book?.stock ?? 0)"
              @click="addToBorrowCart(borrowItem)"
              >加入书单</el-button
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.introduction-view {
  margin: 0 auto;
  position: relative;
  align-items: center; /* 水平居中 */
  padding: 50px;
  padding-left: 100px;

  height: 90vh;
  border-radius: 20px; /* 可改大或小，如 20px、999px等 */
}

.books {
  width: 90%;
  min-height: 80%;
  display: flex;
  overflow: hidden;
  height: auto;

  background-color: #f5f7fa;
  border: 2px solid #ccc; /* 淡灰色更柔和 */
  border-radius: 10px; /* 圆角 */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); /* 阴影 可选 */
  padding: 10px;
}

.books-row1 {
  padding-left: 2%;
  padding-top: 2%;
  width: 30%;
}

.books-row2 {
  padding-top: 2%;
  padding-left: 5%;
  display: flex;
  flex-direction: column;
  width: 70%;
}

.books-col1 {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  height: 30%;
}

.books-col2 {
  margin-top: 10%;
}

.books-introduction {
  color: rgb(160, 160, 160);
  font-size: small;
  display: flex;
  flex-direction: column;
}

.books-title {
  padding-bottom: 15px;
  font-size: 200%;
}

.books-intro {
  padding-bottom: 10px;
  font-size: 100%;
  color: rgb(68, 61, 61);
  width: 100%; /* 记得给宽度，不然不会触发换行 */
  white-space: normal; /* 允许换行 */
  word-wrap: break-word; /* 自动换行 */
  word-break: break-all; /* 单词或长字符串也强制换行 */
}

.book-intro p {
  font-size: 90%;
  padding-top: 10px;
  padding-bottom: 20px;
}

.books-auth {
  padding-bottom: 20px;
  font-size: medium;
}

.books-pic {
  width: 100%;
  height: 90%;
  overflow: hidden;
  border-radius: 20px;
}

.books-buy {
  margin-top: 50px;
  padding-bottom: 20px;
  font-size: 20px;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
  font-weight: bold;
}

.books-pic img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
:deep(.el-button) {
  width: 120px; /* 固定宽度 */
  height: 40px;
  background-color: rgb(229, 94, 52);
}
:deep(.el-input-number) {
  width: 150px; /* 固定宽度 */
}

:deep(.el-input-number__decrease) {
  background-color: #d7d4d4;
}
:deep(.el-input-number__increase) {
  background-color: #d7d4d4;
}

:deep(.el-icon) {
  color: black;
}

/* 平板/小屏幕笔记本适配 */
@media (max-width: 1200px) {
  .introduction-view {
    padding: 30px;
    padding-left: 30px;
  }

  .books-col1 {
    flex-wrap: wrap; /* 允许换行 */
    height: auto;
  }

  .books-col1-row {
    width: 100%;
    margin-bottom: 10px;
  }

  .books-buy {
    margin-top: 20px;
    justify-content: flex-start; /* 空间不足时左对齐 */
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .introduction-view {
    padding: 10px;
    height: auto;
    padding-left: 10px;
  }

  .books {
    flex-direction: column;
    width: 100%;
    padding: 15px;
    box-sizing: border-box;
  }

  .books-row1 {
    width: 100%;
    padding: 0;
    margin-bottom: 15px;
    display: flex;
    justify-content: center;
  }

  .books-pic {
    height: 250px;
    width: 100%;
    border-radius: 10px;
  }

  .books-row2 {
    width: 100%;
    padding: 0;
  }

  .books-col1 {
    flex-direction: column;
    height: auto;
  }

  .books-col1-row {
    width: 100%;
  }

  .books-title h2 {
    font-size: 20px;
    margin: 0;
  }

  .books-col2 {
    margin-top: 20px;
  }

  .books-buy {
    margin-top: 20px;
    padding-left: 0;
    width: 100%;
    flex-direction: column;
    gap: 15px;
    height: auto;
  }

  :deep(.el-input-number) {
    width: 100%;
  }

  :deep(.el-button) {
    width: 100%;
    height: 40px;
    margin-left: 0 !important;
  }
}

html.dark .books {
  /* 1. 设置整体背景色为 Element Plus 标准深色背景 */
  background-color: var(--el-bg-color);
  /* 或者使用稍微亮一点的层级背景： var(--el-bg-color-overlay) */

  /* 2. 确保主文字颜色适配 */
  color: var(--el-text-color-primary);

  /* 3. 添加过渡动画，让切换不生硬 */
  transition:
    background-color 0.3s,
    color 0.3s;
}

/* 针对次要文字（如作者、ISBN、出版社）设置稍微淡一点的颜色，提升层次感 */
html.dark .books-intro h3,
html.dark .books-auth p,
html.dark .books-intro p {
  color: var(--el-text-color-regular);
}

/* 4. 如果你的布局有边框，记得把边框变暗 */
html.dark .books-row1,
html.dark .books-col1 {
  border-color: var(--el-border-color-darker);
}
</style>
