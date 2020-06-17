import { Component, EntityListAccessor } from '@contember/binding'
import * as React from 'react'
import { RepeaterInner, RepeaterInnerProps } from '../collections/Repeater'

export interface ImmutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps>
	extends Omit<
		RepeaterInnerProps<ContainerExtraProps, ItemExtraProps>,
		| 'entityList'
		| 'label'
		| 'sortableBy'
		| 'unstable__sortAxis'
		| 'addButtonComponentExtraProps'
		| 'addButtonText'
		| 'addButtonProps'
		| 'addButtonComponent'
		| 'enableAddingNew'
		| 'enableRemoving'
	> {
	beforeContent?: React.ReactNode
	afterContent?: React.ReactNode
	accessor: EntityListAccessor
}

export const ImmutableEntityListRenderer = Component(
	<ContainerExtraProps, ItemExtraProps>(
		props: ImmutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps>,
	) => {
		return (
			<>
				{props.beforeContent}
				<RepeaterInner label={undefined} enableAddingNew={false} enableRemoving={false} {...props} />
				{props.afterContent}
			</>
		)
	},
	props => (
		// Deliberately omitting emptyMessage ‒ it's not supposed to be data-dependent.
		<>
			{props.beforeContent}
			<RepeaterInner label={undefined} {...props} accessor={undefined as any} />
			{props.afterContent}
		</>
	),
	'ImmutableEntityListRenderer',
) as <ContainerExtraProps, ItemExtraProps>(
	props: ImmutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps>,
) => React.ReactElement
