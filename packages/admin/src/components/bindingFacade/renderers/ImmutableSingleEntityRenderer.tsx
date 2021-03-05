import { Component, Entity, EntityAccessor } from '@contember/binding'
import { FunctionComponent } from 'react'
import { ImmutableContentLayoutRenderer, ImmutableContentLayoutRendererProps } from './ImmutableContentLayoutRenderer'

export interface ImmutableSingleEntityRendererProps extends ImmutableContentLayoutRendererProps {
	accessor: EntityAccessor
}

export const ImmutableSingleEntityRenderer: FunctionComponent<ImmutableSingleEntityRendererProps> = Component(
	({ accessor, children, ...contentLayoutProps }) => (
		<Entity accessor={accessor}>
			<ImmutableContentLayoutRenderer {...contentLayoutProps}>{children}</ImmutableContentLayoutRenderer>
		</Entity>
	),
	'ImmutableSingleEntityRenderer',
)
