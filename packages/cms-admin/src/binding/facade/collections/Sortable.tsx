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
import {
	DataBindingError,
	EntityAccessor,
	EntityCollectionAccessor,
	Environment,
	FieldAccessor,
	VariableScalar
} from '../../dao'
import { Repeater } from './Repeater'
import EntityCollectionPublicProps = Repeater.EntityCollectionPublicProps

export interface SortablePublicProps extends EntityCollectionPublicProps {
	sortBy: FieldName | VariableScalar
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
				<Field name={Sortable.resolveSortByFieldName(props.sortBy, environment)} isNonbearing={true} />
				{props.children}
			</>
		)
	}
}

namespace Sortable {
	export const resolveSortByFieldName = (sortBy: FieldName | VariableScalar, environment: Environment): FieldName => {
		if (sortBy instanceof VariableScalar) {
			const fieldName = environment.getValue(sortBy.variable)

			if (fieldName === undefined) {
				throw new DataBindingError(`Attempting to sort by a variable field '${sortBy.variable}' which is not defined.`)
			}
			if (typeof fieldName !== 'string') {
				throw new DataBindingError(
					`Attempting to sort by a variable field '${sortBy.variable}' which exists but resolves to a non-string value.`
				)
			}
			return fieldName
		}
		return sortBy
	}

	export interface DragHandleProps {
		isMutating: boolean
	}

	export const DragHandle = React.memo(
		SortableHandle((props: Props<DragHandleProps>) => (
			<div
				className={cn(
					'sortable-item-handle',
					(console.log(props) as any) || false,
					props.isMutating && 'sortable-item-handle-disabled'
				)}
			>
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
		addNew: EntityCollectionAccessor['addNew']
	}

	export const SortableList = React.memo(
		SortableContainer((props: Props<SortableListProps & SortableContainerProps>) => {
			const isMutating = React.useContext(MutationStateContext)
			return (
				<Repeater.Cloneable addNew={props.addNew} enableAddingNew={props.enableAddingNew}>
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

	export interface SortableInnerProps extends SortablePublicProps {
		entities: EntityCollectionAccessor
		environment: Environment
	}

	export class SortableInner extends React.PureComponent<SortableInnerProps> {
		private entities: EntityAccessor[] = []

		private getOnSortEnd = (environment: Environment): SortEndHandler => ({ oldIndex, newIndex }, e) => {
			const order: { [primaryKey: string]: number } = {}

			for (let i = 0, len = this.entities.length; i < len; i++) {
				const entity = this.entities[i]
				const fieldName = Sortable.resolveSortByFieldName(this.props.sortBy, environment)
				const orderField = entity.data.getField(fieldName)

				if (orderField instanceof FieldAccessor && orderField.onChange) {
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
			const fieldName = Sortable.resolveSortByFieldName(this.props.sortBy, environment)
			for (const entity of this.entities) {
				const target = order[entity.getKey()]
				const orderField = entity.data.getField(fieldName)

				if (target !== undefined && orderField instanceof FieldAccessor && orderField.onChange) {
					orderField.onChange(target)
				}
			}
		}

		private updateUnpersistedEntities() {
			const fieldName = Sortable.resolveSortByFieldName(this.props.sortBy, this.props.environment)
			for (let i = 0, length = this.entities.length; i < length; i++) {
				const entity = this.entities[i]

				if (entity.primaryKey instanceof EntityAccessor.UnpersistedEntityID) {
					const orderField = entity.data.getField(fieldName)

					if (orderField instanceof FieldAccessor && orderField.currentValue === null && orderField.onChange) {
						orderField.onChange(i)
					}
				}
			}
		}

		public render() {
			const fieldName = Sortable.resolveSortByFieldName(this.props.sortBy, this.props.environment)
			const entities = this.props.entities.entities.filter(
				(item): item is EntityAccessor => item instanceof EntityAccessor
			)

			this.entities = entities.sort((a, b) => {
				const [aField, bField] = [a.data.getField(fieldName), b.data.getField(fieldName)]

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

			return (
				<SortableList
					entities={this.entities}
					onSortEnd={this.getOnSortEnd(this.props.environment)}
					useDragHandle={true}
					lockAxis="y"
					lockToContainerEdges={true}
					addNew={this.props.entities.addNew}
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
			this.updateUnpersistedEntities()
		}
	}
}

export { Sortable }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Sortable, SyntheticChildrenProvider<SortableProps>>
