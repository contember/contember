import * as React from 'react'

export type ErrorMessageFactory<Environment = any> =
	| string
	| ((node: React.ReactNode, environment: Environment) => string)
