import * as React from 'react'
import { EntityKeyContext } from './EntityKeyContext'

export interface EntityKeyProviderProps {
	entityKey: string
	children: React.ReactNode
}

export function EntityKeyProvider(props: EntityKeyProviderProps) {
	return <EntityKeyContext.Provider value={props.entityKey}>{props.children}</EntityKeyContext.Provider>
}
