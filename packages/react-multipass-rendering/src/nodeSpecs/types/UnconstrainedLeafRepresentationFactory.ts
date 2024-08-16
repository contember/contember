import type { ReactElement, ReactText } from 'react'

export type UnconstrainedLeafRepresentationFactory<Props extends {}, Representation, StaticContext> = (
	node: ReactText | ReactElement<Props, any> | boolean | null | undefined,
	staticContext: StaticContext,
) => Representation
