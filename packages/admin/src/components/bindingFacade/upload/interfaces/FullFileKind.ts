import type { FileUploader, FileUploadError } from '@contember/client'
import type { ReactNode } from 'react'
import type { FileDataExtractor } from './FileDataExtractor'

export interface RenderFilePreviewOptions<AcceptArtifacts = unknown> {
	file: File
	objectUrl: string
	acceptArtifacts: AcceptArtifacts
}

export interface AcceptFileOptions {
	file: File
	abortSignal: AbortSignal
	objectUrl: string
}

export interface FullFileKind<UploadResult = unknown, AcceptArtifacts = unknown> {
	acceptMimeTypes: string | string[] | null // null means "any mime type"

	/** Optionally reject with {@link AcceptFileKindError}. */
	acceptFile: ((options: AcceptFileOptions) => boolean | Promise<AcceptArtifacts>) | undefined
	renderFilePreview: (options: RenderFilePreviewOptions<AcceptArtifacts>) => ReactNode

	children: ReactNode
	renderUploadedFile: ReactNode

	uploader: FileUploader<UploadResult, FileUploadError>
	extractors: FileDataExtractor<unknown, UploadResult, AcceptArtifacts>[]
}
