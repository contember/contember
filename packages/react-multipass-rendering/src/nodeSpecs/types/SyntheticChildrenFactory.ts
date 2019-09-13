import * as React from 'react'

export type SyntheticChildrenFactory<Props extends {}, Environment> = (
	props: Props,
	environment: Environment,
) => React.ReactNode
