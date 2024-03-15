import { DataViewSelectionTrigger } from '@contember/react-dataview'
import { Button } from '../ui/button'
import { LayoutGridIcon, SheetIcon } from 'lucide-react'
import * as React from 'react'
import { dict } from '../../dict'

export const DataGridLayoutSwitcher = () => <>
	<div className={'space-x-0'}>
		<DataViewSelectionTrigger name={'layout'} value={'grid'}>
			<Button variant={'outline'} size={'sm'}
					className={'data-[active]:text-blue-600 data-[active]:bg-gray-50 data-[active]:shadow-inner rounded-r-none'}
					title={'Grid'}>
				<LayoutGridIcon className={'w-3 h-3'} />
				<span className={'sr-only'}>{dict.datagrid.showGrid}</span>
			</Button>
		</DataViewSelectionTrigger>
		<DataViewSelectionTrigger name={'layout'} value={'table'}>
			<Button variant={'outline'} size={'sm'}
					className={'data-[active]:text-blue-600 data-[active]:bg-gray-50 data-[active]:shadow-inner rounded-l-none'}
					title={'Table'}>
				<SheetIcon className={'w-3 h-3'} />
				<span className={'sr-only'}>{dict.datagrid.showTable}</span>
			</Button>
		</DataViewSelectionTrigger>
	</div>
</>
