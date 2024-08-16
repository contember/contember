import type { EntityAccessor, Environment, ErrorAccessorHolder } from '@contember/binding'
import type { ReactNode } from 'react'
import { FileWithMeta } from './file'
import { FileUploadResult } from './uploadClient'


export interface FileDataExtractorStaticRenderOptions {
	environment: Environment
}

export interface FileDataExtractorGetErrorsOptions {
	entity: EntityAccessor
	environment: Environment
}

export interface FileDataExtractor {
	staticRender: (options: FileDataExtractorStaticRenderOptions) => ReactNode
	extractFileData?: (options: FileWithMeta) => Promise<FileDataExtractorPopulator | undefined> | FileDataExtractorPopulator | undefined
	populateFields?: (options: { entity: EntityAccessor; result: FileUploadResult }) => void
	getErrorsHolders?: (options: FileDataExtractorGetErrorsOptions) => ErrorAccessorHolder[]
}

export type FileDataExtractorPopulator = (options: { entity: EntityAccessor; result: FileUploadResult }) => void
