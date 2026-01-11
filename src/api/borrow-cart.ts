import request from '@/utils/request'
import type {
  UpdateBorrowCartForm,
  borrowCartItem,
  BookData,
  ApiResponse,
  BorrowResponse,
} from './types'

export const addborrowCartApi = (book_id: BookData): Promise<ApiResponse<object>> => {
  return request.post('/user/borrowCart/add', book_id)
}

// 查看借阅车 (GET)
export const getborrowCartApi = (): Promise<ApiResponse<borrowCartItem[]>> => {
  return request.get('/user/borrowCart/list')
}

// 更新借阅车书籍数量
export const updateCartItemApi = (data: UpdateBorrowCartForm): Promise<ApiResponse<any>> => {
  return request.put('/user/borrowCart/update', data)
}

// 删除借阅车书籍
export const deleteCartItemApi = (id: number): Promise<ApiResponse<any>> => {
  return request.delete(`/user/borrowCart/` + id)
}

// 清空借阅车
export const clearCartApi = (): Promise<ApiResponse<any>> => {
  return request.delete('/user/borrowCart/clean')
}

export const SubmitOrderApi = (): Promise<ApiResponse<BorrowResponse>> => {
  return request.post('/user/borrow/borrow')
}
