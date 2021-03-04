import { ReactNode, ReactElement } from 'react'
import { ErrorMessageFactory } from '../ErrorMessageFactory'

export const getErrorMessage = <StaticContext>(
	factory: ErrorMessageFactory<StaticContext>,
	node: ReactNode,
	staticContext: StaticContext,
): string => {
	return typeof factory === 'string' ? factory : factory(node, staticContext)
}
