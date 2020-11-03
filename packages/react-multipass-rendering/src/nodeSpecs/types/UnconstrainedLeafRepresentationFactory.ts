import * as React from 'react'

export type UnconstrainedLeafRepresentationFactory<Props extends {}, Representation, StaticContext> = (
	node: React.ReactText | React.ReactElement<Props, any> | boolean | null | undefined | {},
	staticContext: StaticContext,
) => Representation
