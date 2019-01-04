import { FormGroup } from '@blueprintjs/core'
import * as React from 'react'
import { EnforceSubtypeRelation, Props, SyntheticChildrenProvider, ToMany, ToManyProps } from '../../coreComponents'
import { EntityCollectionAccessor } from '../../dao'
import { Repeater } from './Repeater'
import { Sortable, SortablePublicProps } from './Sortable'

interface SortableRepeaterProps extends ToManyProps, Repeater.EntityCollectionPublicProps {
	sortBy: SortablePublicProps['sortBy']
}

class SortableRepeater extends React.PureComponent<SortableRepeaterProps> {
	public static displayName = 'SortableRepeater'

	public render() {
		return (
			<ToMany.CollectionRetriever field={this.props.field} label={this.props.label} filter={this.props.filter}>
				{(field: EntityCollectionAccessor) => {
					return (
						// Intentionally not applying label system middleware
						<FormGroup label={this.props.label}>
							<Sortable
								entities={field}
								sortBy={this.props.sortBy}
								label={this.props.label}
								enableAddingNew={this.props.enableAddingNew}
								enableUnlink={this.props.enableUnlink}
								enableUnlinkAll={this.props.enableUnlinkAll}
								removeType={this.props.removeType}
							>
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
