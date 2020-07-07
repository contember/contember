import * as React from 'react'

export type SyntheticChildrenFactory<Props extends {}, StaticContext> = (
	props: Props,
	staticContext: StaticContext,
) => React.ReactNode
