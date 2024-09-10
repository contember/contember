import { Component } from '@contember/interface'
import * as React from 'react'
import { ReactNode } from 'react'
import { DataGridShowFiltersContext } from './filters/mobile'
import { DataGridToolbarUI } from './ui'
import { Button } from '../ui/button'
import { FilterIcon, RefreshCcwIcon, SettingsIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { DataGridLayoutSwitcher } from './layout-switcher'
import { DataGridPerPageSelector } from './pagination'
import { DataGridQueryFilter } from './filters'
import { dataAttribute } from '@contember/utilities'
import { dict } from '../dict'
import { DataGridAutoExport } from './export'
import { DataGridToolbarVisibleElements } from './elements'
import { DataViewReloadTrigger } from '@contember/react-dataview'

export interface DataGridToolbarProps {
	children?: ReactNode
}

export const DataGridToolbar = Component<DataGridToolbarProps>(({ children }) => {
	const [showFilters, setShowFilters] = React.useState(false)
	return (
		<DataGridShowFiltersContext.Provider value={showFilters}>
			<DataGridToolbarUI>
				<div className="ml-auto flex gap-2 items-center sm:order-1">
					<Button
						variant={'outline'}
						size={'sm'}
						className={'gap-2 sm:hidden data-[active]:bg-gray-50 data-[active]:shadow-inner'}
						data-active={dataAttribute(showFilters)}
						onClick={() => setShowFilters(!showFilters)}
					>
						<FilterIcon className="w-4 h-4" /> {dict.datagrid.filters}
					</Button>

					<Popover>
						<PopoverTrigger asChild>
							<Button variant={'outline'} size={'sm'} className={'gap-2'}>
								<SettingsIcon className={'w-4 h-4'} />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-64">
							<div className="flex flex-col gap-2">
								<DataGridLayoutSwitcher />
								<DataGridToolbarVisibleElements />
								<DataGridPerPageSelector />
							</div>

						</PopoverContent>
					</Popover>

					<DataGridAutoExport />
					<DataViewReloadTrigger>
						<Button variant={'outline'} size={'sm'} className={'group gap-2'}>
							<RefreshCcwIcon className={'w-4 h-4 group-data-[state=refreshing]:animate-spin '} />
						</Button>
					</DataViewReloadTrigger>
				</div>

				<div className="flex flex-1 flex-wrap gap-2">
					{children ?? <>
						<DataGridQueryFilter />
					</>}
				</div>
			</DataGridToolbarUI>
		</DataGridShowFiltersContext.Provider>
	)
}, ({ children }) => <>
	{children}
</>)
