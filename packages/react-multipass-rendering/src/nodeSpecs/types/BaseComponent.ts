import * as React from 'react'

export type BaseComponent<Props extends {}> =
	| React.ComponentClass<Props>
	| React.FunctionComponent<Props>
	| React.NamedExoticComponent<Props>
