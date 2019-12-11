import * as React from 'react'
import { SortEndHandler } from 'react-sortable-hoc'
import {
	Entity,
	EntityListAccessor,
	SugaredRelativeSingleField,
	useMutationState,
	useSortedEntities,
} from '../../../../binding'
import { RepeaterContainer, RepeaterContainerProps } from './RepeaterContainer'
import { RepeaterItem, RepeaterItemProps } from './RepeaterItem'
import { SortableRepeaterContainer } from './SortableRepeaterContainer'
import { SortableRepeaterItem } from './SortableRepeaterItem'

// TODO alt content for collapsing
export interface RepeaterInnerProps
	extends Omit<RepeaterContainerProps, 'children' | 'entities' | 'addNew' | 'isEmpty'>,
		Omit<RepeaterItemProps, 'children' | 'canBeRemoved'> {
	entityList: EntityListAccessor
	children: React.ReactNode

	sortableBy?: SugaredRelativeSingleField['field']

	enableRemovingLast?: boolean

	containerComponent?: React.ComponentType<RepeaterContainerProps>
	itemComponent?: React.ComponentType<RepeaterItemProps>
}

export const RepeaterInner = React.memo((props: RepeaterInnerProps) => {
	const isMutating = useMutationState()
	const { entities, moveEntity, appendNew } = useSortedEntities(props.entityList, props.sortableBy)
	const onSortEnd = React.useCallback<SortEndHandler>(
		({ oldIndex, newIndex }) => {
			moveEntity(oldIndex, newIndex)
		},
		[moveEntity],
	)

	const Item: React.ComponentType<RepeaterItemProps> = props.itemComponent || RepeaterItem
	const Container: React.ComponentType<RepeaterContainerProps> = props.containerComponent || RepeaterContainer

	const isEmpty = entities.length === 0
	const itemRemovingEnabled = entities.length > 1 || !!props.enableRemovingLast

	if (props.sortableBy === undefined) {
		return (
			<Container {...props} isEmpty={isEmpty} addNew={appendNew}>
				{entities.map(entity => (
					<Entity accessor={entity} key={entity.getKey()}>
						<Item removalType={props.removalType} canBeRemoved={itemRemovingEnabled}>
							{props.children}
						</Item>
					</Entity>
				))}
			</Container>
		)
	}

	return (
		<SortableRepeaterContainer lockAxis="y" lockToContainerEdges={true} onSortEnd={onSortEnd}>
			<Container {...props} isEmpty={isEmpty} addNew={appendNew}>
				{entities.map((entity, i) => (
					<SortableRepeaterItem index={i} key={entity.getKey()} disabled={isMutating}>
						<Entity accessor={entity}>
							<Item removalType={props.removalType} canBeRemoved={itemRemovingEnabled}>
								{props.children}
							</Item>
						</Entity>
					</SortableRepeaterItem>
				))}
			</Container>
		</SortableRepeaterContainer>
	)
})
RepeaterInner.displayName = 'RepeaterInner'
