import { cn } from '../../../lib/utils/cn'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown'
import { Button } from '../ui/button'
import { ReactNode } from 'react'
import { ArrowDownAZIcon, ArrowUpDownIcon, ArrowUpZaIcon, EyeOffIcon } from 'lucide-react'
import { DataViewSelectionTrigger, DataViewSortingSwitch, DataViewSortingTrigger } from '@contember/react-dataview'
import { dict } from '../../../lib/dict'


export function DataViewColumnHeader<TData, TValue>({ sortingField, hidingName, children }: {
	sortingField?: string,
	hidingName?: string,
	children: ReactNode,
}) {
	if (!sortingField && !hidingName) {
		return <div>{children}</div>
	}

	return (
		<div className={cn('flex items-center space-x-2')}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="flex-inline gap-1 -ml-3 h-8 data-[state=open]:bg-accent"
					>
						<span>{children}</span>

						{sortingField && <DataViewSortingSwitch
							field={sortingField}
							asc={<ArrowDownAZIcon className={'h-4 w-4'} />}
							desc={<ArrowUpZaIcon className={'h-4 w-4'} />}
							none={<ArrowUpDownIcon className={'h-4 w-4'} />}
						/>}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					{sortingField && <>
						<DataViewSortingTrigger field={sortingField} action="toggleAsc">
							<DropdownMenuItem className={'data-[active]:text-gray-500 cursor-pointer'}>
								<ArrowDownAZIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								{dict.datagrid.columnAsc}
							</DropdownMenuItem>
						</DataViewSortingTrigger>
						<DataViewSortingTrigger field={sortingField} action="toggleDesc">
							<DropdownMenuItem className={'data-[active]:text-gray-500 cursor-pointer'}>
								<ArrowUpZaIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								{dict.datagrid.columnDesc}
							</DropdownMenuItem>
						</DataViewSortingTrigger>
					</>}
					{hidingName &&
						<DataViewSelectionTrigger name={hidingName} value={false}>
							<DropdownMenuItem>
								<EyeOffIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								{dict.datagrid.columnHide}
							</DropdownMenuItem>
						</DataViewSelectionTrigger>
					}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}
