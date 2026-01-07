import request from '@/utils/request'
import type { ApiResponse, User } from './types'

export const getProfile = (id: number): Promise<ApiResponse<User>> => {
  return request.get('/user/profile', {
    params: { id },
  })
}

export const updateProfile = (data: User): Promise<ApiResponse<boolean>> => {
  return request.put('/user/profile', data)
}

export const upload = (file: File): Promise<ApiResponse<string>> => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/user/common/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
