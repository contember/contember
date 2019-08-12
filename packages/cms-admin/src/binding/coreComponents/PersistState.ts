import * as React from 'react'
import { DataTreeDirtinessState, DataTreeMutationState } from '../../state/dataTrees'

export type DirtinessContextValue = DataTreeDirtinessState
export const DirtinessContext = React.createContext<DirtinessContextValue>(false)

export const useDirtiness = () => {
	return React.useContext(DirtinessContext)
}

export type MutationStateContextValue = DataTreeMutationState
export const MutationStateContext = React.createContext<MutationStateContextValue>(false)

export const useMutationState = () => {
	return React.useContext(MutationStateContext)
}
