import * as React from 'react'
import { ReactElement, ReactNode, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewFetchAllData } from '../hooks'
import { CsvExportFactory, ExportFactory } from '../export'
import { useDataViewChildren, useDataViewEntityListProps } from '../contexts'


export interface DataViewExportTriggerProps {
	fields?: ReactNode
	children: ReactElement
	baseName?: string
	exportFactory?: ExportFactory
}

const defaultExportFactory = new CsvExportFactory()


export const DataViewExportTrigger = ({ fields, children, baseName, exportFactory }: DataViewExportTriggerProps) => {
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

	return (
		<Slot onClick={doExport}>
			{children}
		</Slot>
	)
}


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
