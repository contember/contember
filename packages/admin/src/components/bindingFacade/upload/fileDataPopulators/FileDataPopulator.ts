import { EntityAccessor, Environment } from '@contember/binding'
import * as React from 'react'

export interface FileDataPopulatorOptions<UploadResult = never> {
	file: File
	previewUrl: string
	uploadResult: UploadResult
	batchUpdates: EntityAccessor['batchUpdates']
	environment: Environment
}

export interface FileDataPopulator<FileData = never, UploadResult = never> {
	getStaticFields: (environment: Environment) => React.ReactNode
	canHandleFile: (file: File, uploadResult: UploadResult) => boolean
	prepareFileData?: (file: File, previewUrl: string) => Promise<FileData>
	populateFileData: (options: FileDataPopulatorOptions<UploadResult>, fileData: FileData) => void
}
