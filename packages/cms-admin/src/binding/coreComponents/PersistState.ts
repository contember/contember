import * as React from 'react'
import { DataTreeDirtinessState, DataTreeMutationState } from '../../state/dataTrees'

export type DirtinessContextValue = DataTreeDirtinessState
const DirtinessContext = React.createContext<DirtinessContextValue>(false)

export type MutationStateContextValue = DataTreeMutationState
const MutationStateContext = React.createContext<MutationStateContextValue>(false)

export { DirtinessContext, MutationStateContext }
