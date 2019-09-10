import * as React from 'react'

export type BaseComponent =
	| React.ComponentClass<unknown>
	| React.FunctionComponent<unknown>
	| React.NamedExoticComponent<unknown>
