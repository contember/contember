import type { ReactElement } from 'react'

export type ConstrainedLeafRepresentationFactory<Props extends {}, Representation, StaticContext> = (
	node: ReactElement<Props, any>,
	staticContext: StaticContext,
) => Representation
