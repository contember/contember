import React, { ReactNode } from 'react'
import { RepeaterCurrentEntityContext, useRepeaterSortedEntities } from '../contexts'
import { Entity } from '@contember/react-binding'

export const RepeaterEachItem = ({ children }: { children: ReactNode }) => {
	const entities = useRepeaterSortedEntities()
	return <>
		{entities.map(entity => (
			<Entity key={entity.key} accessor={entity}>
				{children}
			</Entity>
		))}
	</>
}
