import * as React from 'react'
import { ReactNode, useCallback } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { Button } from '../ui/button'
import { FilterIcon, FilterXIcon, PlusIcon, XIcon } from 'lucide-react'
import {
	createTextFilter,
	DataView, DataViewEachRow, DataViewLoaderState,
	DataViewRelationFilterList,
	DataViewRelationFilterTrigger, DataViewTextFilterInput,
	useDataViewRelationSetFilter,
} from '@contember/react-dataview'
import { Component, SugaredQualifiedEntityList, useEntity } from '@contember/interface'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Input } from '../ui/input'
import { DataViewLoaderOverlay } from './loader'

export const DataViewRelationFieldTooltip = ({ filter, children, actions }: { filter: string, children: ReactNode, actions?: ReactNode }) => {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button variant={'ghost'} size={'sm'}>
						{children}
					</Button>
				</TooltipTrigger>
				<TooltipContent variant={'blurred'}>
					<div className={'flex gap-1'}>
						<DataViewRelationFilterTrigger name={filter} action={'toggleInclude'}>
							<Button variant={'outline'} size={'sm'}
									className={'space-x-1 data-[active]:text-blue-600 data-[active]:bg-gray-50 data-[active]:shadow-inner'}>
								<FilterIcon className={'w-3 h-3'} />
								<span>Filter</span>
							</Button>
						</DataViewRelationFilterTrigger>
						<DataViewRelationFilterTrigger name={filter} action={'toggleExclude'}>
							<Button variant={'outline'} size={'sm'}
									className={'space-x-1 data-[active]:text-blue-600 data-[active]:bg-gray-50 data-[active]:shadow-inner'}>
								<FilterXIcon className={'w-3 h-3'} />
								<span>Exclude</span>
							</Button>
						</DataViewRelationFilterTrigger>
						{actions}
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}

export const DefaultDataViewRelationFilterList = Component(({ name, children, options }: {
	name: string
	options: SugaredQualifiedEntityList | string
	children: ReactNode
}) => {
	return (
		<DataViewRelationFilterList name={name} options={options}>
			<DataViewRelationFilterTrigger name={name} action={'unset'}>
				<Button variant={'outline'} size="sm" className={'space-x-1 data-[state="exclude"]:line-through h-6'}>
					<span>
						{children}
					</span>
					<XIcon className={'w-2 h-2'} />
				</Button>
			</DataViewRelationFilterTrigger>
		</DataViewRelationFilterList>
	)
}, () => {
	return null
})


export const DataViewRelationFilterSelect = Component(({ name, children }: {
	name: string
	children: ReactNode
}) => {
	const setFilter = useDataViewRelationSetFilter(name)
	const SelectItem = ({ children }: {
		children: ReactNode
	}) => {
		const entity = useEntity()
		const include = useCallback((e: any) => {
			setFilter(entity.id, 'include')
			e.preventDefault()
		}, [entity.id])
		const exclude = useCallback((e: any) => {
			setFilter(entity.id, 'exclude')
			e.preventDefault()
			e.stopPropagation()
		}, [entity.id])
		return (
			<div className={'flex'}>
				<Button onClick={include} size={'sm'} className={'flex-1 text-left flex justify-between'} variant={'ghost'}>
					<span>
						{children}
					</span>
					<span onClick={exclude} className={'p-1 border rounded hover:bg-red-200'}><FilterXIcon
						className={'h-3 w-3'} /></span>
				</Button>
			</div>
		)
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button className={'bg-gray-100 rounded-full border data-[state=open]:bg-gray-50 data-[state=open]:shadow-inner p-1'}>
					<PlusIcon className={'w-3 h-3'} />
				</button>
			</PopoverTrigger>
			<PopoverContent>
				<DataView entities={'GridCategory'} initialItemsPerPage={20} filterTypes={{
					name: createTextFilter('name'),
				}}>
					<div>
						<div className={'mb-4'}>
							<DataViewTextFilterInput name={'name'}>
								<Input placeholder={'Search'} className={'w-full'} autoFocus inputSize={'sm'} />
							</DataViewTextFilterInput>
						</div>
						<div className={'relative flex flex-col gap-2'}>
							<DataViewLoaderState refreshing>
								<DataViewLoaderOverlay />
							</DataViewLoaderState>
							<DataViewLoaderState refreshing loaded>
								<DataViewEachRow>
									<SelectItem>
										{children}
									</SelectItem>
								</DataViewEachRow>
							</DataViewLoaderState>
						</div>
						<DataViewLoaderState initial>
							Loading...
						</DataViewLoaderState>
					</div>
				</DataView>
			</PopoverContent>
		</Popover>
	)
}, () => null)
