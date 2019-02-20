import * as React from 'react'
import { EntityAccessor, EntityCollectionAccessor } from '../../dao'
import { Repeater } from '../collections'
import { LoadingRenderer, LoadingRendererPublicProps } from './LoadingRenderer'

export interface CollectionRendererPublicProps extends LoadingRendererPublicProps {}

export interface CollectionRendererInternalProps {
	children: (rawData: EntityCollectionAccessor, filteredData: EntityAccessor[]) => React.ReactNode
}

export interface CollectionRendererProps extends CollectionRendererPublicProps, CollectionRendererInternalProps {}

export class CollectionRenderer extends React.PureComponent<CollectionRendererProps> {
	public render(): React.ReactNode {
		return (
			<LoadingRenderer data={this.props.data} fallback={this.props.fallback}>
				{data => {
					if (!(data.root instanceof EntityCollectionAccessor)) {
						return null
					}

					return this.props.children(data.root, Repeater.filterEntities(data.root))
				}}
			</LoadingRenderer>
		)
	}
}
