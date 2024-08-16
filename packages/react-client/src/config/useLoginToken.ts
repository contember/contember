import { useContext } from 'react'
import { LoginTokenContext } from './LoginTokenContext'

export const useLoginToken = () => useContext(LoginTokenContext)
