import type { ReactNode } from 'react'
import type { EntityAccessor } from '@contember/binding'
import { EntityKeyContext } from './EntityKeyContext.js'
import { EnvironmentContext } from './EnvironmentContext.js'

export interface EntityProviderProps {
	accessor: EntityAccessor
	children: ReactNode
}

export function AccessorProvider(props: EntityProviderProps) {
	return (
		<EntityKeyContext.Provider value={props.accessor.key ?? props.accessor.getAccessor}>
			<EnvironmentContext.Provider value={props.accessor.environment}>{props.children}</EnvironmentContext.Provider>
		</EntityKeyContext.Provider>
	)
}
