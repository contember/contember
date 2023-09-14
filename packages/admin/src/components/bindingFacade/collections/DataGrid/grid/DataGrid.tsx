import { Component, QueryLanguage, SugaredQualifiedEntityList } from '@contember/react-binding'
import { ComponentType, ReactElement, ReactNode } from 'react'
import { DataGridContainerProps, DataGridContainerPublicProps, DataGridState, DATA_GRID_DEFAULT_ITEMS_PER_PAGE, useDataGrid } from '../base'
import { extractDataGridColumns } from '../structure'
import { ControlledDataGrid } from './ControlledDataGrid'
import { renderGrid } from './renderGrid'

export type DataGridProps<ComponentExtraProps extends {}> =
	& DataGridContainerPublicProps
	& {
		dataGridKey?: string

		entities: SugaredQualifiedEntityList['entities']
		children: ReactNode
		itemsPerPage?: number | null
	}
	& (
		| {}
		| {
			component: ComponentType<DataGridContainerProps & ComponentExtraProps>
			componentProps: ComponentExtraProps
		}
	)

/**
 * Main DataGrid component. Requires cells as a children.
 *
 * @example
 * ```
 * <DataGrid
 *   entities="Article"
 *   itemsPerPage={50}
 * >
 *   <TextCell header="Title" field="title" />
 *   <TextCell header="Author" field="author.name" />
 * </DataGrid>
 * ```
 *
 * @group Data grid
 */
export const DataGrid = Component(
	<ComponentProps extends {}>(props: DataGridProps<ComponentProps>) => {
		return <ControlledDataGrid {...useDataGrid(props)} />
	},
	(props, environment) => {
		const columns = extractDataGridColumns(props.children)
		const fakeState: DataGridState = {
			columns,
			paging: {
				itemsPerPage: props.itemsPerPage ?? DATA_GRID_DEFAULT_ITEMS_PER_PAGE,
				pageIndex: 0,
			},
			hiddenColumns: {},
			filterArtifacts: {},
			orderDirections: {},
			orderBy: [],
			entities: QueryLanguage.desugarQualifiedEntityList({ entities: props.entities }, environment),
			filter: { and: [{}] },
			layout: 'default',
		}

		return renderGrid(
			{ setFilter: () => null, setIsColumnHidden: () => null, setOrderBy: () => null, updatePaging: () => null, setLayout: () => null },
			undefined,
			fakeState,
			fakeState,
			environment,
			{
				tile: props.tile,
			},
			'component' in props ? props.component : undefined,
			'componentProps' in props ? props.componentProps : undefined,
		)
	},
	'DataGrid',
) as <ComponentProps extends {}>(props: DataGridProps<ComponentProps>) => ReactElement
