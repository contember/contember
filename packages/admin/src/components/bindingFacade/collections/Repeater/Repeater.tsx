import { BindingError, Component, HasMany, HasManyProps, useRelativeEntityList } from '@contember/binding'
import * as React from 'react'
import { RepeaterInner, RepeaterInnerProps } from './RepeaterInner'

export interface RepeaterProps<ContainerExtraProps, ItemExtraProps>
	extends HasManyProps,
		Omit<RepeaterInnerProps<ContainerExtraProps, ItemExtraProps>, 'entityList'> {
	initialRowCount?: number
}

export const Repeater = Component(
	<ContainerExtraProps, ItemExtraProps>(props: RepeaterProps<ContainerExtraProps, ItemExtraProps>) => {
		if (process.env.NODE_ENV === 'development') {
			if ('sortableBy' in props && 'orderBy' in props) {
				throw new BindingError(
					`Incorrect <Repeater /> use: cannot supply both the 'orderBy' and the 'sortableBy' properties.\n` +
						`\tTo allow the user to interactively order the rows, use 'sortableBy'.\n` +
						`\tTo control the order in which the items are automatically displayed, use 'orderBy'.`,
				)
			}
		}

		const entityList = useRelativeEntityList(props)

		return <RepeaterInner {...props} entityList={entityList} />
	},
	props => (
		<HasMany
			{...props}
			preferences={{
				initialEntityCount: props.initialRowCount === undefined ? 1 : props.initialRowCount,
			}}
		>
			<RepeaterInner {...props} entityList={undefined as any} />
		</HasMany>
	),
	'Repeater',
) as <ContainerExtraProps, ItemExtraProps>(
	props: RepeaterProps<ContainerExtraProps, ItemExtraProps>,
) => React.ReactElement
