import * as React from 'react'
import { ErrorMessageFactory } from '../ErrorMessageFactory'

export const getErrorMessage = (factory: ErrorMessageFactory, node: React.ReactNode): string => {
	return typeof factory === 'string' ? factory : factory(node)
}
