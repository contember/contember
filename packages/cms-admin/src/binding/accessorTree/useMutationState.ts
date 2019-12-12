import * as React from 'react'
import { MutationStateContext } from './MutationStateContext'

export const useMutationState = () => React.useContext(MutationStateContext)
