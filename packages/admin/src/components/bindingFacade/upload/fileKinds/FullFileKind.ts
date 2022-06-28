import type { AsyncBatchUpdatesOptions } from '@contember/binding'
import type { FileUploader, FileUploadError } from '@contember/client'
import type { ReactNode } from 'react'
import type { FileDataExtractor } from '../fileDataExtractors'

export interface RenderFilePreviewOptions<AcceptArtifacts = unknown> {
	file: File
	objectUrl: string
	acceptArtifacts: AcceptArtifacts
}

export interface AcceptFileOptions extends AsyncBatchUpdatesOptions {
	file: File
	abortSignal: AbortSignal
	objectUrl: string
}

export interface InternalFileKind<UploadResult = unknown, AcceptArtifacts = unknown> {
	acceptMimeTypes: string | string[] | null // null means "any mime type"

	/** Optionally reject with {@link AcceptFileKindError}. */
	acceptFile: ((options: AcceptFileOptions) => boolean | Promise<AcceptArtifacts>) | undefined
	renderFilePreview: (options: RenderFilePreviewOptions<AcceptArtifacts>) => ReactNode
	renderUploadedFile: ReactNode
	uploader: FileUploader<UploadResult, FileUploadError>

	baseEntity?: string | undefined
	childrenOutsideBaseEntity?: boolean
	children?: ReactNode
}


export type PublicFileKind<UploadResult = unknown, AcceptArtifacts = unknown> =
	& Partial<InternalFileKind<UploadResult, AcceptArtifacts>>

export type FullFileKind<UploadResult = unknown, AcceptArtifacts = unknown> =
	& InternalFileKind<UploadResult, AcceptArtifacts>
	& {
		extractors: FileDataExtractor<unknown, UploadResult, AcceptArtifacts>[]
	}
