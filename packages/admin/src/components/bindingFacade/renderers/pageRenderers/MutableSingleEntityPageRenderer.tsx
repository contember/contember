import { Component, EntityAccessor } from '@contember/binding'
import { Message } from '@contember/ui'
import type { FunctionComponent } from 'react'
import { PersistButton } from '../../buttons'
import { LayoutRenderer, LayoutRendererProps } from '../LayoutRenderer'

export type MutableSingleEntityPageRendererProps =
	& LayoutRendererProps
	& {
		accessor: EntityAccessor
	}

export const MutableSingleEntityPageRenderer: FunctionComponent<MutableSingleEntityPageRendererProps> = Component(
	({ accessor, children, actions, ...contentLayoutProps }) => {
		if (accessor.environment.getSystemVariable('rootShouldExists') === 'yes' && !accessor.existsOnServer) {
			return <Message intent="danger">Requested entity of type {accessor.name} was not found</Message>
		}
		return (
			<LayoutRenderer {...contentLayoutProps} actions={actions ?? <PersistButton />}>
				{children}
			</LayoutRenderer>
		)
	},
	({ accessor, children, actions, ...contentLayoutProps }) => (
		<LayoutRenderer {...contentLayoutProps} actions={actions ?? <PersistButton />}>
			{children}
		</LayoutRenderer>
	),
	'MutableSingleEntityPageRenderer',
)
