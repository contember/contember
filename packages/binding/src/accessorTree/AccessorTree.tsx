import { GetEntityByKeyProvider } from '../accessorPropagation'
import { AccessorTreeState, AccessorTreeStateName } from './AccessorTreeState'
import * as React from 'react'
import { AccessorTreeStateContext } from './AccessorTreeStateContext'
import { DirtinessContext } from './DirtinessContext'
import { MutationStateContext } from './MutationStateContext'
import { TriggerPersistContext } from './TriggerPersistContext'

export interface AccessorTreeProps {
	state: AccessorTreeState
	children: React.ReactNode
}

// This is a nasty piece of awfulness which we'll have to live with until we implement subscriptions or until the
// context case of https://github.com/facebook/react/issues/14110 lands a RFC.
export const AccessorTree = React.memo(({ state, children }: AccessorTreeProps) => (
	<TriggerPersistContext.Provider
		value={
			state.name === AccessorTreeStateName.Interactive || state.name === AccessorTreeStateName.Mutating
				? state.triggerPersist
				: undefined
		}
	>
		<DirtinessContext.Provider
			value={
				state.name === AccessorTreeStateName.Interactive || state.name === AccessorTreeStateName.Mutating
					? state.isDirty
					: false
			}
		>
			<MutationStateContext.Provider value={state.name === AccessorTreeStateName.Mutating}>
				<AccessorTreeStateContext.Provider value={state}>
					<GetEntityByKeyProvider getEntityByKey={state.getEntityByKey}>{children}</GetEntityByKeyProvider>
				</AccessorTreeStateContext.Provider>
			</MutationStateContext.Provider>
		</DirtinessContext.Provider>
	</TriggerPersistContext.Provider>
))
AccessorTree.displayName = 'AccessorTree'
