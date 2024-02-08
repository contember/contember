import {
	DataView,
	DataViewEachRow,
	DataViewEmpty,
	DataViewFilterHandler,
	DataViewHasSelection,
	DataViewLoaderState,
	DataViewNonEmpty,
	DataViewProps,
	DataViewSelectionTrigger,
} from '@contember/react-dataview'
import * as React from 'react'
import { Fragment, ReactNode, useMemo } from 'react'
import { DataViewInitialLoader, DataViewLoaderOverlay } from './loader'
import { DataViewNoResults } from './empty'
import { DataTablePagination } from './pagination'
import { DataViewLayoutSwitcher } from './layout-switcher'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown'
import { Button } from '../ui/button'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { DataViewTable, DataViewTableColumn } from './table'

export type DataViewColumn =
	& DataViewTableColumn
	& {
		filterName?: string
		filterHandler?: DataViewFilterHandler<any>
		filterToolbar?: ReactNode
	}

export type DefaultDataGridProps =
	& Omit<DataViewProps, 'children' | 'filterTypes'>
	& {
		columns: DataViewColumn[]
		tile?: ReactNode
		firstColumnActions?: ReactNode
		lastColumnActions?: ReactNode
	}

const DataGridToolbarFilters = ({ columns }: { columns: DataViewColumn[] }) => {
	return <>
		{columns
			.filter(it => it.filterToolbar && it.filterName)
			.map(column => <Fragment key={column.filterName}>{column.filterToolbar}</Fragment>)
		}
	</>
}

const DataGridToolbarColumns = ({ columns }: { columns: DataViewColumn[] }) => {
	return <DropdownMenu>
		<DropdownMenuTrigger asChild>
			<Button variant={'outline'} size={'sm'} className={'gap-2'}>
				<EyeIcon className={'w-4 h-4'} />
				<span className={'sr-only'}>Columns</span>
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

export const DefaultDataGrid = ({ columns, tile, lastColumnActions, firstColumnActions, ...props }: DefaultDataGridProps) => {
	const filterTypes = useMemo(() => {
		return Object.fromEntries(columns
			.filter(it => it.filterHandler)
			.map(it => [it.filterName, it.filterHandler]),
		) as Record<string, DataViewFilterHandler<any>>
	}, [columns])

	return (
		<DataView
			filterTypes={filterTypes}
			initialSelection={{
				layout: tile ? 'grid' : 'table',
				...props.initialSelection,
			}}
			{...props}
		>
			<DataViewBody toolbar={<>
				<DataGridToolbarFilters columns={columns} />
				{tile && <DataViewLayoutSwitcher />}
				<DataGridToolbarColumns columns={columns} />
			</>}>
				<DataViewHasSelection name={'layout'} value={'table'}>
					<DataViewTable
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

			</DataViewBody>
		</DataView>
	)
}


export interface DataViewBodyProps {
	toolbar: ReactNode
	children: ReactNode
}

export const DataViewBody = ({ children, toolbar }: DataViewBodyProps) => (
	<div className="space-y-4">
		<div className={'flex gap-2 items-stretch flex-wrap'}>
			{toolbar}
		</div>
		<DataViewLoaderState refreshing loaded>
			<div className="relative">
				<DataViewLoaderState refreshing>
					<DataViewLoaderOverlay />
				</DataViewLoaderState>

				<DataViewNonEmpty>
					{children}
				</DataViewNonEmpty>

				<DataViewEmpty>
					<DataViewNoResults />
				</DataViewEmpty>
			</div>
		</DataViewLoaderState>
		<DataViewLoaderState initial>
			<DataViewInitialLoader />
		</DataViewLoaderState>
		<DataTablePagination />
	</div>
)


