import React, { ReactNode } from 'react'
import { useSelectCurrentEntities } from '../contexts'
import { Entity } from '@contember/react-binding'


export const SelectEachValue = ({ children }: { children: ReactNode }) => {
	const entities = useSelectCurrentEntities()
	return entities.map(entity => (
		<Entity key={entity.key} accessor={entity}>
			{children}
		</Entity>
	))
}
