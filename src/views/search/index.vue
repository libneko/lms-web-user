<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { searchApi } from '@/api/search'
import { getCategories, getRandomBooks } from '@/api/home'
import type { Book, Category } from '@/api/types'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { openBook } from '@/api/meta.ts'

const route = useRoute()
const router = useRouter()

const searchKeyword = ref('')
const selectedCategoryId = ref(0)
const isSearched = ref(false)

const bookList = ref<Book[]>([])
const categories = ref<Category[]>([])

const total = ref(0)
const currentPage = ref(Number(route.query.page || 1))
const pageSize = ref(Number(route.query.pageSize || 10))

const handleSearch = () => {
  const query: Record<string, any> = {}
  if (searchKeyword.value) query.name = searchKeyword.value
  if (selectedCategoryId.value) query.category_id = selectedCategoryId.value
  query.page = 1
  query.pageSize = pageSize.value

  router.push({
    path: '/search',
    query,
  })
}

const fetchBooks = async () => {
  const name = String(route.query.name || '')
  const categoryId = Number(route.query.category_id || 0)
  const page = Number(route.query.page || 1)
  const size = Number(route.query.pageSize || 10)

  if (!name && categoryId === 0) {
    // 随机推荐
    try {
      const res = await getRandomBooks(size)
      if (res.code === 1) {
        isSearched.value = true
        bookList.value = res.data
        total.value = res.data.length
      }
    } catch (error) {
      console.error(error)
    }
    return
  }

  // 搜索结果
  const res = await searchApi({
    page,
    page_size: size,
    name: name,
    category_id: categoryId,
    status: 1,
  })

  if (res.code === 1) {
    isSearched.value = true
    bookList.value = res.data.records
    total.value = res.data.total
    ElMessage.success('搜索成功')
  } else {
    ElMessage.error('未找到书籍')
    bookList.value = []
    total.value = 0
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  router.push({
    path: '/search',
    query: {
      ...route.query,
      page,
      pageSize: pageSize.value,
    },
  })
}

// 监听 URL 查询参数变化
watch(
  () => route.query,
  () => {
    currentPage.value = Number(route.query.page || 1)
    pageSize.value = Number(route.query.pageSize || 10)
    fetchBooks()
  },
  { immediate: true },
)

onMounted(async () => {
  const res = await getCategories()
  categories.value = [{ id: 0, name: '全部', sort: 0, status: 1 }, ...res.data]

  if (route.query.name) {
    searchKeyword.value = String(route.query.name)
  }
  const id = Number(route.query.categoryId)
  if (!isNaN(id) && id !== 0) {
    selectedCategoryId.value = id
  }
})
</script>

<template>
  <div class="search-view" :class="{ active: isSearched }">
    <div class="search-input" :class="{ active: isSearched }">
      <el-input
        v-model="searchKeyword"
        style="max-width: 80%; height: 55px"
        placeholder="输入书名或关键字进行搜索"
        class="input-with-select"
      >
        <template #prefix>
          <el-select v-model="selectedCategoryId" placeholder="Select" style="width: 115px">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </template>
        <template #suffix>
          <el-button :icon="Search" @click="handleSearch" />
        </template>
      </el-input>
    </div>
    <div class="result-list" v-if="isSearched">
      <el-row class="book-lists" :gutter="20">
        <!-- 每个 <el-col> 用来显示一个书本的相关信息 -->
        <el-col
          v-for="(book, _index) in bookList"
          :key="book.id"
          :span="12"
          class="books"
          @click="openBook(book.id)"
        >
          <div class="book-item">
            <el-row>
              <el-col :span="6">
                <img :src="book?.image" alt="Book Image" style="object-fit: contain" />
              </el-col>
              <el-col :span="18" style="padding-left: 5%; padding-right: 5%">
                <el-row :span="24" class="book-title">
                  <p>{{ book?.name }}</p>
                </el-row>
                <el-row :span="24" class="book-intro">
                  <p>{{ book?.description }}</p>
                </el-row>
                <el-row :span="24" class="">
                  <p>所在位置：{{ book?.location}}</p>
                </el-row>
              </el-col>
            </el-row>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 分页 -->
    <el-pagination
      v-if="isSearched && total > pageSize"
      background
      layout="prev, pager, next, jumper"
      :current-page="currentPage"
      :page-size="pageSize"
      :total="total"
      @current-change="handlePageChange"
      style="margin-top: 20px; text-align: center"
    />
  </div>
</template>

<style scoped>
.search-view {
  margin: 0 auto;
  position: relative;
  margin-top: -4.5%;
  min-height: 100vh;
  border-radius: 20px;
  transition: 0.5s;
  display: flex;
  flex-direction: column;
  background-image: url('https://neko-book.oss-cn-hangzhou.aliyuncs.com/search.jpg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  background-attachment: fixed;
}
.search-input {
  text-align: center;
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.5s;
  :deep(.el-input__wrapper) {
    transition:
      background-color 0.3s,
      box-shadow 0.3s;
  }
}

.search-input.active {
  height: 50vh;
}

.result-list {
  width: 95%; /* 占满屏幕宽度 */
  margin-top: 20px;
  margin-left: 2.5%;
  display: flex;
  border-radius: 40px;
  flex-wrap: wrap;
  gap: 20px;
  backdrop-filter: blur(12px); /* 毛玻璃核心 */
  background: rgba(255, 255, 255, 0.5); /* 半透明玻璃 */
}
.book-lists {
  padding: 2%;
}

.books {
  cursor: pointer; /* 设置鼠标悬停时显示手型 */
  padding: 2%;
  transition: all 0.3s ease; /* 平滑过渡效果 */
  border-radius: 8px; /* 可选，增加圆角效果 */
}
.books:hover {
  background-color: rgba(180, 179, 179, 0.5);
  transform: translateY(-5px); /* 向上浮动 5px */
}

.books:active {
  transform: translateY(-2px); /* 点击时稍微减小浮动效果 */
}

.book-title {
  padding-bottom: 15px;
  font-size: 200%;
}

.book-intro {
  padding-bottom: 10px;
  font-size: 100%;
  color: rgb(68, 61, 61);
  width: 100%; /* 记得给宽度，不然不会触发换行 */
  white-space: normal; /* 允许换行 */
  word-wrap: break-word; /* 自动换行 */
  word-break: break-all; /* 单词或长字符串也强制换行 */

  display: -webkit-box; /* 设置为 flexbox 样式 */
  -webkit-box-orient: vertical; /* 设置为纵向排列 */
  overflow: hidden; /* 隐藏超出容器的部分 */
  line-clamp: 5; /* 限制最多显示 3 行 */
  text-overflow: ellipsis; /* 超出部分用省略号表示 */
  height: 7.5em; /* 3 行文本的固定高度（根据字体大小和行高调整） */
}

.book-price {
  width: 100%;
  border-radius: 30px;
  color: rgb(229, 94, 52);
  font-weight: bold; /* 粗体 */
  font-style: italic; /* 斜体 */
  font-size: 250%;
}

.result-list img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

:deep(.el-input__wrapper) {
  border-radius: 50px !important;
  box-shadow: none;
  overflow: hidden !important;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.5);
  transition:
    box-shadow 0.4s ease,
    transform 0.3s;
  animation: breathing 20s ease-in-out infinite;
}
:deep(.el-input__wrapper:hover) {
  transform: scale(1.01);
}
:deep(.el-select__wrapper) {
  border-radius: 50px !important;
  box-shadow: none;
  overflow: hidden !important;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.5);
  transition:
    box-shadow 0.4s ease,
    transform 0.3s;
}

html.dark .search-input {
  :deep(.el-input__wrapper) {
    /* 深灰色半透明背景 */
    background-color: rgba(30, 30, 30, 0.6);
    /* 调整边框颜色，避免太亮 */
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2) inset;
  }

  /* 输入框文字颜色 */
  :deep(.el-input__inner) {
    color: #e5eaf3;
    &::placeholder {
      color: #a3a6ad; /* 占位符颜色 */
    }
  }

  /* 左侧 Select 下拉框的文字颜色 */
  :deep(.el-select .el-input__inner) {
    color: #e5eaf3;
  }

  /* 搜索图标按钮颜色适配 */
  :deep(.el-input-group__append) {
    background-color: rgba(30, 30, 30, 0.6);
    box-shadow:
      0 1px 0 0 rgba(255, 255, 255, 0.2) inset,
      0 -1px 0 0 rgba(255, 255, 255, 0.2) inset,
      -1px 0 0 0 rgba(255, 255, 255, 0.2) inset;
    color: #fff;
  }
}

:deep(.el-button) {
  border-radius: 50px !important;
  box-shadow: none;
  overflow: hidden !important;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.5);
  transition:
    box-shadow 0.4s ease,
    transform 0.3s;
}
:deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.9);
}
@keyframes breathing {
  0% {
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.9);
  }
  100% {
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.4);
  }
}
</style>
