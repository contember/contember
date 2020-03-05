import { AccessorTreeStateWithDataContext, Component, EntityListAccessor } from '@contember/binding'
import * as React from 'react'
import { RepeaterInner, RepeaterInnerProps } from '../collections/Repeater'

// TODO properly unify with repeaters
export interface MutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps>
	extends Omit<RepeaterInnerProps<ContainerExtraProps, ItemExtraProps>, 'label' | 'entityList'> {
	beforeContent?: React.ReactNode
	afterContent?: React.ReactNode
}

export const MutableEntityListRenderer = Component(
	<ContainerExtraProps, ItemExtraProps>({
		beforeContent,
		afterContent,
		...repeaterInnerProps
	}: MutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps>) => {
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
				{beforeContent}
				<RepeaterInner entityList={root} label={undefined} {...repeaterInnerProps} />
				{afterContent}
			</>
		)
	},
	({ beforeContent, afterContent, ...repeaterInnerProps }) => (
		<>
			{beforeContent}
			<RepeaterInner entityList={undefined as any} label={undefined} {...repeaterInnerProps} />
			{afterContent}
		</>
	),
	'MutableEntityListRenderer',
) as <ContainerExtraProps, ItemExtraProps>(
	props: MutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps>,
) => React.ReactElement
