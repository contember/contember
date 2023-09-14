import { Component, EntityListSubTree } from '@contember/react-binding'
import { ComponentType, Fragment, ReactNode } from 'react'
import {
	DataGridColumnProps,
	DataGridFilterArtifact,
	DataGridRendererInnerProps,
	DataGridRendererProps,
} from '../types'

export const createDataGridRenderer = <ColumnProps extends {}, ContainerProps extends {}>({ Fallback, Container, StaticRender, ColumnStaticRender }: {
	Fallback: ComponentType<{ children: ReactNode }>
	Container: ComponentType<DataGridRendererInnerProps<ColumnProps> & ContainerProps>
	StaticRender?: ComponentType<DataGridRendererInnerProps<ColumnProps> & ContainerProps>
	ColumnStaticRender?: ComponentType<{ column: DataGridColumnProps<DataGridFilterArtifact, ColumnProps> }>
}) => Component<DataGridRendererProps<ColumnProps> & ContainerProps>(({ treeRootId, ...props }) => {
	const displayedState = props.displayedState
	return (
		<Fallback>
			{displayedState && <EntityListSubTree
				entities={{
					...displayedState.entities,
					filter: displayedState.filter,
				}}
				treeRootId={treeRootId}
				offset={displayedState.paging.itemsPerPage === null ? undefined : displayedState.paging.itemsPerPage * displayedState.paging.pageIndex}
				limit={displayedState.paging.itemsPerPage === null ? undefined : displayedState.paging.itemsPerPage}
				orderBy={displayedState.orderBy}
				listComponent={Container as any}
				listProps={props}
			>
				{StaticRender && <StaticRender {...props as any} />}
				{Array.from(displayedState.columns)
					.filter(([key]) => !displayedState.hiddenColumns[key])
					.map(([key, props]) => (
						<Fragment key={key}>
							{ColumnStaticRender && <ColumnStaticRender column={props} />}
							{props.children}
						</Fragment>
					))}
			</EntityListSubTree>}
		</Fallback>
	)
})
