import type { AsyncBatchUpdatesOptions } from '@contember/binding'
import type { FileUploader, FileUploadError } from '@contember/client'
import type { ReactNode } from 'react'
import type { FileDataExtractor } from './FileDataExtractor'
import { SelectFileInputFormComponentProps } from '../internalComponents/SelectFileInput'

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

interface InternalFileKind<UploadResult = unknown, AcceptArtifacts = unknown, SFExtraProps extends {} = {}> {
	acceptMimeTypes: string | string[] | null // null means "any mime type"

	/** Optionally reject with {@link AcceptFileKindError}. */
	acceptFile: ((options: AcceptFileOptions) => boolean | Promise<AcceptArtifacts>) | undefined
	renderFilePreview: (options: RenderFilePreviewOptions<AcceptArtifacts>) => ReactNode

	baseEntity: string | undefined

	children: ReactNode
	renderUploadedFile: ReactNode

	uploader: FileUploader<UploadResult, FileUploadError>

	label?: ReactNode
}


export type PublicFileKind<UploadResult = unknown, AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& (
		| SelectFileInputFormComponentProps<SFExtraProps>
		| {}
	)
	& Partial<InternalFileKind<UploadResult, AcceptArtifacts, SFExtraProps>>

export type FullFileKind<UploadResult = unknown, AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& (
		| SelectFileInputFormComponentProps<SFExtraProps>
		| {}
	)
	& InternalFileKind<UploadResult, AcceptArtifacts, SFExtraProps>
	& {
		extractors: FileDataExtractor<unknown, UploadResult, AcceptArtifacts>[]
	}
