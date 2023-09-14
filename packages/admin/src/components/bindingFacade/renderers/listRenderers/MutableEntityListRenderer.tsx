import { Component } from '@contember/react-binding'
import type { ReactElement, ReactNode } from 'react'
import { RepeaterInner, RepeaterInnerProps } from '../../collections'

// TODO properly unify with repeaters
export type MutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps> =
	& Omit<RepeaterInnerProps<ContainerExtraProps, ItemExtraProps>, 'label'>
	& {
		beforeContent?: ReactNode
		afterContent?: ReactNode
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
) => ReactElement
