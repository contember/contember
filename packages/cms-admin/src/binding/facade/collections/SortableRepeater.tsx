import { FormGroup } from '@blueprintjs/core'
import * as React from 'react'
import { FieldName } from '../../bindingTypes'
import {
	EnforceSubtypeRelation,
	EnvironmentContext,
	Props,
	SyntheticChildrenProvider,
	ToMany,
	ToManyProps
} from '../../coreComponents'
import { EntityCollectionAccessor, Environment } from '../../dao'
import { Sortable } from './Sortable'

interface SortableRepeaterProps extends ToManyProps {
	sortBy: FieldName
}

class SortableRepeater extends React.PureComponent<SortableRepeaterProps> {
	public static displayName = 'SortableRepeater'

	public render() {
		return (
			<ToMany.CollectionRetriever {...this.props}>
				{(field: EntityCollectionAccessor) => {
					return (
						// Intentionally not applying label system middleware
						<FormGroup label={this.props.label}>
							<Sortable entities={field} sortBy={this.props.sortBy}>
								{this.props.children}
							</Sortable>
						</FormGroup>
					)
				}}
			</ToMany.CollectionRetriever>
		)
	}

	public static generateSyntheticChildren(props: Props<SortableRepeaterProps>): React.ReactNode {
		return (
			<ToMany field={props.field} filter={props.filter}>
				<Sortable sortBy={props.sortBy}>{props.children}</Sortable>
			</ToMany>
		)
	}
}

export { SortableRepeater }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof SortableRepeater,
	SyntheticChildrenProvider<SortableRepeaterProps>
>
