import * as React from 'react'
import { BindingOperationsProvider } from '../accessorPropagation'
import { AccessorTreeState, AccessorTreeStateName } from './AccessorTreeState'
import { DirtinessContext } from './DirtinessContext'
import { MutationStateContext } from './MutationStateContext'
import { TriggerPersistContext } from './TriggerPersistContext'

export interface AccessorTreeProps {
	state: AccessorTreeState
	children: React.ReactNode
}

export function AccessorTree({ state, children }: AccessorTreeProps) {
	// It is *CRUCIAL* that both branches differ only in props, not structurally. Otherwise there would be far too many
	// remounts.
	if (state.name === AccessorTreeStateName.Interactive || state.name === AccessorTreeStateName.Mutating) {
		return (
			<TriggerPersistContext.Provider value={state.triggerPersist}>
				<DirtinessContext.Provider value={state.data.hasUnpersistedChanges}>
					<MutationStateContext.Provider value={state.name === AccessorTreeStateName.Mutating}>
						<BindingOperationsProvider bindingOperations={state.data.bindingOperations}>
							{children}
						</BindingOperationsProvider>
					</MutationStateContext.Provider>
				</DirtinessContext.Provider>
			</TriggerPersistContext.Provider>
		)
	}
	return (
		<TriggerPersistContext.Provider value={undefined}>
			<DirtinessContext.Provider value={false}>
				<MutationStateContext.Provider value={false}>
					<BindingOperationsProvider bindingOperations={undefined}>{children}</BindingOperationsProvider>
				</MutationStateContext.Provider>
			</DirtinessContext.Provider>
		</TriggerPersistContext.Provider>
	)
}
AccessorTree.displayName = 'AccessorTree'
