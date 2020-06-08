import { BindingError, Component, HasMany, HasManyProps, useRelativeEntityList } from '@contember/binding'
import * as React from 'react'
import { RepeaterInner, RepeaterInnerProps } from './RepeaterInner'

export interface RepeaterProps<ContainerExtraProps, ItemExtraProps>
	extends HasManyProps,
		Omit<RepeaterInnerProps<ContainerExtraProps, ItemExtraProps>, 'accessor'> {
	initialRowCount?: number
}

export const Repeater = Component(
	<ContainerExtraProps, ItemExtraProps>(props: RepeaterProps<ContainerExtraProps, ItemExtraProps>) => {
		if (__DEV_MODE__) {
			if (
				'sortableBy' in props &&
				props.sortableBy !== undefined &&
				'orderBy' in props &&
				props.orderBy !== undefined
			) {
				throw new BindingError(
					`Incorrect <Repeater /> use: cannot supply both the 'orderBy' and the 'sortableBy' properties.\n` +
						`\tTo allow the user to interactively order the rows, use 'sortableBy'.\n` +
						`\tTo control the order in which the items are automatically displayed, use 'orderBy'.`,
				)
			}
		}

		const entityList = useRelativeEntityList(props)

		return <RepeaterInner {...props} accessor={entityList} />
	},
	props => (
		<HasMany
			{...props}
			preferences={{
				initialEntityCount: props.initialRowCount === undefined ? 1 : props.initialRowCount,
			}}
		>
			<RepeaterInner {...props} accessor={undefined as any} />
		</HasMany>
	),
	'Repeater',
) as <ContainerExtraProps, ItemExtraProps>(
	props: RepeaterProps<ContainerExtraProps, ItemExtraProps>,
) => React.ReactElement
