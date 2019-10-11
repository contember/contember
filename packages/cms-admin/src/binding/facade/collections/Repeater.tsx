import { FieldSet, FieldSetProps } from '@contember/ui'
import * as React from 'react'
import {
	AccessorContext,
	EnforceSubtypeRelation,
	EnvironmentContext,
	SyntheticChildrenProvider,
	ToMany,
	ToManyProps,
} from '../../coreComponents'
import { EntityAccessor, EntityCollectionAccessor, Environment } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'
import { AddNewButton, RemoveButton, RemoveButtonProps } from '../buttons'

export interface RepeaterProps extends ToManyProps, Repeater.EntityCollectionPublicProps {}

class Repeater extends React.PureComponent<RepeaterProps> {
	static displayName = 'Repeater'

	public render() {
		return (
			<EnvironmentContext.Consumer>
				{(environment: Environment) =>
					QueryLanguage.wrapRelativeEntityList(
						this.props.field,
						atomicPrimitiveProps => (
							<ToMany.AccessorRetriever {...atomicPrimitiveProps}>
								{(field: EntityCollectionAccessor) => {
									return (
										<Repeater.EntityCollection
											entities={field}
											label={this.props.label}
											enableAddingNew={this.props.enableAddingNew}
											enableUnlink={this.props.enableUnlink}
											enableUnlinkAll={this.props.enableUnlinkAll}
											removeType={this.props.removeType}
										>
											{this.props.children}
										</Repeater.EntityCollection>
									)
								}}
							</ToMany.AccessorRetriever>
						),
						environment,
					)
				}
			</EnvironmentContext.Consumer>
		)
	}

	public static generateSyntheticChildren(props: RepeaterProps): React.ReactNode {
		return <ToMany field={props.field}>{props.children}</ToMany>
	}
}

namespace Repeater {
	export interface ItemPublicProps {
		removeType?: RemoveButtonProps['removeType']
		children: React.ReactNode
	}

	export interface ItemProps extends ItemPublicProps {
		entity: EntityAccessor
		displayUnlinkButton: boolean
	}

	export const Item = React.memo<ItemProps>(props => (
		<AccessorContext.Provider value={props.entity}>
			<div className="repeaterItem">
				<div className="repeaterItem-in">
					<div className="repeaterItem-content">{props.children}</div>
					{props.displayUnlinkButton && <RemoveButton className="repeaterItem-button" removeType={props.removeType} />}
				</div>
			</div>
		</AccessorContext.Provider>
	))
	Item.displayName = 'Repeater.Item'

	export interface EntityCollectionPublicProps extends ItemPublicProps {
		label?: FieldSetProps['legend']
		enableUnlink?: boolean
		enableUnlinkAll?: boolean
		enableAddingNew?: boolean
		emptyMessage?: React.ReactNode
	}

	export interface EntityCollectionProps extends EntityCollectionPublicProps {
		entities: EntityCollectionAccessor
	}

	export class EntityCollection extends React.PureComponent<EntityCollectionProps> {
		public render() {
			const entities = filterEntities(this.props.entities)
			return (
				// Intentionally not applying label system middleware
				<FieldSet legend={this.props.label} errors={this.props.entities.errors}>
					<Cloneable appendNew={this.props.entities.addNew} enableAddingNew={this.props.enableAddingNew}>
						{entities.map(entity => (
							<Item
								displayUnlinkButton={
									this.props.enableUnlink !== false && (entities.length > 1 || this.props.enableUnlinkAll === true)
								}
								entity={entity}
								key={entity.getKey()}
								removeType={this.props.removeType}
							>
								{this.props.children}
							</Item>
						))}
					</Cloneable>
				</FieldSet>
			)
		}
	}

	export interface CloneableProps {
		prependNew?: EntityCollectionAccessor['addNew']
		appendNew?: EntityCollectionAccessor['addNew']
		enableAddingNew?: boolean
	}

	export class Cloneable extends React.PureComponent<CloneableProps> {
		public render() {
			return this.props.enableAddingNew === false ? (
				this.props.children
			) : (
				<div className="cloneable">
					{this.props.prependNew && <AddNewButton addNew={this.props.prependNew} className="cloneable-button" />}
					<div className="cloneable-content">{this.props.children}</div>
					{this.props.appendNew && <AddNewButton addNew={this.props.appendNew} className="cloneable-button" />}
				</div>
			)
		}
	}

	export const filterEntities = (
		entities: EntityCollectionAccessor,
		excludeUnpersisted: boolean = false,
	): EntityAccessor[] => {
		return entities.entities.filter(
			(item): item is EntityAccessor => item instanceof EntityAccessor && (!excludeUnpersisted || item.isPersisted()),
		)
	}
}

export { Repeater }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Repeater, SyntheticChildrenProvider<RepeaterProps>>
