import React, { ReactNode } from 'react'
import { useSelectCurrentEntities } from '../contexts.js'

export const SelectPlaceholder = ({ children }: { children: ReactNode }) => {
	const hasEntities = useSelectCurrentEntities().length > 0
	return hasEntities ? null : <>{children}</>
}
