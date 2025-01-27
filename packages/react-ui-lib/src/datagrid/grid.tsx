import { Component } from '@contember/interface'
import { DataView, DataViewProps } from '@contember/react-dataview'
import { ReactNode } from 'react'
import { DataGridLoader } from './loader'
import { DataGridPagination } from './pagination'
import { DataGridTable } from './table'
import { DataGridToolbar } from './toolbar'

/**
 * Props for {@link DataGrid}.
 */
export type DataGridProps =
	& Omit<DataViewProps, 'children'>
	& {
		children: ReactNode
	}

const dataGridDefaultStorages: Partial<DataGridProps> = {
	filteringStateStorage: 'session',
	sortingStateStorage: 'session',
	currentPageStateStorage: 'session',
	selectionStateStorage: 'local',
	pagingSettingsStorage: 'local',
}

/**
 * Base DataGrid component. The UI is up to you.
 *
 * ## Props {@link DataGridProps}
 * Primary: children, entities
 * Optional: queryField, filterTypes, dataViewKey, onSelectHighlighted
 * Initial values:  initialFilters, initialSorting, initialSelection, initialItemsPerPage
 * Storage settings: filteringStateStorage, sortingStateStorage, currentPageStateStorage, selectionStateStorage, pagingSettingsStorage
 *
 * ## Example
 * ```tsx
 * <DataGrid
 *     entities="GridArticle"
 *     initialSorting={{
 *         publishedAt: 'asc',
 *     }}
 * >
 *     <DataGridToolbar>
 *         <DataGridQueryFilter />
 *         <DataGridEnumFilter field={'state'} />
 *          <DataGridHasOneFilter field={'author'} label="Author">
 *             <Field field="name" />
 *         </DataGridHasOneFilter>
 *     </DataGridToolbar>
 *     <DataGridLoader>
 *         <DataGridTable>
 *             <DataGridActionColumn><Button>Show detail</Button></DataGridActionColumn>
 *             <DataGridTextColumn header="Title" field="title" />
 *             <DataGridEnumColumn field="state" />
 *             <DataGridDateColumn header="Published at" field="publishedAt" />
 *             <DataGridHasOneColumn header="Author" field="author">
 *                 <Field field="name" />
 *             </DataGridHasOneColumn>
 *         </DataGridTable>
 *         <DataGridTiles>
 *             <MyCustomTile />
 *         </DataGridTiles>
 *         <DataViewLayout name="rows" label='Rows'>
 *             <DataViewEachRow>
 *                 <MyCustomRow />
 *             </DataViewEachRow>
 *         </DataViewLayout>
 *     </DataGridLoader>
 *     <DataGridPagination />
 * </DataGrid>
 * ```
 */
export const DataGrid = Component(({ children, ...props }: DataGridProps) => {
	return (
		<DataView
			{...dataGridDefaultStorages}
			{...props}
		>
			<div>
				{children}
			</div>
		</DataView>
	)
})

/**
 * Props for {@link DefaultDataGrid}.
 */
export type DefaultDataGridProps =
	& Omit<DataViewProps, 'children'>
	& {
		children: ReactNode
		toolbar?: ReactNode
	}

/**
 * Default DataGrid with toolbar, loader, table and pagination.
 *
 * ## Example
 * ```tsx
 * <DefaultDataGrid entities="GridArticle">
 *     <DataGridActionColumn><Button>Show detail</Button></DataGridActionColumn>
 *     <DataGridTextColumn header="Title" field="title" />
 *     <DataGridEnumColumn header="State" field="state" options={GridArticleStateLabels} />
 * </DefaultDataGrid>
 * ```
 */
export const DefaultDataGrid = Component(({ children, toolbar, ...props }: DefaultDataGridProps) => {
	return (
		<DataGrid {...props}>
			<DataGridToolbar sticky>
				{toolbar}
			</DataGridToolbar>

			<DataGridLoader>
				<DataGridTable>
					{children}
				</DataGridTable>
			</DataGridLoader>

			<DataGridPagination sticky />
		</DataGrid>
	)
})
