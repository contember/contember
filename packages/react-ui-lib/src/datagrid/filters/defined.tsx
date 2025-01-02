import * as React from 'react'
import { ReactNode } from 'react'
import { DataViewBooleanFilterProps, DataViewIsDefinedFilter, DataViewNullFilterTrigger } from '@contember/react-dataview'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { DataGridFilterSelectTriggerUI, DataGridSingleFilterUI } from '../ui'
import { dict } from '../../dict'
import { Component } from '@contember/interface'
import { DataGridFilterMobileHiding } from './mobile'
import { CheckIcon, XIcon } from 'lucide-react'
import { Button } from '../../ui/button'
import { DataViewFieldLabel } from '../labels'

/**
 * Props for {@link DataGridIsDefinedFilter}.
 */
export type DataGridIsDefinedFilterProps =
	& Omit<DataViewBooleanFilterProps, 'children'>
	& {
		label: ReactNode
	}

/**
 * Is defined filter for DataGrid with default UI.
 *
 * ## Props {@link DataGridIsDefinedFilterProps}
 * field, label, ?name
 *
 * ## Example
 * ```tsx
 * <DataGridIsDefinedFilter field={'deletedAt'} label="Is Deleted?" />
 * ```
 */
export const DataGridIsDefinedFilter = Component(({ label, ...props }: DataGridIsDefinedFilterProps) => (
	<DataViewIsDefinedFilter {...props}>
		<DataGridFilterMobileHiding>
			<DataGridSingleFilterUI>
				<DataGridIsDefinedFilterSelect label={label ?? <DataViewFieldLabel field={props.field} />} />
				<DataGridIsDefinedFilterList />
			</DataGridSingleFilterUI>
		</DataGridFilterMobileHiding>
	</DataViewIsDefinedFilter>
))

const DataGridIsDefinedFilterList = () => (
	<>
		<DataViewNullFilterTrigger action={'unset'}>
			<Button variant={'outline'} size="sm" className={'space-x-1 data-[current="none"]:hidden data-[current="include"]:hidden h-6'}>
				<CheckIcon size={16} />
				<span>
					{dict.boolean.true}
				</span>
				<XIcon className={'w-2 h-2'} />
			</Button>
		</DataViewNullFilterTrigger>
		<DataViewNullFilterTrigger action={'unset'}>
			<Button variant={'outline'} size="sm" className={'space-x-1 data-[current="none"]:hidden data-[current="exclude"]:hidden h-6'}>
				<XIcon size={16} />
				<span>
					{dict.boolean.false}
				</span>
				<XIcon className={'w-2 h-2'} />
			</Button>
		</DataViewNullFilterTrigger>
	</>
)


const DataGridIsDefinedFilterSelect = ({ label }: {
	label?: ReactNode
}) => (
	<Popover>
		<PopoverTrigger asChild>
			<DataGridFilterSelectTriggerUI>{label}</DataGridFilterSelectTriggerUI>
		</PopoverTrigger>
		<PopoverContent className={'w-52'}>
			<DataGridIsDefinedFilterControls />
		</PopoverContent>
	</Popover>
)

/**
 * @internal
 */
export const DataGridIsDefinedFilterControls = () => {
	return (
		<div className={'flex flex-col gap-2'}>
			<div className={'flex gap-2'}>
				<DataViewNullFilterTrigger action={'toggleExclude'}>
					<Button size={'sm'} className={'w-full data-[active]:shadow-inner data-[active]:text-blue-500'} variant={'outline'}>
						<CheckIcon size={16} />
						{dict.boolean.true}
					</Button>
				</DataViewNullFilterTrigger>
				<DataViewNullFilterTrigger action={'toggleInclude'}>
					<Button size={'sm'} className={'w-full data-[active]:shadow-inner data-[active]:text-blue-500'} variant={'outline'}>
						<XIcon size={16} />
						{dict.boolean.false}
					</Button>
				</DataViewNullFilterTrigger>
			</div>
		</div>
	)
}
