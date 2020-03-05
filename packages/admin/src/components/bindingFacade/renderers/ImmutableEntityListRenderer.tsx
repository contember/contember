import { AccessorTreeStateWithDataContext, Component, EntityListAccessor } from '@contember/binding'
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
		| 'enableRemovingLast'
	> {
	beforeContent?: React.ReactNode
	afterContent?: React.ReactNode
}

export const ImmutableEntityListRenderer = Component(
	<ContainerExtraProps, ItemExtraProps>(
		props: ImmutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps>,
	) => {
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
) as <ContainerExtraProps, ItemExtraProps>(
	props: ImmutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps>,
) => React.ReactElement
