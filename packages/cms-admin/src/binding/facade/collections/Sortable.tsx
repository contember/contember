import cn from 'classnames'
import * as React from 'react'
import {
	SortableContainer,
	SortableContainerProps,
	SortableElement,
	SortableElementProps,
	SortableHandle,
	SortEndHandler
} from 'react-sortable-hoc'
import { DragHandle as DragHandleIcon } from '../../../components/ui'
import { FieldName } from '../../bindingTypes'
import {
	DataContext,
	DataContextValue,
	EnforceSubtypeRelation,
	EnvironmentContext,
	Field,
	Props,
	SyntheticChildrenProvider
} from '../../coreComponents'
import { MutationStateContext } from '../../coreComponents/PersistState'
import { EntityAccessor, EntityCollectionAccessor, Environment, FieldAccessor } from '../../dao'
import { Repeater } from './Repeater'
import EntityCollectionPublicProps = Repeater.EntityCollectionPublicProps

export interface SortablePublicProps extends EntityCollectionPublicProps {
	sortBy: FieldName
}

export interface SortableInternalProps {
	entities?: EntityCollectionAccessor
}

export interface SortableProps extends SortablePublicProps, SortableInternalProps {}

class Sortable extends React.PureComponent<SortableProps> {
	public static displayName = 'Sortable'

	public render() {
		return (
			<EnvironmentContext.Consumer>
				{(environment: Environment) => {
					if (this.props.entities) {
						return (
							<Sortable.SortableInner
								enableUnlinkAll={this.props.enableUnlinkAll}
								enableAddingNew={this.props.enableAddingNew}
								enableUnlink={this.props.enableUnlink}
								label={this.props.label}
								sortBy={this.props.sortBy}
								entities={this.props.entities}
								removeType={this.props.removeType}
								environment={environment}
							>
								{this.props.children}
							</Sortable.SortableInner>
						)
					}
					return (
						<DataContext.Consumer>
							{(data: DataContextValue) => {
								if (data instanceof EntityCollectionAccessor) {
									return (
										<Sortable.SortableInner environment={environment} sortBy={this.props.sortBy} entities={data}>
											{this.props.children}
										</Sortable.SortableInner>
									)
								}
							}}
						</DataContext.Consumer>
					)
				}}
			</EnvironmentContext.Consumer>
		)
	}

	public static generateSyntheticChildren(props: Props<SortableProps>, environment: Environment): React.ReactNode {
		return (
			<>
				<Field name={props.sortBy} isNonbearing={true} />
				{props.children}
			</>
		)
	}
}

namespace Sortable {
	export interface DragHandleProps {
		isMutating: boolean
	}

	export const DragHandle = React.memo(
		SortableHandle((props: Props<DragHandleProps>) => (
			<div className={cn('sortable-item-handle', props.isMutating && 'sortable-item-handle-disabled')}>
				<DragHandleIcon />
			</div>
		))
	)

	export interface SortableItemProps extends Repeater.ItemProps, DragHandleProps {}

	export const SortableItem = React.memo(
		SortableElement((props: Props<SortableItemProps & SortableElementProps>) => (
			<li className="sortable-item">
				<DragHandle isMutating={props.isMutating} />
				<div className="sortable-item-content">
					<Repeater.Item {...props}>{props.children}</Repeater.Item>
				</div>
			</li>
		))
	)

	export interface SortableListProps extends EntityCollectionPublicProps {
		entities: EntityAccessor[]
		prependNew?: EntityCollectionAccessor['addNew']
		appendNew?: EntityCollectionAccessor['addNew']
	}

	export const SortableList = React.memo(
		SortableContainer((props: Props<SortableListProps & SortableContainerProps>) => {
			const isMutating = React.useContext(MutationStateContext)
			return (
				<Repeater.Cloneable
					prependNew={props.prependNew}
					appendNew={props.appendNew}
					enableAddingNew={props.enableAddingNew}
				>
					<ul className="sortable">
						{props.entities.map((item, index) => (
							<SortableItem
								entity={item}
								index={index}
								key={item.getKey()}
								disabled={isMutating}
								isMutating={isMutating}
								displayUnlinkButton={
									props.enableUnlink !== false && (props.entities.length > 1 || props.enableUnlinkAll === true)
								}
								removeType={props.removeType}
							>
								{props.children}
							</SortableItem>
						))}
					</ul>
				</Repeater.Cloneable>
			)
		})
	)

	export interface EntityOrder {
		[primaryKey: string]: number
	}

	export interface SortableInnerProps extends SortablePublicProps {
		entities: EntityCollectionAccessor
		environment: Environment
	}

	export class SortableInner extends React.PureComponent<SortableInnerProps> {
		private entities: EntityAccessor[] = []

		private getOnSortEnd = (accessor: EntityCollectionAccessor): SortEndHandler => ({ oldIndex, newIndex }) => {
			this.reconcileOrderFields(accessor, oldIndex, newIndex)
		}

		private getBatchUpdater = (order: EntityOrder) => (getAccessor: () => EntityCollectionAccessor) => {
			let collectionAccessor: EntityCollectionAccessor = getAccessor()
			for (const entity of collectionAccessor.entities) {
				if (!(entity instanceof EntityAccessor)) {
					continue
				}
				const target = order[entity.getKey()]
				const orderField = entity.data.getField(this.props.sortBy)

				if (target !== undefined && orderField instanceof FieldAccessor && orderField.updateValue) {
					orderField.updateValue(target)
					collectionAccessor = getAccessor()
				}
			}
		}

		private computeNewEntityOrder(oldIndex: number, newIndex: number): EntityOrder {
			const order: EntityOrder = {}

			for (let i = 0, len = this.entities.length; i < len; i++) {
				const entity = this.entities[i]
				const orderField = entity.data.getField(this.props.sortBy)

				if (orderField instanceof FieldAccessor && orderField.updateValue) {
					let targetValue

					if (i === oldIndex) {
						targetValue = newIndex
					} else if (oldIndex < newIndex && i > oldIndex && i <= newIndex) {
						targetValue = i - 1
					} else if (oldIndex > newIndex && i >= newIndex && i < oldIndex) {
						targetValue = i + 1
					} else {
						targetValue = i
					}

					if (typeof orderField.currentValue !== 'number' || orderField.currentValue !== targetValue) {
						order[entity.getKey()] = targetValue
					}
				}
			}
			return order
		}

		private reconcileOrderFields(accessor: EntityCollectionAccessor, oldIndex: number, newIndex: number) {
			const order = this.computeNewEntityOrder(oldIndex, newIndex)
			accessor.batchUpdates && accessor.batchUpdates(this.getBatchUpdater(order))
		}

		private prepareEntities(accessor: EntityCollectionAccessor): EntityAccessor[] {
			const entities = accessor.entities.filter((item): item is EntityAccessor => item instanceof EntityAccessor)

			return entities.sort((a, b) => {
				const [aField, bField] = [a.data.getField(this.props.sortBy), b.data.getField(this.props.sortBy)]

				if (
					aField instanceof FieldAccessor &&
					bField instanceof FieldAccessor &&
					typeof aField.currentValue === 'number' &&
					typeof bField.currentValue === 'number'
				) {
					return aField.currentValue - bField.currentValue
				}
				return 0
			})
		}

		private prependNew = () => {
			this.props.entities.addNew &&
				this.props.entities.addNew((getCollectionAccessor, newIndex) => {
					let accessor = getCollectionAccessor()
					let newlyAdded = accessor.entities[newIndex]

					if (!(newlyAdded instanceof EntityAccessor)) {
						return
					}

					const sortableField = newlyAdded.data.getField(this.props.sortBy)

					if (!(sortableField instanceof FieldAccessor)) {
						return
					}

					sortableField.updateValue && sortableField.updateValue(this.entities.length)

					accessor = getCollectionAccessor()
					newlyAdded = accessor.entities[newIndex]

					if (!(newlyAdded instanceof EntityAccessor)) {
						return
					}

					this.entities.push(newlyAdded)
					this.reconcileOrderFields(accessor, this.entities.length - 1, 0)
				})
		}

		public render() {
			this.entities = this.prepareEntities(this.props.entities)

			return (
				<SortableList
					entities={this.entities}
					onSortEnd={this.getOnSortEnd(this.props.entities)}
					useDragHandle={true}
					lockAxis="y"
					lockToContainerEdges={true}
					prependNew={this.prependNew}
					appendNew={this.props.entities.addNew}
					enableUnlinkAll={this.props.enableUnlinkAll}
					enableAddingNew={this.props.enableAddingNew}
					enableUnlink={this.props.enableUnlink}
					label={this.props.label}
					removeType={this.props.removeType}
				>
					{this.props.children}
				</SortableList>
			)
		}

		componentDidUpdate(): void {
			this.fixOrderlessEntities()
		}

		private fixOrderlessEntities() {
			this.props.entities.batchUpdates &&
				this.props.entities.batchUpdates(getAccessor => {
					let collectionAccessor: EntityCollectionAccessor = getAccessor()
					for (const [i, entity] of this.entities.entries()) {
						if (!(entity instanceof EntityAccessor)) {
							continue
						}

						const orderField = entity.data.getField(this.props.sortBy)

						if (orderField instanceof FieldAccessor && orderField.currentValue === null && orderField.updateValue) {
							orderField.updateValue(i)
							collectionAccessor = getAccessor()
						}
					}
				})
		}
	}
}

export { Sortable }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Sortable, SyntheticChildrenProvider<SortableProps>>
