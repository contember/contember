import { Message } from '@contember/ui'
import cn from 'classnames'
import * as React from 'react'
import {
	SortableContainer,
	SortableContainerProps,
	SortableElement,
	SortableElementProps,
	SortableHandle,
} from 'react-sortable-hoc'
import {
	EnforceSubtypeRelation,
	EntityAccessor,
	EntityListAccessor,
	Environment,
	EnvironmentContext,
	Field,
	SugaredRelativeSingleField,
	SyntheticChildrenProvider,
	useMutationState,
	useSortedEntities,
} from '../../../binding'
import { DragHandle as DragHandleIcon } from '../../ui'
import { Repeater } from './Repeater'
import EntityListPublicProps = Repeater.EntityListPublicProps

export interface SortablePublicProps extends EntityListPublicProps {
	sortBy: SugaredRelativeSingleField['field']
	enablePrepending?: boolean
}

export interface SortableInternalProps {
	entities?: EntityListAccessor
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
								emptyMessage={this.props.emptyMessage}
								environment={environment}
							>
								{this.props.children}
							</Sortable.SortableInner>
						)
					}
					return null
				}}
			</EnvironmentContext.Consumer>
		)
	}

	public static generateSyntheticChildren(props: SortableProps, environment: Environment): React.ReactNode {
		return (
			<>
				<Field field={props.sortBy} isNonbearing={true} />
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
		SortableHandle((props: DragHandleProps) => (
			<div className={cn('sortable-item-handle', props.isMutating && 'sortable-item-handle-disabled')}>
				<DragHandleIcon />
			</div>
		)),
	)
	DragHandle.displayName = 'Sortable.DragHandle'

	export interface SortableItemProps extends Repeater.ItemProps, DragHandleProps {}

	export const SortableItem = React.memo(
		SortableElement((props: SortableItemProps & SortableElementProps) => (
			<li className="sortable-item">
				<DragHandle isMutating={props.isMutating} />
				<div className="sortable-item-content">
					<Repeater.Item {...props}>{props.children}</Repeater.Item>
				</div>
			</li>
		)),
	)
	SortableItem.displayName = 'Sortable.SortableItem'

	export interface SortableListProps extends EntityListPublicProps {
		entities: EntityAccessor[]
		prependNew?: () => void
		appendNew?: () => void
	}

	export const SortableList = React.memo(
		SortableContainer((props: SortableListProps & SortableContainerProps) => {
			const isMutating = useMutationState()
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
		}),
	)
	SortableList.displayName = 'Sortable.SortableList'

	export interface SortableInnerProps extends SortablePublicProps {
		entities: EntityListAccessor
		environment: Environment
	}

	export const SortableInner = React.memo((props: SortableInnerProps) => {
		const { entities, moveEntity, addNewAtIndex, appendNew, prependNew } = useSortedEntities(
			props.entities,
			props.sortBy,
		)
		const onSortEnd = React.useCallback(
			({ oldIndex, newIndex }) => {
				moveEntity(oldIndex, newIndex)
			},
			[moveEntity],
		)

		if (!entities.length) {
			return (
				<Message flow="generousBlock">
					{props.emptyMessage || 'There is no content yet. Try adding a new item.'}
				</Message>
			)
		}

		return (
			<SortableList
				entities={entities}
				onSortEnd={onSortEnd}
				useDragHandle={true}
				shouldCancelStart={() => false}
				lockAxis="y"
				lockToContainerEdges={true}
				prependNew={props.enablePrepending ? prependNew : undefined}
				appendNew={appendNew}
				enableUnlinkAll={props.enableUnlinkAll}
				enableAddingNew={props.enableAddingNew}
				enableUnlink={props.enableUnlink}
				label={props.label}
				removeType={props.removeType}
			>
				{props.children}
			</SortableList>
		)
	})
	SortableInner.displayName = 'Sortable.SortableInner'
}

export { Sortable }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Sortable, SyntheticChildrenProvider<SortableProps>>
