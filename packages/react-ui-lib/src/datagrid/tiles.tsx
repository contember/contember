import { Component } from '@contember/interface'
import { DataViewEachRow, DataViewLayout } from '@contember/react-dataview'
import * as React from 'react'
import { dict } from '../dict'
import { LayoutGridIcon } from 'lucide-react'
import { cn } from '../utils'

export interface DataGridTilesProps {
	children: React.ReactNode
	className?: string
}

export const DataGridTiles = Component< DataGridTilesProps>(({ children, className }) => {
	return (
		<DataViewLayout name={'grid'} label={<>
			<LayoutGridIcon className={'w-3 h-3'} />
			<span>{dict.datagrid.showGrid}</span>
		</>}>
			<div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
				<DataViewEachRow>
					{children}
				</DataViewEachRow>
			</div>
		</DataViewLayout>
	)
})
