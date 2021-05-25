import type { FileUploader, FileUploadError } from '@contember/client'

export type SingleFileUploadState<Result = any, Error extends FileUploadError = FileUploadError> =
	| {
			readyState: 'uploading'
			file: File
			uploader: FileUploader
			abortController: AbortController
			previewUrl: string
			progress?: number
	  }
	| {
			readyState: 'success'
			file: File
			uploader: FileUploader
			previewUrl: string
			result: Result
	  }
	| {
			readyState: 'error'
			file: File
			uploader: FileUploader
			previewUrl: string
			error: Error | undefined
	  }
	| {
			readyState: 'aborted'
			file: File
			uploader: FileUploader
			previewUrl: string
			progress?: number
	  }
