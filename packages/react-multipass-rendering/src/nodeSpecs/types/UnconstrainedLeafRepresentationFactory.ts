import type { ReactElement } from 'react'

export type UnconstrainedLeafRepresentationFactory<Props extends {}, Representation, StaticContext> = (
	node: string | number | bigint | ReactElement<Props, any> | boolean | null | undefined,
	staticContext: StaticContext,
) => Representation
