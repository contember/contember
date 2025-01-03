import { cn } from '../utils'
import { Button } from '../ui/button'
import { ReactNode } from 'react'
import { ArrowDownAZIcon, ArrowUpDownIcon, ArrowUpZaIcon, EyeOffIcon, FilterIcon } from 'lucide-react'
import { DataViewSortingSwitch, DataViewSortingTrigger, DataViewVisibilityTrigger, useDataViewFilter } from '@contember/react-dataview'
import { dict } from '../dict'
import { Component } from '@contember/interface'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

/**
 * Props for {@link DataGridColumnHeader}.
 */
export type DataGridColumnHeaderProps = {
	sortingField?: string
	hidingName?: string
	filterName?: string
	filter?: ReactNode
	children: ReactNode
}

/**
 * Column header for data grid.
 * Contains filtering, sorting and hiding controls.
 */
export const DataGridColumnHeader = Component(({ sortingField, hidingName, children, filter, filterName }: DataGridColumnHeaderProps) => {
	let hasFilter = false
	if (filterName) {
		const [, , { isEmpty }] = useDataViewFilter(filterName)
		hasFilter = !isEmpty
	}

	if (!sortingField && !hidingName && !filter) {
		return <div className="text-xs">{children}</div>
	}

	return (
		<div className={cn('flex items-center space-x-2')}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="flex-inline gap-1 -ml-3 h-8 data-[state=open]:bg-accent"
					>
						<span>{children}</span>

						{sortingField && <DataViewSortingSwitch
							field={sortingField}
							asc={<ArrowDownAZIcon className={'h-4 w-4 text-blue-600'} />}
							desc={<ArrowUpZaIcon className={'h-4 w-4 text-blue-600'} />}
							none={<ArrowUpDownIcon className={'h-4 w-4'} />}
						/>}
						{hasFilter && <FilterIcon className="h-4 w-4 text-blue-600"/>}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="p-3">
					<div className="flex flex-col gap-1">

						{(sortingField || hidingName) && <>
							<div className="flex gap-2 border rounded p-1">
								{sortingField && <><DataViewSortingTrigger field={sortingField} action="toggleAsc">
									<Button variant="ghost" className={'data-[active]:text-blue-600 cursor-pointer flex-1'} size="sm">
										<ArrowDownAZIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
										{dict.datagrid.columnAsc}
									</Button>
								</DataViewSortingTrigger>
								<DataViewSortingTrigger field={sortingField} action="toggleDesc">
									<Button variant="ghost" className={'data-[active]:text-blue-600 cursor-pointer flex-1'} size="sm">
										<ArrowUpZaIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
										{dict.datagrid.columnDesc}
									</Button>
								</DataViewSortingTrigger>
								</>}
								{hidingName &&
									<DataViewVisibilityTrigger name={hidingName} value={false}>
										<Button variant="ghost" size="sm">
											<EyeOffIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
											{dict.datagrid.columnHide}
										</Button>
									</DataViewVisibilityTrigger>
								}
							</div>
						</>}

						{filter && <>
							<div className="py-2">
								{filter}
							</div>
						</>}
					</div>
				</PopoverContent>
			</Popover>
		</div>
	)
}, ({ filter }) => {
	return <>{filter}</>
})
