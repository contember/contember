import { createContext } from 'react'

export const MutationStateContext = createContext<boolean>(false)
MutationStateContext.displayName = 'MutationStateContext'
