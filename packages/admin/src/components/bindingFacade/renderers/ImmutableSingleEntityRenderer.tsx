import { Component, Entity, EntityAccessor } from '@contember/binding'
import * as React from 'react'
import { ImmutableContentLayoutRenderer, ImmutableContentLayoutRendererProps } from './ImmutableContentLayoutRenderer'

export interface ImmutableSingleEntityRendererProps extends ImmutableContentLayoutRendererProps {
	accessor: EntityAccessor
}

export const ImmutableSingleEntityRenderer: React.FunctionComponent<ImmutableSingleEntityRendererProps> = Component(
	({ accessor, children, ...contentLayoutProps }) => (
		<Entity accessor={accessor}>
			<ImmutableContentLayoutRenderer {...contentLayoutProps}>{children}</ImmutableContentLayoutRenderer>
		</Entity>
	),
	'ImmutableSingleEntityRenderer',
)
