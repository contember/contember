import * as React from 'react'
import { ClientConfigContext } from './ClientConfigContext'

export const useClientConfig = () => React.useContext(ClientConfigContext)
