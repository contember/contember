import { createCoalesceFilter, DataView, DataViewEachRow, DataViewEmpty, DataViewFilterHandler, DataViewHasSelection, DataViewLoaderState, DataViewNonEmpty, DataViewProps } from '@contember/react-dataview'
import { SettingsIcon } from 'lucide-react'
import * as React from 'react'
import { Fragment, ReactNode, useMemo } from 'react'
import { Button } from '../ui/button'
import { DataGridNoResults } from './empty'
import { DataGridLayoutSwitcher } from './layout-switcher'
import { DataGridInitialLoader, DataGridOverlayLoader } from './loader'
import { DataGridPagination, DataGridPerPageSelector } from './pagination'
import { DataGridTable, DataGridTableColumn } from './table'
import { DataGridTextFilter } from './filters'
import { DataGridToolbarUI } from './ui'
import { DataGridAutoExport } from './export'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { DataGridToolbarColumns } from './columns-hiding'

export type DataGridColumn =
	& DataGridTableColumn
	& {
		type: 'text' | 'hasOne' | 'hasMany' | 'boolean' | 'number' | 'enum' | 'date'
		field: string
		filterName?: string
		filterHandler?: DataViewFilterHandler<any>
		filterToolbar?: ReactNode
	}

export type DataGridProps =
	& Omit<DataViewProps, 'children' | 'filterTypes'>
	& {
		searchFields?: string[]
		columns: DataGridColumn[]
		tile?: ReactNode
		firstColumnActions?: ReactNode
		lastColumnActions?: ReactNode
		toolbarButtons?: ReactNode
	}

const DataGridToolbarFilters = ({ columns }: { columns: DataGridColumn[] }) => {
	return <>
		{columns
			.filter(it => it.filterToolbar && it.filterName)
			.map(column => <Fragment key={column.filterName}>{column.filterToolbar}</Fragment>)
		}
	</>
}

export const DataGrid = ({ columns, tile, lastColumnActions, firstColumnActions, searchFields, toolbarButtons, ...props }: DataGridProps) => {
	const filterTypes = useMemo(() => {
		const columnFilters = Object.fromEntries(
			columns
				.filter(it => it.filterHandler)
				.map(it => [it.filterName, it.filterHandler]),
		) as Record<string, DataViewFilterHandler<any>>

		const searchFieldsResolved = searchFields ?? columns.filter(it => it.type === 'text').map(it => it.field)
		if (searchFieldsResolved.length > 0) {
			columnFilters['__search'] = createCoalesceFilter(searchFieldsResolved)
		}

		return columnFilters
	}, [columns, searchFields])

	return (
		<DataView
			filterTypes={filterTypes}
			initialSelection={{
				layout: tile ? 'grid' : 'table',
				...props.initialSelection,
			}}
			{...props}
		>
			<DataGridToolbarUI>
				{filterTypes.__search && <DataGridTextFilter name={'__search'} />}
				<DataGridToolbarFilters columns={columns} />
				<div className="ml-auto flex gap-2 items-center">
					<Popover>
						<PopoverTrigger>
							<Button variant={'outline'} size={'sm'} className={'gap-2'}>
								<SettingsIcon className={'w-4 h-4'} />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-64">
							<div className="flex flex-col gap-2">
								{tile && <DataGridLayoutSwitcher />}
								<DataGridToolbarColumns columns={columns} />
								<DataGridPerPageSelector />
							</div>

						</PopoverContent>
					</Popover>
					<DataGridAutoExport columns={columns} />
					{toolbarButtons}
				</div>
			</DataGridToolbarUI>

			<DataGridLoader>

				<DataViewHasSelection name={'layout'} value={'table'}>
					<DataGridTable
						columns={columns}
						firstColumnActions={firstColumnActions}
						lastColumnActions={lastColumnActions}
					/>
				</DataViewHasSelection>

				<DataViewHasSelection name={'layout'} value={'grid'}>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<DataViewEachRow>
							{tile}
						</DataViewEachRow>
					</div>
				</DataViewHasSelection>

			</DataGridLoader>

			<DataGridPagination />
		</DataView>
	)
}


export interface DataViewBodyProps {
	children: ReactNode
}

export const DataGridLoader = ({ children }: DataViewBodyProps) => (
	<>
		<DataViewLoaderState refreshing loaded>
			<div className="relative">
				<DataViewLoaderState refreshing>
					<DataGridOverlayLoader />
				</DataViewLoaderState>

				<DataViewNonEmpty>
					{children}
				</DataViewNonEmpty>

				<DataViewEmpty>
					<DataGridNoResults />
				</DataViewEmpty>
			</div>
		</DataViewLoaderState>
		<DataViewLoaderState initial>
			<DataGridInitialLoader />
		</DataViewLoaderState>
	</>
)


