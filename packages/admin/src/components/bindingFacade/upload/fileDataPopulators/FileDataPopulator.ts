import { EntityAccessor, Environment } from '@contember/binding'
import * as React from 'react'

export interface FileDataPopulatorOptions<UploadResult = any> {
	file: File
	previewUrl: string
	uploadResult: UploadResult
	batchUpdates: EntityAccessor['batchUpdates']
	environment: Environment
}

export interface FileDataPopulator<FileData = any, UploadResult = any> {
	getStaticFields: (environment: Environment) => React.ReactNode
	canHandleFile?: (file: File) => boolean
	prepareFileData?: (file: File, previewUrl: string) => Promise<FileData>
	populateFileData: (options: FileDataPopulatorOptions<UploadResult>, fileData: FileData) => void
}
