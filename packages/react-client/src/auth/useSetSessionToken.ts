import { useContext } from 'react'
import { SetSessionTokenContext } from './SetSessionTokenContext'

export const useSetSessionToken = () => useContext(SetSessionTokenContext)
