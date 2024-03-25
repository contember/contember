import { DataViewSelectionTrigger } from '@contember/react-dataview'
import { Button } from '../ui/button'
import { LayoutGridIcon, SheetIcon } from 'lucide-react'
import * as React from 'react'
import { dict } from '../../dict'

export const DataGridLayoutSwitcher = () => <div>
	<p className="text-gray-400 text-xs font-semibold mb-1">{dict.datagrid.layout}</p>
	<div className={'grid grid-cols-2'}>
		<DataViewSelectionTrigger name={'layout'} value={'grid'}>
			<Button variant={'outline'} size={'sm'} className={'data-[active]:text-blue-600 data-[active]:bg-gray-50 data-[active]:shadow-inner rounded-r-none gap-2'}
					title={'Grid'}>
				<LayoutGridIcon className={'w-3 h-3'} />
				<span>{dict.datagrid.showGrid}</span>
			</Button>
		</DataViewSelectionTrigger>
		<DataViewSelectionTrigger name={'layout'} value={'table'}>
			<Button variant={'outline'} size={'sm'}
					className={'data-[active]:text-blue-600 data-[active]:bg-gray-50 data-[active]:shadow-inner rounded-l-none gap-2'}
					title={'Table'}>
				<SheetIcon className={'w-3 h-3'} />
				<span>{dict.datagrid.showTable}</span>
			</Button>
		</DataViewSelectionTrigger>
	</div>
</div>
