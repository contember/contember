import {
	createCoalesceFilter,
	DataView,
	DataViewEachRow,
	DataViewEmpty,
	DataViewFilterHandler,
	DataViewHasFilterType,
	DataViewHasSelection,
	DataViewLoaderState,
	DataViewNonEmpty,
	DataViewProps,
	DataViewSelectionTrigger,
} from '@contember/react-dataview'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import * as React from 'react'
import { Fragment, ReactNode, useMemo } from 'react'
import { dict } from '../../dict'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown'
import { DataGridNoResults } from './empty'
import { DataGridLayoutSwitcher } from './layout-switcher'
import { DataGridInitialLoader, DataGridOverlayLoader } from './loader'
import { DataGridPagination } from './pagination'
import { DataGridTable, DataGridTableColumn } from './table'
import { DataGridTextFilter } from './filters'
import { DataGridToolbarUI } from './ui'
import { DataGridAutoExport } from './export'

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

const DataGridToolbarColumns = ({ columns }: { columns: DataGridColumn[] }) => {
	return <DropdownMenu>
		<DropdownMenuTrigger asChild>
			<Button variant={'outline'} size={'sm'} className={'gap-2'}>
				<EyeIcon className={'w-4 h-4'} />
				<span className={'sr-only'}>{dict.datagrid.columns}</span>
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent className="w-[160px]">
			{columns.map(column => (
				column.hidingName && <DataViewSelectionTrigger key={column.hidingName} name={column.hidingName} value={it => !it}>
					<DropdownMenuItem onSelect={e => e.preventDefault()}
									  className={'gap-1 group text-gray-500 data-[current]:text-black'}>
						<EyeIcon className={'w-3 h-3 hidden group-data-[current]:block'} />
						<EyeOffIcon className={'w-3 h-3 block group-data-[current]:hidden'} />
						<span>{column.header}</span>
					</DropdownMenuItem>
				</DataViewSelectionTrigger>
			))}
		</DropdownMenuContent>
	</DropdownMenu>
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
				<div className="ml-auto flex gap-2">
					{tile && <DataGridLayoutSwitcher />}
					<DataGridToolbarColumns columns={columns} />
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


