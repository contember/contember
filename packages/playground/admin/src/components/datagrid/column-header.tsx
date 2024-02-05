import { cn } from '../../utils/cn'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown'
import { Button } from '../ui/button'
import { ReactNode } from 'react'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, EyeOffIcon } from 'lucide-react'
import { DataViewSelectionTrigger, DataViewSortingSwitch, DataViewSortingTrigger } from '@contember/react-dataview'


export function DataViewColumnHeader<TData, TValue>({ field, children, enableOrdering, enableHiding }: {
	field: string,
	enableOrdering?: boolean,
	enableHiding?: boolean,
	children: ReactNode,
}) {
	if (!enableOrdering && !enableHiding) {
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

						{enableOrdering && <DataViewSortingSwitch
							field={field}
							asc={<ArrowDownIcon className={'h-4 w-4'} />}
							desc={<ArrowUpIcon className={'h-4 w-4'} />}
							none={<ArrowUpDownIcon className={'h-4 w-4'} />}
						/>}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					{enableOrdering && <>
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
					</>}
					{enableHiding &&
						<DataViewSelectionTrigger name={field} value={false}>
							<DropdownMenuItem>
								<EyeOffIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
								Hide
							</DropdownMenuItem>
						</DataViewSelectionTrigger>
					}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}
