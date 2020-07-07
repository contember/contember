import { Component, EntityListAccessor } from '@contember/binding'
import * as React from 'react'
import { RepeaterInner, RepeaterInnerProps } from '../collections/Repeater'

// TODO properly unify with repeaters
export interface MutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps>
	extends Omit<RepeaterInnerProps<ContainerExtraProps, ItemExtraProps>, 'label'> {
	beforeContent?: React.ReactNode
	afterContent?: React.ReactNode
}

export const MutableEntityListRenderer = Component(
	<ContainerExtraProps, ItemExtraProps>({
		beforeContent,
		afterContent,
		...repeaterInnerProps
	}: MutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps>) => {
		return (
			<>
				{beforeContent}
				<RepeaterInner label={undefined} {...repeaterInnerProps} />
				{afterContent}
			</>
		)
	},
	({ beforeContent, afterContent, ...repeaterInnerProps }, environment) => (
		<>
			{beforeContent}
			{RepeaterInner.staticRender(
				{
					label: undefined,
					...repeaterInnerProps,
				},
				environment,
			)}
			{afterContent}
		</>
	),
	'MutableEntityListRenderer',
) as <ContainerExtraProps, ItemExtraProps>(
	props: MutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps>,
) => React.ReactElement
