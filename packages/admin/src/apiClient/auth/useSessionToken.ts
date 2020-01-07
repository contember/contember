import * as React from 'react'
import { SessionTokenContext } from './SessionTokenContext'

export const useSessionToken = () => React.useContext(SessionTokenContext)
