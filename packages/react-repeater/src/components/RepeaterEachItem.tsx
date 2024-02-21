import React, { ReactNode } from 'react'
import { useRepeaterSortedEntities } from '../internal/contexts'
import { Entity } from '@contember/react-binding'

export const RepeaterEachItem = ({ children }: { children: ReactNode }) => {
	const entities = useRepeaterSortedEntities()
	return entities.map(entity => (
		<Entity key={entity.key} accessor={entity}>
			{children}
		</Entity>
	))
}
