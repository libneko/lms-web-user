import request from '@/utils/request'
import type { AddressBook, ApiResponse } from './types'

// 获取用户地址列表
export const getAddressApi = (): Promise<ApiResponse<AddressBook[]>> => {
  return request.get('/user/addressBook/list')
}

// 添加地址
export const saveAddressApi = (address: AddressBook): Promise<ApiResponse<object>> => {
  return request.post('/user/addressBook', address)
}

// 修改地址
export const updateAddressApi = (address: AddressBook): Promise<ApiResponse<object>> => {
  return request.put('/user/addressBook', address)
}
// 删除地址
export const deleteAddressApi = (id: number): Promise<ApiResponse<object>> => {
  console.log('Deleting address with id:', id)
  return request.delete(`/user/addressBook?id=${id}`)
}

// 设置默认地址
export const setDefaultAddressApi = (id: number): Promise<ApiResponse<object>> => {
  // return request.put(`/user/addressBook/default?id=${id}`)
  return request.put('/user/addressBook/default', { id })
}
