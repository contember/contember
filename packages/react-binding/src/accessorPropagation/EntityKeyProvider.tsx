import type { ReactNode } from 'react'
import { EntityKeyContext } from './EntityKeyContext'
import { EntityAccessor } from '@contember/binding'

export interface EntityKeyProviderProps {
	entityKey: string | (() => EntityAccessor)
	children: ReactNode
}

export function EntityKeyProvider(props: EntityKeyProviderProps) {
	return <EntityKeyContext.Provider value={props.entityKey}>{props.children}</EntityKeyContext.Provider>
}
