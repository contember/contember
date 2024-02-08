import * as React from 'react'
import { ReactNode, useCallback } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip'
import { Button } from '../../ui/button'
import {
	createTextFilter,
	DataView,
	DataViewEachRow,
	DataViewLoaderState,
	DataViewNullFilterTrigger,
	DataViewRelationFilterList,
	DataViewRelationFilterTrigger,
	DataViewTextFilterInput,
	useDataViewRelationFilterFactory,
	UseDataViewRelationFilterResult,
} from '@contember/react-dataview'
import { Component, EntityId, SugarableQualifiedEntityList, SugaredQualifiedEntityList, useEntity } from '@contember/interface'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { Input } from '../../ui/input'
import { DataViewLoaderOverlay } from '../loader'
import {
	DataViewActiveFilterUI,
	DataViewExcludeActionButtonUI,
	DataViewFilterActionButtonUI,
	DataViewFilterSelectItemUI,
	DataViewFilterSelectTriggerUI,
	DataViewSingleFilterUI,
} from '../ui'
import { DataViewNullFilter } from './common'
import { Loader } from '../../ui/loader'

export const DataViewRelationFieldTooltip = ({ filter, children, actions }: { filter: string, children: ReactNode, actions?: ReactNode }) => (
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
						<DataViewFilterActionButtonUI />
					</DataViewRelationFilterTrigger>
					<DataViewRelationFilterTrigger name={filter} action={'toggleExclude'}>
						<DataViewExcludeActionButtonUI />
					</DataViewRelationFilterTrigger>
					{actions}
				</div>
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
)

const DataViewRelationFilteredItemsList = ({ name, children, options }: {
	name: string
	options: SugaredQualifiedEntityList['entities']
	children: ReactNode
}) => (
	<>
		<DataViewRelationFilterList name={name} options={options}>
			<DataViewRelationFilterTrigger name={name} action={'unset'}>
				<DataViewActiveFilterUI>
					{children}
				</DataViewActiveFilterUI>
			</DataViewRelationFilterTrigger>
		</DataViewRelationFilterList>
		<DataViewNullFilterTrigger name={name} action={'unset'}>
			<DataViewActiveFilterUI>
				<span className={'italic'}>N/A</span>
			</DataViewActiveFilterUI>
		</DataViewNullFilterTrigger>
	</>
)

const DataViewRelationFilterSelectItem = ({ children, filterFactory }: {
	children: ReactNode
	filterFactory: (value: EntityId) => UseDataViewRelationFilterResult
}) => {
	const entity = useEntity()
	const [current, setFilter] = filterFactory(entity.id)

	const include = useCallback(() => setFilter('toggleInclude'), [setFilter])
	const exclude = useCallback(() => setFilter('toggleExclude'), [setFilter])

	const isIncluded = current === 'include'
	const isExcluded = current == 'exclude'

	return (
		<DataViewFilterSelectItemUI onExclude={exclude} onInclude={include} isExcluded={isExcluded} isIncluded={isIncluded}>
			{children}
		</DataViewFilterSelectItemUI>
	)
}


const DataViewRelationFilterSelect = ({ name, children, options, filterField, label }: {
	name: string
	filterField?: string
	options: string | SugarableQualifiedEntityList
	children: ReactNode
	label?: ReactNode
}) => (
	<Popover>
		<PopoverTrigger asChild>
			<DataViewFilterSelectTriggerUI>
				{label}
			</DataViewFilterSelectTriggerUI>
		</PopoverTrigger>
		<PopoverContent>
			<DataView entities={options} initialItemsPerPage={20} filterTypes={filterField ? {
				query: createTextFilter(filterField),
			} : undefined}>
				<div className={'mb-2'}>
					{filterField && <div className={'mb-4'}>
						<DataViewTextFilterInput name={'query'}>
							<Input placeholder={'Search'} className={'w-full'} autoFocus inputSize={'sm'} />
						</DataViewTextFilterInput>
					</div>}
					<div className={'relative flex flex-col gap-2'}>
						<DataViewLoaderState refreshing>
							<DataViewLoaderOverlay />
						</DataViewLoaderState>
						<DataViewLoaderState refreshing loaded>
							<DataViewEachRow>
								<DataViewRelationFilterSelectItem filterFactory={useDataViewRelationFilterFactory(name)}>
									{children}
								</DataViewRelationFilterSelectItem>
							</DataViewEachRow>
						</DataViewLoaderState>
					</div>
					<DataViewLoaderState initial>
						<Loader position={'static'} size={'small'} />
					</DataViewLoaderState>
				</div>
			</DataView>
			<DataViewNullFilter name={name} />
		</PopoverContent>
	</Popover>
)


export const DefaultDataViewRelationFilter = Component(({ name, options, children, label, filterField }: {
	name: string
	options: SugaredQualifiedEntityList['entities']
	children: ReactNode
	label: ReactNode
	filterField?: string
}) => {
	return (
		<DataViewSingleFilterUI>
			<DataViewRelationFilterSelect name={name} options={options} label={label} filterField={filterField}>
				{children}
			</DataViewRelationFilterSelect>
			<DataViewRelationFilteredItemsList name={name} options={options}>
				{children}
			</DataViewRelationFilteredItemsList>
		</DataViewSingleFilterUI>
	)
}, () => null)
