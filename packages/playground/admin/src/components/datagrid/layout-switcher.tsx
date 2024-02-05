import { DataViewSelectionTrigger } from '@contember/react-dataview'
import { Button } from '../ui/button'
import { Grid2x2Icon, TableIcon } from 'lucide-react'
import * as React from 'react'

export const DataViewLayoutSwitcher = () => {
	return <>
		<DataViewSelectionTrigger name={'layout'} value={'grid'}>
			<Button variant={'outline'} size={'sm'}
					className={'data-[active]:text-blue-600 data-[active]:bg-gray-50 data-[active]:shadow-inner'}>
				<Grid2x2Icon className={'w-3 h-3'} />
				<span className={'sr-only'}>Show grid</span>
			</Button>
		</DataViewSelectionTrigger>
		<DataViewSelectionTrigger name={'layout'} value={'table'}>
			<Button variant={'outline'} size={'sm'}
					className={'data-[active]:text-blue-600 data-[active]:bg-gray-50 data-[active]:shadow-inner'}>
				<TableIcon className={'w-3 h-3'} />
				<span className={'sr-only'}>Show table</span>
			</Button>
		</DataViewSelectionTrigger>
	</>
}
