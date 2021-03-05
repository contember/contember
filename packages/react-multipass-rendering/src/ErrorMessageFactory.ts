import { ReactNode } from 'react'

export type ErrorMessageFactory<StaticContext = any> =
	| string
	| ((node: ReactNode, staticContext: StaticContext) => string)
