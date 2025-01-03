import * as React from 'react'
import { forwardRef, ReactElement, ReactNode, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewFetchAllData } from '../hooks'
import { CsvExportFactory, ExportFactory } from '../export'
import { useDataViewChildren, useDataViewEntityListProps } from '../contexts'
import { composeEventHandlers } from '@radix-ui/primitive'

export interface DataViewExportTriggerProps {
	/**
	 * The fields to include in the export. Defaults to the fields in the data view's global configuration.
	 */
	fields?: ReactNode
	/**
	 * The button element for the export trigger.
	 */
	children: ReactElement
	/**
	 * The base name for the exported file. Defaults to `<entityName>-<current-date>`.
	 */
	baseName?: string
	/**
	 * A factory for generating the exported data. Defaults to a CSV export factory.
	 */
	exportFactory?: ExportFactory
}

/**
 * A trigger component to export data from a data view.
 *
 * ## Props
 * - fields, children, baseName, exportFactory
 *
 * See {@link DataViewExportTriggerProps} for details.
 *
 * ## Behavior
 * - Clicking the trigger exports data based on the provided fields and format.
 * - Automatically fetches all data before generating the export file.
 * - Downloads the exported file with the specified `baseName` and file extension.
 *
 * ## Example
 * ```tsx
 * <DataViewExportTrigger baseName="my-export">
 *     <button>Export Data</button>
 * </DataViewExportTrigger>
 * ```
 */
export const DataViewExportTrigger = forwardRef<HTMLButtonElement, DataViewExportTriggerProps>(
	({ fields, children, baseName, exportFactory, ...props }: DataViewExportTriggerProps, ref) => {
		const entityName = useDataViewEntityListProps().entityName
		const globalChildren = useDataViewChildren()
		const fetchData = useDataViewFetchAllData({ children: fields ?? globalChildren })
		const download = useTriggerDownload()

		const doExport = useCallback(async () => {
			const fetchResult = await fetchData()
			const exportedData = (exportFactory ?? defaultExportFactory).create(fetchResult)

			const baseNameResolved = baseName ?? `${entityName}-${new Date().toISOString().split('T')[0]}`
			download(exportedData.blob, `${baseNameResolved}.${exportedData.extension}`)
		}, [baseName, download, entityName, exportFactory, fetchData])

		const { onClick, ...otherProps } = props as React.ButtonHTMLAttributes<HTMLButtonElement>

		return (
			<Slot
				ref={ref}
				onClick={composeEventHandlers(onClick, doExport)}
				{...otherProps}
			>
				{children}
			</Slot>
		)
	},
)

DataViewExportTrigger.displayName = 'DataViewExportTrigger'

const defaultExportFactory = new CsvExportFactory()

const useTriggerDownload = () => {
	return useCallback((blob: Blob, fileName: string) => {
		const a = document.createElement('a')
		a.href = URL.createObjectURL(blob)
		a.download = fileName
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
	}, [])
}
