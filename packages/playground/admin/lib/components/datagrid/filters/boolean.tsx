import * as React from 'react'
import { ReactNode } from 'react'
import { DataViewBooleanFilterTrigger, DataViewNullFilterTrigger } from '@contember/react-dataview'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { DataViewActiveFilterUI, DataViewFilterSelectTriggerUI, DataViewSingleFilterUI } from '../ui'
import { DataViewNullFilter } from './common'
import { formatBoolean } from '../../../utils/formatting'
import { Button } from '../../ui/button'
import { dict } from '../../../dict'


export const DataViewBooleanFilterList = ({ name }: {
	name: string
}) => (
	<>
		{[true, false].map(value => (
			<DataViewBooleanFilterTrigger name={name} action={'unset'} value={value} key={value.toString()}>
				<DataViewActiveFilterUI className={'data-[current=none]:hidden'}>
					{formatBoolean(value)}
				</DataViewActiveFilterUI>
			</DataViewBooleanFilterTrigger>
		))}

		<DataViewNullFilterTrigger name={name} action={'unset'}>
			<DataViewActiveFilterUI>
				<span className={'italic'}>{dict.datagrid.na}</span>
			</DataViewActiveFilterUI>
		</DataViewNullFilterTrigger>
	</>
)

export const DataViewBooleanFilterSelect = ({ name, label }: {
	name: string
	label?: ReactNode
}) => (
	<Popover>
		<PopoverTrigger asChild>
			<DataViewFilterSelectTriggerUI>{label}</DataViewFilterSelectTriggerUI>
		</PopoverTrigger>
		<PopoverContent className={'w-52'}>
			<div className={'relative flex flex-col gap-2'}>
				<div className={'flex gap-2'}>
					{[true, false].map(it => (
						<DataViewBooleanFilterTrigger name={name} action={'toggle'} value={it} key={it.toString()}>
							<Button size={'lg'} className={'w-full data-[active]:shadow-inner data-[active]:text-blue-500'}
									variant={'outline'}>

								<span className={'text-xs font-semibold'}>
									{formatBoolean(it)}
								</span>
							</Button>
						</DataViewBooleanFilterTrigger>
					))}
				</div>
				<DataViewNullFilter name={name} />
			</div>
		</PopoverContent>
	</Popover>
)


export const DefaultDataViewBooleanFilter = ({ name, label }: {
	name: string
	label: ReactNode
}) => (
	<DataViewSingleFilterUI>
		<DataViewBooleanFilterSelect name={name} label={label} />
		<DataViewBooleanFilterList name={name} />
	</DataViewSingleFilterUI>
)
