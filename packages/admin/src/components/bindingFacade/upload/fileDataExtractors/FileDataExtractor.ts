import type { EntityAccessor, Environment } from '@contember/react-binding'
import type { ReactNode } from 'react'
import { AccessorErrorsHolder } from '../../errors'

export interface FileDataExtractorPopulateFieldsOptions<
	ExtractedData = unknown,
	UploadResult = unknown,
	AcceptArtifacts = unknown,
> {
	file: File
	objectUrl: string
	extractedData: ExtractedData
	uploadResult: UploadResult
	acceptArtifacts: AcceptArtifacts
	entity: EntityAccessor
}

export interface FileDataExtractorExtractFileDataOptions<AcceptArtifacts = unknown> {
	file: File
	objectUrl: string
	acceptArtifacts: AcceptArtifacts
}

export interface FileDataExtractorStaticRenderOptions {
	environment: Environment
}

export interface FileDataExtractorDestroyOptions {
	entity: EntityAccessor
}

export interface FileDataExtractorGetErrorsOptions {
	entity: EntityAccessor
	environment: Environment
}

export interface FileDataExtractor<ExtractedData = unknown, UploadResult = unknown, AcceptArtifacts = unknown> {
	staticRender: (options: FileDataExtractorStaticRenderOptions) => ReactNode
	extractFileData?: (options: FileDataExtractorExtractFileDataOptions<AcceptArtifacts>) => Promise<ExtractedData> | null
	populateFields: (
		options: FileDataExtractorPopulateFieldsOptions<ExtractedData, UploadResult, AcceptArtifacts>,
	) => void
	getErrorsHolders?: (options: FileDataExtractorGetErrorsOptions) => AccessorErrorsHolder[]
}
