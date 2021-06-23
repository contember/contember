import type { FileUploader, FileUploadError } from '@contember/client'

export type SingleFileUploadState<Result = unknown, Metadata = undefined> =
	| {
			readyState: 'initializing'
			abortController: AbortController
			file: File
			previewUrl: string
	  }
	| {
			readyState: 'uploading'
			abortController: AbortController
			file: File
			metadata: Metadata
			previewUrl: string
			progress: number | undefined
			uploader: FileUploader
	  }
	| {
			readyState: 'success'
			file: File
			metadata: Metadata
			previewUrl: string
			result: Result
			uploader: FileUploader
	  }
	| {
			readyState: 'error'
			errors: FileUploadError[] | undefined
			rawError: any
			file: File
			metadata: Metadata | undefined
			previewUrl: string
			uploader: FileUploader | undefined
	  }
