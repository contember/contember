import { Button } from '../ui/button'
import { DownloadIcon } from 'lucide-react'
import { DataViewExportTrigger } from '@contember/react-dataview'
import * as React from 'react'
import { useMemo } from 'react'
import { DataGridColumn } from './grid'

export const DataGridAutoExport = ({ columns }: { columns: DataGridColumn[] }) => {
	const children = useMemo(() => <>{columns.map(it => it.cell)}</>, [columns])
	return (
		<DataViewExportTrigger fields={children}>
			<Button variant={'outline'} size={'sm'} className={'gap-2'}>
				<DownloadIcon className={'w-4 h-4'} />
				Export
			</Button>
		</DataViewExportTrigger>
	)
}
