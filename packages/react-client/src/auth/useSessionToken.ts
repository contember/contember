import { useContext } from 'react'
import { SessionTokenContext } from './SessionTokenContext'

export const useSessionToken = () => useContext(SessionTokenContext)
