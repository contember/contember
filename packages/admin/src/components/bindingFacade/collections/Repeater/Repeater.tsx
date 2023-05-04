import { BindingError, Component, HasMany, SugaredRelativeEntityList, useEntityList } from '@contember/binding'
import type { ReactElement } from 'react'
import { RepeaterInner, RepeaterInnerProps } from './RepeaterInner'

export interface RepeaterProps<ContainerExtraProps, ItemExtraProps>
	extends SugaredRelativeEntityList,
		Omit<RepeaterInnerProps<ContainerExtraProps, ItemExtraProps>, 'accessor'> {}

/**
 * The `Repeater` component renders a repeater with given child components.
 *
 * @group Blocks and repeaters
 */
export const Repeater = Component(
	<ContainerExtraProps, ItemExtraProps>(props: RepeaterProps<ContainerExtraProps, ItemExtraProps>) => {
		if (import.meta.env.DEV) {
			if (
				'sortableBy' in props &&
				props.sortableBy !== undefined &&
				'orderBy' in props &&
				props.orderBy !== undefined
			) {
				throw new BindingError(
					`Incorrect <Repeater /> use: cannot supply both the 'orderBy' and the 'sortableBy' properties.\n` +
						`\tTo allow the user to interactively order the items, use 'sortableBy'.\n` +
						`\tTo control the order in which the items are automatically displayed, use 'orderBy'.`,
				)
			}
			if (!('sortableBy' in props) && !('orderBy' in props)) {
				throw new BindingError(
					`Using a <Repeater /> without either the 'orderBy' or the 'sortableBy' property. ` +
						`This will currently result in bad user experience as the items may shuffle unpredictably over time.` +
						`\tTo allow the user to interactively order the items, use 'sortableBy'.\n` +
						`\tTo control the order in which the items are automatically displayed, use 'orderBy'.\n` +
						`\tTo disable this warning, set either of these to undefined.`,
				)
			}
		}

		const entityList = useEntityList(props)

		return <RepeaterInner {...props} accessor={entityList} />
	},
	(props, environment) => (
		<HasMany {...props} initialEntityCount={props.initialEntityCount ?? 1}>
			{RepeaterInner.staticRender(props, environment)}
		</HasMany>
	),
	'Repeater',
) as <ContainerExtraProps, ItemExtraProps>(props: RepeaterProps<ContainerExtraProps, ItemExtraProps>) => ReactElement
