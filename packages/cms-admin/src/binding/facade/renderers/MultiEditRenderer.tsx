import * as React from 'react'
import { EnforceSubtypeRelation, SyntheticChildrenProvider } from '../../coreComponents'
import { EntityAccessor } from '../../dao'
import { RemoveButton } from '../buttons'
import { Repeater, Sortable, SortablePublicProps } from '../collections'
import { CommonRendererProps } from './CommonRenderer'
import { ContentLayoutRendererProps } from './ContentLayoutRenderer'
import EntityCollectionPublicProps = Repeater.EntityCollectionPublicProps

export interface MultiEditRendererProps extends ContentLayoutRendererProps, EntityCollectionPublicProps {
	enablePersist?: boolean
	sortable?: Omit<SortablePublicProps, 'children'>
}

class MultiEditRenderer extends React.PureComponent<MultiEditRendererProps & any> {
	public static displayName = 'MultiEditRenderer'

	public render() {
		return null
		/*return (
			<CollectionRenderer data={this.props.data}>
				{rawData => (
					<LayoutInner>
						{DefaultRenderer.renderTitleBar(this.props)}
						<Box>
							{this.props.beforeContent}
							{this.props.sortable === undefined && (
								<Repeater.EntityCollection
									entities={rawData}
									enableUnlinkAll={this.props.enableUnlinkAll}
									enableAddingNew={this.props.enableAddingNew}
									enableUnlink={this.props.enableUnlink}
									label={this.props.label}
								>
									{this.props.children}
								</Repeater.EntityCollection>
							)}
							{this.props.sortable !== undefined && (
								<Sortable
									enableUnlinkAll={this.props.enableUnlinkAll}
									enableAddingNew={this.props.enableAddingNew}
									enableUnlink={this.props.enableUnlink}
									label={this.props.label}
									{...this.props.sortable}
									entities={rawData}
								>
									{this.props.children}
								</Sortable>
							)}
						</Box>
						{this.props.enablePersist !== false && (
							<div style={{ margin: '1em 0' }}>
								<PersistButton />
							</div>
						)}
					</LayoutInner>
				)}
			</CollectionRenderer>
		)*/
	}

	public static generateSyntheticChildren(props: MultiEditRendererProps) {
		return (
			<>
				{props.sortable !== undefined && <Sortable {...props.sortable}>{props.children}</Sortable>}
				{props.sortable && props.children}
			</>
		)
	}
}

namespace MultiEditRenderer {
	export interface MultiEditItemProps {
		entity: EntityAccessor
		displayUnlinkButton: boolean
	}

	export class MultiEditItem extends React.PureComponent<MultiEditItemProps> {
		public render() {
			return (
				<>
					{this.props.children}
					{this.props.displayUnlinkButton && <RemoveButton />}
				</>
			)
		}
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof MultiEditRenderer,
	SyntheticChildrenProvider<MultiEditRendererProps>
>

export { MultiEditRenderer }
