import { GanttChartContext } from '@app/lib-extra/gantt/gantt-chart-provider'
import { DataGridShowFiltersContext, DataGridToolbarUI } from '@app/lib/datagrid'
import { dict } from '@app/lib/dict'
import { Button } from '@app/lib/ui/button'
import { Label } from '@app/lib/ui/label'
import { Switch } from '@app/lib/ui/switch'
import { Component } from '@contember/interface'
import { dataAttribute } from '@contember/utilities'
import { FilterIcon } from 'lucide-react'
import * as React from 'react'
import { ReactNode, useContext } from 'react'

export interface GanttChartToolbarProps {
	children: ReactNode
}

export const GanttChartToolbar = Component<GanttChartToolbarProps>(
	({ children }) => {
		const [showFilters, setShowFilters] = React.useState(false)
		const { isEditAllowed, setIsEditAllowed } = useContext(GanttChartContext)

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
						<div className={'flex items-center gap-2 border p-2 rounded-lg bg-gray-50'}>
							<Switch checked={isEditAllowed} onCheckedChange={() => setIsEditAllowed(!isEditAllowed)} />
							<Label>Edit</Label>
						</div>
					</div>
					<div className="flex flex-1 flex-wrap gap-2">{children}</div>
				</DataGridToolbarUI>
			</DataGridShowFiltersContext.Provider>
		)
	},
	({ children }) => <>{children}</>,
)
