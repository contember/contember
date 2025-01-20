import {
	DataViewChangePageTrigger,
	DataViewPagingStateView,
	DataViewSetItemsPerPageTrigger,
} from '@contember/react-dataview'
import { DropdownMenu } from '@radix-ui/react-dropdown-menu'
import {
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronsLeftIcon,
	ChevronsRightIcon,
	Loader2Icon,
} from 'lucide-react'
import { FC } from 'react'
import { dict, dictFormat } from '../dict'
import { Button } from '../ui/button'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown'
import { uic } from '../utils'

const PaginationWrapper = uic('div', {
	baseClass: 'flex gap-6 lg:gap-8 items-center justify-between mt-4 pb-4',
	variants: {
		sticky: {
			true: 'sticky bottom-0 z-50 bg-white pt-4 border-t border-gray-200',
		},
	},
})

interface DataGridPaginationProps {
	sticky?: boolean
}

/**
 * Pagination controls UI for DataView.
 *
 * ## Example
 * ```tsx
 * <DataGridPagination />
 * ```
 */
export const DataGridPagination: FC<DataGridPaginationProps> = ({ sticky }) => (
	<PaginationWrapper sticky={sticky}>
		<div>
			<DataViewPagingStateView render={it => <>
				<div className="flex gap-2 items-center">
					<div className="font-normal text-sm text-gray-500">
						{it.totalCount === undefined ? <Loader2Icon className="animate-spin h-3 w-3 inline-block" />
							: dictFormat(dict.datagrid.pageRowsCount, {
								totalCount: it.totalCount.toString(),
							})
						}
					</div>
				</div>
			</>} />
		</div>
		<div className="flex items-center space-x-2">
			<DataViewPagingStateView render={it => <>
				<div className="flex gap-2 items-center">
					<div className="text-sm">
						{dictFormat(it.pagesCount !== undefined ? dict.datagrid.pageInfo : dict.datagrid.pageInfoShort, {
							page: (it.pageIndex + 1).toString(),
							pagesCount: it.pagesCount?.toString() ?? '',
						})}
					</div>
				</div>
			</>} />
			<DataViewChangePageTrigger page="first">
				<Button
					variant="outline"
					className="hidden h-8 w-8 p-0 lg:flex"
				>
					<span className="sr-only">{dict.datagrid.paginationFirstPage}</span>
					<ChevronsLeftIcon className="h-4 w-4" />
				</Button>
			</DataViewChangePageTrigger>
			<DataViewChangePageTrigger page="previous">
				<Button
					variant="outline"
					className="h-8 w-8 p-0"
				>
					<span className="sr-only">{dict.datagrid.paginationPreviousPage}</span>
					<ChevronLeftIcon className="h-4 w-4" />
				</Button>
			</DataViewChangePageTrigger>
			<DataViewChangePageTrigger page="next">
				<Button
					variant="outline"
					className="h-8 w-8 p-0"
				>
					<span className="sr-only">{dict.datagrid.paginationNextPage}</span>
					<ChevronRightIcon className="h-4 w-4" />
				</Button>
			</DataViewChangePageTrigger>
			<DataViewChangePageTrigger page="last">
				<Button
					variant="outline"
					className="hidden h-8 w-8 p-0 lg:flex"
				>
					<span className="sr-only">{dict.datagrid.paginationLastPage}</span>
					<ChevronsRightIcon className="h-4 w-4" />
				</Button>
			</DataViewChangePageTrigger>
		</div>
	</PaginationWrapper>
)


export const DataGridPerPageSelector = () => (
	<div>
		<p className="text-gray-400 text-xs font-semibold mb-1">{dict.datagrid.paginationRowsPerPage}</p>
		<DropdownMenu
		>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="h-8 w-[70px] p-0 justify-between px-4"
				>
					<DataViewPagingStateView render={it => it.itemsPerPage} />

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
)
