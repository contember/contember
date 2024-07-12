import { InputBare, InputLike } from '../../ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown'
import { Button } from '../../ui/button'
import { MoreHorizontalIcon, XIcon } from 'lucide-react'
import * as React from 'react'
import {
	DataViewFilterScope,
	DataViewHasFilterType,
	DataViewNullFilterTrigger,
	DataViewQueryFilterName,
	DataViewTextFilter,
	DataViewTextFilterInput,
	DataViewTextFilterMatchModeLabel,
	DataViewTextFilterMatchModeTrigger,
	DataViewTextFilterProps,
	DataViewTextFilterResetTrigger,
	DataViewUnionTextFilter,
	DataViewUnionTextFilterProps,
	TextFilterArtifactsMatchMode,
} from '@contember/react-dataview'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { DataGridActiveFilterUI } from '../ui'
import { DataGridNullFilter } from './common'
import { dict } from '../../dict'
import { Component } from '@contember/interface'
import { DataGridFilterMobileHiding } from './mobile'


export type DataGridTextFilterProps =
	& Omit<DataViewTextFilterProps, 'children'>
	& {
		label?: React.ReactNode
	}

export const DataGridTextFilter = Component(({ label, ...props }: DataGridTextFilterProps) => (
	<DataViewTextFilter {...props}>
		<DataGridFilterMobileHiding>
			<DataGridTextFilterInner label={label} />
		</DataGridFilterMobileHiding>
	</DataViewTextFilter>
))

export type DataGridUnionTextFilterProps =
	& Omit<DataViewUnionTextFilterProps, 'children'>
	& {
		label?: React.ReactNode
	}

export const DataGridUnionTextFilter = Component(({ label, ...props }: DataGridUnionTextFilterProps) => (
	<DataViewUnionTextFilter {...props}>
		<DataGridFilterMobileHiding>
			<DataGridTextFilterInner label={label} />
		</DataGridFilterMobileHiding>
	</DataViewUnionTextFilter>
))

export const DataGridQueryFilter = Component(({ label }: {
	label?: React.ReactNode
}) => (
	<DataViewHasFilterType name={DataViewQueryFilterName}>
		<DataViewFilterScope name={DataViewQueryFilterName}>
			<DataGridFilterMobileHiding>
				<DataGridTextFilterInner label={label} />
			</DataGridFilterMobileHiding>
		</DataViewFilterScope>
	</DataViewHasFilterType>
))

export const DataGridTextFilterInner = ({ label }: {
	label?: React.ReactNode
}) => {
	return (
		<>
			<InputLike className={'p-1 relative basis-1/4 min-w-56'}>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size={'sm'} variant={'secondary'} className={'px-3'}>
							{label} <DataViewTextFilterMatchModeLabel render={dict.datagrid.textMatchMode} />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-[160px]">
						{Object.entries(dict.datagrid.textMatchMode).map(([mode, label]) => (
							<DataViewTextFilterMatchModeTrigger mode={mode as TextFilterArtifactsMatchMode} key={mode}>
								<DropdownMenuItem className={'data-[active]:font-bold'}>
									{label}
								</DropdownMenuItem>
							</DataViewTextFilterMatchModeTrigger>
						))}
					</DropdownMenuContent>
				</DropdownMenu>

				<DataViewTextFilterInput>
					<InputBare placeholder={dict.datagrid.textPlaceholder} className={'w-full ml-2'} />
				</DataViewTextFilterInput>

				<div className={'ml-auto flex gap-1 items-center'}>
					<DataViewNullFilterTrigger action={'unset'}>
						<DataGridActiveFilterUI className={'ml-auto'}>
							<span className={'italic'}>{dict.datagrid.na}</span>
						</DataGridActiveFilterUI>
					</DataViewNullFilterTrigger>
					<Popover>
						<PopoverTrigger asChild>
							<Button variant={'ghost'} size={'sm'} className={'p-0.5 h-5 w-5'}>
								<MoreHorizontalIcon />
							</Button>
						</PopoverTrigger>
						<PopoverContent>
							<DataViewTextFilterResetTrigger>
								<Button size={'sm'} className={'w-full text-left justify-start gap-1'} variant={'ghost'}>
									<XIcon className={'w-3 h-3'} /> {dict.datagrid.textReset}
								</Button>
							</DataViewTextFilterResetTrigger>
							<DataGridNullFilter />
						</PopoverContent>
					</Popover>
				</div>
			</InputLike>
		</>
	)
}
