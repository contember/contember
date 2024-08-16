import React, { ReactNode } from 'react'
import { useRepeaterSortedEntities } from '../contexts'

export const RepeaterNotEmpty = ({ children }: { children: ReactNode }) => {
	const entities = useRepeaterSortedEntities()
	if (entities.length === 0) {
		return null
	}
	return <>{children}</>
}
