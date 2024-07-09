import * as React from 'react'
import { MouseEventHandler } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { DataViewChangePageTrigger, useDataViewPagingInfo } from '@contember/react-dataview'
import { Button } from '../ui/button'
import { dict } from '../dict'

export const SelectPagination = () => {
	const scrollToTop: MouseEventHandler = e => {
		const el = (e.target as HTMLElement).closest('[data-radix-scroll-area-viewport]')
		if (el) {
			requestAnimationFrame(() => {
				el.scrollTo({ top: 0, behavior: 'smooth' })
			})
		}
	}
	const pageInfo = useDataViewPagingInfo()
	if ((pageInfo.pagesCount ?? 1) <= 1) {
		return null
	}

	return (
		<div className="flex gap-6 lg:gap-8 justify-center items-center">
			<div className={'flex gap-1'}>
				<DataViewChangePageTrigger page="previous">
					<Button
						size={'xs'}
						variant="outline"
						onClick={scrollToTop}
					>
						<span className="sr-only">{dict.select.paginationPreviousPage}</span>
						<ChevronLeftIcon className="h-3 w-3"/>
					</Button>
				</DataViewChangePageTrigger>
				<DataViewChangePageTrigger page="next">
					<Button
						size={'xs'}
						variant="outline"
						onClick={scrollToTop}
					>
						<span className="sr-only">{dict.select.paginationNextPage}</span>
						<ChevronRightIcon className="h-3 w-3"/>
					</Button>
				</DataViewChangePageTrigger>
			</div>
		</div>
	)
}
