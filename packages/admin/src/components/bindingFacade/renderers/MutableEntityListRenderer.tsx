import * as React from 'react'
import { AccessorTreeStateWithDataContext, Component, EntityListAccessor } from '@contember/binding'
import { RepeaterInner, RepeaterInnerProps } from '../collections/Repeater'

// TODO properly unify with repeaters
export interface MutableEntityListRendererProps extends Omit<RepeaterInnerProps, 'label' | 'entityList'> {
	beforeContent?: React.ReactNode
	afterContent?: React.ReactNode
}

export const MutableEntityListRenderer = Component<MutableEntityListRendererProps>(
	({ beforeContent, afterContent, ...repeaterInnerProps }) => {
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
)
