import * as React from 'react'
import {
	AddTreeRootListenerProvider,
	GetEntityByKeyProvider,
	GetSubTreeProvider,
	GetTreeFiltersProvider,
} from '../accessorPropagation'
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
						<AddTreeRootListenerProvider addTreeRootListener={state.data.addEventListener}>
							<GetTreeFiltersProvider getTreeFilters={state.data.unstable_getTreeFilters}>
								<GetSubTreeProvider getSubTree={state.data.getSubTree}>
									<GetEntityByKeyProvider getEntityByKey={state.data.getEntityByKey}>{children}</GetEntityByKeyProvider>
								</GetSubTreeProvider>
							</GetTreeFiltersProvider>
						</AddTreeRootListenerProvider>
					</MutationStateContext.Provider>
				</DirtinessContext.Provider>
			</TriggerPersistContext.Provider>
		)
	}
	return (
		<TriggerPersistContext.Provider value={undefined}>
			<DirtinessContext.Provider value={false}>
				<MutationStateContext.Provider value={false}>
					<AddTreeRootListenerProvider addTreeRootListener={undefined}>
						<GetTreeFiltersProvider getTreeFilters={undefined}>
							<GetSubTreeProvider getSubTree={undefined}>
								<GetEntityByKeyProvider getEntityByKey={undefined}>{children}</GetEntityByKeyProvider>
							</GetSubTreeProvider>
						</GetTreeFiltersProvider>
					</AddTreeRootListenerProvider>
				</MutationStateContext.Provider>
			</DirtinessContext.Provider>
		</TriggerPersistContext.Provider>
	)
}
AccessorTree.displayName = 'AccessorTree'
