import * as React from 'react'
import { ApiBaseUrlContext } from './ApiBaseUrlContext'

export const useApiBaseUrl = () => React.useContext(ApiBaseUrlContext)
