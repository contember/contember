import {
	Component,
	Entity,
	EntityAccessor,
	EntityListAccessor,
	RemovalType,
	StaticRenderProvider,
	StaticRenderProviderProps,
	SugaredField,
	SugaredFieldProps,
	useMutationState,
	useSortedEntities,
} from '@contember/binding'
import { RepeaterItemContainerProps } from '@contember/ui'
import { ComponentType, Fragment, ReactElement, ReactNode, useCallback } from 'react'
import type { SortEndHandler } from 'react-sortable-hoc'
import { useMessageFormatter } from '../../../../i18n'
import { shouldCancelStart } from '../../helpers/shouldCancelStart'
import { CreateNewEntityButton, CreateNewEntityButtonProps } from '../helpers'
import {
	RepeaterCreateNewEntity,
	RepeaterFieldContainer,
	RepeaterFieldContainerProps,
	RepeaterFieldContainerPublicProps,
} from './RepeaterFieldContainer'
import { RepeaterItem, RepeaterItemProps } from './RepeaterItem'
import { SortableRepeaterContainer } from './SortableRepeaterContainer'
import { SortableRepeaterItem } from './SortableRepeaterItem'
import { SortableRepeaterItemHandle } from './SortableRepeaterItemHandle'
import { repeaterDictionary } from './repeaterDictionary'

// TODO alt content for collapsing
export interface RepeaterInnerProps<ContainerExtraProps, ItemExtraProps>
	extends RepeaterFieldContainerPublicProps {
	accessor: EntityListAccessor
	/**
	 * @deprecated Use label instead
	 */
	boxLabel?: ReactNode
	label: ReactNode
	children?: ReactNode

	sortableBy?: SugaredFieldProps['field']

	enableAdding?: boolean
	enableRemoving?: boolean
	removalType?: RemovalType

	containerComponent?: ComponentType<RepeaterFieldContainerProps & ContainerExtraProps>
	containerComponentExtraProps?: ContainerExtraProps

	itemComponent?: ComponentType<RepeaterItemProps & ItemExtraProps>
	itemComponentExtraProps?: ItemExtraProps

	unstable__sortAxis?: 'x' | 'y' | 'xy'
	useDragHandle?: boolean
	dragHandleComponent?: RepeaterItemContainerProps['dragHandleComponent']
}

type NonStaticPropNames = 'accessor'

export const RepeaterInner = Component<RepeaterInnerProps<any, any>, NonStaticPropNames>(
	<ContainerExtraProps, ItemExtraProps>(props: RepeaterInnerProps<ContainerExtraProps, ItemExtraProps>) => {
		const isMutating = useMutationState()
		const { entities, moveEntity, addNewAtIndex } = useSortedEntities(props.accessor, props.sortableBy)

		const createNewEntity = useCallback<RepeaterCreateNewEntity>((initialize?: EntityAccessor.BatchUpdatesHandler, index?: number) => {
			addNewAtIndex(index, initialize)
		}, [addNewAtIndex])

		const onSortEnd = useCallback<SortEndHandler>(
			({ oldIndex, newIndex }) => {
				moveEntity(oldIndex, newIndex)
			},
			[moveEntity],
		)
		const formatMessage = useMessageFormatter(repeaterDictionary)

		const AddButton: ComponentType<CreateNewEntityButtonProps> = props.addButtonComponent || CreateNewEntityButton
		const Handle: ComponentType<{ children: ReactNode }> = props.dragHandleComponent || Fragment
		const Item: ComponentType<RepeaterItemProps & ItemExtraProps> = props.itemComponent || RepeaterItem
		const Container: ComponentType<RepeaterFieldContainerProps & ContainerExtraProps> =
			props.containerComponent || RepeaterFieldContainer

		const isEmpty = entities.length === 0
		const itemRemovingEnabled = props.enableRemoving !== false
		const itemAddingEnabled = props.enableAdding === true && !!props.sortableBy

		const sortableHandle = useCallback<ComponentType<{ children: ReactNode }>>(
			({ children }) => (
				<SortableRepeaterItemHandle>
					<Handle>{children}</Handle>
				</SortableRepeaterItemHandle>
			),
			[Handle],
		)

		const removalType: RemovalType = props.removalType ?? 'delete'
		const label = props.label ?? props.boxLabel

		if (props.sortableBy === undefined) {
			return (
				<Container
					{...props.containerComponentExtraProps!}
					{...props}
					removalType={removalType}
					isEmpty={isEmpty}
					createNewEntity={createNewEntity}
					entities={entities}
					formatMessage={formatMessage}
				>
					{entities.map((entity, i) => (
						<Entity accessor={entity} key={entity.key}>
							<Item
								{...props.itemComponentExtraProps!}
								label={label}
								index={i}
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
				helperClass="is-dragged"
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
					createNewEntity={createNewEntity}
					entities={entities}
					formatMessage={formatMessage}
				>
					{entities.map((entity, i) => (
						<Fragment key={entity.key}>
							{itemAddingEnabled && <AddButton {...props.addButtonComponentExtraProps} createNewEntity={() => createNewEntity(undefined, i)} />}
							<SortableRepeaterItem index={i} disabled={isMutating}>
								<Entity accessor={entity}>
									<Item
										{...props.itemComponentExtraProps!}
										label={label}
										index={i}
										createNewEntity={createNewEntity}
										removalType={removalType}
										canBeRemoved={itemRemovingEnabled}
										dragHandleComponent={useDragHandle ? sortableHandle : undefined}
									>
										{props.children}
									</Item>
								</Entity>
							</SortableRepeaterItem>
						</Fragment>
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
) as any as (<ContainerExtraProps, ItemExtraProps>(
	props: RepeaterInnerProps<ContainerExtraProps, ItemExtraProps>,
) => ReactElement) &
	StaticRenderProvider<RepeaterInnerProps<unknown, unknown>, NonStaticPropNames>
