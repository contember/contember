import * as React from 'react'

export type ErrorMessageFactory<StaticContext = any> =
	| string
	| ((node: React.ReactNode, staticContext: StaticContext) => string)
