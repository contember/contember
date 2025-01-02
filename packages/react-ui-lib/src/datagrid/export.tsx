import { Button } from '../ui/button'
import { DownloadIcon } from 'lucide-react'
import { DataViewExportTrigger } from '@contember/react-dataview'
import * as React from 'react'
import { ReactNode, useMemo } from 'react'
import { dict } from '../dict'

/**
 * Button for exporting data grid to CSV.
 * If no fields are provided, all fields will be exported.
 *
 * ## Example
 * ```tsx
 * <DataGridExport />
 * ```
 */
export const DataGridAutoExport = ({ fields }: { fields?: ReactNode }) => {
	return (
		<DataViewExportTrigger fields={fields}>
			<Button variant={'outline'} size={'sm'} className={'gap-2'}>
				<DownloadIcon className={'w-4 h-4'} />
				{dict.datagrid.export}
			</Button>
		</DataViewExportTrigger>
	)
}
