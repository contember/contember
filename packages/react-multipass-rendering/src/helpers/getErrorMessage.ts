import * as React from 'react'
import { ErrorMessageFactory } from '../ErrorMessageFactory'

export const getErrorMessage = <Environment>(
	factory: ErrorMessageFactory<Environment>,
	node: React.ReactNode,
	environment: Environment,
): string => {
	return typeof factory === 'string' ? factory : factory(node, environment)
}
