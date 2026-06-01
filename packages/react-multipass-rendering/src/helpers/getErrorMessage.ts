import type { ReactNode } from 'react'
import type { ErrorMessageFactory } from '../ErrorMessageFactory.js'

export const getErrorMessage = <StaticContext>(
	factory: ErrorMessageFactory<StaticContext>,
	node: ReactNode,
	staticContext: StaticContext,
): string => {
	return typeof factory === 'string' ? factory : factory(node, staticContext)
}
