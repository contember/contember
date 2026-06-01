import { useContext } from 'react'
import { MutationStateContext } from './MutationStateContext.js'

export const useMutationState = () => useContext(MutationStateContext)
