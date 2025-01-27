import { Component } from '@contember/interface'
import { DataViewReloadTrigger } from '@contember/react-dataview'
import { dataAttribute } from '@contember/utilities'
import { FilterIcon, RefreshCcwIcon, SettingsIcon } from 'lucide-react'
import * as React from 'react'
import { ReactNode } from 'react'
import { dict } from '../dict'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { DataGridToolbarVisibleElements } from './elements'
import { DataGridAutoExport } from './export'
import { DataGridQueryFilter } from './filters'
import { DataGridShowFiltersContext } from './filters/mobile'
import { DataGridLayoutSwitcher } from './layout-switcher'
import { DataGridPerPageSelector } from './pagination'
import { DataGridToolbarUI } from './ui'

/**
 * Props for the {@link DataGridToolbar} component.
 */
export interface DataGridToolbarProps {
	children?: ReactNode

	// UI props from DataGridToolbarUI
	sticky?: boolean
}

/**
 * Toolbar for DataGrid with default UI.
 * It contains
 * 	- filters (with default DataGridQueryFilter, which can be replaced by custom filters in children)
 * 	- settings (layout switcher, visible elements, per page selector)
 * 	- export button
 * 	- reload button
 *
 * ## Example
 * ```tsx
 * <DataGridToolbar>
 *     <DataGridQueryFilter />
 *     <DataGridTextFilter field={'name'} label="Name" />
 * </DataGridToolbar>
 * ```
 */
export const DataGridToolbar = Component<DataGridToolbarProps>(({ children, sticky }) => {
	const [showFilters, setShowFilters] = React.useState(false)

	return (
		<DataGridShowFiltersContext.Provider value={showFilters}>
			<DataGridToolbarUI sticky={sticky}>
				<div className="ml-auto flex gap-2 items-center sm:order-1">
					<Button
						variant="outline"
						size="sm"
						className="gap-2 sm:hidden data-[active]:bg-gray-50 data-[active]:shadow-inner"
						data-active={dataAttribute(showFilters)}
						onClick={() => setShowFilters(!showFilters)}
					>
						<FilterIcon className="w-4 h-4" /> {dict.datagrid.filters}
					</Button>

					<Popover>
						<PopoverTrigger asChild>
							<Button variant="outline" size="sm" className="gap-2">
								<SettingsIcon className="w-4 h-4" />
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
						<Button variant="outline" size="sm" className="group gap-2">
							<RefreshCcwIcon className="w-4 h-4 group-data-[state=refreshing]:animate-spin " />
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
