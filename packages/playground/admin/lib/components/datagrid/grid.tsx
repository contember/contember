import { DataView, DataViewEachRow, DataViewEmpty, DataViewFilterHandler, DataViewHasSelection, DataViewLoaderState, DataViewNonEmpty, DataViewProps, useDataViewFilteringState } from '@contember/react-dataview'
import { FilterIcon, SettingsIcon } from 'lucide-react'
import * as React from 'react'
import { Fragment, ReactNode, useMemo } from 'react'
import { Button } from '../ui/button'
import { DataGridNoResults } from './empty'
import { DataGridLayoutSwitcher } from './layout-switcher'
import { DataGridInitialLoader, DataGridOverlayLoader } from './loader'
import { DataGridPagination, DataGridPerPageSelector } from './pagination'
import { DataGridTable, DataGridTableColumn } from './table'
import { DataGridTextFilter, DataGridUnionTextFilter } from './filters'
import { DataGridToolbarUI } from './ui'
import { DataGridAutoExport } from './export'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { DataGridToolbarVisibleFields } from './columns-hiding'
import { Component } from '@contember/interface'
import { dataAttribute } from '@contember/utilities'
import { cn } from '../../utils/cn'

export type DataGridColumn =
	& DataGridTableColumn
	& {
		type: 'text' | 'hasOne' | 'hasMany' | 'boolean' | 'number' | 'enum' | 'date'
		field: string
		filterName?: string
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

const DataGridToolbarFilters = Component(({ columns, alwaysShow }: { columns: DataGridColumn[], alwaysShow: boolean }) => {
	return <>
		{columns
			.map(column => {
				if (!column.filterName || !column.filterToolbar) {
					return null
				}
				return (
					<DataGridFilterMobileHiding key={column.filterName} name={column.filterName} alwaysShow={alwaysShow}>
						{column.filterToolbar}
					</DataGridFilterMobileHiding>
				)
		})}
	</>
})

const DataGridFilterMobileHiding = ({ name, alwaysShow, children }: { name: string, alwaysShow: boolean, children: ReactNode }) => {
	const activeFilter = useDataViewFilteringState().artifact
	const isActive = !!activeFilter[name]
	return (
		<div key={name} className={alwaysShow || isActive ? 'contents' : 'hidden sm:contents'}>
			{children}
		</div>
	)
}

export const DataGrid = ({ columns, tile, lastColumnActions, firstColumnActions, searchFields, toolbarButtons, ...props }: DataGridProps) => {
	const searchFieldsResolved = useMemo(() => {
		return searchFields ?? columns.filter(it => it.type === 'text').map(it => it.field)
	}, [columns, searchFields])

	const [showFilters, setShowFilters] = React.useState(false)

	return (
		<DataView
			initialSelection={{
				layout: tile ? 'grid' : 'table',
				...props.initialSelection,
			}}
			{...props}
		>
			<DataGridToolbarUI>

				<div className="ml-auto flex gap-2 items-center sm:order-1">
					<Button
						variant={'outline'}
						size={'sm'}
						className={'gap-2 sm:hidden data-[active]:bg-gray-50 data-[active]:shadow-inner'}
						data-active={dataAttribute(showFilters)}
						onClick={() => setShowFilters(!showFilters)}
					>
						<FilterIcon className="w-4 h-4" /> Filters
					</Button>
					<Popover>
						<PopoverTrigger>
							<Button variant={'outline'} size={'sm'} className={'gap-2'}>
								<SettingsIcon className={'w-4 h-4'} />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-64">
							<div className="flex flex-col gap-2">
								{tile && <DataGridLayoutSwitcher />}
								<DataGridToolbarVisibleFields fields={columns.filter(it => it.hidingName).map(it => ({ header: it.header, name: it.hidingName as string }))} />
								<DataGridPerPageSelector />
							</div>

						</PopoverContent>
					</Popover>
					<DataGridAutoExport columns={columns} />
					{toolbarButtons}
				</div>

				<div className="flex flex-wrap gap-2">
					{searchFieldsResolved.length > 0 ? (
						<DataGridFilterMobileHiding name="__search" alwaysShow={showFilters}>
							<DataGridUnionTextFilter name={'__search'} fields={searchFieldsResolved} />
						</DataGridFilterMobileHiding>
					) : null}
					<DataGridToolbarFilters columns={columns} alwaysShow={showFilters} />
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


