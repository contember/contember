import * as React from 'react'
import { FieldName } from '../../bindingTypes'
import { EnforceSubtypeRelation, Field, Props, SyntheticChildrenProvider, ToMany, ToManyProps } from '../../coreComponents'
import { Environment } from '../../dao'

interface SortableRepeaterProps extends ToManyProps {
	sortBy: FieldName
}

class SortableRepeater extends React.Component<SortableRepeaterProps> {
	public static displayName = 'SortableRepeater'

	public render() {
		return null
	}

	public static generateSyntheticChildren(
		props: Props<SortableRepeaterProps>,
		environment: Environment
	): React.ReactNode {
		return (
			<ToMany field={props.field} filter={props.filter}>
				<Field name={props.field} />
				{props.children}
			</ToMany>
		)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof SortableRepeater,
	SyntheticChildrenProvider<SortableRepeaterProps>
>
