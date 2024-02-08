import { DataViewSelectionTrigger } from '@contember/react-dataview'
import { Button } from '../ui/button'
import { LayoutGridIcon, SheetIcon } from 'lucide-react'
import * as React from 'react'

export const DataViewLayoutSwitcher = () => <>
	<div className={'space-x-0 ml-auto'}>
		<DataViewSelectionTrigger name={'layout'} value={'grid'}>
			<Button variant={'outline'} size={'sm'}
					className={'data-[active]:text-blue-600 data-[active]:bg-gray-50 data-[active]:shadow-inner rounded-r-none'}
					title={'Grid'}>
				<LayoutGridIcon className={'w-3 h-3'} />
				<span className={'sr-only'}>Show grid</span>
			</Button>
		</DataViewSelectionTrigger>
		<DataViewSelectionTrigger name={'layout'} value={'table'}>
			<Button variant={'outline'} size={'sm'}
					className={'data-[active]:text-blue-600 data-[active]:bg-gray-50 data-[active]:shadow-inner rounded-l-none'}
					title={'Table'}>
				<SheetIcon className={'w-3 h-3'} />
				<span className={'sr-only'}>Show table</span>
			</Button>
		</DataViewSelectionTrigger>
	</div>
</>
