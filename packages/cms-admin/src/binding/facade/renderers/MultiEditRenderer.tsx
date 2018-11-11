import * as React from 'react'
import { DataContext, DataRendererProps } from '../../coreComponents'
import { EntityAccessor, EntityCollectionAccessor } from '../../dao'
import { AddNewButton, PersistButton, UnlinkButton } from '../buttons'
import { Sortable, SortablePublicProps } from '../collections/Sortable'
import { CommonRendererProps } from './CommonRendererProps'
import { DefaultRenderer } from './DefaultRenderer'

export interface MultiEditRendererProps extends CommonRendererProps {
	displayAddNewButton?: boolean
	displayPersistButton?: boolean
	displayUnlinkButton?: boolean
	sortable?: SortablePublicProps
}

class MultiEditRenderer extends React.Component<MultiEditRendererProps & DataRendererProps> {
	public render() {
		const data = this.props.data

		if (!data) {
			return null // TODO display a message
		}

		if (data.root instanceof EntityCollectionAccessor) {
			const entities = data.root.entities.filter((item): item is EntityAccessor => item instanceof EntityAccessor)

			return (
				<>
					{DefaultRenderer.renderTitle(this.props.title)}
					{this.props.sortable === undefined &&
						entities.map(entity => (
							<DataContext.Provider value={entity} key={entity.getKey()}>
								<MultiEditRenderer.MultiEditItem displayUnlinkButton={entities.length > 1} entity={entity}>
									{this.props.children}
								</MultiEditRenderer.MultiEditItem>
							</DataContext.Provider>
						))}
					{this.props.sortable !== undefined && (
						<Sortable {...this.props.sortable} entities={data.root}>
							{this.props.children}
						</Sortable>
					)}
					{this.props.displayAddNewButton && <AddNewButton addNew={data.root.addNew} />}
					{this.props.displayPersistButton !== false && <PersistButton />}
				</>
			)
		}
	}
}

namespace MultiEditRenderer {
	export interface MultiEditItemProps {
		entity: EntityAccessor
		displayUnlinkButton: boolean
	}

	export class MultiEditItem extends React.Component<MultiEditItemProps> {
		public render() {
			return (
				<>
					{this.props.children}
					{this.props.displayUnlinkButton && <UnlinkButton />}
				</>
			)
		}
	}
}

export { MultiEditRenderer }
