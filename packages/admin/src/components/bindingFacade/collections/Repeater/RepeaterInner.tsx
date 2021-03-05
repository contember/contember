import {
	Component,
	Entity,
	EntityListAccessor,
	RemovalType,
	StaticRenderProvider,
	StaticRenderProviderProps,
	SugaredField,
	SugaredFieldProps,
	useMutationState,
	useSortedEntities,
} from '@contember/binding'
import { ComponentType, Fragment, ReactElement, ReactNode, useCallback } from 'react'
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
	accessor: EntityListAccessor
	label: ReactNode
	children?: ReactNode

	sortableBy?: SugaredFieldProps['field']

	enableRemoving?: boolean

	containerComponent?: ComponentType<RepeaterContainerProps & ContainerExtraProps>
	containerComponentExtraProps?: ContainerExtraProps

	itemComponent?: ComponentType<RepeaterItemProps & ItemExtraProps>
	itemComponentExtraProps?: ItemExtraProps

	unstable__sortAxis?: Axis
	useDragHandle?: boolean
}

type NonStaticPropNames = 'accessor'

export const RepeaterInner = Component<RepeaterInnerProps<any, any>, NonStaticPropNames>(
	<ContainerExtraProps, ItemExtraProps>(props: RepeaterInnerProps<ContainerExtraProps, ItemExtraProps>) => {
		const isMutating = useMutationState()
		const { entities, moveEntity, appendNew } = useSortedEntities(props.accessor, props.sortableBy)
		const onSortEnd = useCallback<SortEndHandler>(
			({ oldIndex, newIndex }) => {
				moveEntity(oldIndex, newIndex)
			},
			[moveEntity],
		)

		const Handle: ComponentType<{ children: ReactNode }> = props.dragHandleComponent || Fragment
		const Item: ComponentType<RepeaterItemProps & ItemExtraProps> = props.itemComponent || RepeaterItem
		const Container: ComponentType<RepeaterContainerProps & ContainerExtraProps> =
			props.containerComponent || RepeaterContainer

		const isEmpty = entities.length === 0
		const itemRemovingEnabled = props.enableRemoving !== false

		const sortableHandle = useCallback(
			({ children }) => (
				<SortableRepeaterItemHandle>
					<Handle>{children}</Handle>
				</SortableRepeaterItemHandle>
			),
			[Handle],
		)

		const removalType: RemovalType = props.removalType ?? 'delete'

		if (props.sortableBy === undefined) {
			return (
				<Container
					{...props.containerComponentExtraProps!}
					{...props}
					removalType={removalType}
					isEmpty={isEmpty}
					createNewEntity={appendNew}
					entities={entities}
				>
					{entities.map(entity => (
						<Entity accessor={entity} key={entity.key}>
							<Item
								{...props.itemComponentExtraProps!}
								removalType={removalType}
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
					removalType={removalType}
					isEmpty={isEmpty}
					createNewEntity={appendNew}
					entities={entities}
				>
					{entities.map((entity, i) => (
						<SortableRepeaterItem index={i} key={entity.key} disabled={isMutating}>
							<Entity accessor={entity}>
								<Item
									{...props.itemComponentExtraProps!}
									removalType={removalType}
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
	<ContainerExtraProps, ItemExtraProps>(
		props: StaticRenderProviderProps<RepeaterInnerProps<ContainerExtraProps, ItemExtraProps>, NonStaticPropNames>, // TODO emptyMessage, etc.
	) => (
		<>
			{props.sortableBy && <SugaredField field={props.sortableBy} defaultValue={0} isNonbearing />}
			{props.children}
		</>
	),
	'RepeaterInner',
) as (<ContainerExtraProps, ItemExtraProps>(
	props: RepeaterInnerProps<ContainerExtraProps, ItemExtraProps>,
) => ReactElement) &
	StaticRenderProvider<RepeaterInnerProps<unknown, unknown>, NonStaticPropNames>
