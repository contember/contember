import * as React from 'react'
import { AccessorTreeStateWithDataContext, Component, EntityListAccessor } from '@contember/binding'
import { RepeaterInner, RepeaterInnerProps } from '../collections/Repeater'

export interface EntityListWrapperProps {
	accessor: EntityListAccessor
	isEmpty: boolean
	originalChildren: React.ReactNode
	children: React.ReactNode
}

export interface ImmutableEntityListRendererProps
	extends Omit<
		RepeaterInnerProps,
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
		| 'enableRemovingLast'
	> {
	beforeContent?: React.ReactNode
	afterContent?: React.ReactNode
}

export const ImmutableEntityListRenderer = Component<ImmutableEntityListRendererProps>(
	props => {
		const accessorTreeState = React.useContext(AccessorTreeStateWithDataContext)

		if (accessorTreeState === undefined) {
			return null
		}
		const root = accessorTreeState.data

		if (!(root instanceof EntityListAccessor)) {
			return null
		}

		return (
			<>
				{props.beforeContent}
				<RepeaterInner entityList={root} label={undefined} enableAddingNew={false} enableRemoving={false} {...props} />
				{props.afterContent}
			</>
		)
	},
	props => (
		// Deliberately omitting emptyMessage ‒ it's not supposed to be data-dependent.
		<>
			{props.beforeContent}
			<RepeaterInner entityList={undefined as any} label={undefined} {...props} />
			{props.afterContent}
		</>
	),
	'ImmutableEntityListRenderer',
)
