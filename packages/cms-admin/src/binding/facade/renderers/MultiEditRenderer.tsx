import * as React from 'react'
import {
	DataContext,
	DataRendererProps,
	EnforceSubtypeRelation,
	Field,
	Props,
	SyntheticChildrenProvider
} from '../../coreComponents'
import { EntityAccessor, EntityCollectionAccessor } from '../../dao'
import { AddNewButton, PersistButton, UnlinkButton } from '../buttons'
import { Repeater } from '../collections'
import { Sortable, SortablePublicProps } from '../collections/Sortable'
import { CommonRendererProps } from './CommonRendererProps'
import { DefaultRenderer } from './DefaultRenderer'

export interface MultiEditRendererProps extends CommonRendererProps {
	displayAddNewButton?: boolean
	displayPersistButton?: boolean
	displayUnlinkButton?: boolean
	sortable?: SortablePublicProps
}

class MultiEditRenderer extends React.PureComponent<MultiEditRendererProps & DataRendererProps> {
	public static displayName = 'MultiEditRenderer'

	public render() {
		const data = this.props.data

		if (!data) {
			return null // TODO display a message
		}

		if (data.root instanceof EntityCollectionAccessor) {
			return (
				<>
					{DefaultRenderer.renderTitle(this.props.title)}
					{this.props.beforeContent}
					{this.props.sortable === undefined && (
						<Repeater.EntityCollection entities={data.root}>{this.props.children}</Repeater.EntityCollection>
					)}
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

	public static generateSyntheticChildren(props: Props<MultiEditRendererProps>) {
		return (
			<>
				{DefaultRenderer.renderTitle(props.title)}
				{props.sortable !== undefined && <Sortable {...props.sortable} />}
				{props.children}
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
					{this.props.displayUnlinkButton && <UnlinkButton />}
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
