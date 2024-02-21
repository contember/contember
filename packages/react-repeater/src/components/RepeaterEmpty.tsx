import React, { ReactNode } from 'react'
import { useRepeaterSortedEntities } from '../internal/contexts'

export const RepeaterEmpty = ({ children }: { children: ReactNode }) => {
	const entities = useRepeaterSortedEntities()
	if (entities.length > 0) {
		return null
	}
	return <>{children}</>
}
