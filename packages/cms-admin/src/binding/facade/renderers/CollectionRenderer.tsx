import * as React from 'react'
import { EntityAccessor, EntityCollectionAccessor } from '../../dao'
import { Repeater } from '../collections'
import { FeedbackRenderer, FeedbackRendererPublicProps } from './FeedbackRenderer'

export interface CollectionRendererPublicProps extends FeedbackRendererPublicProps {}

export interface CollectionRendererInternalProps {
	includeUnpersisted?: boolean
	children: (rawData: EntityCollectionAccessor, filteredData: EntityAccessor[]) => React.ReactNode
}

export interface CollectionRendererProps extends CollectionRendererPublicProps, CollectionRendererInternalProps {}

export class CollectionRenderer extends React.PureComponent<CollectionRendererProps> {
	public render(): React.ReactNode {
		return (
			<FeedbackRenderer data={this.props.data} loadingFallback={this.props.loadingFallback}>
				{data => {
					if (!(data.root instanceof EntityCollectionAccessor)) {
						return null
					}

					return this.props.children(
						data.root,
						Repeater.filterEntities(data.root, this.props.includeUnpersisted !== true),
					)
				}}
			</FeedbackRenderer>
		)
	}
}
