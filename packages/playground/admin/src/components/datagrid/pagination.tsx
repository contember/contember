import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from 'lucide-react'

import { Button } from '../ui/button'
import {
	DataViewChangePageTrigger,
	DataViewSetItemsPerPageTrigger,
	useDataViewPagingInfo,
	useDataViewPagingState,
} from '@contember/react-dataview'
import { DropdownMenu } from '@radix-ui/react-dropdown-menu'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown'

export function DataTablePagination() {

	const pagingState = useDataViewPagingState()
	const pagingInfo = useDataViewPagingInfo()

	return (
		<div className="flex items-center justify-between px-2">
			<div className="flex items-center space-x-6 lg:space-x-8">
				<div className="flex items-center space-x-2">
					<p className="text-sm font-medium">Rows per page</p>
					<DropdownMenu
					>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								className="h-8 w-[70px] p-0 justify-between px-4"
							>

								{pagingState.itemsPerPage}
								<ChevronDownIcon className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							{[5, 10, 20, 30, 40, 50].map(pageSize => (
								<DataViewSetItemsPerPageTrigger value={pageSize} key={pageSize}>
									<DropdownMenuItem key={pageSize} className={'data-[active]:font-bold'}>
										{pageSize}
									</DropdownMenuItem>
								</DataViewSetItemsPerPageTrigger>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<div className="flex w-[100px] items-center justify-center text-sm font-medium">
					Page {pagingState.pageIndex + 1} of{' '}
					{pagingInfo.pagesCount}
				</div>
				<div className="flex items-center space-x-2">
					<DataViewChangePageTrigger page="first">
						<Button
							variant="outline"
							className="hidden h-8 w-8 p-0 lg:flex"
						>
							<span className="sr-only">Go to first page</span>
							<ChevronsLeftIcon className="h-4 w-4" />
						</Button>
					</DataViewChangePageTrigger>
					<DataViewChangePageTrigger page="previous">
						<Button
							variant="outline"
							className="h-8 w-8 p-0"
						>
							<span className="sr-only">Go to previous page</span>
							<ChevronLeftIcon className="h-4 w-4" />
						</Button>
					</DataViewChangePageTrigger>
					<DataViewChangePageTrigger page="next">
						<Button
							variant="outline"
							className="h-8 w-8 p-0"
						>
							<span className="sr-only">Go to next page</span>
							<ChevronRightIcon className="h-4 w-4" />
						</Button>
					</DataViewChangePageTrigger>
					<DataViewChangePageTrigger page="last">
						<Button
							variant="outline"
							className="hidden h-8 w-8 p-0 lg:flex"
						>
							<span className="sr-only">Go to last page</span>
							<ChevronsRightIcon className="h-4 w-4" />
						</Button>
					</DataViewChangePageTrigger>
				</div>
			</div>
		</div>
	)
}
