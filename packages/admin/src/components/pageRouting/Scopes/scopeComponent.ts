import { FunctionComponent, memo } from 'react'

export const scopeComponent = <T>(component: T, displayName: string): T => {
	const c = memo(component as FunctionComponent)
	c.displayName = displayName

	return c as T
}
