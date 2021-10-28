import { Component, Entity, EntityAccessor } from '@contember/binding'
import { Message } from '@contember/ui'
import type { FunctionComponent } from 'react'
import { MutableContentLayoutRenderer, MutableContentLayoutRendererProps } from './MutableContentLayoutRenderer'

export interface MutableSingleEntityRendererProps extends MutableContentLayoutRendererProps {
	accessor: EntityAccessor
}

export const MutableSingleEntityRenderer: FunctionComponent<MutableSingleEntityRendererProps> = Component(
	({ accessor, children, ...contentLayoutProps }) => {
		if (accessor.environment.getSystemVariable('rootShouldExists') === 'yes' && !accessor.existsOnServer) {
			return <Message intent="danger">Requested entity of type {accessor.name} was not found</Message>
		}
		return (
			<Entity accessor={accessor}>
				<MutableContentLayoutRenderer {...contentLayoutProps}>{children}</MutableContentLayoutRenderer>
			</Entity>
		)
	},
	({ accessor, children, ...contentLayoutProps }) => (
		<Entity accessor={accessor}>
			<MutableContentLayoutRenderer {...contentLayoutProps}>{children}</MutableContentLayoutRenderer>
		</Entity>
	),
	'MutableSingleEntityRenderer',
)
