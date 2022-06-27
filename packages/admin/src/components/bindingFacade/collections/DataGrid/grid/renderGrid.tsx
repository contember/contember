import { EntityListSubTree, Environment, TreeRootId } from '@contember/binding'
import { ComponentType, Fragment, ReactElement } from 'react'
import {
	DataGridContainer,
	DataGridContainerProps,
	DataGridContainerPublicProps,
	DataGridState,
	DataGridStateMethods,
} from '../base'


export const renderGrid = <ComponentExtraProps extends {}>(
	{ setIsColumnHidden, setFilter, setOrderBy, updatePaging, setLayout }: DataGridStateMethods,
	treeRootId: TreeRootId | undefined,
	displayedState: DataGridState,
	desiredState: DataGridState,
	environment: Environment,
	containerProps: DataGridContainerPublicProps = {},
	component?: ComponentType<DataGridContainerProps & ComponentExtraProps>,
	componentProps ? : ComponentExtraProps,
): ReactElement => {
	const {
		entities,
		paging: { pageIndex, itemsPerPage },
		hiddenColumns,
		filter,
		columns,
		orderBy,
	} = displayedState

	return (
		<EntityListSubTree
			entities={{
				...entities,
				filter,
			}}
			treeRootId={treeRootId}
			offset={itemsPerPage === null ? undefined : itemsPerPage * pageIndex}
			limit={itemsPerPage === null ? undefined : itemsPerPage}
			orderBy={orderBy}
			listComponent={(component as typeof DataGridContainer) ?? DataGridContainer}
			listProps={{
				desiredState,
				displayedState,
				entityName: entities.entityName,
				filter,
				onEntityClick: containerProps.onEntityClick,
				selectedEntityKeys: containerProps.selectedEntityIds,
				tile: containerProps.tile,
				tileSize: containerProps.tileSize,
				setIsColumnHidden,
				setFilter,
				setOrderBy,
				setLayout,
				updatePaging,
				emptyMessageComponentExtraProps: containerProps.emptyMessageComponentExtraProps,
				emptyMessageComponent: containerProps.emptyMessageComponent,
				emptyMessage: containerProps.emptyMessage,
				...componentProps,
			}}
		>
			{containerProps.tile}
			{Array.from(columns)
				.filter(([key]) => !hiddenColumns[key])
				.map(([key, props]) => (
					<Fragment key={key}>
						{props.header}
						{props.children}
					</Fragment>
				))}
		</EntityListSubTree>
	)
}
