import * as React from 'react'
import { ReactNode } from 'react'
import { ScrollArea } from '../ui/scroll-area'
import { Loader } from '../ui/loader'
import {
	DataViewHighlightRow,
	DataViewInfiniteLoadEachRow,
	DataViewInfiniteLoadProvider,
	DataViewInfiniteLoadScrollObserver,
	DataViewInfiniteLoadTrigger,
	DataViewKeyboardEventHandler,
	DataViewLoaderState,
	DataViewSortingDirections,
	DataViewUnionFilterFields,
} from '@contember/react-dataview'
import { useOnHighlight } from './highlight'
import { Component } from '@contember/interface'
import { Button } from '../ui/button'
import { ArrowBigDownDash } from 'lucide-react'
import { SelectDefaultFilter } from './filter'
import { SelectListItemUI } from './ui'
import { SelectDataView, SelectItemTrigger, SelectOption } from '@contember/react-select'

export interface DefaultSelectDataViewProps {
	queryField?: DataViewUnionFilterFields
	initialSorting?: DataViewSortingDirections
	children: ReactNode
}

export const DefaultSelectDataView = Component< DefaultSelectDataViewProps>(({ children, initialSorting, queryField }) => {
	return <>
		<SelectDataView initialSorting={initialSorting} queryField={queryField}>
			<DefaultSelectDataViewRenderer>
				{children}
			</DefaultSelectDataViewRenderer>
		</SelectDataView>
	</>
})

const DefaultSelectDataViewRenderer = Component<{children: ReactNode}>(({ children }) => <>
	<SelectListInner filterToolbar={<SelectDefaultFilter />}>
		<SelectOption>
			<SelectItemTrigger>
				<SelectListItemUI>
					{children}
				</SelectListItemUI>
			</SelectItemTrigger>
		</SelectOption>
	</SelectListInner>
</>)

export type SelectListProps =
	& {
		children: ReactNode
		filterToolbar?: ReactNode
	}

export const SelectListInner = Component(({ children, filterToolbar }: SelectListProps) => {
	return (
		<DataViewInfiniteLoadProvider>
			<DataViewKeyboardEventHandler>
				<div className={'flex flex-col gap-4 group-data-[side="top"]:flex-col-reverse'}>
					{filterToolbar}
					<ScrollArea className={'max-h-96'}>
						<div className={'flex flex-col gap-1'}>
							<DataViewLoaderState refreshing>
								<Loader position={'absolute'} />
							</DataViewLoaderState>
							<DataViewLoaderState refreshing loaded>
								<DataViewInfiniteLoadEachRow>
									<DataViewHighlightRow onHighlight={useOnHighlight()}>
										{children}
									</DataViewHighlightRow>
								</DataViewInfiniteLoadEachRow>
								<DataViewLoaderState loaded>
									<DataViewInfiniteLoadScrollObserver />
								</DataViewLoaderState>
								<DataViewInfiniteLoadTrigger>
									<Button size="sm" variant="ghost" className="disabled:hidden">
										<ArrowBigDownDash size={16} />
									</Button>
								</DataViewInfiniteLoadTrigger>
							</DataViewLoaderState>
						</div>
					</ScrollArea>
					<DataViewLoaderState initial>
						<Loader position={'static'} size={'sm'} />
					</DataViewLoaderState>
					<DataViewLoaderState failed>
						<div>Failed to load data</div>
					</DataViewLoaderState>
				</div>
			</DataViewKeyboardEventHandler>
		</DataViewInfiniteLoadProvider>
	)
}, ({ children, filterToolbar }) => {
	return <>
		{filterToolbar}
		{children}
	</>
})
