import { useContext } from 'react'
import { ApiBaseUrlContext } from './ApiBaseUrlContext'

export const useApiBaseUrl = () => useContext(ApiBaseUrlContext)
