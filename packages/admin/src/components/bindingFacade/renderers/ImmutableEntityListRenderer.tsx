import { Component, EntityListAccessor } from '@contember/binding'
import type { ReactElement, ReactNode } from 'react'
import { RepeaterInner, RepeaterInnerProps } from '../collections'

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
		| 'dragHandleComponent'
		| 'useDragHandle'
	> {
	beforeContent?: ReactNode
	afterContent?: ReactNode
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
	(props, environment) => (
		// Deliberately omitting emptyMessage ‒ it's not supposed to be data-dependent.
		<>
			{props.beforeContent}
			{RepeaterInner.staticRender(
				{
					label: undefined,
					...props,
				},
				environment,
			)}
			{props.afterContent}
		</>
	),
	'ImmutableEntityListRenderer',
) as <ContainerExtraProps, ItemExtraProps>(
	props: ImmutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps>,
) => ReactElement
