import { Component, EntityAccessor, SingleEntity } from '@contember/binding'
import * as React from 'react'
import { ImmutableContentLayoutRenderer, ImmutableContentLayoutRendererProps } from './ImmutableContentLayoutRenderer'

export interface ImmutableSingleEntityRendererProps extends ImmutableContentLayoutRendererProps {
	accessor: EntityAccessor
}

export const ImmutableSingleEntityRenderer = Component<ImmutableSingleEntityRendererProps>(
	({ accessor, children, ...contentLayoutProps }) => (
		<SingleEntity accessor={accessor}>
			<ImmutableContentLayoutRenderer {...contentLayoutProps}>{children}</ImmutableContentLayoutRenderer>
		</SingleEntity>
	),
	'ImmutableSingleEntityRenderer',
)
