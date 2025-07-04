import { ReactNode } from 'react'
import { DataViewBooleanFilter, DataViewBooleanFilterProps, DataViewBooleanFilterTrigger, DataViewNullFilterTrigger } from '@contember/react-dataview'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { DataGridActiveFilterUI, DataGridFilterSelectTriggerUI, DataGridSingleFilterUI } from '../ui'
import { DataGridNullFilter } from './common'
import { formatBoolean } from '../../formatting'
import { Button } from '../../ui/button'
import { dict } from '../../dict'
import { Component } from '@contember/interface'
import { DataGridFilterMobileHiding } from './mobile'
import { DataViewFieldLabel } from '../labels'

const DataGridBooleanFilterList = () => (
	<>
		{[true, false].map(value => (
			<DataViewBooleanFilterTrigger action={'unset'} value={value} key={value.toString()}>
				<DataGridActiveFilterUI className={'data-[current=none]:hidden'}>
					{formatBoolean(value)}
				</DataGridActiveFilterUI>
			</DataViewBooleanFilterTrigger>
		))}

		<DataViewNullFilterTrigger action={'unset'}>
			<DataGridActiveFilterUI>
				<span className={'italic'}>{dict.datagrid.na}</span>
			</DataGridActiveFilterUI>
		</DataViewNullFilterTrigger>
	</>
)


/**
 * @internal
 */
export const DataGridBooleanFilterControls = () => (
	<div className={'flex flex-col gap-2'}>
		<div className={'flex gap-2'}>
			{[true, false].map(it => (
				<DataViewBooleanFilterTrigger action={'toggle'} value={it} key={it.toString()}>
					<Button size={'lg'} className={'w-full data-[active]:shadow-inner data-[active]:text-blue-500'}
						variant={'outline'}>

						<span className={'text-xs font-semibold'}>
							{formatBoolean(it)}
						</span>
					</Button>
				</DataViewBooleanFilterTrigger>
			))}
		</div>
		<DataGridNullFilter />
	</div>
)

const DataGridBooleanFilterSelect = ({ label }: { label?: ReactNode }) => (
	<Popover>
		<PopoverTrigger asChild>
			<DataGridFilterSelectTriggerUI>{label}</DataGridFilterSelectTriggerUI>
		</PopoverTrigger>
		<PopoverContent className={'w-52'}>
			<DataGridBooleanFilterControls />
		</PopoverContent>
	</Popover>
)

/**
 * Props for {@link DataGridBooleanFilter}.
 *
 * Extends {@link DataViewBooleanFilterProps}, excluding the `children` prop.
 */
export interface DataGridBooleanFilterProps extends Omit<DataViewBooleanFilterProps, 'children'> {
	/**
	 * Label for the filter UI
	 * */
	label: ReactNode
}

/**
 * Props {@link DataGridBooleanFilterProps}
 *
 * `DataGridBooleanFilter` provides a boolean filter for `DataGrid` with a default UI.
 *
 * #### Example
 * ```tsx
 * <DefaultDataGrid entities="Project">
 *   <DataGridBooleanFilter field="locked" label="Locked" />
 * </DefaultDataGrid>
 * ```
 */
export const DataGridBooleanFilter = Component(({ label, ...props }: DataGridBooleanFilterProps) => (
	<DataViewBooleanFilter {...props}>
		<DataGridFilterMobileHiding>
			<DataGridSingleFilterUI>
				<DataGridBooleanFilterSelect label={label ?? <DataViewFieldLabel field={props.field} />} />
				<DataGridBooleanFilterList />
			</DataGridSingleFilterUI>
		</DataGridFilterMobileHiding>
	</DataViewBooleanFilter>
))
