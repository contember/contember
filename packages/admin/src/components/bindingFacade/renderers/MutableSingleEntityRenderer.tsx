import { Component, EntityAccessor, SingleEntity } from '@contember/binding'
import * as React from 'react'
import { MutableContentLayoutRenderer, MutableContentLayoutRendererProps } from './MutableContentLayoutRenderer'

export interface MutableSingleEntityRendererProps extends MutableContentLayoutRendererProps {
	accessor: EntityAccessor
}

export const MutableSingleEntityRenderer = Component<MutableSingleEntityRendererProps>(
	({ accessor, children, ...contentLayoutProps }) => (
		<SingleEntity accessor={accessor}>
			<MutableContentLayoutRenderer {...contentLayoutProps}>{children}</MutableContentLayoutRenderer>
		</SingleEntity>
	),
	'MutableSingleEntityRenderer',
)
