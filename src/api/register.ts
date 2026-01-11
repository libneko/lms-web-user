import request from '@/utils/request'
import type { ApiResponse, LoginToken, RegisterForm } from './types'

export const registerApi = (data: RegisterForm): Promise<ApiResponse<LoginToken>> => {
  return request.post('/user/register', data)
}
