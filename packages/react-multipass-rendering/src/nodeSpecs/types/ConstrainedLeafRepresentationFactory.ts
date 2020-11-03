import * as React from 'react'

export type ConstrainedLeafRepresentationFactory<Props extends {}, Representation, StaticContext> = (
	node: React.ReactElement<Props, any>,
	staticContext: StaticContext,
) => Representation
