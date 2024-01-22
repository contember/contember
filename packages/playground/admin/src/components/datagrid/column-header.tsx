import { cn } from '../../utils/cn'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown'
import { Button } from '../ui/button'
import { ReactNode } from 'react'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react'
import { DataViewSortingCondition, DataViewSortingTrigger } from '@contember/react-dataview'


export function DataTableColumnHeader<TData, TValue>({ field, children, enableOrdering }: {
	field: string,
	enableOrdering?: boolean,
	children: ReactNode,
}) {
	if (!enableOrdering) {
		return <div>{children}</div>
	}

	return (
		<div className={cn('flex items-center space-x-2')}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="-ml-3 h-8 data-[state=open]:bg-accent"
					>
						<span>{children}</span>
						<DataViewSortingCondition field={field} direction="asc">
							<ArrowDownIcon className="ml-2 h-4 w-4" />
						</DataViewSortingCondition>
						<DataViewSortingCondition field={field} direction="desc">
							<ArrowUpIcon className="ml-2 h-4 w-4" />
						</DataViewSortingCondition>
						<DataViewSortingCondition field={field} direction="none">
							<ArrowUpDownIcon className="ml-2 h-4 w-4" />
						</DataViewSortingCondition>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					<DataViewSortingTrigger field={field} direction="asc">
						<DropdownMenuItem>
							<ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
							Asc
						</DropdownMenuItem>
					</DataViewSortingTrigger>
					<DataViewSortingTrigger field={field} direction="desc">
						<DropdownMenuItem>
							<ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
							Desc
						</DropdownMenuItem>
					</DataViewSortingTrigger>
					<DropdownMenuSeparator />
					{/*<DropdownMenuItem onClick={() => setIsColumnHidden(columnKey, true)}>*/}
					{/*	<EyeOffIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />*/}
					{/*	Hide*/}
					{/*</DropdownMenuItem>*/}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}
