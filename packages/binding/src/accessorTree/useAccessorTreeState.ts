import { useContext } from 'react'
import { AccessorTreeStateContext } from './AccessorTreeStateContext'

export const useAccessorTreeState = () => useContext(AccessorTreeStateContext)
