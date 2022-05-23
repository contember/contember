import type { ReactNode } from 'react'
import { BindingOperationsProvider } from '../accessorPropagation'
import type { AccessorTreeState } from './AccessorTreeState'
import { AccessorTreeStateContext } from './AccessorTreeStateContext'
import { DirtinessContext } from './DirtinessContext'
import { MutationStateContext } from './MutationStateContext'

export interface AccessorTreeProps {
	state: AccessorTreeState
	children: ReactNode
}

export function AccessorTree({ state, children }: AccessorTreeProps) {
	// It is *CRUCIAL* that both branches differ only in props, not structurally. Otherwise there would be far too many
	// remounts.
	if (state.name === 'initialized') {
		return (
			<AccessorTreeStateContext.Provider value={state}>
				<DirtinessContext.Provider value={state.data.hasUnpersistedChanges}>
					<MutationStateContext.Provider value={state.data.isMutating}>
						<BindingOperationsProvider bindingOperations={state.data.bindingOperations}>
							{children}
						</BindingOperationsProvider>
					</MutationStateContext.Provider>
				</DirtinessContext.Provider>
			</AccessorTreeStateContext.Provider>
		)
	}
	return (
		<AccessorTreeStateContext.Provider value={state}>
			<DirtinessContext.Provider value={false}>
				<MutationStateContext.Provider value={false}>
					<BindingOperationsProvider bindingOperations={undefined}>{children}</BindingOperationsProvider>
				</MutationStateContext.Provider>
			</DirtinessContext.Provider>
		</AccessorTreeStateContext.Provider>
	)
}

AccessorTree.displayName = 'AccessorTree'
