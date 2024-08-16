import type { ReactNode } from 'react'

export type SyntheticChildrenFactory<Props extends {}, StaticContext> = (
	props: Props,
	staticContext: StaticContext,
) => ReactNode
