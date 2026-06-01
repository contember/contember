import type { ReactNode } from 'react'
import { BindingOperationsProvider, EnvironmentContext, TreeRootIdProvider } from '../accessorPropagation/index.js'
import type { AccessorTreeState } from './AccessorTreeState.js'
import { AccessorTreeStateContext } from './AccessorTreeStateContext.js'
import { DirtinessContext } from './DirtinessContext.js'
import { MutationStateContext } from './MutationStateContext.js'
import { EntityKeyContext } from '../accessorPropagation/EntityKeyContext.js'

export interface AccessorTreeProps {
	state: AccessorTreeState
	children: ReactNode
}

/**
 * @group Data binding
 */
export const AccessorTree = ({ state, children }: AccessorTreeProps) => {
	const stateData = state.name === 'initialized' ? state.data : {
		hasUnpersistedChanges: false,
		isMutating: false,
		bindingOperations: undefined,
	}
	return (
		<TreeRootIdProvider treeRootId={undefined}>
			<EntityKeyContext.Provider value={undefined}>
				<EnvironmentContext.Provider value={state.environment}>
					<AccessorTreeStateContext.Provider value={state}>
						<DirtinessContext.Provider value={stateData.hasUnpersistedChanges}>
							<MutationStateContext.Provider value={stateData.isMutating}>
								<BindingOperationsProvider bindingOperations={stateData.bindingOperations}>
									{children}
								</BindingOperationsProvider>
							</MutationStateContext.Provider>
						</DirtinessContext.Provider>
					</AccessorTreeStateContext.Provider>
				</EnvironmentContext.Provider>
			</EntityKeyContext.Provider>
		</TreeRootIdProvider>
	)
}

AccessorTree.displayName = 'AccessorTree'
