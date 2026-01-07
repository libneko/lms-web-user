import request from '@/utils/request'
import type {
  UpdateCartForm,
  ShoppingCartItem,
  BookData,
  ApiResponse,
  AddressBook,
  SubmitOrder,
  OrderPesponse,
} from './types'

export const addShoppingCartApi = (book_id: BookData): Promise<ApiResponse<object>> => {
  return request.post('/user/shoppingCart/add', book_id)
}

// 查看购物车 (GET)
export const getShoppingCartApi = (): Promise<ApiResponse<ShoppingCartItem[]>> => {
  return request.get('/user/shoppingCart/list')
}

// 更新购物车商品数量
export const updateCartItemApi = (data: UpdateCartForm): Promise<ApiResponse<any>> => {
  return request.put('/user/shoppingCart/update', data)
}

// 删除购物车商品
export const deleteCartItemApi = (id: number): Promise<ApiResponse<any>> => {
  return request.delete(`/user/shoppingCart/` + id)
}

// 清空购物车
export const clearCartApi = (): Promise<ApiResponse<any>> => {
  return request.delete('/user/shoppingCart/clean')
}

export const getAddressApi = (): Promise<ApiResponse<AddressBook[]>> => {
  return request.get('/user/addressBook/list')
}

export const SubmitOrderApi = (order: SubmitOrder): Promise<ApiResponse<OrderPesponse>> => {
  return request.post('/user/order/submit', order)
}
