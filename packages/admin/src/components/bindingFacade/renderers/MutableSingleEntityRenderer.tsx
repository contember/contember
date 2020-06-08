import { Component, EntityAccessor, EntityForRemovalAccessor, SingleEntity } from '@contember/binding'
import * as React from 'react'
import { MutableContentLayoutRenderer, MutableContentLayoutRendererProps } from './MutableContentLayoutRenderer'

export interface MutableSingleEntityRendererProps extends MutableContentLayoutRendererProps {
	accessor: EntityAccessor | EntityForRemovalAccessor
}

export const MutableSingleEntityRenderer = Component<MutableSingleEntityRendererProps>(
	({ accessor, children, ...contentLayoutProps }) => (
		<SingleEntity accessor={accessor}>
			<MutableContentLayoutRenderer {...contentLayoutProps}>{children}</MutableContentLayoutRenderer>
		</SingleEntity>
	),
	'MutableSingleEntityRenderer',
)
