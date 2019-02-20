import { Card, Elevation, FormGroup, IFormGroupProps } from '@blueprintjs/core'
import * as React from 'react'
import {
	DataContext,
	EnforceSubtypeRelation,
	EnvironmentContext,
	Props,
	SyntheticChildrenProvider,
	ToMany,
	ToManyProps
} from '../../coreComponents'
import { EntityAccessor, EntityCollectionAccessor, EntityForRemovalAccessor, Environment } from '../../dao'
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
						environment
					)
				}
			</EnvironmentContext.Consumer>
		)
	}

	public static generateSyntheticChildren(props: Props<RepeaterProps>): React.ReactNode {
		return <ToMany field={props.field}>{props.children}</ToMany>
	}
}

namespace Repeater {
	export interface ItemPublicProps {
		removeType?: RemoveButtonProps['removeType']
	}

	export interface ItemProps extends ItemPublicProps {
		entity: EntityAccessor
		displayUnlinkButton: boolean
	}

	export class Item extends React.PureComponent<ItemProps> {
		public render() {
			return (
				<DataContext.Provider value={this.props.entity}>
					<div className="repeaterItem">
						<Card elevation={Elevation.ONE} className="repeaterItem-in">
							<div className="repeaterItem-content">{this.props.children}</div>
							{this.props.displayUnlinkButton && (
								<RemoveButton className="repeaterItem-button" removeType={this.props.removeType} />
							)}
						</Card>
					</div>
				</DataContext.Provider>
			)
		}
	}

	export interface EntityCollectionPublicProps extends ItemPublicProps {
		label?: IFormGroupProps['label']
		enableUnlink?: boolean
		enableUnlinkAll?: boolean
		enableAddingNew?: boolean
	}

	export interface EntityCollectionProps extends EntityCollectionPublicProps {
		entities: EntityCollectionAccessor
	}

	export class EntityCollection extends React.PureComponent<EntityCollectionProps> {
		public render() {
			const entities = filterEntities(this.props.entities)
			return (
				// Intentionally not applying label system middleware
				<FormGroup label={this.props.label}>
					<Cloneable entities={this.props.entities} enableAddingNew={this.props.enableAddingNew}>
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
				</FormGroup>
			)
		}
	}

	export interface CloneableProps {
		entities?: EntityCollectionAccessor
		addNew?: EntityCollectionAccessor['addNew']
		enableAddingNew?: boolean
	}

	export class Cloneable extends React.PureComponent<CloneableProps> {
		public render() {
			return this.props.enableAddingNew === false ? (
				this.props.children
			) : (
				<div className="cloneable">
					<div className="cloneable-content">{this.props.children}</div>
					<AddNewButton
						addNew={this.props.entities ? this.props.entities.addNew : this.props.addNew}
						className="cloneable-button"
					/>
				</div>
			)
		}
	}

	export const filterEntities = (entities: EntityCollectionAccessor): EntityAccessor[] => {
		return entities.entities.filter((item): item is EntityAccessor => item instanceof EntityAccessor)
	}
}

export { Repeater }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Repeater, SyntheticChildrenProvider<RepeaterProps>>
