import { useContext } from 'react'
import { MutationStateContext } from './MutationStateContext'

export const useMutationState = () => useContext(MutationStateContext)
