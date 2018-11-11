import * as React from 'react'
import { FieldName } from '../../bindingTypes'
import {
	EnforceSubtypeRelation,
	Field,
	Props,
	SyntheticChildrenProvider,
	ToMany,
	ToManyProps
} from '../../coreComponents'
import { EntityCollectionAccessor } from '../../dao'
import { Sortable } from './Sortable'

interface SortableRepeaterProps extends ToManyProps {
	sortBy: FieldName
}

class SortableRepeater extends React.Component<SortableRepeaterProps> {
	public static displayName = 'SortableRepeater'

	public render() {
		return (
			<ToMany.CollectionRetriever {...this.props}>
				{(field: EntityCollectionAccessor) => {
					return (
						<Sortable entities={field} sortBy={this.props.sortBy}>
							{this.props.children}
						</Sortable>
					)
				}}
			</ToMany.CollectionRetriever>
		)
	}

	public static generateSyntheticChildren(props: Props<SortableRepeaterProps>): React.ReactNode {
		return <ToMany field={props.field} filter={props.filter}>
			<Sortable sortBy={props.sortBy}>
				{props.children}
			</Sortable>
		</ToMany>
	}
}

export { SortableRepeater }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof SortableRepeater,
	SyntheticChildrenProvider<SortableRepeaterProps>
>
