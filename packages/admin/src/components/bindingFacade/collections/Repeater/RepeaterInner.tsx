import {
	Component,
	Entity,
	EntityListAccessor,
	SugaredField,
	SugaredFieldProps,
	useMutationState,
	useSortedEntities,
} from '@contember/binding'
import * as React from 'react'
import { Axis, SortEndHandler } from 'react-sortable-hoc'
import { RepeaterContainer, RepeaterContainerProps, RepeaterContainerPublicProps } from './RepeaterContainer'
import { RepeaterItem, RepeaterItemProps } from './RepeaterItem'
import { shouldCancelStart } from './shouldCancelStart'
import { SortableRepeaterContainer } from './SortableRepeaterContainer'
import { SortableRepeaterItem } from './SortableRepeaterItem'
import { SortableRepeaterItemHandle } from './SortableRepeaterItemHandle'

// TODO alt content for collapsing
export interface RepeaterInnerProps<ContainerExtraProps, ItemExtraProps>
	extends RepeaterContainerPublicProps,
		Omit<RepeaterItemProps, 'children' | 'canBeRemoved' | 'label'> {
	entityList: EntityListAccessor
	label: React.ReactNode
	initialRowCount?: number
	children: React.ReactNode

	sortableBy?: SugaredFieldProps['field']

	enableRemoving?: boolean
	enableRemovingLast?: boolean

	containerComponent?: React.ComponentType<RepeaterContainerProps & ContainerExtraProps>
	containerComponentExtraProps?: ContainerExtraProps

	itemComponent?: React.ComponentType<RepeaterItemProps & ItemExtraProps>
	itemComponentExtraProps?: ItemExtraProps

	unstable__sortAxis?: Axis
	useDragHandle?: boolean
}

export const RepeaterInner = Component(
	<ContainerExtraProps, ItemExtraProps>(props: RepeaterInnerProps<ContainerExtraProps, ItemExtraProps>) => {
		const isMutating = useMutationState()
		const { entities, moveEntity, appendNew } = useSortedEntities(props.entityList, props.sortableBy)
		const onSortEnd = React.useCallback<SortEndHandler>(
			({ oldIndex, newIndex }) => {
				moveEntity(oldIndex, newIndex)
			},
			[moveEntity],
		)

		const Handle: React.ComponentType<{ children: React.ReactNode }> = props.dragHandleComponent || React.Fragment
		const Item: React.ComponentType<RepeaterItemProps & ItemExtraProps> = props.itemComponent || RepeaterItem
		const Container: React.ComponentType<RepeaterContainerProps & ContainerExtraProps> =
			props.containerComponent || RepeaterContainer

		const isEmpty = entities.length === 0
		const itemRemovingEnabled = props.enableRemoving !== false && (entities.length > 1 || !!props.enableRemovingLast)

		const sortableHandle = React.useCallback(
			({ children }) => (
				<SortableRepeaterItemHandle>
					<Handle>{children}</Handle>
				</SortableRepeaterItemHandle>
			),
			[],
		)

		if (props.sortableBy === undefined) {
			return (
				<Container
					{...props.containerComponentExtraProps!}
					{...props}
					isEmpty={isEmpty}
					addNew={appendNew}
					entities={entities}
				>
					{entities.map(entity => (
						<Entity accessor={entity} key={entity.key}>
							<Item
								{...props.itemComponentExtraProps!}
								removalType={props.removalType}
								canBeRemoved={itemRemovingEnabled}
								dragHandleComponent={undefined}
							>
								{props.children}
							</Item>
						</Entity>
					))}
				</Container>
			)
		}

		const axis = props.unstable__sortAxis || 'y'
		const useDragHandle = props.useDragHandle ?? true

		return (
			<SortableRepeaterContainer
				axis={axis}
				lockAxis={axis}
				helperClass="is-active"
				lockToContainerEdges={true}
				useWindowAsScrollContainer={true}
				useDragHandle={useDragHandle}
				onSortEnd={onSortEnd}
				shouldCancelStart={shouldCancelStart}
			>
				<Container
					{...props.containerComponentExtraProps!}
					{...props}
					isEmpty={isEmpty}
					addNew={appendNew}
					entities={entities}
				>
					{entities.map((entity, i) => (
						<SortableRepeaterItem index={i} key={entity.key} disabled={isMutating}>
							<Entity accessor={entity}>
								<Item
									{...props.itemComponentExtraProps!}
									removalType={props.removalType}
									canBeRemoved={itemRemovingEnabled}
									dragHandleComponent={useDragHandle ? sortableHandle : undefined}
								>
									{props.children}
								</Item>
							</Entity>
						</SortableRepeaterItem>
					))}
				</Container>
			</SortableRepeaterContainer>
		)
	},
	(
		props, // TODO emptyMessage, etc.
	) => (
		<>
			{props.sortableBy && <SugaredField field={props.sortableBy} isNonbearing={true} />}
			{props.children}
		</>
	),
	'RepeaterInner',
) as <ContainerExtraProps, ItemExtraProps>(
	props: RepeaterInnerProps<ContainerExtraProps, ItemExtraProps>,
) => React.ReactElement
