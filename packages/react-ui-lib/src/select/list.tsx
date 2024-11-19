import * as React from 'react'
import { ReactNode } from 'react'
import { ScrollArea } from '../ui/scroll-area'
import { DataGridOverlayLoader } from '../datagrid'
import { Loader } from '../ui/loader'
import {
	DataViewHighlightRow,
	DataViewInfiniteLoadEachRow,
	DataViewInfiniteLoadProvider,
	DataViewInfiniteLoadScrollObserver,
	DataViewInfiniteLoadTrigger,
	DataViewKeyboardEventHandler,
	DataViewLoaderState,
} from '@contember/react-dataview'
import { useOnHighlight } from './highlight'
import { Component } from '@contember/interface'
import { Button } from '../ui/button'
import { ArrowBigDownDash } from 'lucide-react'


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
								<DataGridOverlayLoader />
							</DataViewLoaderState>
							<DataViewLoaderState refreshing loaded>
								<DataViewInfiniteLoadEachRow>
									<DataViewHighlightRow onHighlight={useOnHighlight()}>
										{children}
									</DataViewHighlightRow>
								</DataViewInfiniteLoadEachRow>
								<DataViewInfiniteLoadScrollObserver />
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
