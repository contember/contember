import { FieldSet, FieldSetProps } from '@contember/ui'
import * as React from 'react'
import {
	AccessorContext,
	EnforceSubtypeRelation,
	EntityAccessor,
	EntityListAccessor,
	Environment,
	EnvironmentContext,
	QueryLanguage,
	SyntheticChildrenProvider,
	ToMany,
	ToManyProps,
} from '../../../binding'
import { AddNewButton, RemoveButton, RemoveButtonProps } from '../buttons'

export interface RepeaterProps extends ToManyProps, Repeater.EntityListPublicProps {}

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
								{(field: EntityListAccessor) => {
									return (
										<Repeater.EntityList
											entities={field}
											label={this.props.label}
											enableAddingNew={this.props.enableAddingNew}
											enableUnlink={this.props.enableUnlink}
											enableUnlinkAll={this.props.enableUnlinkAll}
											removeType={this.props.removeType}
										>
											{this.props.children}
										</Repeater.EntityList>
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

	export interface EntityListPublicProps extends ItemPublicProps {
		label?: FieldSetProps['legend']
		enableUnlink?: boolean
		enableUnlinkAll?: boolean
		enableAddingNew?: boolean
		emptyMessage?: React.ReactNode
	}

	export interface EntityListProps extends EntityListPublicProps {
		entities: EntityListAccessor
	}

	export class EntityList extends React.PureComponent<EntityListProps> {
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
		prependNew?: EntityListAccessor['addNew']
		appendNew?: EntityListAccessor['addNew']
		enableAddingNew?: boolean
	}

	export class Cloneable extends React.PureComponent<CloneableProps> {
		public render() {
			return this.props.enableAddingNew === false ? (
				this.props.children
			) : (
				<div className="cloneable">
					{this.props.prependNew && <AddNewButton addNew={this.props.prependNew} />}
					<div className="cloneable-content">{this.props.children}</div>
					{this.props.appendNew && <AddNewButton addNew={this.props.appendNew} />}
				</div>
			)
		}
	}

	export const filterEntities = (
		entities: EntityListAccessor,
		excludeUnpersisted: boolean = false,
	): EntityAccessor[] => {
		return entities.entities.filter(
			(item): item is EntityAccessor => item instanceof EntityAccessor && (!excludeUnpersisted || item.isPersisted()),
		)
	}
}

export { Repeater }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Repeater, SyntheticChildrenProvider<RepeaterProps>>
