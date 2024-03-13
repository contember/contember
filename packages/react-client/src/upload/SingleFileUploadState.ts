import type { FileUploader, FileUploadError } from '@contember/client'

export type SingleFileUploadInitializingState = {
	readyState: 'initializing'
	abortController: AbortController
	file: File
	previewUrl: string
}

export type SingleFileUploadUploadingState<Metadata = undefined> = {
	readyState: 'uploading'
	abortController: AbortController
	file: File
	metadata: Metadata
	previewUrl: string
	progress: number | undefined
	uploader: FileUploader
}

export type SingleFileUploadSuccessState<Metadata = undefined, Result = unknown> = {
	readyState: 'success'
	file: File
	metadata: Metadata
	previewUrl: string
	result: Result
	uploader: FileUploader
}

export type SingleFileUploadErrorState<Metadata = undefined> = {
	readyState: 'error'
	errors: FileUploadError[] | undefined
	rawError: any
	file: File
	metadata: Metadata | undefined
	previewUrl: string
	uploader: FileUploader | undefined
}

export type SingleFileUploadState<Result = unknown, Metadata = undefined> =
	| SingleFileUploadInitializingState
	| SingleFileUploadUploadingState<Metadata>
	| SingleFileUploadSuccessState<Metadata, Result>
	| SingleFileUploadErrorState<Metadata>
