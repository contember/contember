import { ReactNode } from 'react'
import { EntityAccessor } from '../accessors'
import { EntityKeyContext } from './EntityKeyContext'
import { EnvironmentContext } from './EnvironmentContext'

export interface EntityProviderProps {
	accessor: EntityAccessor
	children: ReactNode
}

export function AccessorProvider(props: EntityProviderProps) {
	return (
		<EntityKeyContext.Provider value={props.accessor.key}>
			<EnvironmentContext.Provider value={props.accessor.environment}>{props.children}</EnvironmentContext.Provider>
		</EntityKeyContext.Provider>
	)
}
